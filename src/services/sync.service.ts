import * as p from '@clack/prompts'
import { cp, glob, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import type { AgentMapping, RepositoryConfig, SkillMapping, SyncInfo, SyncItemRecord } from '../types'
import type { UpstreamService } from './upstream.service'

import { composeTransforms } from '../transforms/compose'
import { applyMarkdownTransforms, transformId } from '../transforms/pipeline'
import { hashNamedTransforms } from '../transforms/registry'
import { digestFile, digestTree } from '../utils/digest'
import { emptyDir, ensureDir, pathExists } from '../utils/fs'
import { listSkillFiles } from '../utils/glob-files'
import { shouldSkipItem } from './sync-skip'

/** 按 mapping 拷贝 + 变换。不删除 dest 里未再映射的目录/文件。 */
export class SyncService {
  constructor(
    private root: string,
    private upstreamService: UpstreamService,
  ) {}

  async syncAll(repositories: Record<string, RepositoryConfig>, force: boolean = false): Promise<void> {
    for (const [name, config] of Object.entries(repositories)) {
      await this.syncUpstream(name, config, force)
    }
  }

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

    const sha = await this.upstreamService.getRepoSha(upstreamName)
    if (!sha) {
      throw new Error(`Cannot get SHA for ${upstreamName}`)
    }

    if (skills.length) {
      await this.syncSkillsKind(upstreamName, repoRoot, config, skills, sha, force)
    }

    if (agents.length) {
      await this.syncAgentsKind(upstreamName, repoRoot, config, agents, sha, force)
    }
  }

  private async syncSkillsKind(
    upstreamName: string,
    repoRoot: string,
    config: RepositoryConfig,
    skills: SkillMapping[],
    sha: string,
    force: boolean,
  ): Promise<void> {
    const skillsRoot = join(this.root, 'skills', upstreamName)
    await ensureDir(skillsRoot)
    const previous = await this.readSyncInfo(skillsRoot)
    const items: Record<string, SyncItemRecord> = {}

    for (const mapping of skills) {
      const composed = composeTransforms(config, 'skill', mapping)
      const moduleHashes = hashNamedTransforms(composed.transforms)
      const id = transformId(composed, mapping.includes, moduleHashes)
      const skillDir = dirname(join(repoRoot, mapping.source))
      const files = await listSkillFiles(skillDir, mapping.includes, composed.excludes)
      const skillMd = basename(mapping.source)
      const sourceFiles = files.includes(skillMd) ? files : [...files, skillMd]
      const sourceDigest = await digestTree(skillDir, sourceFiles)
      const destPath = join(skillsRoot, mapping.target)
      const destExists = await pathExists(join(destPath, 'SKILL.md'))
      const skip = shouldSkipItem({
        force,
        destExists,
        recorded: previous?.items?.[mapping.target],
        sourceDigest,
        transformId: id,
      })

      if (skip) {
        p.log.warn(`✓ ${upstreamName}/${mapping.target} unchanged`)
        items[mapping.target] = previous!.items![mapping.target]
        continue
      }

      // 只清空当前这条 dest，再拷贝；未映射的邻居目录不动
      await emptyDir(destPath)
      await this.copySkillFiles(skillDir, destPath, mapping.includes, composed.excludes)
      const skillMdDest = join(destPath, 'SKILL.md')
      if (!(await pathExists(skillMdDest))) {
        await writeFile(skillMdDest, await readFile(join(repoRoot, mapping.source), 'utf-8'))
      }
      await this.applyDestMarkdown(destPath, mapping.target, composed)
      items[mapping.target] = { sourceDigest, transformId: id }
      p.log.success(`✓ Synced skill '${mapping.target}' from ${upstreamName}`)
    }

    await this.writeSyncJSON(skillsRoot, sha, items)
    p.log.success(`✓ Wrote skills SYNC.json for ${upstreamName} (SHA: ${sha.substring(0, 7)})`)
  }

  private async syncAgentsKind(
    upstreamName: string,
    repoRoot: string,
    config: RepositoryConfig,
    agents: AgentMapping[],
    sha: string,
    force: boolean,
  ): Promise<void> {
    const agentsRoot = join(this.root, 'agents', upstreamName)
    await ensureDir(agentsRoot)
    const previous = await this.readSyncInfo(agentsRoot)
    const items: Record<string, SyncItemRecord> = {}

    for (const mapping of agents) {
      const composed = composeTransforms(config, 'agent', mapping)
      const moduleHashes = hashNamedTransforms(composed.transforms)
      const id = transformId(composed, undefined, moduleHashes)
      const sourcePath = join(repoRoot, mapping.source)
      const sourceDigest = await digestFile(sourcePath)
      const destPath = join(agentsRoot, `${mapping.target}.md`)
      const destExists = await pathExists(destPath)
      const skip = shouldSkipItem({
        force,
        destExists,
        recorded: previous?.items?.[mapping.target],
        sourceDigest,
        transformId: id,
      })

      if (skip) {
        p.log.warn(`✓ ${upstreamName}/${mapping.target} agent unchanged`)
        items[mapping.target] = previous!.items![mapping.target]
        continue
      }

      const content = await readFile(sourcePath, 'utf-8')
      await writeFile(
        destPath,
        applyMarkdownTransforms(content, {
          isFrontmatterFile: true,
          name: mapping.target,
          composed,
        }),
      )
      items[mapping.target] = { sourceDigest, transformId: id }
      p.log.success(`✓ Synced agent '${mapping.target}' from ${upstreamName}`)
    }

    await this.writeSyncJSON(agentsRoot, sha, items)
    p.log.success(`✓ Wrote agents SYNC.json for ${upstreamName} (SHA: ${sha.substring(0, 7)})`)
  }

  /** .md / .mdc 跑正文变换；只有 SKILL.md 改 YAML 并把 name 写成 dest target。 */
  private async applyDestMarkdown(
    destDir: string,
    name: string,
    composed: ReturnType<typeof composeTransforms>,
  ): Promise<void> {
    for (const pattern of ['**/*.md', '**/*.mdc']) {
      for await (const file of glob(pattern, { cwd: destDir })) {
        const full = join(destDir, file)
        const normalized = file.split('\\').join('/')
        const isEntry = normalized === 'SKILL.md'
        const content = await readFile(full, 'utf-8')
        await writeFile(
          full,
          applyMarkdownTransforms(content, {
            isFrontmatterFile: isEntry,
            name: isEntry ? name : undefined,
            composed,
          }),
        )
      }
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
        missing.push(`skill ${mapping.target}: ${sourcePath}`)
      }
    }
    for (const mapping of agents) {
      const sourcePath = join(repoRoot, mapping.source)
      if (!(await pathExists(sourcePath))) {
        missing.push(`agent ${mapping.target}: ${sourcePath}`)
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `Preflight failed for ${upstreamName}: ${missing.length} source(s) missing:\n${missing.map((m) => `  - ${m}`).join('\n')}`,
      )
    }
  }

  private async copySkillFiles(
    sourceDir: string,
    targetDir: string,
    includes: string[] | undefined,
    excludes: string[] | undefined,
  ): Promise<void> {
    const files = await listSkillFiles(sourceDir, includes, excludes)
    for (const file of files) {
      const destPath = join(targetDir, file)
      await mkdir(dirname(destPath), { recursive: true })
      await cp(join(sourceDir, file), destPath)
    }
  }

  private async readSyncInfo(destRoot: string): Promise<SyncInfo | null> {
    const syncJsonPath = join(destRoot, 'SYNC.json')
    if (!(await pathExists(syncJsonPath))) return null
    try {
      return JSON.parse(await readFile(syncJsonPath, 'utf-8')) as SyncInfo
    } catch {
      return null
    }
  }

  private async writeSyncJSON(destRoot: string, sha: string, items: Record<string, SyncItemRecord>): Promise<void> {
    const date = new Date().toISOString().split('T')[0]
    const syncInfo: SyncInfo = { sha, synced: date, items }
    await writeFile(join(destRoot, 'SYNC.json'), `${JSON.stringify(syncInfo, null, 2)}\n`)
  }
}
