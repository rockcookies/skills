import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import type { Dependencies, RepositoryConfig } from '../../types'

import { listFilesRecursive } from '../../utils/fs'
import { check, formatReport } from '../check.service'
import {
  fixtureDependencies,
  fixturePacks,
  fixtureRepositories,
  writeCleanFixture,
  writeSkill,
} from './fixtures/check-fixtures'

const tempRoots: string[] = []

async function createRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'audit-'))
  tempRoots.push(root)
  return root
}

function inputFor(
  root: string,
  overrides: {
    dependencies?: Dependencies
    repositories?: Record<string, RepositoryConfig>
  } = {},
): {
  root: string
  repositories: Record<string, RepositoryConfig>
  dependencies: Dependencies
  packs: typeof fixturePacks
} {
  return {
    root,
    repositories: overrides.repositories ?? fixtureRepositories,
    dependencies: overrides.dependencies ?? fixtureDependencies,
    packs: fixturePacks,
  }
}

afterAll(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })))
})

describe('check', () => {
  it('reports zero errors on the clean self-consistent fixture', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)

    const result = await check(inputFor(root))

    expect(result.findings.filter((f) => f.severity === 'error')).toEqual([])
    expect(result.skills.map((s) => s.name).toSorted()).toEqual(['one', 'two'])
    expect(result.agents.map((a) => a.name)).toEqual(['agent-one'])
    expect(result.rules.map((r) => r.name)).toEqual(['rule-one'])
  })

  it('flags duplicate skill names across repoKeys (A3)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeSkill(root, join('beta', 'skills', 'one'), 'one', 'Duplicate of one')

    const result = await check(inputFor(root))

    const a3 = result.findings.filter((f) => f.rule === 'A3')
    expect(a3).toHaveLength(1)
    expect(a3[0]!.message).toContain('content/alpha/skills/one')
    expect(a3[0]!.message).toContain('content/beta/skills/one')
  })

  it('flags duplicate agent names across repoKeys (A3)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    const repositories: Record<string, RepositoryConfig> = {
      alpha: { url: 'https://example.com/alpha', agents: [{ source: './a.md', name: 'dup' }] },
      beta: { url: 'https://example.com/beta', agents: [{ source: './a.md', name: 'dup' }] },
    }
    await mkdir(join(root, 'content', 'beta', 'agents'), { recursive: true })
    await writeFile(join(root, 'content', 'alpha', 'agents', 'dup.md'), 'x\n')
    await writeFile(join(root, 'content', 'beta', 'agents', 'dup.md'), 'x\n')

    const result = await check(inputFor(root, { repositories }))

    const a3 = result.findings.filter((f) => f.rule === 'A3')
    expect(a3).toHaveLength(1)
    expect(a3[0]!.message).toContain('duplicate agent name "dup"')
  })

  it('flags names used by multiple kinds (A4)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await mkdir(join(root, 'content', 'beta', 'agents'), { recursive: true })
    await writeFile(join(root, 'content', 'beta', 'agents', 'one.md'), 'x\n')

    const result = await check(inputFor(root))

    const a4 = result.findings.filter((f) => f.rule === 'A4')
    expect(a4).toHaveLength(1)
    expect(a4[0]!.message).toContain('name "one"')
    expect(a4[0]!.message).toContain('skill: content/alpha/skills/one')
    expect(a4[0]!.message).toContain('agent: content/beta/agents/one.md')
  })

  it('flags dangling dependency refs but exempts command refs (D1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    const dependencies: Dependencies = {
      skills: { one: { skills: ['ghost'], commands: ['future-command'] } },
      agents: {},
      rules: {},
      commands: {},
    }

    const result = await check(inputFor(root, { dependencies }))

    const d1 = result.findings.filter((f) => f.rule === 'D1')
    expect(d1).toHaveLength(1)
    expect(d1[0]!.message).toContain('"one" -> unknown skill "ghost"')
    expect(d1.some((f) => f.message.includes('future-command'))).toBe(false)
  })

  it('flags unknown dependency keys (D1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    const dependencies: Dependencies = {
      skills: { 'not-a-skill': { agents: ['agent-one'] } },
      agents: {},
      rules: {},
      commands: {},
    }

    const result = await check(inputFor(root, { dependencies }))

    expect(result.findings.some((f) => f.rule === 'D1' && f.message.includes('"not-a-skill"'))).toBe(true)
  })

  it('detects skill->skill dependency cycles once per cycle (D2, warn)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    const dependencies: Dependencies = {
      skills: { one: { skills: ['two'] }, two: { skills: ['one'] } },
      agents: {},
      rules: {},
      commands: {},
    }

    const result = await check(inputFor(root, { dependencies }))

    const d2 = result.findings.filter((f) => f.rule === 'D2')
    expect(d2).toHaveLength(1)
    expect(d2[0]!.severity).toBe('warn')
    expect(d2[0]!.message).toContain('one -> two -> one')
  })

  it('flags unknown pack members (P1) and warns on missing pack deps (P2)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)

    const result = await check({
      root,
      repositories: fixtureRepositories,
      dependencies: fixtureDependencies,
      packs: {
        complete: { description: '', skills: ['one', 'two'] },
        broken: { description: '', skills: ['ghost-skill'] },
        incomplete: { description: '', skills: ['one'] },
      },
    })

    const p1 = result.findings.filter((f) => f.rule === 'P1')
    expect(p1).toHaveLength(1)
    expect(p1[0]!.message).toContain('"ghost-skill"')
    const p2 = result.findings.filter((f) => f.rule === 'P2')
    expect(p2).toHaveLength(1)
    expect(p2[0]!.message).toContain('pack "incomplete"')
    expect(p2[0]!.severity).toBe('warn')
  })

  it('tolerates the git line-ending phantom in SYNC.json digests (I1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    // 模拟检出/写盘形态漂移：dest 全部转 CRLF，SYNC.json 仍记 LF 形态摘要；
    // 读取侧归一（CRLF→LF + 首尾换行 trim）让两种形态同摘要
    const destDirs = [join('alpha', 'skills', 'one'), join('alpha', 'agents'), join('alpha', 'rules')].map((relDir) =>
      join(root, 'content', relDir),
    )
    const trees = await Promise.all(destDirs.map(async (dir) => ({ dir, rels: await listFilesRecursive(dir) })))
    await Promise.all(
      trees.flatMap(({ dir, rels }) =>
        rels.map(async (rel) => {
          const p = join(dir, rel)
          await writeFile(p, (await readFile(p)).toString('utf8').replaceAll('\n', '\r\n'))
        }),
      ),
    )

    const result = await check(inputFor(root))

    expect(result.findings.filter((f) => f.rule === 'I1')).toEqual([])
  })

  it('detects SYNC.json digest drift (I1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeFile(join(root, 'content', 'alpha', 'skills', 'one', 'extra.md'), 'unexpected file\n')

    const result = await check(inputFor(root))

    const i1 = result.findings.filter((f) => f.rule === 'I1')
    expect(i1).toHaveLength(1)
    expect(i1[0]!.path).toBe('content/alpha/skills/one')
  })

  it('detects SYNC.json items missing from the manifest (I1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    const path = join(root, 'content', 'alpha', 'SYNC.json')
    const manifest = JSON.parse(await readFile(path, 'utf8')) as {
      items: { kind: string; name: string; digest: string }[]
    }
    manifest.items = manifest.items.filter((i) => i.name !== 'rule-one')
    await writeFile(path, JSON.stringify(manifest, null, 2) + '\n')

    const result = await check(inputFor(root))

    const i1 = result.findings.filter((f) => f.rule === 'I1')
    expect(i1).toHaveLength(1)
    expect(i1[0]!.message).toContain('rule mapping "rule-one" is missing from SYNC.json')
  })

  it('flags manifest items with unknown kind (I1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    const path = join(root, 'content', 'alpha', 'SYNC.json')
    const manifest = JSON.parse(await readFile(path, 'utf8')) as {
      items: { kind: string; name: string; digest: string }[]
    }
    manifest.items[0]!.kind = 'command'
    await writeFile(path, JSON.stringify(manifest, null, 2) + '\n')

    const result = await check(inputFor(root))

    // kind 打错的那条报 unknown kind，且没进 seen → agent-one 同时报 missing from SYNC.json
    const i1 = result.findings.filter((f) => f.rule === 'I1')
    expect(i1).toHaveLength(2)
    expect(i1[0]!.message).toContain('unknown kind "command"')
    expect(i1[1]!.message).toContain('agent mapping "agent-one" is missing from SYNC.json')
  })

  it('flags orphan dests and unknown vendors (O1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeSkill(root, join('ghost-vendor', 'skills', 'orphan'), 'orphan', 'No mapping')

    const result = await check(inputFor(root))

    const o1 = result.findings.filter((f) => f.rule === 'O1')
    expect(o1).toHaveLength(1)
    expect(o1[0]!.message).toContain('unknown vendor "ghost-vendor"')
  })

  it('flags mapped skills missing on disk (O1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await rm(join(root, 'content', 'alpha', 'agents', 'agent-one.md'), { force: true })

    const result = await check(inputFor(root))

    const o1 = result.findings.filter((f) => f.rule === 'O1')
    expect(o1).toHaveLength(1)
    expect(o1[0]!.message).toContain('mapped agent missing on disk')
  })

  it('flags invalid frontmatter (A1) and invalid names (A2)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await mkdir(join(root, 'content', 'custom', 'skills', 'no-fm'), { recursive: true })
    await writeFile(join(root, 'content', 'custom', 'skills', 'no-fm', 'SKILL.md'), 'no frontmatter here\n')
    await writeSkill(root, join('custom', 'skills', 'bad-name'), 'Bad_Name', 'Badly named')

    const result = await check(inputFor(root))

    expect(result.findings.some((f) => f.rule === 'A1' && f.message === 'missing frontmatter')).toBe(true)
    expect(result.findings.some((f) => f.rule === 'A2' && f.message.includes('"Bad_Name"'))).toBe(true)
  })
})

describe('formatReport', () => {
  it('summarizes counts and lists findings', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeSkill(root, join('beta', 'skills', 'one'), 'one', 'Duplicate of one')

    const report = formatReport(await check(inputFor(root)))

    expect(report).toContain('## Check')
    expect(report).toContain('### Errors')
    expect(report).toContain('`A3`')
    expect(report).toContain('`O1`')
  })
})
