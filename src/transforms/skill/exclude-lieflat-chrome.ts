import type { SkillContext } from '../context'

/**
 * lieflat 上游仓库根即技能目录：删掉根级仓库杂物（README/LICENSE/.gitignore）与 assets/ 整棵子树。
 * README 按根级精确匹配，不按 basename，避免误杀 examples/agent-memory-case/README.md（SKILL.md 引用它）。
 */
const excludedRootPaths = new Set(['README.md', 'README.en.md', 'LICENSE', '.gitignore'])

export function excludeLieflatChrome(ctx: SkillContext): void {
  for (const path of ctx.files.keys()) {
    if (excludedRootPaths.has(path) || path.startsWith('assets/')) {
      ctx.files.delete(path)
    }
  }
}
