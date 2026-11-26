import { appendFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { dependencies } from '../dependencies'
import { repositories } from '../meta'
import { packs } from '../packs'
import { check, formatReport } from '../src/check/check'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const { values } = parseArgs({ options: { report: { type: 'string' } } })

async function main(): Promise<void> {
  const result = await check({ root, repositories, dependencies, packs })
  const md = formatReport(result)
  console.info(md)
  if (values.report) await writeFile(values.report, md)
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md)
  if (result.findings.some((f) => f.severity === 'error')) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
