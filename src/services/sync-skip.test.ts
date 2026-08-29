import assert from 'node:assert/strict'
import { test } from 'node:test'

import { shouldSkipItem } from './sync-skip'

test('skips when source digest and transform id match', () => {
  assert.equal(
    shouldSkipItem({
      force: false,
      destExists: true,
      recorded: { sourceDigest: 'sha256:a', transformId: 'sha256:b' },
      sourceDigest: 'sha256:a',
      transformId: 'sha256:b',
    }),
    true,
  )
})

test('does not skip when dest is missing', () => {
  assert.equal(
    shouldSkipItem({
      force: false,
      destExists: false,
      recorded: { sourceDigest: 'sha256:a', transformId: 'sha256:b' },
      sourceDigest: 'sha256:a',
      transformId: 'sha256:b',
    }),
    false,
  )
})

test('does not skip when transform id changes', () => {
  assert.equal(
    shouldSkipItem({
      force: false,
      destExists: true,
      recorded: { sourceDigest: 'sha256:a', transformId: 'sha256:b' },
      sourceDigest: 'sha256:a',
      transformId: 'sha256:c',
    }),
    false,
  )
})

test('does not skip when recorded items are missing (old SYNC.json)', () => {
  assert.equal(
    shouldSkipItem({
      force: false,
      destExists: true,
      recorded: undefined,
      sourceDigest: 'sha256:a',
      transformId: 'sha256:b',
    }),
    false,
  )
})

test('force never skips', () => {
  assert.equal(
    shouldSkipItem({
      force: true,
      destExists: true,
      recorded: { sourceDigest: 'sha256:a', transformId: 'sha256:b' },
      sourceDigest: 'sha256:a',
      transformId: 'sha256:b',
    }),
    false,
  )
})
