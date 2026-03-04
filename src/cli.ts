import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { repositories } from '../meta'
import { cleanupUpstreamRepositories } from './commands/cleanup.command'
import { syncSubmodules } from './commands/sync.command'
import { ensureUpstreamRepositories } from './commands/upstream.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function main() {
  p.intro('Skills Manager')

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'sync', label: 'Sync skills', hint: 'Update upstream and sync skills' },
      { value: 'upstream', label: 'Manage upstream repositories', hint: 'Ensure upstream repositories' },
      { value: 'cleanup', label: 'Cleanup upstream repositories', hint: 'Remove orphaned repositories' },
    ],
  })

  if (p.isCancel(action)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  switch (action) {
    case 'upstream': {
      const shouldForce = await p.confirm({
        message: 'Force update (delete and reclone)?',
        initialValue: false,
      })

      if (p.isCancel(shouldForce)) {
        p.cancel('Cancelled')
        process.exit(0)
      }

      await ensureUpstreamRepositories(root, repositories, { force: shouldForce })
      break
    }
    case 'sync': {
      const shouldForce = await p.confirm({
        message: 'Force sync (skip SHA check)?',
        initialValue: false,
      })

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
  }

  p.outro('Done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
