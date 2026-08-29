import * as p from '@clack/prompts'

import type { RepositoryConfig } from '../types'

import { CatalogService } from '../services/catalog.service'
import { GitService } from '../services/git.service'
import { SyncService } from '../services/sync.service'
import { UpstreamService } from '../services/upstream.service'
import { formatError } from '../utils/error'

/** update upstream → 按条拷贝+变换 → 写 catalog 并打印相对 HEAD 的 diff。 */
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
  } catch (error) {
    spinner.stop(`Failed to update: ${formatError(error)}`)
    throw error
  }

  p.log.success('All repositories updated')

  spinner.start('Syncing upstream skills and agents...')
  try {
    await syncService.syncAll(repositories, force)
    spinner.stop('Skills and agents synced')
  } catch (error) {
    spinner.stop(`Failed to sync: ${formatError(error)}`)
    throw error
  }

  p.log.success('All skills and agents synced')

  spinner.start('Writing catalog.json...')
  try {
    const catalogService = new CatalogService(root)
    const catalog = await catalogService.build()
    await catalogService.write(catalog)
    const previous = await catalogService.loadPrevious()
    const report = catalogService.diff(catalog, previous)
    spinner.stop(`Wrote catalog.json (${catalog.items.length} items)`)
    p.log.info(
      `catalog diff vs HEAD: added ${report.added.length}, removed ${report.removed.length}, changed ${report.changed.length}, unchanged ${report.unchanged}`,
    )
    if (report.added.length) p.log.info(`  added: ${report.added.join(', ')}`)
    if (report.removed.length) p.log.info(`  removed: ${report.removed.join(', ')}`)
    if (report.changed.length) p.log.info(`  changed: ${report.changed.join(', ')}`)
  } catch (error) {
    spinner.stop(`Failed to write catalog: ${formatError(error)}`)
    throw error
  }
}
