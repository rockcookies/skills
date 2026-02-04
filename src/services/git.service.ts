import type { SimpleGit } from 'simple-git'
import process from 'node:process'
import simpleGit from 'simple-git'

export class GitService {
  private git: SimpleGit
  private proxy?: string

  constructor(cwd: string = process.cwd(), proxy?: string) {
    this.git = simpleGit(cwd)
    this.proxy = proxy
    if (proxy) {
      this.configureProxy()
    }
  }

  private async configureProxy(): Promise<void> {
    if (!this.proxy)
      return

    // Configure git http.proxy
    await this.git.raw(['config', 'http.proxy', this.proxy])
    await this.git.raw(['config', 'https.proxy', this.proxy])
  }

  // 获取当前 HEAD SHA
  async getSha(): Promise<string> {
    const result = await this.git.revparse(['HEAD'])
    return result.trim()
  }

  // 获取相对于 upstream 的落后提交数
  async getBehindCount(): Promise<number> {
    const count = await this.git.raw(['rev-list', 'HEAD..@{u}', '--count'])
    return Number.parseInt(count.trim())
  }

  // 获取远程更新
  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  // Clone repository
  async clone(url: string, path: string): Promise<void> {
    if (this.proxy) {
      // Use git clone with proxy configuration
      await this.git.raw(['clone', '-c', `http.proxy=${this.proxy}`, '-c', `https.proxy=${this.proxy}`, url, path])
    }
    else {
      await this.git.clone(url, path)
    }
  }

  // Get working tree diff
  async diff(files?: string[]): Promise<string> {
    const args = ['diff']
    if (files && files.length > 0) {
      args.push('--')
      args.push(...files)
    }
    return await this.git.raw(args)
  }

  // 检查是否为 git 仓库
  async checkIsRepo(): Promise<boolean> {
    return await this.git.checkIsRepo()
  }
}
