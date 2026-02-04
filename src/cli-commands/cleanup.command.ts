import type { Project } from '../types'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { SubmoduleService } from '../services/submodule.service'
import { formatError } from '../utils/error'
import { getExistingSkillNames, getExpectedSkillNames } from '../utils/submodule'

export async function cleanup(root: string, projects: Project[], skipPrompt: boolean) {
  const submoduleService = new SubmoduleService(root)
  const spinner = p.spinner()
  let hasChanges = false

  // 1. 移除额外的 submodules
  const existingPaths = submoduleService.getSubmodulePaths()
  const expectedPaths = new Set(projects.map(p => p.path))
  const extraSubmodules = existingPaths.filter(path => !expectedPaths.has(path))

  if (extraSubmodules.length > 0) {
    p.log.warn(`Found ${extraSubmodules.length} submodule(s) not in meta.ts:`)
    extraSubmodules.forEach(path => p.log.message(`  - ${path}`))

    const shouldRemove = skipPrompt
      ? true
      : await p.confirm({ message: 'Remove these extra submodules?', initialValue: true })

    if (p.isCancel(shouldRemove)) {
      p.cancel('Cancelled')
      return
    }

    if (shouldRemove) {
      for (const path of extraSubmodules) {
        spinner.start(`Removing submodule: ${path}`)
        try {
          await submoduleService.removeSubmoduleFully(path)

          const gitModulesPath = join(root, '.git', 'modules', path)
          if (existsSync(gitModulesPath)) {
            rmSync(gitModulesPath, { recursive: true })
          }

          hasChanges = true
          spinner.stop(`Removed: ${path}`)
        }
        catch (error) {
          spinner.stop(`Failed to remove ${path}: ${formatError(error)}`)
        }
      }
    }
  }

  // 2. 移除额外的 skills
  try {
    const metaModule = await import('../../meta')
    const { manual, submodules, vendors } = metaModule
    const existingSkills = getExistingSkillNames(root)
    const expectedSkills = getExpectedSkillNames(submodules, vendors, manual)
    const extraSkills = existingSkills.filter(name => !expectedSkills.has(name))

    if (extraSkills.length > 0) {
      p.log.warn(`Found ${extraSkills.length} skill(s) not in meta.ts:`)
      extraSkills.forEach(name => p.log.message(`  - skills/${name}`))

      const shouldRemove = skipPrompt
        ? true
        : await p.confirm({ message: 'Remove these extra skills?', initialValue: true })

      if (p.isCancel(shouldRemove)) {
        p.cancel('Cancelled')
        return
      }

      if (shouldRemove) {
        hasChanges = true
        for (const skillName of extraSkills) {
          spinner.start(`Removing skill: ${skillName}`)
          try {
            rmSync(join(root, 'skills', skillName), { recursive: true })
            spinner.stop(`Removed: skills/${skillName}`)
          }
          catch (error) {
            spinner.stop(`Failed to remove skills/${skillName}: ${formatError(error)}`)
          }
        }
      }
    }
  }
  catch (error) {
    p.log.error(`Failed to check skills: ${formatError(error)}`)
  }

  if (!hasChanges && extraSubmodules.length === 0) {
    p.log.success('Everything is clean')
  }
  else if (hasChanges) {
    p.log.success('Cleanup completed')
  }
}
