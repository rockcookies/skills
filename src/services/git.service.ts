import type { SimpleGit } from 'simple-git'

import process from 'node:process'
import git from 'simple-git'

export class GitService {
  private git: SimpleGit

  constructor(cwd: string = process.cwd()) {
    this.git = git(cwd)
  }

  /** 当前工作目录 HEAD SHA */
  async getSha(): Promise<string> {
    const result = await this.git.revparse(['HEAD'])
    return result.trim()
  }

  /** 相对 @{u} 落后的提交数 */
  async getBehindCount(): Promise<number> {
    const count = await this.git.raw(['rev-list', 'HEAD..@{u}', '--count'])
    return Number.parseInt(count.trim())
  }

  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  async clone(url: string, path: string): Promise<void> {
    await this.git.clone(url, path)
  }

  /** 工作区 diff；可限定路径 */
  async diff(files?: string[]): Promise<string> {
    const args = ['diff']
    if (files && files.length > 0) {
      args.push('--')
      args.push(...files)
    }
    return await this.git.raw(args)
  }

  async checkIsRepo(): Promise<boolean> {
    return await this.git.checkIsRepo()
  }
}
