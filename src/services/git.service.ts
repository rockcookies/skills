import type { SimpleGit } from 'simple-git'
import process from 'node:process'
import simpleGit from 'simple-git'

export class GitService {
  private git: SimpleGit

  constructor(cwd: string = process.cwd()) {
    this.git = simpleGit(cwd)
  }

  // 获取当前 HEAD SHA
  async getSha(): Promise<string> {
    const result = await this.git.revparse(['HEAD'])
    return result.trim()
  }

  // 获取相对于 upstream 的落后提交数
  async getBehindCount(): Promise<number> {
    const count = await this.git.revlist(['HEAD..@{u}', '--count'])
    return Number.parseInt(count.trim())
  }

  // 获取远程更新
  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  // 更新 submodule
  async updateSubmodules(options: { remote: boolean, merge: boolean }): Promise<void> {
    const args: string[] = ['submodule', 'update']
    if (options.remote)
      args.push('--remote')
    if (options.merge)
      args.push('--merge')
    await this.git.raw(args)
  }

  // 添加 submodule
  async addSubmodule(url: string, path: string): Promise<void> {
    await this.git.raw(['submodule', 'add', url, path])
  }

  // 移除 submodule
  async removeSubmodule(path: string): Promise<void> {
    await this.git.raw(['submodule', 'deinit', '-f', path])
    await this.git.rm(['-f', path])
  }

  // 检查是否为 git 仓库
  async checkIsRepo(): Promise<boolean> {
    return await this.git.checkIsRepo()
  }

  // 在 submodule 中执行命令
  async submoduleForeach(command: string): Promise<void> {
    // 使用 raw 方法执行 git submodule foreach 命令
    await this.git.raw(['submodule', 'foreach', command])
  }
}
