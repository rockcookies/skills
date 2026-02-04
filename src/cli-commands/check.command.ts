import type { VendorConfig } from '../types.ts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { SubmoduleService } from '../services/submodule.service'

export async function checkUpdates(
  root: string,
  submodules: Record<string, string>,
  vendors: Record<string, VendorConfig>,
) {
  const submoduleService = new SubmoduleService(root)
  const spinner = p.spinner()

  spinner.start('Fetching remote changes...')
  try {
    await submoduleService.fetchAllSubmodules()
    spinner.stop('Fetched remote changes')
  }
  catch (error) {
    spinner.stop(`Failed to fetch: ${error instanceof Error ? error.message : String(error)}`)
    return
  }

  const updates: { name: string, type: string, behind: number }[] = []

  // 检查 sources
  for (const [name] of Object.entries(submodules)) {
    const path = join(root, 'sources', name)
    if (!existsSync(path)) {
      continue
    }

    try {
      const behind = await submoduleService.checkSubmoduleUpdate(`sources/${name}`)
      if (behind > 0) {
        updates.push({ name, type: 'source', behind })
      }
    }
    catch {
      // 忽略错误
    }
  }

  // 检查 vendors
  for (const [name, config] of Object.entries(vendors)) {
    const vendorConfig = config as VendorConfig
    const path = join(root, 'vendor', name)
    if (!existsSync(path)) {
      continue
    }

    try {
      const behind = await submoduleService.checkSubmoduleUpdate(`vendor/${name}`)
      if (behind > 0) {
        const skillNames = Object.values(vendorConfig.skills).join(', ')
        updates.push({ name: `${name} (${skillNames})`, type: 'vendor', behind })
      }
    }
    catch {
      // 忽略错误
    }
  }

  if (updates.length === 0) {
    p.log.success('All submodules are up to date')
  }
  else {
    p.log.info('Updates available:')
    updates.forEach((update) => {
      p.log.message(`  ${update.name} (${update.type}): ${update.behind} commits behind`)
    })
  }
}
