import type { RepositoryConfig } from '../types'
import type { GitService } from './git.service'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import simpleGit from 'simple-git'

export class VendorService {
  private root: string
  private git: GitService

  constructor(root: string, git: GitService) {
    this.root = root
    this.git = git
  }

  // Initialize all vendor repositories
  async initAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      await this.ensureRepo(name, config)
    }
  }

  // Update all vendor repositories to specified ref
  async updateAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      await this.ensureRepo(name, config)
    }
  }

  // Get repository current SHA
  async getRepoSha(repoName: string): Promise<string> {
    const repoPath = join(this.root, 'vendor', repoName)
    const repoGit = this.gitForPath(repoPath)
    const sha = await repoGit.revparse(['HEAD'])
    return sha.trim()
  }

  // Clone or update single repository
  async ensureRepo(name: string, config: RepositoryConfig): Promise<void> {
    const vendorPath = join(this.root, 'vendor', name)

    if (!existsSync(vendorPath)) {
      await this.cloneRepo(name, config, vendorPath)
    }
    else {
      await this.updateRepo(name, config, vendorPath)
    }
  }

  private async cloneRepo(name: string, config: RepositoryConfig, vendorPath: string): Promise<void> {
    const vendorDir = join(this.root, 'vendor')
    if (!existsSync(vendorDir)) {
      mkdirSync(vendorDir, { recursive: true })
    }

    await this.git.clone(config.url, vendorPath)
  }

  private async updateRepo(name: string, config: RepositoryConfig, vendorPath: string): Promise<void> {
    const repoGit = this.gitForPath(vendorPath)

    // Fetch all updates
    await repoGit.fetch()

    // Reset to specified ref or default branch
    const ref = config.ref || await this.getDefaultBranch(repoGit)
    await repoGit.reset(['--hard', ref])
  }

  private gitForPath(path: string) {
    return simpleGit(path)
  }

  private async getDefaultBranch(git: any): Promise<string> {
    // Try common default branch names
    const branches = ['main', 'master']
    for (const branch of branches) {
      try {
        await git.revparse([`origin/${branch}`])
        return `origin/${branch}`
      }
      catch {
        // Branch doesn't exist, try next
      }
    }
    throw new Error('Could not determine default branch')
  }
}
