import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { repositories } from '../meta'
import { initSubmodules } from '../src/cli-commands/init.command'
import { syncSubmodules } from '../src/cli-commands/sync.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

interface CLIArgs {
  command?: string
  skipPrompt: boolean
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2)
  const skipPrompt = args.includes('-y') || args.includes('--yes')
  const command = args.find(arg => !arg.startsWith('-'))
  return { command, skipPrompt }
}

async function main() {
  const { command, skipPrompt } = parseArgs()

  // 处理子命令
  if (command === 'init') {
    p.intro('Skills Manager - Init')
    await initSubmodules(root, repositories)
    p.outro('Done')
    return
  }

  if (command === 'sync') {
    p.intro('Skills Manager - Sync')
    await syncSubmodules(root, repositories)
    p.outro('Done')
    return
  }

  // 无子命令：显示交互式菜单
  if (skipPrompt) {
    p.log.error('Command required when using -y flag')
    p.log.info('Available commands: init, sync')
    process.exit(1)
  }

  p.intro('Skills Manager')

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'sync', label: 'Sync repositories', hint: 'Pull latest and sync skills' },
      { value: 'init', label: 'Init repositories', hint: 'Clone vendor repositories' },
    ],
  })

  if (p.isCancel(action)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  switch (action) {
    case 'init':
      await initSubmodules(root, repositories)
      break
    case 'sync':
      await syncSubmodules(root, repositories)
      break
  }

  p.outro('Done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
