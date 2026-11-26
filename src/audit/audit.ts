import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import type { DuplicateNames, ItemIndex } from '../services/dependencies.service'
import type { Dependencies, RepositoryConfig, SyncManifest } from '../types'

import { SKILL_NAME_RE, resolveRequirements } from '../lib/install-commands'
import { buildItemIndex, resolveDependencyGraph } from '../services/dependencies.service'
import { validatePackMembers } from '../services/packs.service'
import { splitFrontmatter } from '../transforms/frontmatter'
import { sha256, treeDigest } from '../utils/digest'
import { listFilesRecursive } from '../utils/list-files'

interface TreeFile {
  path: string
  content: Buffer
}

/**
 * I1 摘要比对容忍 git 行尾转换幻影（Windows sync 写 CRLF、提交归一成 LF、检出还原形态
 * 漂移——已知每次 sync 复现）：字节一致、CRLF→LF 归一或 LF→CRLF 归一任一匹配即通过；
 * 内容真实漂移三种变体都命不中。根治需统一仓库 eol 策略（.gitattributes），另行处理。
 * 摘要形态与 sync 管道一致：skill 整树走 treeDigest，agent/rule 单文件走 sha256
 */
function eolDigestVariants(files: TreeFile[], singleFile: boolean): string[] {
  const digest = (fs: TreeFile[]) => (singleFile ? sha256(fs[0]!.content) : treeDigest(fs))
  const normalize = (transform: (text: string) => string) =>
    files.map((f) => ({ path: f.path, content: Buffer.from(transform(f.content.toString('utf8')), 'utf8') }))
  return [
    digest(files),
    digest(normalize((t) => t.replaceAll('\r\n', '\n'))),
    digest(normalize((t) => t.replaceAll('\n', '\r\n'))),
  ]
}

async function loadTreeFiles(dir: string): Promise<TreeFile[]> {
  const rels = await listFilesRecursive(dir)
  return Promise.all(rels.map(async (file) => ({ path: file, content: await readFile(join(dir, file)) })))
}

export type Severity = 'error' | 'warn'

export interface Finding {
  rule: string
  severity: Severity
  message: string
  path?: string
}

export interface SkillInfo {
  name: string
  description: string
  /** 相对仓库根，如 content/skills/samber-golang/golang-how-to */
  dir: string
  /** content/skills/<vendor>/ 的 vendor 段；手工技能为 custom */
  vendor: string
  internal: boolean
}

export interface FileInfo {
  /** 不含 .md 的文件名 */
  name: string
  /** 相对仓库根 */
  file: string
}

export interface AuditInput {
  root: string
  repositories: Record<string, RepositoryConfig>
  dependencies: Dependencies
  packs: Record<string, { description: string; skills: string[] }>
}

export interface AuditResult {
  skills: SkillInfo[]
  agents: FileInfo[]
  rules: FileInfo[]
  findings: Finding[]
}

/** 与 skills CLI 的默认发现一致（skills.sh.json 声明 content/skills 为容器）：容器内最多下探 2 层（content/skills/{vendor}/{name}），浅层 SKILL.md 遮蔽深层 */
const MAX_SCAN_DEPTH = 2

function rel(root: string, p: string): string {
  return relative(root, p).split('\\').join('/')
}

async function findSkillDirs(dir: string, depth: number, out: string[]): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out // skills/ 不存在
  }
  if (entries.some((e) => e.isFile() && e.name === 'SKILL.md')) {
    out.push(dir)
    return out
  }
  if (depth >= MAX_SCAN_DEPTH) return out
  for (const e of entries) {
    if (e.isDirectory() && !e.name.startsWith('.')) await findSkillDirs(join(dir, e.name), depth + 1, out)
  }
  return out
}

interface ParsedFrontmatter {
  name: string
  description: string
  internal: boolean
}

function readSkillFrontmatter(raw: string): { fm: ParsedFrontmatter } | { error: string } {
  let split
  try {
    split = splitFrontmatter(raw)
  } catch {
    return { error: 'invalid frontmatter YAML' }
  }
  if (!split.hasFrontmatter) return { error: 'missing frontmatter' }
  const name = typeof split.data.name === 'string' ? split.data.name.trim() : ''
  const description = typeof split.data.description === 'string' ? split.data.description.trim() : ''
  const metadata = split.data.metadata as { internal?: unknown } | undefined
  return { fm: { name, description, internal: metadata?.internal === true } }
}

