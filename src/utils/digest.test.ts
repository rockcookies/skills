import assert from 'node:assert/strict'
import { mkdtemp, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { digestTree, sha256, treeDigest } from './digest'

test('sha256 is stable for the same bytes', () => {
  assert.equal(sha256('hello'), sha256(Buffer.from('hello')))
  assert.match(sha256('hello'), /^sha256:[0-9a-f]{64}$/)
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
  assert.equal(a, b)
})

test('tree digest changes when content changes', () => {
  const a = treeDigest([{ path: 'a.md', content: Buffer.from('a') }])
  const b = treeDigest([{ path: 'a.md', content: Buffer.from('B') }])
  assert.notEqual(a, b)
})

test('directory tree digest is stable across mtime-only changes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'digest-'))
  const file = join(dir, 'SKILL.md')
  await writeFile(file, 'hello')
  const first = await digestTree(dir, ['SKILL.md'])
  await utimes(file, new Date(0), new Date(0))
  const second = await digestTree(dir, ['SKILL.md'])
  assert.equal(first, second)
})
