import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import type { RepositoryConfig, SyncManifest, SyncManifestItem } from '../types'

import { repositories } from '../../meta'
import { formatError } from '../errors/format-error'
import { compareNames, isEmptyMapping, UpstreamService } from '../services/upstream.service'
import { pathExists } from '../utils/fs'

type SyncKind = SyncManifestItem['kind']

const SYNC_KINDS: SyncKind[] = ['skill', 'agent', 'rule', 'command']

/** 一个 repo 同步前后的 SYNC.json 快照；null = 无清单（空映射 repo 或首次同步）。 */
export interface RepoSyncSnapshot {
  repo: string
  skipped: boolean
  before: SyncManifest | null
  after: SyncManifest | null
}

export interface KindChanges {
  added: string[]
  removed: string[]
  changed: string[]
}

const short = (sha: string) => sha.slice(0, 7)

/** 按 name 对比前后 manifest 的 items digest；before 为 null（首次同步）时全部记 added。 */
export function compareManifests(before: SyncManifest | null, after: SyncManifest): KindChanges {
  const beforeItems = new Map((before?.items ?? []).map((item) => [item.name, item.digest]))
  const afterItems = new Map(after.items.map((item) => [item.name, item.digest]))
  const added: string[] = []
  const changed: string[] = []
  for (const [name, digest] of afterItems) {
    const previous = beforeItems.get(name)
    if (previous === undefined) added.push(name)
    else if (previous !== digest) changed.push(name)
  }
  const removed = [...beforeItems.keys()].filter((name) => !afterItems.has(name))
  return {
    added: added.toSorted(compareNames),
    removed: removed.toSorted(compareNames),
    changed: changed.toSorted(compareNames),
  }
}

/** 单个 kind 的变化（items 按 kind 过滤后再比）；前后都没有该 kind 的 item 时返回 null。 */
export function changesForKind(before: SyncManifest | null, after: SyncManifest, kind: SyncKind): KindChanges | null {
  const pick = (m: SyncManifest | null) => (m?.items ?? []).filter((item) => item.kind === kind)
  const beforeItems = new Map(pick(before).map((item) => [item.name, item.digest]))
  const afterItems = new Map(pick(after).map((item) => [item.name, item.digest]))
  if (beforeItems.size === 0 && afterItems.size === 0) return null
  const added: string[] = []
  const changed: string[] = []
  for (const [name, digest] of afterItems) {
    const previous = beforeItems.get(name)
    if (previous === undefined) added.push(name)
    else if (previous !== digest) changed.push(name)
  }
  const removed = [...beforeItems.keys()].filter((name) => !afterItems.has(name))
  return {
    added: added.toSorted(compareNames),
    removed: removed.toSorted(compareNames),
    changed: changed.toSorted(compareNames),
  }
}

/** 人类可读的 Markdown 同步报告：每 repo 一行 pin sha 变化，变化项逐 kind 列出。 */
export function buildSyncReport(snapshots: RepoSyncSnapshot[]): string {
  const lines: string[] = ['## Upstream sync', '']
  for (const snapshot of snapshots) {
    if (snapshot.skipped) {
      lines.push(`- **${snapshot.repo}**: skipped (no mappings)`)
      continue
    }
    if (!snapshot.after) {
      lines.push(`- **${snapshot.repo}**: no SYNC.json after sync`)
      continue
    }
    const shaAfter = snapshot.after.upstream_committed_sha
    const shaBefore = snapshot.before?.upstream_committed_sha
    const arrow = shaBefore ? `${short(shaBefore)} -> ${short(shaAfter)}` : short(shaAfter)
    const changes = SYNC_KINDS.map((kind) => ({ kind, diff: changesForKind(snapshot.before, snapshot.after, kind) }))
      .filter((entry): entry is { kind: SyncKind; diff: KindChanges } => entry.diff !== null)
      .filter(({ diff }) => diff.added.length || diff.removed.length || diff.changed.length)
    if (!changes.length) {
      lines.push(`- **${snapshot.repo}**: no content changes (${arrow})`)
      continue
    }
    lines.push(`- **${snapshot.repo}** ${arrow}`)
    for (const { kind, diff } of changes) {
      const parts = [
        ...diff.added.map((name) => `+${name}`),
        ...diff.removed.map((name) => `-${name}`),
        ...diff.changed.map((name) => `~${name}`),
      ]
      lines.push(`  - ${kind}s: ${parts.join(', ')}`)
    }
  }
  return `${lines.join('\n')}\n`
}

/** 损坏的 SYNC.json 视同缺失，报告里按全量新增呈现。 */
async function readRepoManifest(root: string, repo: string): Promise<SyncManifest | null> {
  const file = join(root, 'content', repo, 'SYNC.json')
  if (!(await pathExists(file))) return null
  try {
    return JSON.parse(await readFile(file, 'utf-8')) as SyncManifest
  } catch {
    return null
  }
}

/**
 * 非交互 sync：更新 upstream → 重写 content/ 生成树 → 输出 Markdown 报告；不做任何 git
 * commit/push。返回退出码：0 成功（含无变化），2 同步失败或 --repo 未知名。
 */
export async function runSync(options: {
  root: string
  repositories: Record<string, RepositoryConfig>
  repo?: string
  report?: string
  force?: boolean
}): Promise<number> {
  const { root, repositories, repo, report, force } = options
  let targets = repositories
  if (repo) {
    const config = repositories[repo]
    if (!config) {
      console.error(`unknown repoKey: ${repo}`)
      console.error(`valid keys: ${Object.keys(repositories).toSorted(compareNames).join(', ')}`)
      return 2
    }
    targets = { [repo]: config }
  }

  const snapshots: RepoSyncSnapshot[] = await Promise.all(
    Object.entries(targets).map(async ([name, config]) => ({
      repo: name,
      skipped: isEmptyMapping(config),
      before: await readRepoManifest(root, name),
      after: null,
    })),
  )

  const service = new UpstreamService(root)
  try {
    await service.updateAll(targets)
    await service.syncAll(targets, force ?? false)
  } catch (error) {
    console.error(formatError(error))
    return 2
  }

  for (const snapshot of snapshots) {
    snapshot.after = await readRepoManifest(root, snapshot.repo)
  }

  const md = buildSyncReport(snapshots)
  console.log(md)
  if (report) await writeFile(report, md, 'utf-8')
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md)
  return 0
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

async function main(): Promise<void> {
  // strict:false：未知参数静默忽略
  const { values } = parseArgs({
    allowPositionals: true,
    strict: false,
    options: {
      force: { type: 'boolean' },
      repo: { type: 'string' },
      report: { type: 'string' },
    },
  })
  process.exit(
    await runSync({
      root,
      repositories,
      repo: values.repo,
      report: values.report,
      force: values.force === true,
    }),
  )
}

// 仅直接执行时跑 main（tsx src/commands/sync.command.ts）；被 vitest/其他模块 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
