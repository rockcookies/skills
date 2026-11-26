import { appendFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { dependencies } from '../../dependencies'
import { repositories } from '../../meta'
import { packs } from '../../packs'
import { check, formatReport } from '../services/check.service'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { report: { type: 'string' } } })
  const result = await check({ root, repositories, dependencies, packs })
  const md = formatReport(result)
  console.info(md)
  if (values.report) await writeFile(values.report, md)
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md)
  if (result.findings.some((f) => f.severity === 'error')) process.exitCode = 1
}

// 仅直接执行时跑 main（tsx src/commands/check.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
