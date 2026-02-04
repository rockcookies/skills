import type { Project } from '../types'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import * as p from '@clack/prompts'
import { SubmoduleService } from '../services/submodule.service'
import { formatError } from '../utils/error'

interface InitOptions {
  skipPrompt: boolean
}

export async function initSubmodules(root: string, projects: Project[], options: InitOptions) {
  const submoduleService = new SubmoduleService(root)
  const spinner = p.spinner()

  // 1. 检查并移除额外的 submodules
  const existingPaths = submoduleService.getSubmodulePaths()
  const expectedPaths = new Set(projects.map(p => p.path))
  const extraSubmodules = existingPaths.filter(path => !expectedPaths.has(path))

  if (extraSubmodules.length > 0) {
    p.log.warn(`Found ${extraSubmodules.length} submodule(s) not in meta.ts:`)
    extraSubmodules.forEach(path => p.log.message(`  - ${path}`))

    const shouldRemove = options.skipPrompt
      ? true
      : await p.confirm({ message: 'Remove these extra submodules?', initialValue: true })

    if (p.isCancel(shouldRemove)) {
      p.cancel('Cancelled')
      return
    }

    if (shouldRemove) {
      await removeExtraSubmodules(submoduleService, root, extraSubmodules, spinner)
    }
  }

  // 2. 查找新增的 submodules
  const existingProjects = projects.filter(p => submoduleService.isSubmodule(p.path))
  const newProjects = projects.filter(p => !submoduleService.isSubmodule(p.path))

  if (newProjects.length === 0) {
    p.log.info('All submodules already initialized')
    return
  }

  // 3. 选择要添加的 submodules
  const selected = options.skipPrompt
    ? newProjects
    : await p.multiselect({
        message: 'Select projects to initialize',
        options: newProjects.map(project => ({
          value: project,
          label: `${project.name} (${project.type})`,
          hint: project.url,
        })),
        initialValues: newProjects,
      })

  if (p.isCancel(selected)) {
    p.cancel('Cancelled')
    return
  }

  // 4. 添加 submodules
  for (const project of selected as Project[]) {
    spinner.start(`Adding submodule: ${project.name}`)

    const parentDir = join(root, dirname(project.path))
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true })
    }

    try {
      await submoduleService.addSubmodule(project.url, project.path)
      spinner.stop(`Added: ${project.name}`)
    }
    catch (error) {
      spinner.stop(`Failed to add ${project.name}: ${formatError(error)}`)
    }
  }

  p.log.success('Submodules initialized')
  if (existingProjects.length > 0) {
    p.log.info(`Already initialized: ${existingProjects.map(p => p.name).join(', ')}`)
  }
}

async function removeExtraSubmodules(
  submoduleService: any,
  root: string,
  paths: string[],
  spinner: any,
): Promise<void> {
  for (const path of paths) {
    spinner.start(`Removing submodule: ${path}`)
    try {
      await submoduleService.removeSubmoduleFully(path)

      const gitModulesPath = join(root, '.git', 'modules', path)
      if (existsSync(gitModulesPath)) {
        rmSync(gitModulesPath, { recursive: true })
      }

      spinner.stop(`Removed: ${path}`)
    }
    catch (error) {
      spinner.stop(`Failed to remove ${path}: ${formatError(error)}`)
    }
  }
}
