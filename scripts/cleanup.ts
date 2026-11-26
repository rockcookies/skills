import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { repositories } from '../meta'
import { cleanupUpstreamRepositories } from '../src/commands/cleanup.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const { values } = parseArgs({ options: { force: { type: 'boolean' } } })

async function main(): Promise<void> {
  cleanupUpstreamRepositories(root, repositories, values.force === true)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
