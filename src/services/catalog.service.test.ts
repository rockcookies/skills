import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { CatalogService, itemKey } from './catalog.service'

test('diff reports added changed removed', () => {
  const svc = new CatalogService('.')
  const report = svc.diff(
    {
      generated: 'now',
      items: [
        { kind: 'skill', name: 'a', digest: 'sha256:1' },
        { kind: 'skill', name: 'b', digest: 'sha256:2' },
      ],
    },
    {
      generated: 'old',
      items: [
        { kind: 'skill', name: 'a', digest: 'sha256:0' },
        { kind: 'skill', name: 'c', digest: 'sha256:3' },
      ],
    },
  )
  assert.deepEqual(report.added, ['skill:b'])
  assert.deepEqual(report.removed, ['skill:c'])
  assert.deepEqual(report.changed, ['skill:a'])
  assert.equal(report.unchanged, 0)
})

test('itemKey is kind plus name', () => {
  assert.equal(itemKey({ kind: 'skill', name: 'golang-how-to', digest: 'x' }), 'skill:golang-how-to')
})

test('duplicate kind+name fails the catalog build', async () => {
  const root = await mkdtemp(join(tmpdir(), 'catalog-'))
  await mkdir(join(root, 'skills', 'one', 'dup'), { recursive: true })
  await mkdir(join(root, 'skills', 'two', 'dup'), { recursive: true })
  await writeFile(join(root, 'skills', 'one', 'dup', 'SKILL.md'), '---\nname: dup\n---\n')
  await writeFile(join(root, 'skills', 'two', 'dup', 'SKILL.md'), '---\nname: dup\n---\n')
  const svc = new CatalogService(root)
  await assert.rejects(() => svc.build(), /Duplicate catalog skill name/)
})
