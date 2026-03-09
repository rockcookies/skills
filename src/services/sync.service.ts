import type { RepositoryConfig, SkillMapping, SkillsConfig } from '../types'
import type { UpstreamService } from './upstream.service'
import { cp, glob, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import { emptyDir, ensureDir, pathExists } from '../utils/fs'
import { GitService } from './git.service'

interface SyncInfo {
  source: string
  sha: string
  synced: string
  glob?: string
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

    // 标准化配置并遍历
    const mappings = this.normalizeSkillsConfig(config.skills)
    for (const mapping of mappings) {
      await this.syncSkillMapping(
        upstreamName,
        upstreamSkillsPath,
        mapping,
        sha,
        force,
      )
    }
  }

  /**
   * 标准化技能配置为统一的 SkillMapping[] 格式
   */
  private normalizeSkillsConfig(skills?: SkillsConfig): SkillMapping[] {
    if (!skills) {
      return []
    }

    // 检测是否为旧格式 Record<string, string>
    if (typeof skills === 'object' && !Array.isArray(skills)) {
      // 转换旧格式为新格式
      return Object.entries(skills).map(([source, target]) => ({
        source,
        target,
      }))
    }

    // 已经是新格式
    return skills as SkillMapping[]
  }

  // 同步单个技能映射（支持 glob 过滤）
  private async syncSkillMapping(
    upstreamName: string,
    upstreamSkillsPath: string,
    mapping: SkillMapping,
    sha: string,
    force: boolean = false,
  ): Promise<void> {
    const { source, target, glob: globPattern } = mapping

    const sourcePath = source === ''
      ? upstreamSkillsPath
      : join(upstreamSkillsPath, source)
    const outputPath = join(this.root, 'skills', target)

    // 验证源路径存在
    if (!await pathExists(sourcePath)) {
      throw new Error(`Source path not found: ${sourcePath}`)
    }

    // 如果有 glob 模式，验证过滤后的文件中包含 SKILL.md
    if (globPattern) {
      const filteredFiles = await this.filterByGlob(sourcePath, globPattern)
      const hasSkillMd = filteredFiles.some(f => f.endsWith('SKILL.md'))
      if (!hasSkillMd) {
        throw new Error(`SKILL.md not found in glob-filtered files from ${sourcePath}`)
      }
    }
    else {
      if (!await pathExists(join(sourcePath, 'SKILL.md'))) {
        throw new Error(`Missing SKILL.md in ${sourcePath}`)
      }
    }

    // SHA 检查
    if (!force && await pathExists(outputPath)) {
      const syncInfo = await this.readSyncInfo(outputPath)
      if (syncInfo?.sha === sha && syncInfo?.glob === globPattern) {
        p.log.warn(`✓ Skill '${target}' is up to date (SHA: ${sha.substring(0, 7)})`)
        return
      }
    }

    // 清理并重建输出目录
    await ensureDir(outputPath)
    await emptyDir(outputPath)

    // 根据是否有 glob 模式选择复制方式
    if (globPattern) {
      await this.copyDirectoryWithGlob(sourcePath, outputPath, globPattern)
    }
    else {
      await this.copyDirectory(sourcePath, outputPath)
    }

    // 写入 SYNC.json
    await this.writeSyncJSON(upstreamName, source, outputPath, sha, globPattern)
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

  /**
   * 使用 glob 模式过滤文件（使用 Node.js 原生 glob）
   */
  private async filterByGlob(sourcePath: string, globPattern: string): Promise<string[]> {
    const files = await Array.fromAsync(glob(globPattern, {
      cwd: sourcePath,
      withFileTypes: false,
    }))
    return files
  }

  /**
   * 复制目录并应用 glob 过滤
   */
  private async copyDirectoryWithGlob(source: string, target: string, globPattern: string): Promise<void> {
    const files = await this.filterByGlob(source, globPattern)

    for (const relPath of files) {
      const srcPath = join(source, relPath)
      const destPath = join(target, relPath)

      await mkdir(dirname(destPath), { recursive: true })
      await cp(srcPath, destPath)
    }

    p.log.info(`✓ Copied ${files.length} files matching pattern: ${globPattern}`)
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
  private async writeSyncJSON(upstreamName: string, sourceSkillName: string, outputPath: string, sha: string, globPattern?: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0]
    const source = sourceSkillName === ''
      ? `upstream/${upstreamName}`
      : `upstream/${upstreamName}/skills/${sourceSkillName}`
    const syncInfo: SyncInfo = {
      source,
      sha,
      synced: date,
      ...(globPattern && { glob: globPattern }),
    }
    await writeFile(join(outputPath, 'SYNC.json'), `${JSON.stringify(syncInfo, null, 2)}\n`)
  }
}
