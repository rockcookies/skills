import type { VendorConfig } from '../types.ts'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { SubmoduleService } from './submodule.service.ts'

export class SyncService {
  private submoduleService: SubmoduleService
  private root: string

  constructor(root: string) {
    this.root = root
    this.submoduleService = new SubmoduleService(root)
  }

  // 同步所有 vendor 技能
  async syncVendorSkills(vendors: Record<string, VendorConfig>): Promise<void> {
    await this.submoduleService.updateAllSubmodules()

    for (const [vendorName, config] of Object.entries(vendors)) {
      await this.syncVendor(vendorName, config)
    }
  }

  // 同步单个 vendor
  async syncVendor(vendorName: string, config: VendorConfig): Promise<void> {
    const vendorPath = join(this.root, 'vendor', vendorName)
    const vendorSkillsPath = join(vendorPath, 'skills')

    if (!existsSync(vendorPath)) {
      throw new Error(`Vendor submodule not found: ${vendorName}`)
    }

    if (!existsSync(vendorSkillsPath)) {
      throw new Error(`No skills directory in ${vendorName}`)
    }

    const sha = await this.submoduleService.getSubmoduleSha(`vendor/${vendorName}`)
    if (!sha) {
      throw new Error(`Cannot get SHA for ${vendorName}`)
    }

    for (const [sourceSkillName, outputSkillName] of Object.entries(config.skills)) {
      await this.syncSkill(vendorName, vendorSkillsPath, sourceSkillName, outputSkillName, sha)
    }
  }

  // 同步单个技能
  private async syncSkill(
    vendorName: string,
    vendorSkillsPath: string,
    sourceSkillName: string,
    outputSkillName: string,
    sha: string,
  ): Promise<void> {
    const sourceSkillPath = join(vendorSkillsPath, sourceSkillName)
    const outputPath = join(this.root, 'skills', outputSkillName)

    if (!existsSync(sourceSkillPath)) {
      throw new Error(`Skill not found: ${vendorName}/skills/${sourceSkillName}`)
    }

    // 清理并重建输出目录
    if (existsSync(outputPath)) {
      rmSync(outputPath, { recursive: true })
    }
    mkdirSync(outputPath, { recursive: true })

    // 递归复制文件
    this.copyDirectory(sourceSkillPath, outputPath)

    // 复制 LICENSE
    this.copyLicense(vendorName, outputPath)

    // 写入 SYNC.md
    this.writeSyncMd(vendorName, sourceSkillName, outputPath, sha)
  }

  // 递归复制目录
  private copyDirectory(source: string, target: string): void {
    const files = readdirSync(source, { recursive: true, withFileTypes: true })
    for (const file of files) {
      if (file.isFile()) {
        const srcPath = join(file.parentPath, file.name)
        const relPath = srcPath.replace(source, '')
        const destPath = join(target, relPath)

        mkdirSync(dirname(destPath), { recursive: true })
        cpSync(srcPath, destPath)
      }
    }
  }

  // 复制 LICENSE 文件
  private copyLicense(vendorName: string, outputPath: string): void {
    const vendorPath = join(this.root, 'vendor', vendorName)
    const licenseNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'license.txt']

    for (const name of licenseNames) {
      const licensePath = join(vendorPath, name)
      if (existsSync(licensePath)) {
        cpSync(licensePath, join(outputPath, 'LICENSE.md'))
        break
      }
    }
  }

  // 写入 SYNC.md
  private writeSyncMd(vendorName: string, sourceSkillName: string, outputPath: string, sha: string): void {
    const date = new Date().toISOString().split('T')[0]
    const content = `# Sync Info

- **Source:** \`vendor/${vendorName}/skills/${sourceSkillName}\`
- **Git SHA:** \`${sha}\`
- **Synced:** ${date}
`
    writeFileSync(join(outputPath, 'SYNC.md'), content)
  }
}
