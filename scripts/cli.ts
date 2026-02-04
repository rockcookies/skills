import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { submodules, vendors } from '../meta.ts'
import { checkUpdates } from '../src/cli-commands/check.command.ts'
import { cleanup } from '../src/cli-commands/cleanup.command.ts'
import { initSubmodules } from '../src/cli-commands/init.command.ts'
import { syncSubmodules } from '../src/cli-commands/sync.command.ts'
import { buildProjects } from '../src/utils/project-builder.ts'

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

  // 构建项目列表
  const projects = buildProjects(submodules, vendors)

  // 处理子命令
  if (command === 'init') {
    p.intro('Skills Manager - Init')
    await initSubmodules(root, projects, { skipPrompt })
    p.outro('Done')
    return
  }

  if (command === 'sync') {
    p.intro('Skills Manager - Sync')
    await syncSubmodules(root, vendors)
    p.outro('Done')
    return
  }

  if (command === 'check') {
    p.intro('Skills Manager - Check')
    await checkUpdates(root, submodules, vendors)
    p.outro('Done')
    return
  }

  if (command === 'cleanup') {
    p.intro('Skills Manager - Cleanup')
    await cleanup(root, projects, skipPrompt)
    p.outro('Done')
    return
  }

  // 无子命令：显示交互式菜单
  if (skipPrompt) {
    p.log.error('Command required when using -y flag')
    p.log.info('Available commands: init, sync, check, cleanup')
    process.exit(1)
  }

  p.intro('Skills Manager')

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'sync', label: 'Sync submodules', hint: 'Pull latest and sync Type 2 skills' },
      { value: 'init', label: 'Init submodules', hint: 'Add new submodules' },
      { value: 'check', label: 'Check updates', hint: 'See available updates' },
      { value: 'cleanup', label: 'Cleanup', hint: 'Remove unused submodules and skills' },
    ],
  })

  if (p.isCancel(action)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  switch (action) {
    case 'init':
      await initSubmodules(root, projects, { skipPrompt: false })
      break
    case 'sync':
      await syncSubmodules(root, vendors)
      break
    case 'check':
      await checkUpdates(root, submodules, vendors)
      break
    case 'cleanup':
      await cleanup(root, projects, false)
      break
  }

  p.outro('Done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
