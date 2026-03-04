import type { RepositoryConfig } from '../types'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { formatError } from '../utils/error'

export async function cleanupUpstreamRepositories(
  root: string,
  repositories: Record<string, RepositoryConfig>,
) {
  const upstreamDir = join(root, 'upstream')

  if (!existsSync(upstreamDir)) {
    p.log.info('No upstream directory found')
    return
  }

  const spinner = p.spinner()
  const configuredRepos = new Set(Object.keys(repositories))
  const existingDirs = readdirSync(upstreamDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  const toRemove = existingDirs.filter(dir => !configuredRepos.has(dir))

  if (toRemove.length === 0) {
    p.log.info('No orphaned repositories found')
    return
  }

  p.log.info(`Found ${toRemove.length} orphaned repositories:`)
  toRemove.forEach(dir => p.log.step(`  - ${dir}`))

  const shouldRemove = await p.confirm({
    message: `Remove ${toRemove.length} orphaned repositories?`,
    initialValue: false,
  })

  if (p.isCancel(shouldRemove) || !shouldRemove) {
    p.cancel('Cleanup cancelled')
    return
  }

  spinner.start('Cleaning up orphaned upstream repositories...')
  try {
    for (const dir of toRemove) {
      const dirPath = join(upstreamDir, dir)
      rmSync(dirPath, { recursive: true, force: true })
    }
    spinner.stop('Cleanup complete')
  }
  catch (error) {
    spinner.stop(`Failed to cleanup: ${formatError(error)}`)
    return
  }

  p.log.success(`Removed ${toRemove.length} orphaned repositories`)
}
