import { glob, stat } from 'node:fs/promises'
import { join } from 'node:path'

export const DEFAULT_INCLUDES = ['**/*', '**/*/.*']

/** includes 非空则整表替换默认 glob，不与默认合并。excludes 优先。 */
export async function listSkillFiles(
  sourceDir: string,
  includes: string[] | undefined,
  excludes: string[] | undefined,
): Promise<string[]> {
  const patterns = includes && includes.length > 0 ? includes : DEFAULT_INCLUDES
  const seen = new Set<string>()

  for (const pattern of patterns) {
    const files = glob(pattern, {
      exclude: excludes,
      cwd: sourceDir,
    })

    for await (const file of files) {
      const rel = file.split('\\').join('/')
      if (seen.has(rel)) continue

      const stats = await stat(join(sourceDir, file))
      if (stats.isDirectory()) continue

      seen.add(rel)
    }
  }

  return [...seen].toSorted()
}
