import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import type { Dependencies, Packs, RepositoryConfig, SyncManifest } from '../types'
import type { DuplicateNames, ItemIndex } from './dependencies.service'

import { splitFrontmatter } from '../transforms/frontmatter'
import { normalizeEolForDigest, sha256, treeDigest } from '../utils/digest'
import { listFilesRecursive } from '../utils/fs'
import { buildItemIndex, resolveDependencyGraph } from './dependencies.service'
import { SKILL_NAME_RE, resolveRequirements } from './install-commands.service'
import { validatePackMembers } from './packs.service'

interface TreeFile {
  path: string
  content: Buffer
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
  /** 相对仓库根，如 content/samber-golang/skills/golang-how-to */
  dir: string
  /** content/<repoKey>/skills/ 的 repoKey 段；手工技能为 custom */
  vendor: string
  internal: boolean
}

export interface FileInfo {
  /** 不含 .md 的文件名 */
  name: string
  /** 相对仓库根 */
  file: string
  /** frontmatter description（仅 agents 解析；rules 原样交付无 frontmatter 契约） */
  description?: string
}

export interface CheckInput {
  root: string
  repositories: Record<string, RepositoryConfig>
  dependencies: Dependencies
  packs: Packs
}

export interface CheckResult {
  skills: SkillInfo[]
  agents: FileInfo[]
  rules: FileInfo[]
  commands: FileInfo[]
  findings: Finding[]
}

/** 与 skills CLI 的默认发现一致（skills.sh.json 声明 ./content 为容器）：容器内最多下探 3 层（content/{repoKey}/{kind}/{name}），浅层 SKILL.md 遮蔽深层 */
const MAX_SCAN_DEPTH = 3

function rel(root: string, p: string): string {
  return relative(root, p).split('\\').join('/')
}

async function findSkillDirs(dir: string, depth: number, out: string[]): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out // content/ 不存在
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

/** 扫描 content/ 并产出 A1/A2（frontmatter 有效性、命名规范） */
export async function loadSkills(root: string, findings: Finding[]): Promise<SkillInfo[]> {
  const out: SkillInfo[] = []
  for (const dir of await findSkillDirs(join(root, 'content'), 0, [])) {
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
      vendor: r.split('/')[1] ?? '',
      internal: fm.internal,
    })
  }
  return out
}

