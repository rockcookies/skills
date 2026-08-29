import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** 内容身份。树哈希按路径排序，与文件 mtime 无关。 */
export function sha256(data: Buffer | string): string {
  return `sha256:${createHash('sha256').update(data).digest('hex')}`
}

/** 目录树 digest：path + NUL + 文件 sha256，再总哈希。不打 tar。 */
export function treeDigest(files: { path: string; content: Buffer }[]): string {
  const sorted = [...files].toSorted((a, b) => a.path.localeCompare(b.path))
  const hash = createHash('sha256')
  for (const file of sorted) {
    hash.update(file.path)
    hash.update('\0')
    hash.update(createHash('sha256').update(file.content).digest())
  }
  return `sha256:${hash.digest('hex')}`
}

/** 单文件内容 digest，agent dest 用这个。 */
export async function digestFile(filePath: string): Promise<string> {
  return sha256(await readFile(filePath))
}

/** 按相对路径列表读盘再 treeDigest。 */
export async function digestTree(dir: string, relativeFiles: string[]): Promise<string> {
  const files: { path: string; content: Buffer }[] = []
  const sorted = [...relativeFiles].map((rel) => rel.split('\\').join('/')).toSorted()
  for (const rel of sorted) {
    files.push({ path: rel, content: await readFile(join(dir, rel)) })
  }
  return treeDigest(files)
}

/** 键排序后 JSON，保证同一对象 transformId 稳定。 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .toSorted()
        .map((key) => [key, sortValue(record[key])]),
    )
  }
  return value
}
