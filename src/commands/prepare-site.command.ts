import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import type { SyncManifest } from '../types'

import { packs } from '../../packs'
import { flattenContent } from '../services/flatten-content.service'
import { skillsAddCommand } from '../services/install-commands.service'
import { listFilesRecursive } from '../utils/list-files'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const publicDir = join(root, 'site', 'public')
const MAX_FILE_BYTES = 5 * 1024 * 1024

/** 站点公开输入守卫：单文件体积上限 + 疑似泄密文件名（.env / 私钥）一票拦截 */
async function guard(dir: string): Promise<void> {
  for (const f of await listFilesRecursive(dir)) {
    const size = (await stat(join(dir, f))).size
    if (size > MAX_FILE_BYTES) throw new Error(`site guard: ${f} is ${size} bytes`)
    if (/(^|\/)\.env(\.|$)/.test(f) || /(^|\/)(id_rsa|.*\.pem)$/.test(f))
      throw new Error(`site guard: suspicious file ${f}`)
  }
}

/** 各 repoKey 的 SYNC.json 合并成一份发布面账目 {repoKey: manifest}（键码元升序）；损坏/缺失跳过 */
async function collectSyncManifests(contentRoot: string): Promise<Record<string, SyncManifest>> {
  const out: Record<string, SyncManifest> = {}
  let repoKeys: string[]
  try {
    repoKeys = (await readdir(contentRoot, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .toSorted()
  } catch {
    return out
  }
  for (const repoKey of repoKeys) {
    try {
      const raw = await readFile(join(contentRoot, repoKey, 'SYNC.json'), 'utf8')
      out[repoKey] = JSON.parse(raw) as SyncManifest
    } catch {
      // 无清单（custom / 未同步）不进发布面账目
    }
  }
  return out
}

/** 生成的发布面 README：安装命令、packs、目录说明；bash 形态，指回 main 源仓 */
function renderPublishReadme(packList: { id: string; description: string; skills: string[] }[]): string {
  const lines: string[] = [
    '# rockcookies/skills',
    '',
    'Curated agent skills, agents, and rules synced from upstream repositories.',
    'Generated from the [`main` branch](https://github.com/rockcookies/skills) — do not edit by hand.',
    '',
    '## Install',
    '',
    '```bash',
    skillsAddCommand({ skills: '*', scope: 'global', shell: 'bash' }),
    '```',
    '',
  ]
  if (packList.length > 0) {
    lines.push('## Packs', '')
    for (const pack of packList) {
      lines.push(
        `### ${pack.id}`,
        '',
        pack.description,
        '',
        '```bash',
        skillsAddCommand({ skills: pack.skills, scope: 'global', shell: 'bash' }),
        '```',
        '',
      )
    }
  }
  lines.push(
    '## Layout',
    '',
    '- `skills/` — skill bundles (installable via `npx skills add`)',
    '- `agents/` — Cursor single-file subagents (copy to `~/.cursor/agents`)',
    '- `rules/` — rule files (copy to `~/.cursor/rules`)',
    '- `catalog.json` — machine-readable index',
    '- `sync.json` — per-repo upstream sync manifests',
    '',
  )
  return lines.join('\n')
}

/**
 * 组装 Pages 发布面输入 site/public/：content/ 扁平为 {skills,agents,rules,commands}/{name}，
 * 外加 catalog.json、合并 sync.json 与生成的 README.md。site/public 整体生成（git 未跟踪），
 * 每次全量重建。vite 会把 public/ 原样带进 dist/
 */
async function main(): Promise<void> {
  await rm(publicDir, { recursive: true, force: true })
  await mkdir(publicDir, { recursive: true })

  const plan = await flattenContent(root)
  for (const entry of plan) {
    const destAbs = join(publicDir, entry.dest)
    await mkdir(dirname(destAbs), { recursive: true })
    await cp(join(root, entry.src), destAbs, { recursive: true })
  }

  // catalog 喂前端；扁平 {kind}/{name} 即发布面路径（下载 URL = base + agents|rules/…）。
  // SYNC.json 是内部同步账目，不逐份发布，合并成 sync.json
  await cp(join(root, '.build', 'catalog.json'), join(publicDir, 'catalog.json'))
  await writeFile(
    join(publicDir, 'sync.json'),
    `${JSON.stringify(await collectSyncManifests(join(root, 'content')), null, 2)}\n`,
  )
  await writeFile(
    join(publicDir, 'README.md'),
    renderPublishReadme(Object.entries(packs).map(([id, p]) => ({ id, ...p }))),
  )

  await guard(publicDir)
  console.info(`site inputs prepared -> site/public (${plan.length} flattened entries)`)
}

// 仅直接执行时跑 main（tsx src/commands/prepare-site.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
