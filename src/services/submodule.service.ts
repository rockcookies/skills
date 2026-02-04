import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GitService } from './git.service'

export class SubmoduleService {
  private rootGit: GitService
  private root: string

  constructor(root: string) {
    this.root = root
    this.rootGit = new GitService(root)
  }

  // 读取 .gitmodules 获取所有 submodule 路径
  getSubmodulePaths(): string[] {
    const gitmodules = join(this.root, '.gitmodules')
    try {
      const content = readFileSync(gitmodules, 'utf-8')
      const matches = content.matchAll(/path\s*=\s*(.+)/g)
      return Array.from(matches, m => m[1].trim())
    }
    catch {
      return []
    }
  }

  // 检查指定路径是否为 submodule
  isSubmodule(path: string): boolean {
    return this.getSubmodulePaths().includes(path)
  }

  // 获取指定 submodule 的 SHA
  async getSubmoduleSha(submodulePath: string): Promise<string | null> {
    const gitService = new GitService(join(this.root, submodulePath))
    try {
      return await gitService.getSha()
    }
    catch {
      return null
    }
  }

  // 检查 submodule 是否有更新
  async checkSubmoduleUpdate(submodulePath: string): Promise<number> {
    const gitService = new GitService(join(this.root, submodulePath))
    return await gitService.getBehindCount()
  }

  // 添加新 submodule
  async addSubmodule(url: string, path: string): Promise<void> {
    await this.rootGit.addSubmodule(url, path)
  }

  // 完全移除 submodule
  async removeSubmoduleFully(submodulePath: string): Promise<void> {
    await this.rootGit.removeSubmodule(submodulePath)
  }

  // 更新所有 submodules
  async updateAllSubmodules(): Promise<void> {
    await this.rootGit.updateSubmodules({ remote: true, merge: true })
  }

  // 为所有 submodules 执行 fetch
  async fetchAllSubmodules(): Promise<void> {
    await this.rootGit.submoduleForeach('git fetch')
  }
}
