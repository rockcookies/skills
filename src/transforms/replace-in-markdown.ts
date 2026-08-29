import type { BodyReplace } from '../types'

/** meta.ts 声明式正文替换：精确子串，不做正则。 */
export function replaceInMarkdown(body: string, replaces: BodyReplace[]): string {
  let out = body
  for (const rule of replaces) {
    if (!rule.find) continue
    out = out.split(rule.find).join(rule.replace)
  }
  return out
}
