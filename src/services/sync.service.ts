import * as p from '@clack/prompts'
import { dump, load } from 'js-yaml'
import { cp, glob, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type { AgentMapping, RepositoryConfig, SkillMapping } from '../types'
import type { UpstreamService } from './upstream.service'

import { emptyDir, ensureDir, pathExists } from '../utils/fs'

interface SyncInfo {
  sha: string
  synced: string
}

interface SourceMapping {
  source: string
  target: string
  kind: 'skill' | 'agent'
}

export class SyncService {
  private upstreamService: UpstreamService
  private root: string

  constructor(root: string, upstreamService: UpstreamService) {
    this.root = root
    this.upstreamService = upstreamService
  }

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

    const sources: SourceMapping[] = [
      ...skills.map((mapping) => ({ ...mapping, kind: 'skill' as const })),
      ...agents.map((mapping) => ({ ...mapping, kind: 'agent' as const })),
    ]
    await this.preflight(upstreamName, repoRoot, sources)

    const sha = await this.upstreamService.getRepoSha(upstreamName)
    if (!sha) {
      throw new Error(`Cannot get SHA for ${upstreamName}`)
    }

    if (skills.length) {
      await this.syncSkillsKind(upstreamName, repoRoot, skills, sha, force)
    }

    if (agents.length) {
      await this.syncAgentsKind(upstreamName, repoRoot, agents, sha, force)
    }
  }

  private async syncSkillsKind(
    upstreamName: string,
    repoRoot: string,
    skills: SkillMapping[],
    sha: string,
    force: boolean,
  ): Promise<void> {
    const skillsRoot = join(this.root, 'skills', upstreamName)
    if (await this.shouldSkipKind(skillsRoot, sha, force)) {
      p.log.warn(`✓ ${upstreamName} skills are up to date (SHA: ${sha.substring(0, 7)})`)
      return
    }

    await emptyDir(skillsRoot)

    for (const mapping of skills) {
      await this.syncSkillMapping(repoRoot, skillsRoot, mapping)
      p.log.success(`✓ Synced skill '${mapping.target}' from ${upstreamName}`)
    }

    await this.writeSyncJSON(skillsRoot, sha)
    p.log.success(`✓ Wrote skills SYNC.json for ${upstreamName} (SHA: ${sha.substring(0, 7)})`)
  }

  private async syncAgentsKind(
    upstreamName: string,
    repoRoot: string,
    agents: AgentMapping[],
    sha: string,
    force: boolean,
  ): Promise<void> {
    const agentsRoot = join(this.root, 'agents', upstreamName)
    if (await this.shouldSkipKind(agentsRoot, sha, force)) {
      p.log.warn(`✓ ${upstreamName} agents are up to date (SHA: ${sha.substring(0, 7)})`)
      return
    }

    await emptyDir(agentsRoot)

    for (const mapping of agents) {
      await this.syncAgentMapping(repoRoot, agentsRoot, mapping)
      p.log.success(`✓ Synced agent '${mapping.target}' from ${upstreamName}`)
    }

    await this.writeSyncJSON(agentsRoot, sha)
    p.log.success(`✓ Wrote agents SYNC.json for ${upstreamName} (SHA: ${sha.substring(0, 7)})`)
  }

  private async shouldSkipKind(destRoot: string, sha: string, force: boolean): Promise<boolean> {
    if (force) return false
    const syncInfo = await this.readSyncInfo(destRoot)
    return syncInfo?.sha === sha
  }

  private async preflight(upstreamName: string, repoRoot: string, sources: SourceMapping[]): Promise<void> {
    const missing: string[] = []

    for (const mapping of sources) {
      const sourcePath = join(repoRoot, mapping.source)
      if (!(await pathExists(sourcePath))) {
        missing.push(`${mapping.kind} ${mapping.target}: ${sourcePath}`)
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Preflight failed for ${upstreamName}: ${missing.length} source(s) missing:\n${missing.map((m) => `  - ${m}`).join('\n')}`,
      )
    }
  }

  private async syncSkillMapping(repoRoot: string, skillsRoot: string, mapping: SkillMapping): Promise<void> {
    const sourcePath = join(repoRoot, mapping.source)
    const outputPath = join(skillsRoot, mapping.target)

    await ensureDir(outputPath)

    const skillDir = dirname(sourcePath)
    await this.copySkillFiles(skillDir, outputPath, mapping.includes, mapping.excludes)

    const skillContent = await readFile(sourcePath, 'utf-8')
    await writeFile(join(outputPath, 'SKILL.md'), this.rewriteFrontmatterName(skillContent, mapping.target))
  }

  private async syncAgentMapping(repoRoot: string, agentsRoot: string, mapping: AgentMapping): Promise<void> {
    const sourcePath = join(repoRoot, mapping.source)
    const destPath = join(agentsRoot, `${mapping.target}.md`)

    const agentContent = await readFile(sourcePath, 'utf-8')
    await writeFile(destPath, this.rewriteFrontmatterName(agentContent, mapping.target))
  }

  private rewriteFrontmatterName(content: string, name: string): string {
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    const frontMatterData = fmMatch ? (load(fmMatch[1]) as Record<string, unknown>) : {}
    const bodyContent = fmMatch ? fmMatch[2] : content
    return `---\n${dump({ ...frontMatterData, name })}---\n${bodyContent}`
  }

  private async copySkillFiles(
    sourceDir: string,
    targetDir: string,
    includes: string[] = [],
    excludes?: string[],
  ): Promise<void> {
    const patterns = includes.length === 0 ? ['**/*', '**/*/.*'] : includes
    const seen = new Set<string>()

    for (const pattern of patterns) {
      const files = glob(pattern, {
        exclude: excludes,
        cwd: sourceDir,
      })

      for await (const file of files) {
        if (seen.has(file)) continue
        seen.add(file)

        const srcPath = join(sourceDir, file)
        const destPath = join(targetDir, file)

        const stats = await stat(srcPath)
        if (stats.isDirectory()) {
          continue
        }

        await mkdir(dirname(destPath), { recursive: true })
        await cp(srcPath, destPath)
      }
    }
  }

  private async readSyncInfo(destRoot: string): Promise<SyncInfo | null> {
    const syncJsonPath = join(destRoot, 'SYNC.json')
    if (!(await pathExists(syncJsonPath))) return null
    try {
      const content = await readFile(syncJsonPath, 'utf-8')
      return JSON.parse(content) as SyncInfo
    } catch {
      return null
    }
  }

  private async writeSyncJSON(destRoot: string, sha: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0]
    const syncInfo: SyncInfo = {
      sha,
      synced: date,
    }
    await writeFile(join(destRoot, 'SYNC.json'), `${JSON.stringify(syncInfo, null, 2)}\n`)
  }
}
