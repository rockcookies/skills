import { expect, test } from 'vitest'

import type { SyncManifest } from '../types'

import { buildSyncReport, compareManifests, type RepoSyncSnapshot } from './sync.command'

function manifest(sha: string, items: { name: string; digest: string }[]): SyncManifest {
  return {
    upstream_committed_sha: sha,
    upstream_committed_at: '2026-11-20T00:00:00.000Z',
    items_digest: 'sha256:agg',
    items_changed_at: '2026-11-20T00:00:00.000Z',
    items,
  }
}

test('compareManifests treats null before as all added', () => {
  expect(
    compareManifests(
      null,
      manifest('sha-new', [
        { name: 'b', digest: '1' },
        { name: 'a', digest: '2' },
      ]),
    ),
  ).toEqual({
    added: ['a', 'b'],
    removed: [],
    changed: [],
  })
})

test('compareManifests splits added/removed/changed', () => {
  const before = manifest('sha-old', [
    { name: 'kept', digest: '1' },
    { name: 'stale', digest: '2' },
    { name: 'gone', digest: '3' },
  ])
  const after = manifest('sha-new', [
    { name: 'kept', digest: '1' },
    { name: 'stale', digest: '9' },
    { name: 'fresh', digest: '4' },
  ])
  expect(compareManifests(before, after)).toEqual({
    added: ['fresh'],
    removed: ['gone'],
    changed: ['stale'],
  })
})

test('compareManifests reports no changes for identical items', () => {
  const m = manifest('sha', [{ name: 'a', digest: '1' }])
  expect(compareManifests(m, m)).toEqual({ added: [], removed: [], changed: [] })
})

test('buildSyncReport lists skipped repos without sha line', () => {
  const snapshots: RepoSyncSnapshot[] = [{ repo: 'reserved', skipped: true, before: {}, after: {} }]
  expect(buildSyncReport(snapshots)).toBe('## Upstream sync\n\n- **reserved**: skipped (no mappings)\n')
})

test('buildSyncReport shows no-changes line with sha arrow', () => {
  const m = manifest('aaaaaaaaaa', [{ name: 'a', digest: '1' }])
  const snapshots: RepoSyncSnapshot[] = [
    {
      repo: 'tw93-kami',
      skipped: false,
      before: { skills: m },
      after: { skills: manifest('bbbbbbbbbb', [{ name: 'a', digest: '1' }]) },
    },
  ]
  expect(buildSyncReport(snapshots)).toContain('- **tw93-kami**: no content changes (aaaaaaa -> bbbbbbb)')
})

test('buildSyncReport lists per-kind changes and marks first sync', () => {
  const snapshots: RepoSyncSnapshot[] = [
    {
      repo: 'new-repo',
      skipped: false,
      before: {},
      after: {
        skills: manifest('cccccccccc', [{ name: 'skill-a', digest: '1' }]),
        agents: manifest('cccccccccc', [{ name: 'agent-a', digest: '1' }]),
      },
    },
  ]
  const report = buildSyncReport(snapshots)
  expect(report).toContain('- **new-repo** ccccccc')
  expect(report).toContain('  - skills: +skill-a')
  expect(report).toContain('  - agents: +agent-a')
  expect(report).not.toContain('rules:')
})
