import type { Dependencies, RepositoryConfig, SourceKind } from '../types'

export const SOURCE_KINDS: readonly SourceKind[] = ['skill', 'agent', 'rule', 'command']

export interface ItemLocation {
  kind: SourceKind
  /** null = hand-maintained custom skill (skills/custom/) */
  repoKey: string | null
}

export type ItemIndex = Record<SourceKind, Map<string, ItemLocation>>

/** Names claimed by 2+ owners within the same kind; ambiguous, excluded from resolution */
export type DuplicateNames = Record<SourceKind, string[]>

export interface UnknownKey {
  kind: SourceKind
  key: string
  reason: string
}

export interface DanglingRef {
  kind: SourceKind
  key: string
  refKind: SourceKind
  ref: string
  reason: string
}

export interface DependencyEdge {
  fromKind: SourceKind
  from: string
  toKind: SourceKind
  to: string
}

export interface ResolvedDependencyGraph {
  edges: DependencyEdge[]
  unknownKeys: UnknownKey[]
  dangling: DanglingRef[]
}

export interface ClosureNode {
  kind: SourceKind
  name: string
}

export interface DependencyClosure {
  direct: ClosureNode[]
  transitive: ClosureNode[]
}

function emptyIndex(): ItemIndex {
  return { skill: new Map(), agent: new Map(), rule: new Map(), command: new Map() }
}

function emptyDuplicates(): DuplicateNames {
  return { skill: [], agent: [], rule: [], command: [] }
}

/**
 * Index every dest name by kind: mapped skills/agents/rules plus hand-maintained
 * custom skills. A name claimed by 2+ owners inside one kind (incl. custom vs mapped)
 * goes to duplicates instead of the index.
 */
export function buildItemIndex(
  repositories: Record<string, RepositoryConfig>,
  customSkillNames: string[] = [],
): { index: ItemIndex; duplicates: DuplicateNames } {
  const owners: Record<SourceKind, Map<string, Set<string | null>>> = {
    skill: new Map(),
    agent: new Map(),
    rule: new Map(),
    command: new Map(),
  }

  const add = (kind: SourceKind, name: string, repoKey: string | null): void => {
    const set = owners[kind].get(name) ?? new Set()
    set.add(repoKey)
    owners[kind].set(name, set)
  }

  for (const [repoKey, config] of Object.entries(repositories)) {
    for (const mapping of config.skills ?? []) add('skill', mapping.name, repoKey)
    for (const mapping of config.agents ?? []) add('agent', mapping.name, repoKey)
    for (const mapping of config.rules ?? []) add('rule', mapping.name, repoKey)
  }
  for (const name of customSkillNames) add('skill', name, null)

  const index = emptyIndex()
  const duplicates = emptyDuplicates()
  for (const kind of SOURCE_KINDS) {
    for (const [name, ownerSet] of owners[kind]) {
      if (ownerSet.size > 1) {
        duplicates[kind].push(name)
        continue
      }
      index[kind].set(name, { kind, repoKey: ownerSet.values().next().value ?? null })
    }
  }
  return { index, duplicates }
}

/**
 * Resolve every declaration key and every per-kind ref array against the index.
 * Entries with unknown/duplicate keys are reported via unknownKeys and their refs
 * are not checked; command refs always dangle until that kind is synced.
 */
export function resolveDependencyGraph(
  dependencies: Dependencies,
  index: ItemIndex,
  duplicates: DuplicateNames,
): ResolvedDependencyGraph {
  const edges: ResolvedDependencyGraph['edges'] = []
  const unknownKeys: UnknownKey[] = []
  const dangling: DanglingRef[] = []

  for (const kind of SOURCE_KINDS) {
    for (const [key, declaration] of Object.entries(dependencies[`${kind}s`])) {
      if (duplicates[kind].includes(key)) {
        unknownKeys.push({ kind, key, reason: `duplicate dest name in ${kind}` })
        continue
      }
      if (!index[kind].has(key)) {
        unknownKeys.push({ kind, key, reason: `${kind} dest not found` })
        continue
      }
      for (const refKind of SOURCE_KINDS) {
        for (const ref of declaration[`${refKind}s`] ?? []) {
          if (!index[refKind].has(ref)) {
            dangling.push({
              kind,
              key,
              refKind,
              ref,
              reason: refKind === 'command' ? 'command dest 尚未同步' : `${refKind} dest not found`,
            })
            continue
          }
          edges.push({ fromKind: kind, from: key, toKind: refKind, to: ref })
        }
      }
    }
  }
  return { edges, unknownKeys, dangling }
}

/**
 * BFS closure over resolvable edges. A node reachable both directly and further out
 * is listed as direct only; cycles and self-loops terminate via the visited set.
 */
export function closureOf(graph: ResolvedDependencyGraph, kind: SourceKind, name: string): DependencyClosure {
  const adjacency = new Map<string, ClosureNode[]>()
  for (const edge of graph.edges) {
    const list = adjacency.get(`${edge.fromKind}:${edge.from}`) ?? []
    list.push({ kind: edge.toKind, name: edge.to })
    adjacency.set(`${edge.fromKind}:${edge.from}`, list)
  }

  const startKey = `${kind}:${name}`
  const directKeys = new Set((adjacency.get(startKey) ?? []).map((n) => `${n.kind}:${n.name}`))

  const visited = new Set([startKey])
  const direct: ClosureNode[] = []
  const transitive: ClosureNode[] = []
  const queue: ClosureNode[] = []

  for (const node of adjacency.get(startKey) ?? []) {
    const nodeKey = `${node.kind}:${node.name}`
    if (visited.has(nodeKey)) continue
    visited.add(nodeKey)
    direct.push(node)
    queue.push(node)
  }
  while (queue.length > 0) {
    const node = queue.shift()!
    for (const next of adjacency.get(`${node.kind}:${node.name}`) ?? []) {
      const nextKey = `${next.kind}:${next.name}`
      if (visited.has(nextKey)) continue
      visited.add(nextKey)
      if (!directKeys.has(nextKey)) transitive.push(next)
      queue.push(next)
    }
  }
  return { direct, transitive }
}
