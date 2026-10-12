import * as p from '@clack/prompts'

import type { RepositoryConfig } from '../types'

import { UpstreamService } from '../services/upstream.service'
import { formatError } from '../utils/error'

/** update upstream → 按条 load+pipeline 写 dest → 写 SYNC.json；force 时再清 orphan。 */
export async function syncSubmodules(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  force: boolean = false,
) {
  const upstreamService = new UpstreamService(root)
  const spinner = p.spinner()

  spinner.start('Updating upstream repositories...')
  try {
    await upstreamService.updateAll(repositories)
    spinner.stop('Upstream repositories updated')
  } catch (error) {
    spinner.stop(`Failed to update: ${formatError(error)}`)
    throw error
  }

  p.log.success('All repositories updated')

  spinner.start(force ? 'Force syncing skills, agents and rules...' : 'Syncing upstream skills, agents and rules...')
  try {
    await upstreamService.syncAll(repositories, force)
    spinner.stop(force ? 'Force sync complete' : 'Skills, agents and rules synced')
  } catch (error) {
    spinner.stop(`Failed to sync: ${formatError(error)}`)
    throw error
  }

  p.log.success(force ? 'All skills, agents and rules force-synced' : 'All skills, agents and rules synced')
}
