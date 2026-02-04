import type { RepositoryConfig } from '../types'
import * as p from '@clack/prompts'
import { GitService } from '../services/git.service'
import { VendorService } from '../services/vendor.service'
import { formatError } from '../utils/error'

export interface VendorOptions {
  force?: boolean
  proxy?: string
}

export async function ensureVendorRepositories(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  options: VendorOptions = {},
) {
  const gitService = new GitService(root, options.proxy)
  const vendorService = new VendorService(root, gitService)
  const spinner = p.spinner()

  spinner.start('Ensuring vendor repositories...')
  try {
    if (options.force) {
      await vendorService.forceUpdateAll(repositories)
    }
    else {
      await vendorService.updateAll(repositories)
    }
    spinner.stop('Vendor repositories ready')
  }
  catch (error) {
    spinner.stop(`Failed to ensure repositories: ${formatError(error)}`)
    return
  }

  p.log.success('All vendor repositories synced')
}
