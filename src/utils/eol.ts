/**
 * sync 写盘统一 LF：dest 的摘要记录在 SYNC.json 里，跨平台检出（Windows autocrlf 的
 * CRLF 与 CI 的 LF）会让 I1 摘要核对出现无法用变体调和的幻影漂移；写盘时归一，
 * 配合 .gitattributes 的 eol=lf，三处字节恒等。含 NUL 视作二进制原样保留
 */
export function normalizeTextEol(content: Buffer): Buffer {
  if (content.includes(0)) return content
  return Buffer.from(content.toString('utf8').replaceAll('\r\n', '\n'), 'utf8')
}
