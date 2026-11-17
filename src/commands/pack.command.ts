import * as p from '@clack/prompts'
import process from 'node:process'

import type { RepositoryConfig } from '../types'

import { dependencies } from '../../dependencies'
import { packs } from '../../packs'
import { buildItemIndex } from '../services/dependencies.service'
import {
  formatInstallCommand,
  listCustomSkillNames,
  resolvePackGaps,
  validatePackMembers,
  type InstallShell,
} from '../services/packs.service'

export async function generateInstallCommand(
  root: string,
  repositories: Record<string, RepositoryConfig>,
): Promise<void> {
  const customSkillNames = await listCustomSkillNames(root)
  const { index, duplicates } = buildItemIndex(repositories, customSkillNames)

  const errors = validatePackMembers(packs, index, duplicates)
  if (errors.length > 0) {
    console.info('\nPack members failed validation:')
    for (const error of errors) console.info(`  ${error}`)
    process.exitCode = 1
    return
  }

  const packName = await p.select({
    message: 'Which pack?',
    options: Object.entries(packs).map(([name, pack]) => ({
      value: name,
      label: name,
      hint: `${pack.skills.length} skills — ${pack.description}`,
    })),
  })
  if (p.isCancel(packName)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  const shell = await p.select<'bash' | 'powershell' | 'cmd' | 'all'>({
    message: 'Which shell?',
    options: [
      { value: 'bash', label: 'bash / zsh', hint: 'backslash continuations (macOS, Linux, Git Bash)' },
      { value: 'powershell', label: 'PowerShell', hint: 'backtick continuations (Windows pwsh)' },
      { value: 'cmd', label: 'cmd.exe', hint: 'caret continuations (Windows cmd)' },
      { value: 'all', label: 'All shells', hint: 'print all three versions' },
    ],
  })
  if (p.isCancel(shell)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  const pack = packs[packName]!
  const shells: InstallShell[] = shell === 'all' ? ['bash', 'powershell', 'cmd'] : [shell]

  for (const target of shells) {
    console.info(`\n# ${packName} (${target}):`)
    console.info(formatInstallCommand(pack.skills, target))
  }
  const gaps = resolvePackGaps(pack.skills, dependencies)
  if (gaps.length > 0) {
    console.info(`\nReferenced but not in pack: ${gaps.join(', ')}`)
  }
}
