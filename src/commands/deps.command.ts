import * as p from '@clack/prompts'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

import type {
  ClosureNode,
  DependencyClosure,
  ItemIndex,
  ItemLocation,
  ResolvedDependencyGraph,
} from '../services/dependencies.service'
import type { RepositoryConfig, SourceKind } from '../types'

import { dependencies } from '../../dependencies'
import { buildItemIndex, closureOf, resolveDependencyGraph, SOURCE_KINDS } from '../services/dependencies.service'

const REPO_SLUG = 'rockcookies/skills'
const CURSOR_AGENTS_DIR = '~/.cursor/agents/'

async function listCustomSkillNames(root: string): Promise<string[]> {
  const customDir = join(root, 'skills', 'custom')
  try {
    const entries = await readdir(customDir, { withFileTypes: true })
    const checks = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => ({
          name: entry.name,
          hasSkillMd: await stat(join(customDir, entry.name, 'SKILL.md')).then(
            () => true,
            () => false,
          ),
        })),
    )
    return checks
      .filter((check) => check.hasSkillMd)
      .map((check) => check.name)
      .toSorted()
  } catch {
    return []
  }
}

function groupByKind(nodes: ClosureNode[]): Array<[SourceKind, string[]]> {
  const groups = new Map<SourceKind, string[]>(SOURCE_KINDS.map((kind) => [kind, []]))
  for (const node of nodes) groups.get(node.kind)!.push(node.name)
  return [...groups.entries()].filter(([, names]) => names.length > 0)
}

function printNames(label: string, nodes: ClosureNode[]): void {
  console.info(`\n${label} (${nodes.length}):`)
  if (nodes.length === 0) {
    console.info('  （无）')
    return
  }
  for (const [kind, names] of groupByKind(nodes)) {
    console.info(`  ${kind}s: ${names.join(', ')}`)
  }
}

function describeLocation(location: ItemLocation): string {
  return location.repoKey ? `${location.kind} @ ${location.repoKey}` : `${location.kind} @ custom`
}

function printGraphWarnings(graph: ResolvedDependencyGraph): void {
  if (graph.unknownKeys.length === 0 && graph.dangling.length === 0) return
  console.info('\n悬空引用（全图）:')
  for (const unknown of graph.unknownKeys) {
    console.info(`  ${unknown.kind}.${unknown.key}: ${unknown.reason}`)
  }
  for (const dangling of graph.dangling) {
    console.info(`  ${dangling.kind}.${dangling.key} → ${dangling.refKind}.${dangling.ref}: ${dangling.reason}`)
  }
}

function printInstallCommands(closure: DependencyClosure, index: ItemIndex): void {
  const all = [...closure.direct, ...closure.transitive]
  const skills = all.filter((node) => node.kind === 'skill').map((node) => node.name)
  const agents = all.filter((node) => node.kind === 'agent')
  const rules = all.filter((node) => node.kind === 'rule')

  if (skills.length > 0) {
    console.info('\n复制安装依赖 skills:')
    console.info(`npx skills add ${REPO_SLUG} --full-depth ${skills.map((n) => `--skill ${n}`).join(' ')} -g`)
  }
  if (agents.length > 0) {
    console.info('\n复制安装 agents:')
    for (const agent of agents) {
      const repoKey = index.agent.get(agent.name)?.repoKey ?? '<repoKey>'
      console.info(`cp agents/${repoKey}/${agent.name}.md ${CURSOR_AGENTS_DIR}`)
    }
  }
  if (rules.length > 0) {
    console.info('\n复制 rules（npx 不安装规则，手动复制）:')
    for (const rule of rules) {
      const repoKey = index.rule.get(rule.name)?.repoKey ?? '<repoKey>'
      console.info(`rules/${repoKey}/${rule.name}.md`)
    }
  }
}

function printAvailableNames(index: ItemIndex): void {
  for (const kind of SOURCE_KINDS) {
    const names = [...index[kind].keys()].toSorted()
    if (names.length > 0) console.info(`  ${kind}s: ${names.join(', ')}`)
  }
}

export async function printDependencies(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  nameInput?: string,
): Promise<void> {
  let rawName = nameInput?.trim()
  if (!rawName) {
    const answer = await p.text({ message: 'Skill or agent name (e.g. grill-and-think):' })
    if (p.isCancel(answer) || !answer.trim()) {
      p.cancel('No name given')
      process.exit(0)
    }
    rawName = answer.trim()
  }
  const name = rawName

  const customSkillNames = await listCustomSkillNames(root)
  const { index, duplicates } = buildItemIndex(repositories, customSkillNames)
  const graph = resolveDependencyGraph(dependencies, index, duplicates)

  const dupKinds = SOURCE_KINDS.filter((kind) => duplicates[kind].includes(name))
  if (dupKinds.length > 0) {
    console.info(`\n"${name}" 在 ${dupKinds.join(', ')} 类内重名，解析歧义，先改名再声明依赖。`)
    process.exitCode = 1
    return
  }

  const kinds = SOURCE_KINDS.filter((kind) => index[kind].has(name))
  if (kinds.length === 0) {
    console.info(`\n"${name}" 不是映射产物或 custom 技能。可用名字：`)
    printAvailableNames(index)
    process.exitCode = 1
    return
  }

  const kind = kinds[0]!
  const location = index[kind].get(name)!
  const declaration = dependencies[`${kind}s`][name]
  const closure = closureOf(graph, kind, name)

  console.info(`\n${name} (${describeLocation(location)})`)
  if (!declaration) {
    console.info('存在但未在 dependencies.ts 声明依赖。')
  }
  printNames('直接依赖', closure.direct)
  printNames('传递依赖', closure.transitive)
  printGraphWarnings(graph)
  printInstallCommands(closure, index)
}
