import { readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

/**
 * dest 技能目录全量文件列表，用于树哈希（含点文件）。
 * 手写递归 readdir：Node 内置 glob 在 22.x 的点文件模式会漏嵌套点文件（26.x 正常），
 * 文件清单随 Node 版本漂移会让树摘要跨环境失配
 */
export async function listFilesRecursive(dir: string): Promise<string[]> {
  const seen = new Set<string>()
  const walk = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const abs = join(current, entry.name)
      // stat 跟随符号链接，与旧 glob 行为一致：目录下探，文件收集
      if ((await stat(abs)).isDirectory()) {
        await walk(abs)
      } else {
        seen.add(relative(dir, abs).split('\\').join('/'))
      }
    }
  }
  await walk(dir)
  return [...seen].toSorted()
}
