import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import type { InstallShell } from '../services/packs.service'
import type { RepositoryConfig } from '../types'

import { dependencies } from '../../dependencies'
import { packs } from '../../packs'
import { buildItemIndex } from '../services/dependencies.service'
import {
  combinePackSkills,
  formatInstallCommand,
  listCustomSkillNames,
  resolvePackGaps,
  validatePackMembers,
} from '../services/packs.service'

/**
 * 打印 pack 安装命令：packIds 为空 = 全部 pack 合并；shells 逐个输出一段。
 * 成员校验失败或 pack id 未知名时置退出码 1
 */
export async function generateInstallCommand(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  packIds: string[],
  shells: InstallShell[],
): Promise<void> {
  const customSkillNames = await listCustomSkillNames(root)
  const { index, duplicates } = buildItemIndex(repositories, customSkillNames)

  const errors = validatePackMembers(packs, index, duplicates)
  if (errors.length > 0) {
    console.error('Pack members failed validation:')
    for (const error of errors) console.error(`  ${error}`)
    process.exitCode = 1
    return
  }

  const unknown = packIds.filter((id) => !packs[id])
  if (unknown.length > 0) {
    console.error(`unknown pack id(s): ${unknown.join(', ')}`)
    console.error(`valid ids: ${Object.keys(packs).toSorted().join(', ')}`)
    process.exitCode = 1
    return
  }

  const selected = packIds.length > 0 ? packIds : Object.keys(packs).toSorted()
  const members = combinePackSkills(selected, packs)

  for (const shell of shells) {
    console.info(`\n# ${selected.join(' + ')} (${shell}):`)
    console.info(formatInstallCommand(members, shell))
  }
  const gaps = resolvePackGaps(members, dependencies)
  if (gaps.length > 0) {
    console.info(`\nReferenced but not in packs: ${gaps.join(', ')}`)
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const SHELLS: InstallShell[] = ['bash', 'powershell', 'cmd']

async function main(): Promise<void> {
  // 位置参数是 pack id（可多个，缺省 = 全部）；--shell 取一个或 all（缺省 bash）
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { shell: { type: 'string' } } })
  const shellArg = values.shell ?? 'bash'
  const shells: InstallShell[] = shellArg === 'all' ? [...SHELLS] : [shellArg as InstallShell]
  if (!shells.every((s) => SHELLS.includes(s))) {
    console.error(`unknown shell: ${shellArg} (valid: ${SHELLS.join(' | ')} | all)`)
    process.exitCode = 1
    return
  }
  await generateInstallCommand(root, repositories, positionals, shells)
}

// 仅直接执行时跑 main（tsx src/commands/pack.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