/** 扫描 content/skills/ 并产出 A1/A2（frontmatter 有效性、命名规范） */
export async function loadSkills(root: string, findings: Finding[]): Promise<SkillInfo[]> {
  const out: SkillInfo[] = []
  for (const dir of await findSkillDirs(join(root, 'content', 'skills'), 0, [])) {
    const r = rel(root, dir)
    let raw: string
    try {
      raw = await readFile(join(dir, 'SKILL.md'), 'utf8')
    } catch {
      findings.push({ rule: 'A1', severity: 'error', path: r, message: 'unreadable SKILL.md' })
      continue
    }
    const parsed = readSkillFrontmatter(raw)
    if ('error' in parsed) {
      findings.push({ rule: 'A1', severity: 'error', path: r, message: parsed.error })
      continue
    }
    const { fm } = parsed
    if (!fm.name) {
      findings.push({ rule: 'A1', severity: 'error', path: r, message: 'missing name' })
      continue
    }
    if (!SKILL_NAME_RE.test(fm.name) || fm.name.length > 64) {
      findings.push({ rule: 'A2', severity: 'error', path: r, message: `invalid skill name "${fm.name}"` })
    }
    if (!fm.description) {
      findings.push({ rule: 'A1', severity: 'error', path: r, message: 'missing description' })
    } else if (fm.description.length > 1024) {
      findings.push({ rule: 'A2', severity: 'warn', path: r, message: 'description > 1024 chars' })
    }
    out.push({
      name: fm.name,
      description: fm.description,
      dir: r,
      vendor: r.split('/')[2] ?? '',
      internal: fm.internal,
    })
  }
  return out
}

async function listMarkdown(root: string, top: 'agents' | 'rules'): Promise<FileInfo[]> {
  const out: FileInfo[] = []
  const walk = async (dir: string): Promise<void> => {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return // 目录不存在
    }
    for (const e of entries) {
      const p = join(dir, e.name)
      if (e.isDirectory()) await walk(p)
      else if (e.name.endsWith('.md')) out.push({ name: e.name.slice(0, -3), file: rel(root, p) })
    }
  }
  await walk(join(root, 'content', top))
  return out
}

/**
 * D2：skill→skill 依赖环只提示不拦截——闭包解析（resolveRequirements）的 visited set
 * 对环安全终止，互引（A requires B 且 B requires A）是 dependencies.ts 里的真实运行时
 * 引用形态；按环成员集去重，避免同一环从不同起点重复报告
 */
function detectSkillCycles(dependencies: Dependencies, findings: Finding[]): void {
  const visiting = new Set<string>()
  const done = new Set<string>()
  const seenCycles = new Set<string>()
  const visit = (n: string, trail: string[]): void => {
    if (done.has(n)) return
    if (visiting.has(n)) {
      const start = trail.indexOf(n)
      const cycle = [...trail.slice(start), n]
      const canonical = [...new Set(cycle)].toSorted().join(' | ')
      if (!seenCycles.has(canonical)) {
        seenCycles.add(canonical)
        findings.push({ rule: 'D2', severity: 'warn', message: `skill dependency cycle: ${cycle.join(' -> ')}` })
      }
      return
    }
    visiting.add(n)
    for (const next of dependencies.skills[n]?.skills ?? []) visit(next, [...trail, n])
    visiting.delete(n)
    done.add(n)
  }
  for (const n of Object.keys(dependencies.skills)) visit(n, [])
}

async function readSyncManifest(path: string): Promise<SyncManifest | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as SyncManifest
  } catch {
    return null // 无清单或损坏：所有权问题由 O1 覆盖
  }
}

/**
 * I1：SYNC.json 的 digest 与磁盘内容一致，且 items 与 meta 映射双向对齐。
 * 复用 sync 管道的 digest 实现（skill 整树 / agent、rule 单文件）
 */
