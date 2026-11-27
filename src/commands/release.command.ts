import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

/**
 * dev/main 快照发布：
 * - main 只收白名单路径（安装面 + CLI 发现契约 + 发布文档 + Pages workflow），
 *   由临时 index 从 dev 提交构造快照树，不切分支、不碰工作区
 * - 快照提交 parent = origin/main，push 永远 fast-forward（非 ff 被远端拒绝，正是保护）
 * - 提交信息带 `Source-Commit: <dev sha>` trailer：deploy.yml 靠它检出对应 dev 源码构建站点，
 *   并校验发布树与源码一致；重复发布按 trailer 判等跳过
 */

export const REMOTE = 'origin'
export const SOURCE_BRANCH = 'dev'
export const RELEASE_BRANCH = 'main'

/** 只有这些路径会进入 main。新增前先想清楚：它是不是安装方需要的产物 */
export const PUBLISH_PATHS = [
  'content',
  'skills.sh.json',
  'README.md',
  'LICENSE',
  '.github/workflows/deploy.yml',
] as const

/** 安全网：即使 PUBLISH_PATHS 被误改，这些前缀也绝不进入 main */
export const FORBIDDEN_PREFIXES = [
  'src/',
  'site/',
  'upstream/',
  '.build/',
  '.agents/',
  '.vscode/',
  'meta.ts',
  'dependencies.ts',
  'packs.ts',
  'AGENTS.md',
  'CLAUDE.md',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'vitest.config.ts',
  'oxfmt.config.ts',
  'oxlint.config.ts',
  '.github/actions/',
  '.github/workflows/ci.yml',
  '.github/dependabot.yml',
] as const

/** 同日重复发布追加 .2/.3…；existing 是 ls-remote 的 tag 名（容忍 ^{} peeled 后缀） */
export function nextTag(existing: string[], day: string): string {
  const base = `v${day}`
  const taken = new Set(existing.map((t) => t.replace(/\^\{\}$/, '')))
  if (!taken.has(base)) return base
  for (let i = 2; ; i++) {
    const candidate = `${base}.${i}`
    if (!taken.has(candidate)) return candidate
  }
}

/** 从提交信息提取 Source-Commit trailer（无则 null） */
export function parseSourceCommit(message: string): string | null {
  const m = /^Source-Commit:\s*(\S+)\s*$/m.exec(message)
  return m ? m[1]! : null
}

export function isForbiddenPath(path: string): boolean {
  return FORBIDDEN_PREFIXES.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p))
}

function localDay(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function git(args: string[], opts: { env?: NodeJS.ProcessEnv; input?: string } = {}): string {
  return execFileSync('git', args, {
    encoding: 'utf8',
    input: opts.input,
    env: opts.env ? { ...process.env, ...opts.env } : process.env,
    stdio: ['pipe', 'pipe', 'inherit'],
    maxBuffer: 1 << 30,
  })
}

/** 只关心成功/失败的 git 调用（如 merge-base --is-ancestor 用退出码表达结果） */
function gitOk(args: string[]): boolean {
  try {
    execFileSync('git', args, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** pnpm 在 Windows 下是 .cmd shim，需要 shell 才能被 execFileSync 拉起 */
function run(cmd: string, args: string[]): void {
  execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const skipChecks = argv.includes('--skip-checks')
  const sourceArg = argv.find((a) => a.startsWith('--source='))?.slice('--source='.length)

  git(['fetch', REMOTE, RELEASE_BRANCH, SOURCE_BRANCH, '--tags', '--quiet'])
  const head = git(['rev-parse', 'HEAD']).trim()
  const src = sourceArg ? git(['rev-parse', `${sourceArg}^{commit}`]).trim() : head

  if (!sourceArg) {
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim()
    if (branch !== SOURCE_BRANCH) throw new Error(`release: must run on ${SOURCE_BRANCH} (current: ${branch})`)
    if (git(['status', '--porcelain']).trim()) throw new Error('release: working tree is not clean')
    if (git(['rev-parse', `${REMOTE}/${SOURCE_BRANCH}`]).trim() !== head) {
      throw new Error(`release: ${SOURCE_BRANCH} is not in sync with ${REMOTE}/${SOURCE_BRANCH}; push first`)
    }
  } else if (!gitOk(['merge-base', '--is-ancestor', src, `${REMOTE}/${SOURCE_BRANCH}`])) {
    throw new Error(
      `release: ${src.slice(0, 7)} is not contained in ${REMOTE}/${SOURCE_BRANCH}; CI could not check it out`,
    )
  }

  // 发布门禁只在发布当前工作区 HEAD 时跑（--source 回滚路径的树早经同套门禁发布过）
  if (!skipChecks && src === head) {
    for (const args of [['lint'], ['test'], ['check'], ['build:catalog'], ['smoke'], ['readme:check']]) {
      run('pnpm', args)
    }
  }

  const tmp = mkdtempSync(join(tmpdir(), 'skills-release-'))
  try {
    // 临时 index 从 src 构造白名单快照树；ls-tree 与 update-index --index-info 同构，直接回灌
    const indexEnv = { GIT_INDEX_FILE: join(tmp, 'index') }
    const listing = git(['ls-tree', '-r', '-z', src, '--', ...PUBLISH_PATHS])
    const files = listing
      .split('\0')
      .filter(Boolean)
      .map((line) => line.slice(line.indexOf('\t') + 1))

    for (const p of PUBLISH_PATHS) {
      if (!files.some((f) => f === p || f.startsWith(`${p}/`))) {
        throw new Error(`release: publish path missing in ${src.slice(0, 7)}: ${p}`)
      }
    }
    const bad = files.find((f) => isForbiddenPath(f))
    if (bad) throw new Error(`release: forbidden path in snapshot: ${bad}`)

    git(['update-index', '--add', '-z', '--index-info'], { env: indexEnv, input: listing })
    const tree = git(['write-tree'], { env: indexEnv }).trim()

    const parent = git(['rev-parse', `${REMOTE}/${RELEASE_BRANCH}`]).trim()
    const released = parseSourceCommit(git(['log', '-1', '--format=%B', `${REMOTE}/${RELEASE_BRANCH}`]))
    if (released === src) {
      console.log(`release: ${REMOTE}/${RELEASE_BRANCH} already points at ${src.slice(0, 7)}; nothing to do`)
      return
    }

    const day = localDay()
    const commit = git([
      'commit-tree',
      tree,
      '-p',
      parent,
      '-m',
      `release: ${day} (${src.slice(0, 7)})`,
      '-m',
      `Source-Commit: ${src}`,
    ]).trim()

    console.log(git(['diff', '--stat', parent, commit]))
    if (dryRun) {
      console.log(`(dry-run) would push ${commit.slice(0, 7)} -> ${REMOTE}/${RELEASE_BRANCH}`)
      return
    }

    // 不带 --force：非 fast-forward 会被远端拒绝，这是想要的保护
    git(['push', REMOTE, `${commit}:refs/heads/${RELEASE_BRANCH}`])

    const tags = git(['ls-remote', '--tags', REMOTE, 'refs/tags/v*'])
      .split('\n')
      .filter(Boolean)
      .map((line) => line.slice(line.indexOf('refs/tags/') + 'refs/tags/'.length))
    const tag = nextTag(tags, day)
    git(['tag', tag, commit])
    git(['push', REMOTE, `refs/tags/${tag}`])

    console.log(`release: pushed ${commit.slice(0, 7)} as ${tag}; site build triggered on GitHub Actions`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

// 仅直接执行时跑 main（tsx src/commands/release.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
