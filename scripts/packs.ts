import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import type { InstallShell } from '../src/services/packs.service'

import { repositories } from '../meta'
import { generateInstallCommand } from '../src/commands/pack.command'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const SHELLS: InstallShell[] = ['bash', 'powershell', 'cmd']

// 位置参数是 pack id（可多个，缺省 = 全部）；--shell 取一个或 all（缺省 bash）
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { shell: { type: 'string' } },
})

async function main(): Promise<void> {
  const shellArg = values.shell ?? 'bash'
  const shells: InstallShell[] = shellArg === 'all' ? [...SHELLS] : [shellArg as InstallShell]
  if (!shells.every((s) => SHELLS.includes(s))) {
    console.error(`unknown shell: ${shellArg} (valid: ${SHELLS.join(' | ')} | all)`)
    process.exitCode = 1
    return
  }
  await generateInstallCommand(root, repositories, positionals, shells)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
