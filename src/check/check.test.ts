import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import type { Dependencies } from '../types'

import { treeDigest } from '../utils/digest'
import { listFilesRecursive } from '../utils/list-files'
import { check, formatReport } from './check'
import { fixtureDependencies, fixturePacks, fixtureRepositories, writeCleanFixture, writeSkill } from './test-fixtures'

const tempRoots: string[] = []

async function createRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'audit-'))
  tempRoots.push(root)
  return root
}

function inputFor(
  root: string,
  overrides: { dependencies?: Dependencies } = {},
): { root: string; repositories: typeof fixtureRepositories; dependencies: Dependencies; packs: typeof fixturePacks } {
  return {
    root,
    repositories: fixtureRepositories,
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

  it('flags duplicate skill names across vendors (A3)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeSkill(root, join('beta', 'one'), 'one', 'Duplicate of one')

    const result = await check(inputFor(root))

    const a3 = result.findings.filter((f) => f.rule === 'A3')
    expect(a3).toHaveLength(1)
    expect(a3[0]!.message).toContain('content/skills/alpha/one')
    expect(a3[0]!.message).toContain('content/skills/beta/one')
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
    // 模拟 Windows sync 写 CRLF 摘要、git 提交归一成 LF 的已知幻影：存 CRLF 形态摘要
    const skillDir = join(root, 'content', 'skills', 'alpha', 'one')
    const files = await Promise.all(
      (await listFilesRecursive(skillDir)).map(async (rel) => ({
        path: rel,
        content: (await readFile(join(skillDir, rel))).toString('utf8').replaceAll('\n', '\r\n'),
      })),
    )
    const manifestPath = join(root, 'content', 'skills', 'alpha', 'SYNC.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { items: { name: string; digest: string }[] }
    manifest.items[0]!.digest = treeDigest(
      files.map((f) => ({ path: f.path, content: Buffer.from(f.content, 'utf8') })),
    )
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

    const result = await check(inputFor(root))

    expect(result.findings.filter((f) => f.rule === 'I1')).toEqual([])
  })

  it('detects SYNC.json digest drift (I1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeFile(join(root, 'content', 'skills', 'alpha', 'one', 'extra.md'), 'unexpected file\n')

    const result = await check(inputFor(root))

    const i1 = result.findings.filter((f) => f.rule === 'I1')
    expect(i1).toHaveLength(1)
    expect(i1[0]!.path).toBe('content/skills/alpha/one')
  })

  it('detects SYNC.json items missing from the manifest (I1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    const path = join(root, 'content', 'rules', 'alpha', 'SYNC.json')
    const manifest = JSON.parse(await readFile(path, 'utf8')) as { items: { name: string; digest: string }[] }
    manifest.items = []
    await writeFile(path, JSON.stringify(manifest, null, 2) + '\n')

    const result = await check(inputFor(root))

    const i1 = result.findings.filter((f) => f.rule === 'I1')
    expect(i1).toHaveLength(1)
    expect(i1[0]!.message).toContain('mapping "rule-one" is missing from SYNC.json')
  })

  it('flags orphan dests and unknown vendors (O1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeSkill(root, join('ghost-vendor', 'orphan'), 'orphan', 'No mapping')

    const result = await check(inputFor(root))

    const o1 = result.findings.filter((f) => f.rule === 'O1')
    expect(o1).toHaveLength(1)
    expect(o1[0]!.message).toContain('unknown vendor "ghost-vendor"')
  })

  it('flags mapped skills missing on disk (O1)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await rm(join(root, 'content', 'agents', 'alpha', 'agent-one.md'), { force: true })

    const result = await check(inputFor(root))

    const o1 = result.findings.filter((f) => f.rule === 'O1')
    expect(o1).toHaveLength(1)
    expect(o1[0]!.message).toContain('mapped agent missing on disk')
  })

  it('flags invalid frontmatter (A1) and invalid names (A2)', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await mkdir(join(root, 'content', 'skills', 'custom', 'no-fm'), { recursive: true })
    await writeFile(join(root, 'content', 'skills', 'custom', 'no-fm', 'SKILL.md'), 'no frontmatter here\n')
    await writeSkill(root, join('custom', 'bad-name'), 'Bad_Name', 'Badly named')

    const result = await check(inputFor(root))

    expect(result.findings.some((f) => f.rule === 'A1' && f.message === 'missing frontmatter')).toBe(true)
    expect(result.findings.some((f) => f.rule === 'A2' && f.message.includes('"Bad_Name"'))).toBe(true)
  })
})

describe('formatReport', () => {
  it('summarizes counts and lists findings', async () => {
    const root = await createRoot()
    await writeCleanFixture(root)
    await writeSkill(root, join('beta', 'one'), 'one', 'Duplicate of one')

    const report = formatReport(await check(inputFor(root)))

    expect(report).toContain('## Check')
    expect(report).toContain('### Errors')
    expect(report).toContain('`A3`')
    expect(report).toContain('`O1`')
  })
})
