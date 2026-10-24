import { describe, expect, it } from 'vitest'

import type { Dependencies, RepositoryConfig } from '../types'

import { buildItemIndex, closureOf, resolveDependencyGraph } from './dependencies.service'

const repositories: Record<string, RepositoryConfig> = {
  alpha: {
    url: 'https://example.com/alpha',
    skills: [
      { name: 'shared', source: './skills/shared/SKILL.md' },
      { name: 'a-main', source: './skills/a-main/SKILL.md' },
      { name: 'chain-root', source: './skills/chain-root/SKILL.md' },
    ],
    agents: [
      { name: 'agent-one', source: './agents/agent-one.md' },
      // 跨类同名合法：agents 里也有 a-main
      { name: 'a-main', source: './agents/a-main.md' },
    ],
    rules: [{ name: 'rule-one', source: './rules/rule-one.md' }],
  },
  beta: {
    url: 'https://example.com/beta',
    // 类内重名：shared 同时被 alpha 和 beta 声明
    skills: [{ name: 'shared', source: './skills/shared/SKILL.md' }],
  },
}

const customSkillNames = ['custom-one', 'shared']

const dependencies: Dependencies = {
  skills: {
    'chain-root': { skills: ['a-main'] },
    'a-main': { skills: ['custom-one'], agents: ['agent-one'] },
    'custom-one': { skills: ['nonexistent'] },
    ghost: { skills: ['a-main'] },
    shared: { skills: ['a-main'] },
  },
  agents: {
    'agent-one': { rules: ['rule-one'], skills: ['a-main'] },
  },
  rules: {
    'rule-one': { commands: ['some-cmd'] },
  },
  commands: {},
}

describe('buildItemIndex', () => {
  it('indexes mapped and custom items by kind', () => {
    const { index } = buildItemIndex(repositories, customSkillNames)

    expect(index.skill.get('a-main')).toEqual({ kind: 'skill', repoKey: 'alpha' })
    expect(index.skill.get('custom-one')).toEqual({ kind: 'skill', repoKey: null })
    expect(index.agent.get('a-main')).toEqual({ kind: 'agent', repoKey: 'alpha' })
    expect(index.rule.get('rule-one')).toEqual({ kind: 'rule', repoKey: 'alpha' })
    expect(index.command.size).toBe(0)
  })

  it('flags same-kind collisions; cross-kind same name is legal', () => {
    const { index, duplicates } = buildItemIndex(repositories, customSkillNames)

    expect(duplicates.skill).toEqual(['shared'])
    expect(index.skill.has('shared')).toBe(false)
    // a-main 同时存在于 skills 与 agents，不算重名
    expect(duplicates.agent).toEqual([])
    expect(index.skill.has('a-main')).toBe(true)
    expect(index.agent.has('a-main')).toBe(true)
  })
})

describe('resolveDependencyGraph', () => {
  const { index, duplicates } = buildItemIndex(repositories, customSkillNames)
  const graph = resolveDependencyGraph(dependencies, index, duplicates)

  it('collects resolvable edges across kinds', () => {
    expect(graph.edges).toContainEqual({
      fromKind: 'skill',
      from: 'a-main',
      toKind: 'agent',
      to: 'agent-one',
    })
    expect(graph.edges).toContainEqual({
      fromKind: 'agent',
      from: 'agent-one',
      toKind: 'rule',
      to: 'rule-one',
    })
  })

  it('reports dangling refs, command refs always dangle', () => {
    expect(graph.dangling).toContainEqual(
      expect.objectContaining({ kind: 'skill', key: 'custom-one', refKind: 'skill', ref: 'nonexistent' }),
    )
    expect(graph.dangling).toContainEqual(
      expect.objectContaining({
        kind: 'rule',
        key: 'rule-one',
        refKind: 'command',
        ref: 'some-cmd',
        reason: 'command dest 尚未同步',
      }),
    )
    // shared 声明的 refs 不检查（key 本身悬空）
    expect(graph.dangling.find((d) => d.key === 'shared')).toBeUndefined()
  })

  it('reports unknown and duplicate keys', () => {
    expect(graph.unknownKeys).toContainEqual(
      expect.objectContaining({ kind: 'skill', key: 'ghost', reason: 'skill dest not found' }),
    )
    expect(graph.unknownKeys).toContainEqual(
      expect.objectContaining({ kind: 'skill', key: 'shared', reason: 'duplicate dest name in skill' }),
    )
  })
})

describe('closureOf', () => {
  const { index, duplicates } = buildItemIndex(repositories, customSkillNames)
  const graph = resolveDependencyGraph(dependencies, index, duplicates)

  it('walks direct and transitive deps across kinds', () => {
    const closure = closureOf(graph, 'skill', 'chain-root')

    expect(closure.direct).toEqual([{ kind: 'skill', name: 'a-main' }])
    expect(closure.transitive).toEqual([
      { kind: 'skill', name: 'custom-one' },
      { kind: 'agent', name: 'agent-one' },
      { kind: 'rule', name: 'rule-one' },
    ])
  })

  it('keeps a node reachable at both levels as direct only', () => {
    // a-main ↔ agent-one 成环：agent-one 直接可达，再次经它到达的 a-main 已访问
    const closure = closureOf(graph, 'skill', 'a-main')

    expect(closure.direct).toEqual([
      { kind: 'skill', name: 'custom-one' },
      { kind: 'agent', name: 'agent-one' },
    ])
    expect(closure.transitive).toEqual([{ kind: 'rule', name: 'rule-one' }])
  })

  it('returns empty closure for a leaf node', () => {
    const closure = closureOf(graph, 'rule', 'rule-one')

    expect(closure.direct).toEqual([])
    expect(closure.transitive).toEqual([])
  })
})
