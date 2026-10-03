import type { AgentTransform, SkillTransform } from './context'

import { excludeGenerationMd } from './skill/exclude-generation-md'
import { excludeLicenseTxt } from './skill/exclude-license-txt'
import { stripPrinciplePrefix } from './skill/strip-principle-prefix'
import { stripSamber } from './skill/strip-samber'

/** kebab-case 具名策略：meta.ts 的 transforms 数组按名字引用这里的函数。 */
export const skillTransforms: Record<string, SkillTransform> = {
  'strip-samber': stripSamber,
  'exclude-license-txt': excludeLicenseTxt,
  'exclude-generation-md': excludeGenerationMd,
  'strip-principle-prefix': stripPrinciplePrefix,
}

/** agent 表今天为空；挂 skill 名到 agent 会抛错。 */
export const agentTransforms: Record<string, AgentTransform> = {}

export function getSkillTransform(name: string): SkillTransform {
  const transform = skillTransforms[name]
  if (!transform) {
    throw new Error(`Unknown skill transform: ${name}`)
  }
  return transform
}

export function getAgentTransform(name: string): AgentTransform {
  const transform = agentTransforms[name]
  if (!transform) {
    throw new Error(`Unknown agent transform: ${name}`)
  }
  return transform
}