async function listMarkdown(root: string, kind: 'agents' | 'rules' | 'commands'): Promise<FileInfo[]> {
  const out: FileInfo[] = []
  // agents 的 description 供 README / catalog 展示；读不到或缺字段就不填，由展示端兜底
  const readDescription = async (file: string): Promise<string | undefined> => {
    if (kind !== 'agents') return undefined
    try {
      const split = splitFrontmatter(await readFile(file, 'utf8'))
      const description = split.data.description
      return typeof description === 'string' && description.trim() ? description.trim() : undefined
    } catch {
      return undefined
    }
  }
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
      else if (e.name.endsWith('.md')) {
        out.push({ name: e.name.slice(0, -3), file: rel(root, p), description: await readDescription(p) })
      }
    }
  }
  let repoKeys: string[]
  try {
    repoKeys = (await readdir(join(root, 'content'), { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  } catch {
    return out // content/ 不存在
  }
  for (const repoKey of repoKeys) await walk(join(root, 'content', repoKey, kind))
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

/** I1 的每类核对参数：manifest item.kind → dest 目录、meta 映射、摘要形态 */
const SYNC_KIND_SPECS = [
  { kind: 'skill', kindDir: 'skills', mappingsOf: (c: RepositoryConfig) => c.skills ?? [], isTree: true },
  { kind: 'agent', kindDir: 'agents', mappingsOf: (c: RepositoryConfig) => c.agents ?? [], isTree: false },
  { kind: 'rule', kindDir: 'rules', mappingsOf: (c: RepositoryConfig) => c.rules ?? [], isTree: false },
  { kind: 'command', kindDir: 'commands', mappingsOf: (c: RepositoryConfig) => c.commands ?? [], isTree: false },
] as const

type SyncKindSpec = (typeof SYNC_KIND_SPECS)[number]

/**
 * I1：每个 repoKey 一份 content/{repoKey}/SYNC.json，digest 与磁盘内容一致，
 * items（含 kind）与 meta 映射双向对齐。复用 sync 管道的 digest 实现
 * （skill 整树 / agent、rule 单文件）
 */
async function checkSyncManifests(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  findings: Finding[],
): Promise<void> {
  let repoKeys: string[]
  try {
    repoKeys = (await readdir(join(root, 'content'), { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  } catch {
    return // content/ 不存在
  }
  for (const repoKey of repoKeys) {
    if (repoKey === 'custom') continue // 手工技能无 SYNC.json
    const manifest = await readSyncManifest(join(root, 'content', repoKey, 'SYNC.json'))
    if (!manifest) continue
    const expectedByKind = new Map<SyncKindSpec['kind'], Set<string>>(
      SYNC_KIND_SPECS.map((spec) => [
        spec.kind,
        new Set(spec.mappingsOf(repositories[repoKey] ?? { url: '' }).map((m) => m.name)),
      ]),
    )
    const seen = new Set<string>() // `${kind}:${name}`
    for (const item of manifest.items) {
      const spec = SYNC_KIND_SPECS.find((s) => s.kind === item.kind)
      if (!spec) {
        findings.push({
          rule: 'I1',
          severity: 'error',
          path: `content/${repoKey}`,
          message: `SYNC.json item "${item.name}" has unknown kind "${String(item.kind)}"`,
        })
        continue
      }
      seen.add(`${item.kind}:${item.name}`)
      if (!expectedByKind.get(item.kind)!.has(item.name)) {
        findings.push({
          rule: 'I1',
          severity: 'error',
          path: `content/${repoKey}`,
          message: `SYNC.json ${item.kind} item "${item.name}" has no mapping in meta.ts`,
        })
        continue
      }
      const destPath = spec.isTree
        ? join(root, 'content', repoKey, spec.kindDir, item.name)
        : join(root, 'content', repoKey, spec.kindDir, `${item.name}.md`)
      let actual: string | null = null
      try {
        const files = spec.isTree
          ? await loadTreeFiles(destPath)
          : [{ path: `${item.name}.md`, content: await readFile(destPath) }]
        actual = spec.isTree ? treeDigest(files) : sha256(normalizeEolForDigest(files[0]!.content))
      } catch {
        actual = null // dest 整个缺失（清单位在但产物没同步）
      }
      if (actual === null || actual !== item.digest) {
        findings.push({
          rule: 'I1',
          severity: 'error',
          path: `content/${repoKey}/${spec.kindDir}/${item.name}`,
          message: actual === null ? 'dest missing on disk' : 'dest content does not match SYNC.json digest',
        })
      }
    }
    for (const spec of SYNC_KIND_SPECS) {
      for (const name of expectedByKind.get(spec.kind)!) {
        if (!seen.has(`${spec.kind}:${name}`)) {
          findings.push({
            rule: 'I1',
            severity: 'error',
            path: `content/${repoKey}`,
            message: `${spec.kind} mapping "${name}" is missing from SYNC.json`,
          })
        }
      }
    }
  }
}

/**
 * O1：meta.ts 映射与磁盘双向对齐——孤儿 dest（删了映射没删产物）、映射缺失
 * （映射了没同步）、未知 repoKey 目录。custom 技能不需要映射
 */
function checkOrphans(
  repositories: Record<string, RepositoryConfig>,
  skills: SkillInfo[],
  agents: FileInfo[],
  rules: FileInfo[],
  commands: FileInfo[],
  findings: Finding[],
): void {
  const expectedSkillDirs = new Set<string>()
  for (const [repoKey, config] of Object.entries(repositories)) {
    for (const m of config.skills ?? []) expectedSkillDirs.add(`content/${repoKey}/skills/${m.name}`)
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
  const expectedCommands = new Set<string>()
  for (const [repoKey, config] of Object.entries(repositories)) {
    for (const m of config.agents ?? []) expectedAgents.add(`content/${repoKey}/agents/${m.name}.md`)
    for (const m of config.rules ?? []) expectedRules.add(`content/${repoKey}/rules/${m.name}.md`)
    for (const m of config.commands ?? []) expectedCommands.add(`content/${repoKey}/commands/${m.name}.md`)
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
  for (const f of commands) {
    if (!expectedCommands.has(f.file)) {
      findings.push({
        rule: 'O1',
        severity: 'error',
        path: f.file,
        message: 'orphan command file (no mapping in meta.ts)',
      })
    }
  }
  for (const file of expectedCommands) {
    if (!commands.some((f) => f.file === file)) {
      findings.push({ rule: 'O1', severity: 'error', path: file, message: 'mapped command missing on disk' })
    }
  }
}

/** A3 同类内 name 全局唯一：CLI 按 name 平铺安装（skills），扁平发布面按 {kind}/{name} 摆放（agents/rules） */
function reportDuplicates(entries: { name: string; path: string }[], kind: string, findings: Finding[]): void {
  const byName = new Map<string, string[]>()
  for (const e of entries) byName.set(e.name, [...(byName.get(e.name) ?? []), e.path])
  for (const [name, paths] of byName) {
    if (paths.length > 1) {
      findings.push({
        rule: 'A3',
        severity: 'error',
        message: `duplicate ${kind} name "${name}": ${paths.join(', ')}`,
      })
    }
  }
}

export async function check(input: CheckInput): Promise<CheckResult> {
  const findings: Finding[] = []
  const skills = await loadSkills(input.root, findings)
  const agents = await listMarkdown(input.root, 'agents')
  const rules = await listMarkdown(input.root, 'rules')
  const commands = await listMarkdown(input.root, 'commands')

  reportDuplicates(
    skills.map((s) => ({ name: s.name, path: s.dir })),
    'skill',
    findings,
  )
  reportDuplicates(
    agents.map((a) => ({ name: a.name, path: a.file })),
    'agent',
    findings,
  )
  reportDuplicates(
    rules.map((r) => ({ name: r.name, path: r.file })),
    'rule',
    findings,
  )
  reportDuplicates(
    commands.map((c) => ({ name: c.name, path: c.file })),
    'command',
    findings,
  )

  // A4 跨类 name 互不重叠：扁平发布面按 {kind}/{name} 摆放，跨类同名互相覆盖。
  // commands 的名字来自磁盘产物 + dependencies.ts 的 commands 分区（占位）
  const kindOwners = new Map<string, { kind: string; path: string }[]>()
  const addOwner = (name: string, kind: string, path: string): void => {
    kindOwners.set(name, [...(kindOwners.get(name) ?? []), { kind, path }])
  }
  for (const s of skills) addOwner(s.name, 'skill', s.dir)
  for (const a of agents) addOwner(a.name, 'agent', a.file)
  for (const r of rules) addOwner(r.name, 'rule', r.file)
  for (const c of commands) addOwner(c.name, 'command', c.file)
  for (const key of Object.keys(input.dependencies.commands))
    addOwner(key, 'command', `dependencies.ts commands.${key}`)
  for (const [name, owners] of kindOwners) {
    const kinds = [...new Set(owners.map((o) => o.kind))]
    if (kinds.length > 1) {
      findings.push({
        rule: 'A4',
        severity: 'error',
        message: `name "${name}" used by multiple kinds (${owners.map((o) => `${o.kind}: ${o.path}`).join(', ')})`,
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
  checkOrphans(input.repositories, skills, agents, rules, commands, findings)

  return { skills, agents, rules, commands, findings }
}

const formatFinding = (f: Finding) => `- \`${f.rule}\` ${f.path ? `\`${f.path}\` ` : ''}${f.message}`

export function formatReport(r: CheckResult): string {
  const errors = r.findings.filter((f) => f.severity === 'error')
  const warns = r.findings.filter((f) => f.severity === 'warn')
  return [
    '## Check',
    '',
    `${r.skills.length} skills · ${r.agents.length} agents · ${r.rules.length} rules · ${r.commands.length} commands · ${errors.length} errors · ${warns.length} warnings`,
    ...(errors.length > 0 ? ['', '### Errors', ...errors.map(formatFinding)] : []),
    ...(warns.length > 0 ? ['', '### Warnings', ...warns.map(formatFinding)] : []),
    '',
  ].join('\n')
}
