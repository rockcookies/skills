import { basename } from 'node:path'

import type { SkillContext } from '../context'

/** 从 skill 文件树删掉 basename 为 LICENSE.txt 的项。 */
export function excludeLicenseTxt(ctx: SkillContext): void {
  for (const path of ctx.files.keys()) {
    if (basename(path) === 'LICENSE.txt') {
      ctx.files.delete(path)
    }
  }
}