async function checkSyncManifests(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  findings: Finding[],
): Promise<void> {
  const kinds = [
    { kindRoot: 'skills', mappingsOf: (c: RepositoryConfig) => c.skills ?? [], isTree: true },
    { kindRoot: 'agents', mappingsOf: (c: RepositoryConfig) => c.agents ?? [], isTree: false },
    { kindRoot: 'rules', mappingsOf: (c: RepositoryConfig) => c.rules ?? [], isTree: false },
  ] as const

  for (const { kindRoot, mappingsOf, isTree } of kinds) {
    const kindDir = join(root, 'content', kindRoot)
    let vendors: string[]
    try {
      vendors = (await readdir(kindDir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name)
    } catch {
      continue // 目录不存在
    }
    for (const vendor of vendors) {
      if (vendor === 'custom') continue // 手工技能无 SYNC.json
      const manifest = await readSyncManifest(join(kindDir, vendor, 'SYNC.json'))
      if (!manifest) continue
      const expected = new Set(mappingsOf(repositories[vendor] ?? { url: '' }).map((m) => m.name))
      const seen = new Set<string>()
      for (const item of manifest.items) {
        seen.add(item.name)
        if (!expected.has(item.name)) {
          findings.push({
            rule: 'I1',
            severity: 'error',
            path: `content/${kindRoot}/${vendor}`,
            message: `SYNC.json item "${item.name}" has no mapping in meta.ts`,
          })
          continue
        }
        const destPath = isTree ? join(kindDir, vendor, item.name) : join(kindDir, vendor, `${item.name}.md`)
        let variants: string[] | null = null
        try {
          const files = isTree
            ? await loadTreeFiles(destPath)
            : [{ path: `${item.name}.md`, content: await readFile(destPath) }]
          variants = eolDigestVariants(files, !isTree)
        } catch {
          variants = null // dest 整个缺失（清单位在但产物没同步）
        }
        if (variants === null || !variants.includes(item.digest)) {
          findings.push({
            rule: 'I1',
            severity: 'error',
            path: `content/${kindRoot}/${vendor}/${item.name}`,
            message: variants === null ? 'dest missing on disk' : 'dest content does not match SYNC.json digest',
          })
        }
      }
      for (const name of expected) {
        if (!seen.has(name)) {
          findings.push({
            rule: 'I1',
            severity: 'error',
            path: `content/${kindRoot}/${vendor}`,
            message: `mapping "${name}" is missing from SYNC.json`,
          })
        }
      }
    }
  }
}

/**
 * O1：meta.ts 映射与磁盘双向对齐——孤儿 dest（删了映射没删产物）、映射缺失
 * （映射了没同步）、未知 vendor 目录。custom 技能不需要映射
 */
function checkOrphans(
  repositories: Record<string, RepositoryConfig>,
  skills: SkillInfo[],
  agents: FileInfo[],
  rules: FileInfo[],
  findings: Finding[],
): void {
  const expectedSkillDirs = new Set<string>()
  for (const [repoKey, config] of Object.entries(repositories)) {
    for (const m of config.skills ?? []) expectedSkillDirs.add(`content/skills/${repoKey}/${m.name}`)
  }
  for (const s of skills) {
    if (s.vendor === 'custom') continue
    if (!repositories[s.vendor]) {
      findings.push({
        rule: 'O1',
        severity: 'error',
        path: s.dir,
        message: `unknown vendor "${s.vendor}" (not in meta.ts)`,
      })
    } else if (!expectedSkillDirs.has(s.dir)) {
      findings.push({ rule: 'O1', severity: 'error', path: s.dir, message: 'orphan skill dir (no mapping in meta.ts)' })
    }
  }
  for (const dir of expectedSkillDirs) {
    if (!skills.some((s) => s.dir === dir)) {
      findings.push({ rule: 'O1', severity: 'error', path: dir, message: 'mapped skill missing on disk' })
    }
  }

  const expectedAgents = new Set<string>()
  const expectedRules = new Set<string>()
  for (const [repoKey, config] of Object.entries(repositories)) {
    for (const m of config.agents ?? []) expectedAgents.add(`content/agents/${repoKey}/${m.name}.md`)
    for (const m of config.rules ?? []) expectedRules.add(`content/rules/${repoKey}/${m.name}.md`)
  }
  for (const f of agents) {
    if (!expectedAgents.has(f.file)) {
      findings.push({
        rule: 'O1',
        severity: 'error',
        path: f.file,
        message: 'orphan agent file (no mapping in meta.ts)',
      })
    }
  }
  for (const file of expectedAgents) {
    if (!agents.some((f) => f.file === file)) {
      findings.push({ rule: 'O1', severity: 'error', path: file, message: 'mapped agent missing on disk' })
    }
  }
  for (const f of rules) {
    if (!expectedRules.has(f.file)) {
      findings.push({
        rule: 'O1',
        severity: 'error',
        path: f.file,
        message: 'orphan rule file (no mapping in meta.ts)',
      })
    }
  }
  for (const file of expectedRules) {
    if (!rules.some((f) => f.file === file)) {
      findings.push({ rule: 'O1', severity: 'error', path: file, message: 'mapped rule missing on disk' })
    }
  }
}

export async function audit(input: AuditInput): Promise<AuditResult> {
  const findings: Finding[] = []
  const skills = await loadSkills(input.root, findings)
  const agents = await listMarkdown(input.root, 'agents')
  const rules = await listMarkdown(input.root, 'rules')

  // A3 全仓 name 唯一：CLI 按 name 平铺安装，重名会互相覆盖
  const byName = new Map<string, SkillInfo[]>()
  for (const s of skills) byName.set(s.name, [...(byName.get(s.name) ?? []), s])
  for (const [name, list] of byName) {
    if (list.length > 1) {
      findings.push({
        rule: 'A3',
        severity: 'error',
        message: `duplicate skill name "${name}": ${list.map((s) => s.dir).join(', ')}`,
      })
    }
  }

  // D1 依赖声明可解析：复用 dependencies.service 的索引与解析，command 引用按设计悬空，豁免
  const customSkillNames = skills.filter((s) => s.vendor === 'custom').map((s) => s.name)
  const { index, duplicates }: { index: ItemIndex; duplicates: DuplicateNames } = buildItemIndex(
    input.repositories,
    customSkillNames,
  )
  const { unknownKeys, dangling } = resolveDependencyGraph(input.dependencies, index, duplicates)
  for (const u of unknownKeys) {
    findings.push({
      rule: 'D1',
      severity: 'error',
      message: `dependencies: unknown ${u.kind} key "${u.key}" (${u.reason})`,
    })
  }
  for (const d of dangling) {
    if (d.refKind === 'command') continue
    findings.push({
      rule: 'D1',
      severity: 'error',
      message: `dependencies: ${d.kind} "${d.key}" -> unknown ${d.refKind} "${d.ref}"`,
    })
  }

  detectSkillCycles(input.dependencies, findings)

  // P1 pack 成员可解析；P2 pack 缺成员硬依赖只警告（保持显式清单、不自动展开的语义）
  for (const message of validatePackMembers(input.packs, index, duplicates)) {
    findings.push({ rule: 'P1', severity: 'error', message })
  }
  for (const [id, pack] of Object.entries(input.packs)) {
    for (const missing of resolveRequirements(pack.skills, input.dependencies.skills).missingSkills) {
      findings.push({
        rule: 'P2',
        severity: 'warn',
        message: `pack "${id}": member requires skill "${missing}" which is not in the pack`,
      })
    }
  }

  await checkSyncManifests(input.root, input.repositories, findings)
  checkOrphans(input.repositories, skills, agents, rules, findings)

  return { skills, agents, rules, findings }
}

const formatFinding = (f: Finding) => `- \`${f.rule}\` ${f.path ? `\`${f.path}\` ` : ''}${f.message}`

export function formatReport(r: AuditResult): string {
  const errors = r.findings.filter((f) => f.severity === 'error')
  const warns = r.findings.filter((f) => f.severity === 'warn')
  return [
    '## Skill audit',
    '',
    `${r.skills.length} skills · ${r.agents.length} agents · ${r.rules.length} rules · ${errors.length} errors · ${warns.length} warnings`,
    ...(errors.length > 0 ? ['', '### Errors', ...errors.map(formatFinding)] : []),
    ...(warns.length > 0 ? ['', '### Warnings', ...warns.map(formatFinding)] : []),
    '',
  ].join('\n')
}
