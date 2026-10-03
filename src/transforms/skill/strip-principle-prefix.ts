import type { SkillContext } from '../context'

import { mapMarkdownFiles } from '../map-markdown'

/** 上游跨技能链接写 principle- 前缀路径，dest 剥成与 name 对齐。 */
export function stripPrinciplePrefixText(text: string): string {
  return text.replaceAll('../principle-', '../')
}

export function stripPrinciplePrefix(ctx: SkillContext): void {
  mapMarkdownFiles(ctx, stripPrinciplePrefixText)
}
