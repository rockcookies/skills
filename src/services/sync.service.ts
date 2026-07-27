import * as p from '@clack/prompts'
import { dump, load } from 'js-yaml'
import { cp, glob, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type { RepositoryConfig, SkillMapping } from '../types'
import type { UpstreamService } from './upstream.service'

import { emptyDir, ensureDir, pathExists } from '../utils/fs'

interface SyncInfo {
  sha: string
  synced: string
}

export class SyncService {
  private upstreamService: UpstreamService
  private root: string

  constructor(root: string, upstreamService: UpstreamService) {
    this.root = root
    this.upstreamService = upstreamService
  }

  async syncUpstreamSkills(repositories: Record<string, RepositoryConfig>, force: boolean = false): Promise<void> {
    for (const [name, config] of Object.entries(repositories)) {
      await this.syncUpstream(name, config, force)
    }
  }

  async syncUpstream(upstreamName: string, config: RepositoryConfig, force: boolean = false): Promise<void> {
    if (!config.skills?.length) {
      p.log.warn(`No skills configured for ${upstreamName}, skipping sync`)
      return
    }

    const repoRoot = join(this.root, 'upstream', upstreamName)

    if (!(await pathExists(repoRoot))) {
      throw new Error(`Upstream repository not found: ${upstreamName}`)
    }

    await this.preflight(upstreamName, repoRoot, config.skills)

    const sha = await this.upstreamService.getRepoSha(upstreamName)
    if (!sha) {
      throw new Error(`Cannot get SHA for ${upstreamName}`)
    }

    const skillsRoot = join(this.root, 'skills', upstreamName)
    const syncInfo = await this.readSyncInfo(skillsRoot)

    if (!force && syncInfo?.sha === sha) {
      p.log.warn(`✓ ${upstreamName} is up to date (SHA: ${sha.substring(0, 7)})`)
      return
    }

    await emptyDir(skillsRoot)

    for (const mapping of config.skills) {
      await this.syncSkillMapping(repoRoot, skillsRoot, mapping)
      p.log.success(`✓ Synced '${mapping.target}' from ${upstreamName}`)
    }

    await this.writeSyncJSON(skillsRoot, sha)
    p.log.success(`✓ Wrote SYNC.json for ${upstreamName} (SHA: ${sha.substring(0, 7)})`)
  }

  private async preflight(upstreamName: string, repoRoot: string, skills: SkillMapping[]): Promise<void> {
    const missing: string[] = []

    for (const mapping of skills) {
      const sourcePath = join(repoRoot, mapping.source)
      if (!(await pathExists(sourcePath))) {
        missing.push(`${mapping.target}: ${sourcePath}`)
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Preflight failed for ${upstreamName}: ${missing.length} skill source(s) missing:\n${missing.map((m) => `  - ${m}`).join('\n')}`,
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
    const fmMatch = skillContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    const frontMatterData = fmMatch ? (load(fmMatch[1]) as Record<string, unknown>) : {}
    const bodyContent = fmMatch ? fmMatch[2] : skillContent
    const updated = `---\n${dump({ ...frontMatterData, name: mapping.target })}---\n${bodyContent}`
    await writeFile(join(outputPath, 'SKILL.md'), updated)
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

  private async readSyncInfo(skillsRoot: string): Promise<SyncInfo | null> {
    const syncJsonPath = join(skillsRoot, 'SYNC.json')
    if (!(await pathExists(syncJsonPath))) return null
    try {
      const content = await readFile(syncJsonPath, 'utf-8')
      return JSON.parse(content) as SyncInfo
    } catch {
      return null
    }
  }

  private async writeSyncJSON(skillsRoot: string, sha: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0]
    const syncInfo: SyncInfo = {
      sha,
      synced: date,
    }
    await writeFile(join(skillsRoot, 'SYNC.json'), `${JSON.stringify(syncInfo, null, 2)}\n`)
  }
}
