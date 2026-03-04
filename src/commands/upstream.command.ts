import type { RepositoryConfig } from '../types'
import * as p from '@clack/prompts'
import { GitService } from '../services/git.service'
import { UpstreamService } from '../services/upstream.service'
import { formatError } from '../utils/error'

export interface UpstreamOptions {
  force?: boolean
  proxy?: string
}

export async function ensureUpstreamRepositories(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  options: UpstreamOptions = {},
) {
  const gitService = new GitService(root, options.proxy)
  const upstreamService = new UpstreamService(root, gitService)
  const spinner = p.spinner()

  spinner.start('Ensuring upstream repositories...')
  try {
    if (options.force) {
      await upstreamService.forceUpdateAll(repositories)
    }
    else {
      await upstreamService.updateAll(repositories)
    }
    spinner.stop('Upstream repositories ready')
  }
  catch (error) {
    spinner.stop(`Failed to ensure repositories: ${formatError(error)}`)
    return
  }

  p.log.success('All upstream repositories synced')
}
