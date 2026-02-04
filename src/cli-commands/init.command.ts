import type { RepositoryConfig } from '../types'
import * as p from '@clack/prompts'
import { GitService } from '../services/git.service'
import { VendorService } from '../services/vendor.service'
import { formatError } from '../utils/error'

export async function initSubmodules(root: string, repositories: Record<string, RepositoryConfig>) {
  const gitService = new GitService(root)
  const vendorService = new VendorService(root, gitService)
  const spinner = p.spinner()

  spinner.start('Initializing vendor repositories...')
  try {
    await vendorService.initAll(repositories)
    spinner.stop('Vendor repositories initialized')
  }
  catch (error) {
    spinner.stop(`Failed to initialize: ${formatError(error)}`)
    return
  }

  p.log.success('All repositories initialized')
}
