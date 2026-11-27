import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** 内容身份。树哈希按路径排序，与文件 mtime 无关。 */
export function sha256(data: Buffer | string): string {
  return `sha256:${createHash('sha256').update(data).digest('hex')}`
}

/** 目录树 digest：path + NUL + 文件 sha256，再总哈希。不打 tar。 */
export function treeDigest(files: { path: string; content: Buffer }[]): string {
  // 码元序排序：localeCompare 受 ICU 版本/运行环境摆布（Node 22 与 26 对部分路径对次序
  // 不同，SYNC 摘要跨环境核对会幻影失配），与 catalog.ts 的 compareBy 同理
  const sorted = [...files].toSorted((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
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

/**
 * sync 写盘统一 LF：dest 的摘要记录在 SYNC.json 里，跨平台检出（Windows autocrlf 的
 * CRLF 与 CI 的 LF）会让 I1 摘要核对出现无法用变体调和的幻影漂移；写盘时归一，
 * 配合 .gitattributes 的 eol=lf，三处字节恒等。含 NUL 视作二进制原样保留
 */
export function normalizeTextEol(content: Buffer): Buffer {
  if (content.includes(0)) return content
  return Buffer.from(content.toString('utf8').replaceAll('\r\n', '\n'), 'utf8')
}
