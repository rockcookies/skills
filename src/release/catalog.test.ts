import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import {
  fixtureDependencies,
  fixturePacks,
  fixtureRepositories,
  writeCleanFixture,
  writeSkill,
} from '../audit/test-fixtures'
import { buildCatalog } from './catalog'

const tempRoots: string[] = []

afterAll(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })))
})

describe('buildCatalog', () => {
  it('builds a deterministic catalog from a clean fixture', async () => {
    const root = await mkdtemp(join(tmpdir(), 'catalog-'))
    tempRoots.push(root)
    await writeCleanFixture(root)

    const catalog = await buildCatalog({
      root,
      repositories: fixtureRepositories,
      dependencies: fixtureDependencies,
      packs: fixturePacks,
    })

    expect(catalog.schema).toBe(1)
    expect(catalog.skills.map((s) => s.name)).toEqual(['one', 'two'])
    const one = catalog.skills[0]!
    expect(one.vendor).toBe('alpha')
    expect(one.requires).toEqual({ skills: ['two'], agents: [], rules: [] })
    expect(one.source).toEqual({ repo: 'https://example.com/alpha', pin: 'v1.0.0' })
    const two = catalog.skills[1]!
    expect(two.vendor).toBe('custom')
    expect(two.source).toBeUndefined()
    expect(catalog.agents).toEqual([{ name: 'agent-one', path: 'content/agents/alpha/agent-one.md' }])
    expect(catalog.rules).toEqual([{ name: 'rule-one', path: 'content/rules/alpha/rule-one.md' }])
    expect(catalog.packs).toEqual([
      { id: 'complete', description: 'covers all fixture skills', skills: ['one', 'two'] },
    ])
  })

  it('throws when the audit has errors', async () => {
    const root = await mkdtemp(join(tmpdir(), 'catalog-'))
    tempRoots.push(root)
    await writeCleanFixture(root)
    // 映射了 missing 但磁盘上没有 → O1（missing on disk）+ I1（清单缺项）共 2 个 error
    const repositories = {
      alpha: {
        ...fixtureRepositories.alpha!,
        skills: [...fixtureRepositories.alpha!.skills!, { source: './upstream/alpha/missing.md', name: 'missing' }],
      },
    }

    await expect(
      buildCatalog({ root, repositories, dependencies: fixtureDependencies, packs: fixturePacks }),
    ).rejects.toThrow(/audit has 2 error/)
  })
})
