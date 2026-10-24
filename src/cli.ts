import * as p from '@clack/prompts'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { repositories } from '../meta'
import { cleanupUpstreamRepositories } from './commands/cleanup.command'
import { printDependencies } from './commands/deps.command'
import { syncSubmodules } from './commands/sync.command'
import { ensureUpstreamRepositories } from './commands/upstream.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

async function main() {
  const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))

  // pnpm cli deps <name> — non-interactive, prints the dependency closure
  if (positionalArgs[0] === 'deps') {
    await printDependencies(root, repositories, positionalArgs[1])
    return
  }

  p.intro('Skills Manager')

  const argvForce = hasFlag('--force')

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'sync', label: 'Sync skills', hint: 'Update upstream and sync skills/agents/rules' },
      {
        value: 'upstream',
        label: 'Manage upstream repositories',
        hint: 'Ensure upstream repositories',
      },
      {
        value: 'cleanup',
        label: 'Cleanup upstream repositories',
        hint: 'Remove unused upstream/ checkouts (not dest skills)',
      },
      {
        value: 'deps',
        label: 'Print dependencies',
        hint: 'Dependency closure for a skill/agent, copy-ready',
      },
    ],
  })

  if (p.isCancel(action)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  switch (action) {
    case 'upstream': {
      const shouldForce =
        argvForce ||
        (await p.confirm({
          message: 'Force update (delete and reclone)?',
          initialValue: false,
        }))

      if (p.isCancel(shouldForce)) {
        p.cancel('Cancelled')
        process.exit(0)
      }

      await ensureUpstreamRepositories(root, repositories, { force: shouldForce })
      break
    }
    case 'sync': {
      const shouldForce =
        argvForce ||
        (await p.confirm({
          message: 'Force sync (also remove orphan dests not in mapping)?',
          initialValue: false,
        }))

      if (p.isCancel(shouldForce)) {
        p.cancel('Cancelled')
        process.exit(0)
      }

      await syncSubmodules(root, repositories, shouldForce)
      break
    }
    case 'cleanup':
      await cleanupUpstreamRepositories(root, repositories)
      break
    case 'deps': {
      const name = await p.text({ message: 'Skill or agent name (e.g. grill-and-think):' })
      if (p.isCancel(name)) {
        p.cancel('Cancelled')
        process.exit(0)
      }
      await printDependencies(root, repositories, name)
      break
    }
  }

  p.outro('Done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
