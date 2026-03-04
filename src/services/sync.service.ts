import type { RepositoryConfig } from '../types'
import type { UpstreamService } from './upstream.service'
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pathExists } from '../utils/fs'
import { GitService } from './git.service'

interface SyncInfo {
  source: string
  sha: string
  synced: string
}

export class SyncService {
  private upstreamService: UpstreamService
  private gitService: GitService
  private root: string

  constructor(root: string, upstreamService: UpstreamService) {
    this.root = root
    this.upstreamService = upstreamService
    this.gitService = new GitService(root)
  }

  // 同步所有 upstream 技能
  async syncUpstreamSkills(
    repositories: Record<string, RepositoryConfig>,
    force: boolean = false,
  ): Promise<void> {
    // Note: UpstreamService.updateAll should be called before this

    for (const [upstreamName, config] of Object.entries(repositories)) {
      await this.syncUpstream(upstreamName, config, force)
    }
  }

  // 同步单个 upstream
  async syncUpstream(upstreamName: string, config: RepositoryConfig, force: boolean = false): Promise<void> {
    const upstreamPath = join(this.root, 'upstream', upstreamName)
    const upstreamSkillsPath = join(upstreamPath, config.skillsPath || 'skills')

    if (!await pathExists(upstreamPath)) {
      throw new Error(`Upstream repository not found: ${upstreamName}`)
    }

    if (!await pathExists(upstreamSkillsPath)) {
      throw new Error(`No skills directory in ${upstreamName}`)
    }

    const sha = await this.upstreamService.getRepoSha(upstreamName)
    if (!sha) {
      throw new Error(`Cannot get SHA for ${upstreamName}`)
    }

    for (const [sourceSkillName, outputSkillName] of Object.entries(config.skills || {})) {
      await this.syncSkill(upstreamName, upstreamSkillsPath, sourceSkillName, outputSkillName, sha, force)
    }
  }

  // 同步单个技能
  private async syncSkill(
    upstreamName: string,
    upstreamSkillsPath: string,
    sourceSkillName: string,
    outputSkillName: string,
    sha: string,
    force: boolean = false,
  ): Promise<void> {
    const sourceSkillPath = join(upstreamSkillsPath, sourceSkillName)
    const outputPath = join(this.root, 'skills', outputSkillName)

    if (!await pathExists(sourceSkillPath)) {
      throw new Error(`Skill not found: ${upstreamName}/skills/${sourceSkillName}`)
    }

    // force 模式下跳过 SHA 检查
    if (!force && await pathExists(outputPath)) {
      const syncInfo = await this.readSyncInfo(outputPath)
      if (syncInfo?.sha === sha) {
        console.warn(`✓ Skill '${outputSkillName}' is up to date (SHA: ${sha.substring(0, 7)})`)
        return
      }
    }

    // Check for local modifications
    if (await pathExists(outputPath) && await this.hasLocalModifications(outputPath)) {
      console.warn(`⚠️  Skill '${outputSkillName}' has local modifications, will be overwritten`)
    }

    // 优化：先确保父目录存在
    await mkdir(dirname(outputPath), { recursive: true })

    // 清理并重建输出目录
    if (await pathExists(outputPath)) {
      await rm(outputPath, { recursive: true })
    }
    await mkdir(outputPath, { recursive: true })

    // 递归复制文件
    await this.copyDirectory(sourceSkillPath, outputPath)

    // 写入 SYNC.md
    await this.writeSyncJSON(upstreamName, sourceSkillName, outputPath, sha)
  }

  // 递归复制目录
  private async copyDirectory(source: string, target: string): Promise<void> {
    const files = await readdir(source, { recursive: true, withFileTypes: true })
    for (const file of files) {
      if (file.isFile()) {
        const srcPath = join(file.parentPath, file.name)
        const relPath = srcPath.replace(source, '')
        const destPath = join(target, relPath)

        await mkdir(dirname(destPath), { recursive: true })
        await cp(srcPath, destPath)
      }
    }
  }

  // 读取 SYNC.json
  private async readSyncInfo(outputPath: string): Promise<SyncInfo | null> {
    const syncJsonPath = join(outputPath, 'SYNC.json')

    if (await pathExists(syncJsonPath)) {
      try {
        const content = await readFile(syncJsonPath, 'utf-8')
        return JSON.parse(content)
      }
      catch {
        return null
      }
    }

    return null
  }

  // 写入 SYNC.json
  private async writeSyncJSON(upstreamName: string, sourceSkillName: string, outputPath: string, sha: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0]
    const syncInfo: SyncInfo = {
      source: `upstream/${upstreamName}/skills/${sourceSkillName}`,
      sha,
      synced: date,
    }
    await writeFile(join(outputPath, 'SYNC.json'), `${JSON.stringify(syncInfo, null, 2)}\n`)
  }

  // Check if skill has local modifications
  private async hasLocalModifications(skillPath: string): Promise<boolean> {
    const relativePath = skillPath.replace(`${this.root}/`, '').replace(/\\/g, '/')
    const diff = await this.gitService.diff([relativePath])
    return diff.trim().length > 0
  }
}
