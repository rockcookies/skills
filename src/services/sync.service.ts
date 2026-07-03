import * as p from '@clack/prompts'
import yaml from 'js-yaml'
import { cp, glob, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type { RepositoryConfig, SkillMapping } from '../types'
import type { UpstreamService } from './upstream.service'

import { emptyDir, ensureDir, pathExists } from '../utils/fs'

interface SyncInfo {
  source: string
  sha: string
  synced: string
  includes?: string[]
  excludes?: string[]
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

    const sha = await this.upstreamService.getRepoSha(upstreamName)
    if (!sha) {
      throw new Error(`Cannot get SHA for ${upstreamName}`)
    }

    for (const mapping of config.skills) {
      await this.syncSkillMapping(upstreamName, repoRoot, mapping, sha, force)
    }
  }

  private async syncSkillMapping(
    upstreamName: string,
    repoRoot: string,
    mapping: SkillMapping,
    sha: string,
    force: boolean = false,
  ): Promise<void> {
    const sourcePath = join(repoRoot, mapping.source)
    const outputPath = join(this.root, 'skills', mapping.target)

    if (!(await pathExists(sourcePath))) {
      throw new Error(`SKILL.md not found: ${sourcePath}`)
    }

    await ensureDir(outputPath)

    if (!force && (await pathExists(outputPath))) {
      const syncInfo = await this.readSyncInfo(outputPath)
      if (syncInfo?.sha === sha) {
        p.log.warn(`✓ Skill '${mapping.target}' is up to date (SHA: ${sha.substring(0, 7)})`)
        return
      }
    }

    await emptyDir(outputPath)

    // Copy other files
    const skillDir = dirname(sourcePath)
    await this.copySkillFiles(skillDir, outputPath, mapping.includes, mapping.excludes)

    // Process SKILL.md
    const skillContent = await readFile(sourcePath, 'utf-8')
    const fmMatch = skillContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    const frontMatterData = fmMatch ? (yaml.load(fmMatch[1]) as Record<string, unknown>) : {}
    const bodyContent = fmMatch ? fmMatch[2] : skillContent
    const updated = `---\n${yaml.dump({ ...frontMatterData, name: mapping.target })}---\n${bodyContent}`
    await writeFile(join(outputPath, 'SKILL.md'), updated)

    // Write SYNC.json
    await this.writeSyncJSON(upstreamName, mapping.source, outputPath, sha, mapping.includes, mapping.excludes)

    p.log.success(`✓ Synced '${mapping.target}' from ${upstreamName}`)
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

  private async readSyncInfo(outputPath: string): Promise<SyncInfo | null> {
    const syncJsonPath = join(outputPath, 'SYNC.json')
    if (!(await pathExists(syncJsonPath))) return null
    try {
      const content = await readFile(syncJsonPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  private async writeSyncJSON(
    upstreamName: string,
    source: string,
    outputPath: string,
    sha: string,
    includes?: string[],
    excludes?: string[],
  ): Promise<void> {
    const date = new Date().toISOString().split('T')[0]
    const cleanSource = source.replace(/^\.\//, '')
    const syncInfo: SyncInfo = {
      source: `upstream/${upstreamName}/${cleanSource}`,
      sha,
      synced: date,
      ...(includes?.length && { includes }),
      ...(excludes?.length && { excludes }),
    }
    await writeFile(join(outputPath, 'SYNC.json'), `${JSON.stringify(syncInfo, null, 2)}\n`)
  }
}
