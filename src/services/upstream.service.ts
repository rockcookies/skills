import * as p from '@clack/prompts'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { simpleGit } from 'simple-git'

import type { AgentContext, SkillContext } from '../transforms/context'
import type { AgentMapping, RepositoryConfig, SkillMapping, SyncManifest, SyncManifestItem } from '../types'

import { resolveTransformNames, runAgentPipeline, runSkillPipeline } from '../transforms/pipeline'
import { digestFile, digestTree, sha256 } from '../utils/digest'
import { emptyDir, ensureDir, pathExists } from '../utils/fs'
import { listFilesRecursive } from '../utils/list-files'

/** name 的 UTF-16 码元升序（与当前 ASCII kebab-case 的 unix 字节序一致）。 */
export function compareNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** skill dest 根下：目录名不在 mapping 即为 orphan（SYNC.json 是文件，不会进这里）。 */
export function orphanSkillNames(dirNames: string[], mapped: ReadonlySet<string>): string[] {
  return dirNames.filter((name) => !mapped.has(name)).toSorted(compareNames)
}

/** agent dest 根下：`*.md` 且 basename 不在 mapping；忽略 SYNC.json 与其它文件。 */
export function orphanAgentNames(fileNames: string[], mapped: ReadonlySet<string>): string[] {
  return fileNames
    .filter((file) => file.endsWith('.md') && file !== 'SYNC.json')
    .map((file) => basename(file, '.md'))
    .filter((name) => !mapped.has(name))
    .toSorted(compareNames)
}

/** 排序后紧凑 JSON 再 sha256；键序固定为 name、digest。 */
export function itemsDigest(items: SyncManifestItem[]): string {
  const sorted = [...items].toSorted((a, b) => compareNames(a.name, b.name))
  const normalized = sorted.map((item) => ({ name: item.name, digest: item.digest }))
  return sha256(JSON.stringify(normalized))
}

/** items_digest 相同则沿用旧时间；否则用传入的 now。 */
export function nextItemsChangedAt(
  previousDigest: string | undefined,
  previousChangedAt: string | undefined,
  currentDigest: string,
  now: string,
): string {
  if (previousDigest && previousDigest === currentDigest && previousChangedAt) {
    return previousChangedAt
  }
  return now
}

export class UpstreamService {
  constructor(private root: string) {}

