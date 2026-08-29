import type { AgentMapping, BodyReplace, RepositoryConfig, SkillMapping } from '../types'

export interface ComposedTransforms {
  transforms: string[]
  frontmatter: { set: Record<string, unknown>; delete: string[] }
  replace: BodyReplace[]
  excludes: string[]
}

/**
 * 默认 → repo → kind（skillTransforms / agentTransforms）→ mapping。
 * mapping 的 excludes 与 repo.excludes 取并集；includes 仍由 mapping 自己决定。
 */
export function composeTransforms(
  repo: RepositoryConfig,
  kind: 'skill' | 'agent',
  mapping: SkillMapping | AgentMapping,
): ComposedTransforms {
  const kindTransforms = kind === 'skill' ? (repo.skillTransforms ?? []) : (repo.agentTransforms ?? [])
  const transforms = [...(repo.transforms ?? []), ...kindTransforms, ...(mapping.transforms ?? [])]
  const set = { ...repo.frontmatter?.set, ...mapping.frontmatter?.set }
  const deleteKeys = unique([...(repo.frontmatter?.delete ?? []), ...(mapping.frontmatter?.delete ?? [])])
  const replace = [...(repo.replace ?? []), ...(mapping.replace ?? [])]
  const mappingExcludes = kind === 'skill' ? ((mapping as SkillMapping).excludes ?? []) : []
  const excludes = unique([...(repo.excludes ?? []), ...mappingExcludes])
  return { transforms, frontmatter: { set, delete: deleteKeys }, replace, excludes }
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
