import { dump } from 'js-yaml'

import type { SkillContext } from './context'

import { rewireRecordStrings, splitFrontmatter } from './frontmatter'

function isMarkdownPath(path: string): boolean {
  const lower = path.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.mdc')
}

/** 对 markdown 正文与 YAML 字符串字段跑同一变换，二进制与其它扩展名不动。 */
export function rewriteMarkdownText(content: string, rewrite: (text: string) => string): string {
  const split = splitFrontmatter(content)
  if (!split.hasFrontmatter) {
    return rewrite(content)
  }
  const data = rewireRecordStrings(split.data, rewrite)
  return `---\n${dump(data)}---\n${rewrite(split.body)}`
}

/** 遍历 skill 树里全部 .md/.mdc，对每个文件应用 rewrite。 */
export function mapMarkdownFiles(ctx: SkillContext, rewrite: (text: string) => string): void {
  for (const [path, buf] of ctx.files) {
    if (!isMarkdownPath(path)) continue
    const next = rewriteMarkdownText(buf.toString('utf8'), rewrite)
    ctx.files.set(path, Buffer.from(next, 'utf8'))
  }
}
