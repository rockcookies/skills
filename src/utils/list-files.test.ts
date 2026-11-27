import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'

import { listFilesRecursive } from './list-files'

test('lists nested dotfiles alongside regular files, sorted', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'list-files-'))
  await mkdir(join(dir, 'assets'), { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), 's')
  await writeFile(join(dir, 'assets', '.golangci.yml'), 'g')
  const files = await listFilesRecursive(dir)
  expect(files).toEqual(['SKILL.md', 'assets/.golangci.yml'])
})

test('returns empty list for an empty directory', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'list-files-'))
  expect(await listFilesRecursive(dir)).toEqual([])
})
