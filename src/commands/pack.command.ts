import process from 'node:process'

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
