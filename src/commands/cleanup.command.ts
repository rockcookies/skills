import type { RepositoryConfig } from '../types'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { formatError } from '../utils/error'

export async function cleanupVendorRepositories(
  root: string,
  repositories: Record<string, RepositoryConfig>,
) {
  const vendorDir = join(root, 'vendor')

  if (!existsSync(vendorDir)) {
    p.log.info('No vendor directory found')
    return
  }

  const spinner = p.spinner()
  const configuredRepos = new Set(Object.keys(repositories))
  const existingDirs = readdirSync(vendorDir, { withFileTypes: true })
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

  spinner.start('Cleaning up orphaned repositories...')
  try {
    for (const dir of toRemove) {
      const dirPath = join(vendorDir, dir)
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
