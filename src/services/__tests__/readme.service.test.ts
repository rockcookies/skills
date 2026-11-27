import { describe, expect, it } from 'vitest'

import type { Catalog, CatalogFileItem, CatalogSkill } from '../../catalog'

import { catalogEntries, renderKindTable, replaceBlocks, type ReadmeEntry } from '../readme.service'

const skill = (over: Partial<CatalogSkill>): CatalogSkill => ({
  name: 'demo',
  description: 'A demo skill',
  vendor: 'custom',
  path: 'content/custom/skills/demo',
  internal: false,
  requires: { skills: [], agents: [], rules: [] },
  ...over,
})

const fileItem = (over: Partial<CatalogFileItem>): CatalogFileItem => ({
  name: 'agent-one',
  vendor: 'alpha',
  path: 'content/alpha/agents/agent-one.md',
  ...over,
})

const catalog = (over: Partial<Catalog>): Catalog => ({
  schema: 1,
  skills: [skill({})],
  agents: [fileItem({})],
  rules: [fileItem({ name: 'rule-one', path: 'content/alpha/rules/rule-one.md' })],
  commands: [],
  packs: [],
  ...over,
})

describe('renderKindTable', () => {
  it('renders custom tables with two columns and face links', () => {
    const entries: ReadmeEntry[] = [{ name: 'demo', vendor: 'custom', description: 'A | demo' }]
    const md = renderKindTable('skills', entries, false)
    expect(md.startsWith('| Skill | Description |')).toBe(true)
    expect(md).toContain('| [demo](skills/demo) | A \\| demo |')
  })

  it('renders synced tables with an Upstream column and file extension links', () => {
    const entries: ReadmeEntry[] = [{ name: 'agent-one', vendor: 'alpha', description: 'Does things' }]
    const md = renderKindTable('agents', entries, true)
    expect(md.startsWith('| Agent | Upstream | Description |')).toBe(true)
    expect(md).toContain('| [agent-one](agents/agent-one.md) | alpha | Does things |')
  })

  it('renders an empty description cell and a *(none)* placeholder for empty sets', () => {
    expect(renderKindTable('agents', [{ name: 'x', vendor: 'alpha' }], true)).toContain('| alpha |  |')
    expect(renderKindTable('rules', [], true)).toBe('*(none)*')
    expect(renderKindTable('commands', [], false)).toBe('*(none)*')
  })
})

describe('catalogEntries', () => {
  it('splits custom and synced entries and drops internal skills', () => {
    const cat = catalog({
      skills: [
        skill({ name: 'mine', vendor: 'custom' }),
        skill({ name: 'theirs', vendor: 'alpha', internal: true }),
        skill({ name: 'published', vendor: 'alpha' }),
      ],
      agents: [
        fileItem({ name: 'mine-agent', vendor: 'custom', path: 'content/custom/agents/mine-agent.md' }),
        fileItem({}),
      ],
    })
    const skills = catalogEntries('skills', cat)
    expect(skills.custom.map((e) => e.name)).toEqual(['mine'])
    expect(skills.synced.map((e) => e.name)).toEqual(['published'])
    const agents = catalogEntries('agents', cat)
    expect(agents.custom.map((e) => e.name)).toEqual(['mine-agent'])
    expect(agents.synced.map((e) => e.name)).toEqual(['agent-one'])
    expect(catalogEntries('commands', cat).synced).toEqual([])
  })
})

describe('replaceBlocks', () => {
  const template = 'before\n<!-- skills:custom:start -->\nstale\n<!-- skills:custom:end -->\nafter'

  it('replaces the block body between markers', () => {
    const out = replaceBlocks(template, [{ name: 'skills:custom', body: 'fresh' }])
    expect(out).toBe('before\n<!-- skills:custom:start -->\nfresh\n<!-- skills:custom:end -->\nafter')
  })

  it('throws when markers are missing', () => {
    expect(() => replaceBlocks('no markers', [{ name: 'skills:custom', body: 'x' }])).toThrow(
      'missing block markers: skills:custom',
    )
  })

  it('applies multiple blocks independently', () => {
    const t = '<!-- a:start -->\nA\n<!-- a:end -->\n<!-- b:start -->\nB\n<!-- b:end -->'
    const out = replaceBlocks(t, [
      { name: 'a', body: 'A1' },
      { name: 'b', body: 'B1' },
    ])
    expect(out).toContain('A1')
    expect(out).toContain('B1')
    expect(out).not.toContain('A\n')
  })
})
