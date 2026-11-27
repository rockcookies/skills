import { mkdir, mkdtemp, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import type { RepositoryConfig } from '../../types'

import { digestFile, digestTree } from '../../utils/digest'
import { listFilesRecursive } from '../../utils/fs'
import { buildPublishManifest, materializePublishTree } from '../publish-tree.service'

const repositories: Record<string, RepositoryConfig> = {
  alpha: { url: 'https://example.com/alpha', tag: 'v1.0.0' },
}

const roots: string[] = []

afterAll(async () => {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })))
})

/** alpha：1 个多文件技能 + 1 个 agent + SYNC.json；custom：1 个手维护技能（无 SYNC.json） */
async function writeFixture(root: string): Promise<void> {
  const skillDir = join(root, 'content', 'alpha', 'skills', 'one')
  await mkdir(join(skillDir, 'references'), { recursive: true })
  await writeFile(join(skillDir, 'SKILL.md'), 'entry\n')
  await writeFile(join(skillDir, 'references', 'a.md'), 'ref\n')
  await mkdir(join(root, 'content', 'alpha', 'agents'), { recursive: true })
  await writeFile(join(root, 'content', 'alpha', 'agents', 'agent-one.md'), 'agent body\n')
  await mkdir(join(root, 'content', 'custom', 'skills', 'two'), { recursive: true })
  await writeFile(join(root, 'content', 'custom', 'skills', 'two', 'SKILL.md'), 'two\n')
  await writeFile(
    join(root, 'content', 'alpha', 'SYNC.json'),
    JSON.stringify({
      upstream_committed_sha: 'a'.repeat(40),
      upstream_committed_at: '2026-01-01T00:00:00Z',
      items_digest: 'sha256:agg',
      items_changed_at: '2026-01-01T00:00:00Z',
      items: [],
    }),
  )
}

describe('buildPublishManifest', () => {
  it('groups items per source with sync fields; custom carries none', async () => {
    const root = await mkdtemp(join(tmpdir(), 'publish-tree-'))
    roots.push(root)
    await writeFixture(root)

    const manifest = await buildPublishManifest(root, repositories)

    expect(Object.keys(manifest.sources)).toEqual(['alpha', 'custom'])
    const alpha = manifest.sources.alpha!
    expect(alpha.repo).toBe('https://example.com/alpha')
    expect(alpha.pin).toBe('v1.0.0')
    expect(alpha.upstream_committed_sha).toBe('a'.repeat(40))
    expect(alpha.upstream_committed_at).toBe('2026-01-01T00:00:00Z')
    expect(alpha.items_digest).toBe('sha256:agg')
    expect(alpha.items_changed_at).toBe('2026-01-01T00:00:00Z')
    expect(alpha.skills).toEqual([
      {
        name: 'one',
        digest: await digestTree(
          join(root, 'content/alpha/skills/one'),
          await listFilesRecursive(join(root, 'content/alpha/skills/one')),
        ),
      },
    ])
    expect(alpha.agents).toEqual([
      { name: 'agent-one', digest: await digestFile(join(root, 'content/alpha/agents/agent-one.md')) },
    ])
    expect(alpha.rules).toEqual([])
    expect(alpha.commands).toEqual([])

    const custom = manifest.sources.custom!
    expect(custom.repo).toBeUndefined()
    expect(custom.pin).toBeUndefined()
    expect(custom.upstream_committed_sha).toBeUndefined()
    expect(custom.items_digest).toBeUndefined()
    expect(custom.skills).toEqual([
      {
        name: 'two',
        digest: await digestTree(
          join(root, 'content/custom/skills/two'),
          await listFilesRecursive(join(root, 'content/custom/skills/two')),
        ),
      },
    ])
    expect(custom.agents).toEqual([])
  })

  it('omits sync fields when the repo has no SYNC.json', async () => {
    const root = await mkdtemp(join(tmpdir(), 'publish-tree-'))
    roots.push(root)
    await writeFixture(root)
    await unlink(join(root, 'content', 'alpha', 'SYNC.json'))

    const manifest = await buildPublishManifest(root, repositories)

    const alpha = manifest.sources.alpha!
    expect(alpha.repo).toBeUndefined()
    expect(alpha.pin).toBeUndefined()
    expect(alpha.skills).toHaveLength(1)
  })

  it('throws when a repoKey has no meta.ts entry', async () => {
    const root = await mkdtemp(join(tmpdir(), 'publish-tree-'))
    roots.push(root)
    await writeFixture(root)

    await expect(buildPublishManifest(root, {})).rejects.toThrow(/no entry in meta\.ts/)
  })
})

describe('materializePublishTree', () => {
  it('writes flat dirs + manifest.json and skips empty kinds', async () => {
    const root = await mkdtemp(join(tmpdir(), 'publish-tree-'))
    roots.push(root)
    await writeFixture(root)
    const out = join(root, 'face')

    const { entries, manifest } = await materializePublishTree(root, out, repositories)

    expect(entries).toBe(3)
    expect(await readFile(join(out, 'skills', 'one', 'references', 'a.md'), 'utf8')).toBe('ref\n')
    expect(await readFile(join(out, 'agents', 'agent-one.md'), 'utf8')).toBe('agent body\n')
    await expect(stat(join(out, 'rules'))).rejects.toThrow() // 空 kind 不建目录
    await expect(stat(join(out, 'commands'))).rejects.toThrow()
    const written = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'))
    expect(written).toEqual(manifest)
    expect(written.schema).toBe(1)
  })
})