  async updateAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      await this.ensureRepo(name, config)
    }
  }

  /** 删掉 checkout 再 clone，与 dest 技能目录无关 */
  async forceUpdateAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      const upstreamPath = join(this.root, 'upstream', name)
      if (existsSync(upstreamPath)) {
        rmSync(upstreamPath, { recursive: true, force: true })
      }
      await this.ensureRepo(name, config)
    }
  }

  async syncAll(repositories: Record<string, RepositoryConfig>, force: boolean = false): Promise<void> {
    for (const [name, config] of Object.entries(repositories)) {
      await this.syncUpstream(name, config, force)
    }
  }

  /**
   * 重写当前 mapping 的 dest。
   * force：额外删除该 repo 下已不在 mapping 里的 orphan skill 目录 / agent .md。
   */
  async syncUpstream(upstreamName: string, config: RepositoryConfig, force: boolean = false): Promise<void> {
    const skills = config.skills ?? []
    const agents = config.agents ?? []

    if (!skills.length && !agents.length) {
      p.log.warn(`No skills or agents configured for ${upstreamName}, skipping sync`)
      return
    }

    const repoRoot = join(this.root, 'upstream', upstreamName)
    if (!(await pathExists(repoRoot))) {
      throw new Error(`Upstream repository not found: ${upstreamName}`)
    }

    await this.preflight(upstreamName, repoRoot, skills, agents)

    const { sha, committedAt } = await this.getUpstreamCommit(upstreamName)

    if (skills.length) {
      await this.syncSkillsKind(upstreamName, repoRoot, config, skills, sha, committedAt, force)
    }

    if (agents.length) {
      await this.syncAgentsKind(upstreamName, repoRoot, config, agents, sha, committedAt, force)
    }
  }

  /** 没有 checkout 就 clone，然后一律 reset 到 pin。 */
  async ensureRepo(name: string, config: RepositoryConfig): Promise<void> {
    const upstreamPath = join(this.root, 'upstream', name)

    if (!existsSync(upstreamPath)) {
      await this.cloneRepo(config, upstreamPath)
    }
    await this.updateRepo(config, upstreamPath)
  }

  private async syncSkillsKind(
    upstreamName: string,
    repoRoot: string,
    config: RepositoryConfig,
    skills: SkillMapping[],
    sha: string,
    committedAt: string,
    force: boolean,
  ): Promise<void> {
    const skillsRoot = join(this.root, 'skills', upstreamName)
    await ensureDir(skillsRoot)
    const items: SyncManifestItem[] = []

    for (const mapping of skills) {
      const ctx = await this.loadSkillContext(repoRoot, mapping)
      const names = resolveTransformNames(config, 'skill', mapping)
      runSkillPipeline(ctx, names)
      const destPath = join(skillsRoot, mapping.name)
      await emptyDir(destPath)
      await this.writeSkillFiles(destPath, ctx.files)
      const files = await listFilesRecursive(destPath)
      items.push({ name: mapping.name, digest: await digestTree(destPath, files) })
      p.log.success(`✓ Synced skill '${mapping.name}' from ${upstreamName}`)
    }

    if (force) {
      await this.removeOrphanSkills(skillsRoot, new Set(skills.map((mapping) => mapping.name)), upstreamName)
    }
    await this.writeSyncJSON(skillsRoot, sha, committedAt, items)
    p.log.success(`✓ Wrote skills SYNC.json for ${upstreamName} (SHA: ${sha.substring(0, 7)})`)
  }

  private async syncAgentsKind(
    upstreamName: string,
    repoRoot: string,
    config: RepositoryConfig,
    agents: AgentMapping[],
    sha: string,
    committedAt: string,
    force: boolean,
  ): Promise<void> {
    const agentsRoot = join(this.root, 'agents', upstreamName)
    await ensureDir(agentsRoot)
    const items: SyncManifestItem[] = []

    for (const mapping of agents) {
      const ctx = await this.loadAgentContext(repoRoot, mapping)
      const names = resolveTransformNames(config, 'agent', mapping)
      runAgentPipeline(ctx, names)
      const destPath = join(agentsRoot, `${mapping.name}.md`)
      await writeFile(destPath, ctx.content)
      items.push({ name: mapping.name, digest: await digestFile(destPath) })
      p.log.success(`✓ Synced agent '${mapping.name}' from ${upstreamName}`)
    }

    if (force) {
      await this.removeOrphanAgents(agentsRoot, new Set(agents.map((mapping) => mapping.name)), upstreamName)
    }
    await this.writeSyncJSON(agentsRoot, sha, committedAt, items)
    p.log.success(`✓ Wrote agents SYNC.json for ${upstreamName} (SHA: ${sha.substring(0, 7)})`)
  }

  private async removeOrphanSkills(
    skillsRoot: string,
    mapped: ReadonlySet<string>,
    upstreamName: string,
  ): Promise<void> {
    const entries = await readdir(skillsRoot, { withFileTypes: true })
    const dirNames = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    for (const name of orphanSkillNames(dirNames, mapped)) {
      await rm(join(skillsRoot, name), { recursive: true, force: true })
      p.log.warn(`✗ Removed orphan skill '${name}' from ${upstreamName}`)
    }
  }

  private async removeOrphanAgents(
    agentsRoot: string,
    mapped: ReadonlySet<string>,
    upstreamName: string,
  ): Promise<void> {
    const entries = await readdir(agentsRoot, { withFileTypes: true })
    const fileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
    for (const name of orphanAgentNames(fileNames, mapped)) {
      await rm(join(agentsRoot, `${name}.md`), { force: true })
      p.log.warn(`✗ Removed orphan agent '${name}' from ${upstreamName}`)
    }
  }

  private async loadSkillContext(repoRoot: string, mapping: SkillMapping): Promise<SkillContext> {
    const skillDir = dirname(join(repoRoot, mapping.source))
    const entryPath = basename(mapping.source)
    const relativeFiles = await listFilesRecursive(skillDir)
    const files = new Map<string, Buffer>()
    for (const rel of relativeFiles) {
      files.set(rel, await readFile(join(skillDir, rel)))
    }
    if (!files.has(entryPath)) {
      files.set(entryPath, await readFile(join(repoRoot, mapping.source)))
    }
    return { name: mapping.name, files, entryPath }
  }

  private async loadAgentContext(repoRoot: string, mapping: AgentMapping): Promise<AgentContext> {
    const content = await readFile(join(repoRoot, mapping.source), 'utf-8')
    return { name: mapping.name, content }
  }

  private async writeSkillFiles(destDir: string, files: Map<string, Buffer>): Promise<void> {
    for (const [rel, content] of files) {
      const destPath = join(destDir, rel)
      await mkdir(dirname(destPath), { recursive: true })
      await writeFile(destPath, content)
    }
  }

  private async preflight(
    upstreamName: string,
    repoRoot: string,
    skills: SkillMapping[],
    agents: AgentMapping[],
  ): Promise<void> {
    const missing: string[] = []
    for (const mapping of skills) {
      const sourcePath = join(repoRoot, mapping.source)
      if (!(await pathExists(sourcePath))) {
        missing.push(`skill ${mapping.name}: ${sourcePath}`)
      }
    }
    for (const mapping of agents) {
      const sourcePath = join(repoRoot, mapping.source)
      if (!(await pathExists(sourcePath))) {
        missing.push(`agent ${mapping.name}: ${sourcePath}`)
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `Preflight failed for ${upstreamName}: ${missing.length} source(s) missing:\n${missing.map((m) => `  - ${m}`).join('\n')}`,
      )
    }
  }

  private async getUpstreamCommit(repoName: string): Promise<{ sha: string; committedAt: string }> {
    const repoPath = join(this.root, 'upstream', repoName)
    const git = simpleGit(repoPath)
    const sha = (await git.revparse(['HEAD'])).trim()
    const committedAt = (await git.raw(['log', '-1', '--format=%cI'])).trim()
    return { sha, committedAt }
  }

  private async readSyncManifest(destRoot: string): Promise<SyncManifest | null> {
    const syncJsonPath = join(destRoot, 'SYNC.json')
    if (!(await pathExists(syncJsonPath))) return null
    try {
      return JSON.parse(await readFile(syncJsonPath, 'utf-8')) as SyncManifest
    } catch {
      return null
    }
  }

  private async writeSyncJSON(
    destRoot: string,
    sha: string,
    committedAt: string,
    items: SyncManifestItem[],
  ): Promise<void> {
    const sorted = [...items].toSorted((a, b) => compareNames(a.name, b.name))
    const digest = itemsDigest(sorted)
    const previous = await this.readSyncManifest(destRoot)
    const now = new Date().toISOString()
    const manifest: SyncManifest = {
      upstream_committed_sha: sha,
      upstream_committed_at: committedAt,
      items_digest: digest,
      items_changed_at: nextItemsChangedAt(previous?.items_digest, previous?.items_changed_at, digest, now),
      items: sorted,
    }
    await writeFile(join(destRoot, 'SYNC.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  }

  private async cloneRepo(config: RepositoryConfig, upstreamPath: string): Promise<void> {
    const upstreamDir = join(this.root, 'upstream')
    if (!existsSync(upstreamDir)) {
      mkdirSync(upstreamDir, { recursive: true })
    }
    await simpleGit(this.root).clone(config.url, upstreamPath)
  }

  private async updateRepo(config: RepositoryConfig, upstreamPath: string): Promise<void> {
    const repoGit = simpleGit(upstreamPath)
    await repoGit.fetch(['--tags', '--force'])

    let ref: string
    if (config.commit) {
      ref = config.commit
    } else if (config.tag) {
      ref = `refs/tags/${config.tag}`
    } else if (config.branch) {
      ref = `origin/${config.branch}`
    } else {
      ref = await this.getDefaultBranch(repoGit)
    }

    await repoGit.reset(['--hard', ref])
  }

  private async getDefaultBranch(git: ReturnType<typeof simpleGit>): Promise<string> {
    const branches = ['main', 'master']
    for (const branch of branches) {
      try {
        await git.revparse([`origin/${branch}`])
        return `origin/${branch}`
      } catch {
        // try next
      }
    }
    throw new Error('Could not determine default branch')
  }
}
