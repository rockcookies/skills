import type { RepositoryConfig } from '../types'
import type { GitService } from './git.service'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import simpleGit from 'simple-git'

export class UpstreamService {
  private root: string
  private git: GitService

  constructor(root: string, git: GitService) {
    this.root = root
    this.git = git
  }

  // Initialize all upstream repositories
  async initAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      await this.ensureRepo(name, config)
    }
  }

  // Update all upstream repositories to specified ref
  async updateAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      await this.ensureRepo(name, config)
    }
  }

  // Force update all upstream repositories (delete and reclone)
  async forceUpdateAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    const { rmSync } = await import('node:fs')
    for (const [name, config] of Object.entries(repos)) {
      const upstreamPath = join(this.root, 'upstream', name)
      if (existsSync(upstreamPath)) {
        rmSync(upstreamPath, { recursive: true, force: true })
      }
      await this.ensureRepo(name, config)
    }
  }

  // Get repository current SHA
  async getRepoSha(repoName: string): Promise<string> {
    const repoPath = join(this.root, 'upstream', repoName)
    const sha = await this.gitForPath(repoPath).revparse(['HEAD'])
    return sha.trim()
  }

  // Get latest git tag of a repository
  async getRepoLatestTag(repoName: string): Promise<string> {
    const repoPath = join(this.root, 'upstream', repoName)
    const tag = await this.gitForPath(repoPath).raw(['describe', '--tags', '--abbrev=0'])
    return tag.trim()
  }

  // Clone or update single repository
  async ensureRepo(name: string, config: RepositoryConfig): Promise<void> {
    const upstreamPath = join(this.root, 'upstream', name)

    if (!existsSync(upstreamPath)) {
      await this.cloneRepo(config, upstreamPath)
    }
    else {
      await this.updateRepo(config, upstreamPath)
    }
  }

  private async cloneRepo(config: RepositoryConfig, upstreamPath: string): Promise<void> {
    const upstreamDir = join(this.root, 'upstream')
    if (!existsSync(upstreamDir)) {
      mkdirSync(upstreamDir, { recursive: true })
    }

    await this.git.clone(config.url, upstreamPath)
  }

  private async updateRepo(config: RepositoryConfig, upstreamPath: string): Promise<void> {
    const repoGit = this.gitForPath(upstreamPath)

    // Fetch all updates
    await repoGit.fetch(['--tags', '--force'])

    // Determine target ref based on priority: commit > tag > branch > default
    let ref: string
    if (config.commit) {
      ref = config.commit
    }
    else if (config.tag) {
      ref = `refs/tags/${config.tag}`
    }
    else if (config.branch) {
      ref = `origin/${config.branch}`
    }
    else {
      ref = await this.getDefaultBranch(repoGit)
    }

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
