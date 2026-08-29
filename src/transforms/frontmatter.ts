import { dump, load } from 'js-yaml'

import type { FrontmatterOps } from '../types'

export interface SplitMarkdown {
  data: Record<string, unknown>
  body: string
  hasFrontmatter: boolean
}

/** 拆 YAML 头。没有 --- 包围则整份当正文。 */
export function splitFrontmatter(content: string): SplitMarkdown {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { data: {}, body: content, hasFrontmatter: false }
  }
  const data = (load(match[1]) as Record<string, unknown> | undefined) ?? {}
  return { data, body: match[2], hasFrontmatter: true }
}

/** delete → set，最后强制 name = dest target（覆盖上游 name）。 */
export function applyFrontmatter(content: string, ops: FrontmatterOps & { name: string }): string {
  const split = splitFrontmatter(content)
  const data: Record<string, unknown> = { ...split.data }
  for (const key of ops.delete ?? []) {
    delete data[key]
  }
  Object.assign(data, ops.set ?? {})
  data.name = ops.name
  const body = split.hasFrontmatter ? split.body : content
  return `---\n${dump(data)}---\n${body}`
}

/** 只改 YAML 里的字符串字段（description 等），结构键不动。 */
export function rewireRecordStrings(
  data: Record<string, unknown>,
  rewire: (text: string) => string,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      out[key] = rewire(value)
    } else {
      out[key] = value
    }
  }
  return out
}
