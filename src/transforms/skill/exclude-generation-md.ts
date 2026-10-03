import { basename } from 'node:path'

import type { SkillContext } from '../context'

/** 从 skill 文件树删掉 basename 为 GENERATION.md 的项。 */
export function excludeGenerationMd(ctx: SkillContext): void {
  for (const path of ctx.files.keys()) {
    if (basename(path) === 'GENERATION.md') {
      ctx.files.delete(path)
    }
  }
}
