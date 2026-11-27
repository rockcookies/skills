import { createHash } from 'node:crypto'
import { mkdtemp, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, test } from 'vitest'

import { digestTree, normalizeTextEol, sha256, treeDigest } from '../digest'

const sha256Buf = (data: Buffer | string): Buffer => createHash('sha256').update(data).digest()

test('sha256 is stable for the same bytes', () => {
  expect(sha256('hello')).toBe(sha256(Buffer.from('hello')))
  expect(sha256('hello')).toMatch(/^sha256:[0-9a-f]{64}$/)
})

test('tree digest sorts paths by codepoint order, not locale collation', () => {
  const files = [
    { path: 'references/a.md', content: Buffer.from('r') },
    { path: 'SKILL.md', content: Buffer.from('s') },
  ]
  const canonical = Buffer.concat([
    Buffer.from('SKILL.md'),
    Buffer.from('\0'),
    sha256Buf(Buffer.from('s')),
    Buffer.from('references/a.md'),
    Buffer.from('\0'),
    sha256Buf(Buffer.from('r')),
  ])
  // locale collation 会把 references 排在 SKILL 之前（大小写混排），码元序 S(83) < r(114)
  expect(treeDigest(files)).toBe(sha256(canonical))
})

test('tree digest ignores file order', () => {
  const a = treeDigest([
    { path: 'b.md', content: Buffer.from('b') },
    { path: 'a.md', content: Buffer.from('a') },
  ])
  const b = treeDigest([
    { path: 'a.md', content: Buffer.from('a') },
    { path: 'b.md', content: Buffer.from('b') },
  ])
  expect(a).toBe(b)
})

test('tree digest changes when content changes', () => {
  const a = treeDigest([{ path: 'a.md', content: Buffer.from('a') }])
  const b = treeDigest([{ path: 'a.md', content: Buffer.from('B') }])
  expect(a).not.toBe(b)
})

test('directory tree digest is stable across mtime-only changes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'digest-'))
  const file = join(dir, 'SKILL.md')
  await writeFile(file, 'hello')
  const first = await digestTree(dir, ['SKILL.md'])
  await utimes(file, new Date(0), new Date(0))
  const second = await digestTree(dir, ['SKILL.md'])
  expect(first).toBe(second)
})

describe('normalizeTextEol', () => {
  it('converts CRLF to LF in text content', () => {
    expect(normalizeTextEol(Buffer.from('a\r\nb\r\n'))).toEqual(Buffer.from('a\nb\n'))
  })

  it('keeps binary content byte-identical', () => {
    const png = Buffer.from([0x89, 0x50, 0x0d, 0x0a, 0x00, 0x1a, 0x0a])
    expect(normalizeTextEol(png)).toBe(png)
  })

  it('is a no-op for pure-LF text', () => {
    const text = Buffer.from('a\nb\n')
    expect(normalizeTextEol(text)).toEqual(text)
  })
})
