import type { RepositoryConfig } from '../types'
import * as p from '@clack/prompts'
import { GitService } from '../services/git.service'
import { SyncService } from '../services/sync.service'
import { VendorService } from '../services/vendor.service'
import { formatError } from '../utils/error'

export async function syncSubmodules(root: string, repositories: Record<string, RepositoryConfig>) {
  const gitService = new GitService(root)
  const vendorService = new VendorService(root, gitService)
  const syncService = new SyncService(root, vendorService)
  const spinner = p.spinner()

  spinner.start('Updating vendor repositories...')
  try {
    await vendorService.updateAll(repositories)
    spinner.stop('Vendor repositories updated')
  }
  catch (error) {
    spinner.stop(`Failed to update: ${formatError(error)}`)
    return
  }

  p.log.success('All repositories updated')

  spinner.start('Syncing skills...')
  try {
    await syncService.syncVendorSkills(repositories)
    spinner.stop('Skills synced')
  }
  catch (error) {
    spinner.stop(`Failed to sync: ${formatError(error)}`)
    return
  }

  p.log.success('All skills synced')
}
