import { expect, test } from 'vitest'

import { compareNames, itemsDigest, nextItemsChangedAt, orphanAgentNames, orphanSkillNames } from './upstream.service'

test('compareNames is UTF-16 code-unit ascending', () => {
  expect(compareNames('A', 'a')).toBeLessThan(0)
  expect(compareNames('boundary-discipline', 'encode-lessons-in-structure')).toBeLessThan(0)
  expect(compareNames('same', 'same')).toBe(0)
})

test('itemsDigest is order-independent after sort', () => {
  const a = itemsDigest([
    { name: 'b', digest: 'sha256:2' },
    { name: 'a', digest: 'sha256:1' },
  ])
  const b = itemsDigest([
    { name: 'a', digest: 'sha256:1' },
    { name: 'b', digest: 'sha256:2' },
  ])
  expect(a).toBe(b)
  expect(a).toMatch(/^sha256:[0-9a-f]{64}$/)
})

test('itemsDigest changes when an item digest changes', () => {
  const a = itemsDigest([{ name: 'a', digest: 'sha256:1' }])
  const b = itemsDigest([{ name: 'a', digest: 'sha256:2' }])
  expect(a).not.toBe(b)
})

test('nextItemsChangedAt reuses previous time when digest matches', () => {
  const now = '2026-10-03T01:00:00.000Z'
  expect(nextItemsChangedAt('sha256:same', '2026-01-01T00:00:00.000Z', 'sha256:same', now)).toBe(
    '2026-01-01T00:00:00.000Z',
  )
  expect(nextItemsChangedAt('sha256:old', '2026-01-01T00:00:00.000Z', 'sha256:new', now)).toBe(now)
  expect(nextItemsChangedAt(undefined, undefined, 'sha256:x', now)).toBe(now)
})

test('orphanSkillNames drops unmapped dirs and sorts', () => {
  const mapped = new Set(['keep-a', 'keep-b'])
  expect(orphanSkillNames(['keep-b', 'orphan-z', 'keep-a', 'orphan-a'], mapped)).toEqual(['orphan-a', 'orphan-z'])
})

test('orphanAgentNames only considers .md basenames', () => {
  const mapped = new Set(['keep'])
  expect(orphanAgentNames(['keep.md', 'gone.md', 'SYNC.json', 'notes.txt'], mapped)).toEqual(['gone'])
})
