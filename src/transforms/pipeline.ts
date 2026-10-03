import type { AgentMapping, RepositoryConfig, SkillMapping } from '../types'
import type { AgentContext, SkillContext } from './context'

import { setFrontmatterName } from './frontmatter'
import { getAgentTransform, getSkillTransform } from './registry'

/** repo 策略先于 mapping 策略。 */
export function resolveTransformNames(
  repo: RepositoryConfig,
  kind: 'skill' | 'agent',
  mapping: SkillMapping | AgentMapping,
): string[] {
  const repoNames = kind === 'skill' ? (repo.transforms?.skills ?? []) : (repo.transforms?.agents ?? [])
  return [...repoNames, ...(mapping.transforms ?? [])]
}

export function runSkillPipeline(ctx: SkillContext, names: string[]): void {
  for (const name of names) {
    getSkillTransform(name)(ctx)
  }
  const entry = ctx.files.get(ctx.entryPath)
  if (entry === undefined) {
    throw new Error(`Skill entry missing after transforms: ${ctx.entryPath}`)
  }
  ctx.files.set(ctx.entryPath, Buffer.from(setFrontmatterName(entry.toString('utf8'), ctx.name), 'utf8'))
}

export function runAgentPipeline(ctx: AgentContext, names: string[]): void {
  for (const name of names) {
    getAgentTransform(name)(ctx)
  }
  ctx.content = setFrontmatterName(ctx.content, ctx.name)
}
