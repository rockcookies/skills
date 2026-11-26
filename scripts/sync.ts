import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { repositories } from '../meta'
import { runSync } from '../src/commands/sync.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// strict:false：未知参数静默忽略
const { values } = parseArgs({
  allowPositionals: true,
  strict: false,
  options: {
    force: { type: 'boolean' },
    repo: { type: 'string' },
    report: { type: 'string' },
  },
})

async function main(): Promise<void> {
  process.exit(
    await runSync({
      root,
      repositories,
      repo: values.repo,
      report: values.report,
      force: values.force === true,
    }),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
