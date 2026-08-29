import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { sha256 } from '../utils/digest'
import { rewireSkillRefs } from './rewire-skill-refs'

/** 具名变换：meta.ts 的 transforms 数组按名字引用这里的函数 */
export type NamedTransform = (body: string) => string

const TRANSFORM_PATHS: Record<string, string> = {
  rewireSkillRefs: fileURLToPath(new URL('./rewire-skill-refs.ts', import.meta.url)),
}

const registry: Record<string, NamedTransform> = {
  rewireSkillRefs,
}

export function applyNamedTransforms(body: string, names: string[]): string {
  let out = body
  for (const name of names) {
    const transform = registry[name]
    if (!transform) throw new Error(`Unknown transform: ${name}`)
    out = transform(out)
  }
  return out
}

/** 把用到的变换源码纳入 transformId，改变换实现后会失效跳过缓存 */
export function hashNamedTransforms(names: string[]): Record<string, string> {
  const hashes: Record<string, string> = {}
  for (const name of names) {
    const path = TRANSFORM_PATHS[name]
    if (!path) throw new Error(`Unknown transform: ${name}`)
    hashes[name] = sha256(readFileSync(path))
  }
  return hashes
}
