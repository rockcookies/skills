import type { RepositoryConfig } from '../types'
import * as p from '@clack/prompts'
import { GitService } from '../services/git.service'
import { SyncService } from '../services/sync.service'
import { UpstreamService } from '../services/upstream.service'
import { formatError } from '../utils/error'

export async function syncSubmodules(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  force: boolean = false,
) {
  const gitService = new GitService(root)
  const upstreamService = new UpstreamService(root, gitService)
  const syncService = new SyncService(root, upstreamService)
  const spinner = p.spinner()

  spinner.start('Updating upstream repositories...')
  try {
    await upstreamService.updateAll(repositories)
    spinner.stop('Upstream repositories updated')
  }
  catch (error) {
    spinner.stop(`Failed to update: ${formatError(error)}`)
    return
  }

  p.log.success('All repositories updated')

  spinner.start('Syncing upstream skills...')
  try {
    await syncService.syncUpstreamSkills(repositories, force)
    spinner.stop('Skills synced')
  }
  catch (error) {
    spinner.stop(`Failed to sync: ${formatError(error)}`)
    return
  }

  p.log.success('All skills synced')
}
