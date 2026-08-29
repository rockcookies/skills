import { glob, stat } from 'node:fs/promises'
import { join } from 'node:path'

/** dest 技能目录全量文件列表，用于 catalog 树哈希（含点文件）。 */
export async function listFilesRecursive(dir: string): Promise<string[]> {
  const seen = new Set<string>()
  for (const pattern of ['**/*', '**/.*']) {
    for await (const file of glob(pattern, { cwd: dir })) {
      const rel = file.split('\\').join('/')
      if (seen.has(rel)) continue
      const stats = await stat(join(dir, file))
      if (stats.isDirectory()) continue
      seen.add(rel)
    }
  }
  return [...seen].toSorted()
}
