import { describe, expect, it } from 'vitest'

import type { Catalog, CatalogPack, CatalogSkill } from '../catalog'
import type { PackCategory } from '../types'

import { renderAgentsTable, renderPackCategory, renderSkillsTable, replaceBlocks } from './readme.service'

const skill = (over: Partial<CatalogSkill>): CatalogSkill => ({
  name: 'demo',
  description: 'A demo skill',
  vendor: 'custom',
  path: 'content/custom/skills/demo',
  internal: false,
  requires: { skills: [], agents: [], rules: [] },
  ...over,
})

const pack = (over: Partial<CatalogPack>): CatalogPack => ({
  id: 'demo-pack',
  description: '',
  skills: ['demo'],
  ...over,
})

const catalog = (over: Partial<Catalog>): Catalog => ({
  schema: 1,
  skills: [skill({})],
  agents: [],
  rules: [],
  packs: [pack({})],
  ...over,
})

const category: PackCategory = {
  id: 'demo',
  title: 'Demo skills',
  intro: 'Intro paragraph.',
  packs: ['demo-pack'],
}

describe('renderPackCategory', () => {
  it('renders heading, intro and bash command with global scope', () => {
    const md = renderPackCategory(category, catalog({}))
    expect(md).toContain('### Demo skills')
    expect(md).toContain('Intro paragraph.')
    expect(md).toContain('#### demo-pack')
    expect(md).toContain('```bash\nnpx skills add rockcookies/skills \\\n  --skill demo \\\n  -g\n```')
  })

  it('falls back to pack id when title is missing and skips empty description', () => {
    const md = renderPackCategory(category, catalog({ packs: [pack({ title: undefined })] }))
    expect(md).toContain('#### demo-pack')
    expect(md).not.toContain('#### undefined')
  })

  it('notes agents and rules pulled from the dependency closure', () => {
    const cat = catalog({
      skills: [skill({ name: 'demo', requires: { skills: [], agents: ['a-one', 'a-two'], rules: ['r-one'] } })],
    })
    const md = renderPackCategory(category, cat)
    expect(md).toContain('Also copy the agent files — not installed by `npx skills add`')
    expect(md).toContain('`a-one`, `a-two`')
    expect(md).toContain('Also copy the rule files')
    expect(md).toContain('`r-one`')
  })

  it('throws when the category references an unknown pack', () => {
    const broken: PackCategory = { ...category, packs: ['nope'] }
    expect(() => renderPackCategory(broken, catalog({}))).toThrow('unknown pack "nope"')
  })
})

describe('renderSkillsTable', () => {
  it('renders one flat table row per non-internal skill', () => {
    const md = renderSkillsTable([
      skill({ name: 'alpha', vendor: 'antfu', path: 'content/antfu/skills/alpha' }),
      skill({ name: 'hidden', internal: true }),
    ])
    expect(md).toContain('| [alpha](content/antfu/skills/alpha) | antfu |')
    expect(md).not.toContain('hidden')
    expect(md.startsWith('| Skill | Vendor | Description |')).toBe(true)
  })

  it('escapes pipes and newlines inside descriptions', () => {
    const md = renderSkillsTable([skill({ description: 'a | b\nc' })])
    expect(md).toContain('a \\| b c')
  })
})

describe('renderAgentsTable', () => {
  it('derives vendor from the repoKey path segment', () => {
    const md = renderAgentsTable([
      { name: 'agent-one', path: 'content/cursor-plugins/agents/agent-one.md', description: 'Does things' },
    ])
    expect(md).toContain('| [agent-one](content/cursor-plugins/agents/agent-one.md) | cursor-plugins | Does things |')
  })

  it('renders an empty cell when the agent has no description', () => {
    const md = renderAgentsTable([{ name: 'agent-two', path: 'content/x/agents/agent-two.md' }])
    expect(md).toContain('| x |  |')
  })
})

describe('replaceBlocks', () => {
  const template = 'before\n<!-- packs:demo:start -->\nstale\n<!-- packs:demo:end -->\nafter'

  it('replaces the block body between markers', () => {
    const out = replaceBlocks(template, [{ name: 'packs:demo', body: 'fresh' }])
    expect(out).toBe('before\n<!-- packs:demo:start -->\nfresh\n<!-- packs:demo:end -->\nafter')
  })

  it('throws when markers are missing', () => {
    expect(() => replaceBlocks('no markers', [{ name: 'packs:demo', body: 'x' }])).toThrow(
      'missing block markers: packs:demo',
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
