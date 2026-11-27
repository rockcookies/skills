import { expect, test } from 'vitest'

import type { SyncManifest, SyncManifestItem } from '../../types'

import { buildSyncReport, changesForKind, compareManifests, type RepoSyncSnapshot } from '../sync.command'

function item(kind: SyncManifestItem['kind'], name: string, digest: string): SyncManifestItem {
  return { kind, name, digest }
}

function manifest(sha: string, items: SyncManifestItem[]): SyncManifest {
  return {
    upstream_committed_sha: sha,
    upstream_committed_at: '2026-11-20T00:00:00.000Z',
    items_digest: 'sha256:agg',
    items_changed_at: '2026-11-20T00:00:00.000Z',
    items,
  }
}

test('compareManifests treats null before as all added', () => {
  expect(compareManifests(null, manifest('sha-new', [item('skill', 'b', '1'), item('skill', 'a', '2')]))).toEqual({
    added: ['a', 'b'],
    removed: [],
    changed: [],
  })
})

test('compareManifests splits added/removed/changed', () => {
  const before = manifest('sha-old', [
    item('skill', 'kept', '1'),
    item('skill', 'stale', '2'),
    item('agent', 'gone', '3'),
  ])
  const after = manifest('sha-new', [
    item('skill', 'kept', '1'),
    item('skill', 'stale', '9'),
    item('agent', 'fresh', '4'),
  ])
  expect(compareManifests(before, after)).toEqual({
    added: ['fresh'],
    removed: ['gone'],
    changed: ['stale'],
  })
})

test('compareManifests reports no changes for identical items', () => {
  const m = manifest('sha', [item('skill', 'a', '1')])
  expect(compareManifests(m, m)).toEqual({ added: [], removed: [], changed: [] })
})

test('changesForKind filters items by kind and returns null when absent on both sides', () => {
  const before = manifest('sha-old', [item('skill', 'a', '1'), item('agent', 'x', '1')])
  const after = manifest('sha-new', [item('skill', 'a', '2')])

  expect(changesForKind(before, after, 'skill')).toEqual({ added: [], removed: [], changed: ['a'] })
  expect(changesForKind(before, after, 'agent')).toEqual({ added: [], removed: ['x'], changed: [] })
  expect(changesForKind(before, after, 'rule')).toBeNull()
})

test('buildSyncReport lists skipped repos without sha line', () => {
  const snapshots: RepoSyncSnapshot[] = [{ repo: 'reserved', skipped: true, before: null, after: null }]
  expect(buildSyncReport(snapshots)).toBe('## Upstream sync\n\n- **reserved**: skipped (no mappings)\n')
})

test('buildSyncReport shows no-changes line with sha arrow', () => {
  const m = manifest('aaaaaaaaaa', [item('skill', 'a', '1')])
  const snapshots: RepoSyncSnapshot[] = [
    { repo: 'tw93-kami', skipped: false, before: m, after: manifest('bbbbbbbbbb', [item('skill', 'a', '1')]) },
  ]
  expect(buildSyncReport(snapshots)).toContain('- **tw93-kami**: no content changes (aaaaaaa -> bbbbbbb)')
})

test('buildSyncReport lists per-kind changes from a single manifest', () => {
  const snapshots: RepoSyncSnapshot[] = [
    {
      repo: 'new-repo',
      skipped: false,
      before: null,
      after: manifest('cccccccccc', [item('skill', 'skill-a', '1'), item('agent', 'agent-a', '1')]),
    },
  ]
  const report = buildSyncReport(snapshots)
  expect(report).toContain('- **new-repo** ccccccc')
  expect(report).toContain('  - skills: +skill-a')
  expect(report).toContain('  - agents: +agent-a')
  expect(report).not.toContain('rules:')
})

test('buildSyncReport reports missing manifest after sync', () => {
  const snapshots: RepoSyncSnapshot[] = [{ repo: 'broken', skipped: false, before: null, after: null }]
  expect(buildSyncReport(snapshots)).toContain('- **broken**: no SYNC.json after sync')
})
