import { dump } from 'js-yaml'

import type { ComposedTransforms } from './compose'

import { sha256, stableStringify } from '../utils/digest'
import { applyFrontmatter, rewireRecordStrings, splitFrontmatter } from './frontmatter'
import { applyNamedTransforms } from './registry'
import { replaceInMarkdown } from './replace-in-markdown'

/** 源内容 digest 之外，配置+变换源码变了也要重跑 */
export function transformId(
  composed: ComposedTransforms,
  includes: string[] | undefined,
  moduleHashes: Record<string, string>,
): string {
  return sha256(
    stableStringify({
      excludes: composed.excludes,
      frontmatter: composed.frontmatter,
      includes: includes ?? [],
      modules: composed.transforms.map((name) => moduleHashes[name] ?? ''),
      replace: composed.replace,
      transforms: composed.transforms,
    }),
  )
}

/**
 * 对单个 markdown 文件跑变换。SKILL.md / agent 先拆 YAML：
 * 字符串字段和正文都走具名变换 + replace，最后强制 name = target。
 */
export function applyMarkdownTransforms(
  content: string,
  options: {
    isFrontmatterFile: boolean
    name?: string
    composed: ComposedTransforms
  },
): string {
  const applyBody = (body: string) => {
    const named = applyNamedTransforms(body, options.composed.transforms)
    return replaceInMarkdown(named, options.composed.replace)
  }

  if (!options.isFrontmatterFile) {
    return applyBody(content)
  }

  const split = splitFrontmatter(content)
  const named = (text: string) => applyNamedTransforms(text, options.composed.transforms)
  const data = options.composed.transforms.length ? rewireRecordStrings(split.data, named) : split.data
  const body = applyBody(split.hasFrontmatter ? split.body : content)
  const rebuilt = split.hasFrontmatter ? `---\n${dump(data)}---\n${body}` : body
  if (!options.name) return rebuilt
  return applyFrontmatter(rebuilt, {
    delete: options.composed.frontmatter.delete,
    set: options.composed.frontmatter.set,
    name: options.name,
  })
}
