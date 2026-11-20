import * as p from '@clack/prompts'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { repositories } from '../meta'
import { cleanupUpstreamRepositories } from './commands/cleanup.command'
import { generateInstallCommand } from './commands/pack.command'
import { syncSubmodules } from './commands/sync.command'
import { runSyncCi } from './commands/sync-ci.command'
import { ensureUpstreamRepositories } from './commands/upstream.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// strict:false：未知参数静默忽略，与既有 hasFlag 行为一致
const { values, positionals } = parseArgs({
  allowPositionals: true,
  strict: false,
  options: {
    ci: { type: 'boolean' },
    force: { type: 'boolean' },
    repo: { type: 'string' },
    report: { type: 'string' },
  },
})

async function main() {
  if (positionals[0] === 'sync' && values.ci) {
    process.exit(await runSyncCi({ root, repositories, repo: values.repo, report: values.report }))
  }

  p.intro('Skills Manager')

  const argvForce = values.force === true

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
        value: 'pack',
        label: 'Generate install command',
        hint: 'Multi-line npx skills add command for a curated pack, per shell',
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
    case 'pack':
      await generateInstallCommand(root, repositories)
      break
  }

  p.outro('Done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
