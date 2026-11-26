import type { RepositoryConfig } from '../types'

import { UpstreamService } from '../services/upstream.service'

export interface UpstreamOptions {
  force?: boolean
}

/** 确保 upstream/ 里有 checkout 并钉到 pin。force 会删掉 checkout 再 clone。 */
export async function ensureUpstreamRepositories(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  options: UpstreamOptions = {},
): Promise<void> {
  const upstreamService = new UpstreamService(root)

  console.info(
    options.force
      ? 'Force updating upstream repositories (delete and reclone)...'
      : 'Ensuring upstream repositories...',
  )
  if (options.force) await upstreamService.forceUpdateAll(repositories)
  else await upstreamService.updateAll(repositories)
  console.info('All upstream repositories ready')
}
