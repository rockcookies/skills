import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

import type { Shell } from '../lib/install-commands'
import type { Dependencies, Packs } from '../types'
import type { DuplicateNames, ItemIndex } from './dependencies.service'

import { skillsAddCommand } from '../lib/install-commands'

export const REPO_SLUG = 'rockcookies/skills'

export type InstallShell = Shell

/** 扫描 content/skills/custom/ 下含 SKILL.md 的手维护技能名（升序）；目录不存在返回 [] */
export async function listCustomSkillNames(root: string): Promise<string[]> {
  const customDir = join(root, 'content', 'skills', 'custom')
  try {
    const entries = await readdir(customDir, { withFileTypes: true })
    const checks = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => ({
          name: entry.name,
          hasSkillMd: await stat(join(customDir, entry.name, 'SKILL.md')).then(
            () => true,
            () => false,
          ),
        })),
    )
    return checks
      .filter((check) => check.hasSkillMd)
      .map((check) => check.name)
      .toSorted()
  } catch {
    return []
  }
}

/**
 * 生成多行安装命令：`npx skills add <slug>` 起头，每个 --skill 一行（2 空格缩进），
 * `-g` 收尾。委托 src/lib/install-commands.ts 统一拼装（短写法，实测发布布局
 * 无需 --full-depth，带上反而会把本地 upstream/ checkout 扫进发现集合）
 */
export function formatInstallCommand(skillNames: string[], shell: InstallShell): string {
  return skillsAddCommand({ skills: skillNames, scope: 'global', shell })
}

/**
 * 包缺口：成员在 dependencies.ts skills 分区声明了 direct 技能引用、
 * 但引用不在包内的名字（排序去重）。只看 skills 引用
 */
export function resolvePackGaps(packSkills: string[], dependencies: Dependencies): string[] {
  const members = new Set(packSkills)
  const gaps = new Set<string>()
  for (const name of packSkills) {
    for (const ref of dependencies.skills[name]?.skills ?? []) {
      if (!members.has(ref)) gaps.add(ref)
    }
  }
  return [...gaps].toSorted()
}

/** 校验所有 pack 成员都能解析到映射产物或 custom 技能且不在重名歧义里；返回 `<pack>: <reason>` 错误列表 */
export function validatePackMembers(packs: Packs, index: ItemIndex, duplicates: DuplicateNames): string[] {
  const errors: string[] = []
  for (const [packName, pack] of Object.entries(packs)) {
    for (const skill of pack.skills) {
      if (duplicates.skill.includes(skill)) {
        errors.push(`${packName}: "${skill}" is a duplicate dest name; resolve the ambiguity first`)
      } else if (!index.skill.has(skill)) {
        errors.push(`${packName}: "${skill}" is not a mapped skill or custom skill`)
      }
    }
  }
  return errors
}

/** 按包声明顺序合并所选 pack 的成员，跨包去重（保留首次出现顺序） */
export function combinePackSkills(packNames: string[], packs: Packs): string[] {
  const seen = new Set<string>()
  const combined: string[] = []
  for (const name of packNames) {
    for (const skill of packs[name]!.skills) {
      if (!seen.has(skill)) {
        seen.add(skill)
        combined.push(skill)
      }
    }
  }
  return combined
}
