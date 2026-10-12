import type { AgentMapping, RepositoryConfig, RuleMapping, SkillMapping } from '../types'
import type { AgentContext, RuleContext, SkillContext } from './context'

import { setFrontmatterName } from './frontmatter'
import { getAgentTransform, getRuleTransform, getSkillTransform } from './registry'

/** repo 策略先于 mapping 策略。 */
export function resolveTransformNames(
  repo: RepositoryConfig,
  kind: 'skill' | 'agent' | 'rule',
  mapping: SkillMapping | AgentMapping | RuleMapping,
): string[] {
  const repoNames =
    kind === 'skill'
      ? (repo.transforms?.skills ?? [])
      : kind === 'agent'
        ? (repo.transforms?.agents ?? [])
        : (repo.transforms?.rules ?? [])
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

/** rule 只跑具名变换；正文必须原样，不注入 frontmatter。 */
export function runRulePipeline(ctx: RuleContext, names: string[]): void {
  for (const name of names) {
    getRuleTransform(name)(ctx)
  }
}
