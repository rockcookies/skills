import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { repositories } from '../meta'
import { cleanupVendorRepositories } from './commands/cleanup.command'
import { syncSubmodules } from './commands/sync.command'
import { ensureVendorRepositories } from './commands/vendor.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

interface CLIArgs {
  command?: string
  skipPrompt: boolean
  force?: boolean
  proxy?: string
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2)
  const skipPrompt = args.includes('-y') || args.includes('--yes')
  const force = args.includes('--force') || args.includes('-f')
  const command = args.find(arg => !arg.startsWith('-'))

  // Parse proxy parameter
  const proxyIndex = args.findIndex(arg => arg === '--proxy')
  const proxy = proxyIndex >= 0 && proxyIndex + 1 < args.length ? args[proxyIndex + 1] : undefined

  return { command, skipPrompt, force, proxy }
}

async function main() {
  const { command, skipPrompt, force, proxy } = parseArgs()

  // 处理子命令
  if (command === 'vendor') {
    p.intro('Skills Manager - Vendor')
    await ensureVendorRepositories(root, repositories, { force, proxy })
    p.outro('Done')
    return
  }

  if (command === 'sync') {
    p.intro('Skills Manager - Sync')
    await syncSubmodules(root, repositories)
    p.outro('Done')
    return
  }

  if (command === 'cleanup') {
    p.intro('Skills Manager - Cleanup')
    await cleanupVendorRepositories(root, repositories)
    p.outro('Done')
    return
  }

  // 无子命令：显示交互式菜单
  if (skipPrompt) {
    p.log.error('Command required when using -y flag')
    p.log.info('Available commands: vendor, sync, cleanup')
    process.exit(1)
  }

  p.intro('Skills Manager')

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'sync', label: 'Sync skills', hint: 'Update vendors and sync skills' },
      { value: 'vendor', label: 'Manage vendors', hint: 'Ensure vendor repositories' },
      { value: 'cleanup', label: 'Cleanup vendors', hint: 'Remove orphaned repositories' },
    ],
  })

  if (p.isCancel(action)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  switch (action) {
    case 'vendor': {
      const shouldForce = await p.confirm({
        message: 'Force update (delete and reclone)?',
        initialValue: false,
      })

      if (p.isCancel(shouldForce)) {
        p.cancel('Cancelled')
        process.exit(0)
      }

      await ensureVendorRepositories(root, repositories, { force: shouldForce })
      break
    }
    case 'sync':
      await syncSubmodules(root, repositories)
      break
    case 'cleanup':
      await cleanupVendorRepositories(root, repositories)
      break
  }

  p.outro('Done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
