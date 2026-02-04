import type { VendorConfig } from '../types.ts'
import * as p from '@clack/prompts'
import { SyncService } from '../services/sync.service.ts'
import { formatError } from '../utils/error.ts'

export async function syncSubmodules(root: string, vendors: Record<string, VendorConfig>) {
  const syncService = new SyncService(root)
  const spinner = p.spinner()

  spinner.start('Updating submodules...')
  try {
    await syncService.syncVendorSkills(vendors)
    spinner.stop('Submodules updated')
  }
  catch (error) {
    spinner.stop(`Failed to update: ${formatError(error)}`)
    return
  }

  p.log.success('All skills synced')
}
