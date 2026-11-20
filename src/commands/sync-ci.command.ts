import { appendFile, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'

import type { RepositoryConfig, SyncManifest } from '../types'

import { compareNames, isEmptyMapping, UpstreamService } from '../services/upstream.service'
import { formatError } from '../utils/error'
import { pathExists } from '../utils/fs'

type SyncKind = 'skills' | 'agents' | 'rules'

const SYNC_KINDS: SyncKind[] = ['skills', 'agents', 'rules']

/** 一个 repo 同步前后的 SYNC.json 快照；skipped 为空映射 repo（无 SYNC.json）。 */
export interface RepoSyncSnapshot {
  repo: string
  skipped: boolean
  before: Partial<Record<SyncKind, SyncManifest>>
  after: Partial<Record<SyncKind, SyncManifest>>
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

/** 人类可读的 Markdown 同步报告：每 repo 一行 pin sha 变化，变化项逐 kind 列出。 */
export function buildSyncReport(snapshots: RepoSyncSnapshot[]): string {
  const lines: string[] = ['## Upstream sync', '']
  for (const snapshot of snapshots) {
    if (snapshot.skipped) {
      lines.push(`- **${snapshot.repo}**: skipped (no mappings)`)
      continue
    }
    const kinds = SYNC_KINDS.filter((kind) => snapshot.before[kind] ?? snapshot.after[kind])
    const shaAfter = kinds.map((kind) => snapshot.after[kind]?.upstream_committed_sha).find(Boolean)
    if (!shaAfter) {
      lines.push(`- **${snapshot.repo}**: no SYNC.json after sync`)
      continue
    }
    const shaBefore = kinds.map((kind) => snapshot.before[kind]?.upstream_committed_sha).find(Boolean)
    const arrow = shaBefore ? `${short(shaBefore)} -> ${short(shaAfter)}` : short(shaAfter)
    const changes = kinds
      .map((kind) => ({ kind, diff: compareManifests(snapshot.before[kind] ?? null, snapshot.after[kind]!) }))
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
      lines.push(`  - ${kind}: ${parts.join(', ')}`)
    }
  }
  return `${lines.join('\n')}\n`
}

/** 损坏的 SYNC.json 视同缺失，报告里按全量新增呈现。 */
async function readKindManifests(root: string, repo: string): Promise<Partial<Record<SyncKind, SyncManifest>>> {
  const out: Partial<Record<SyncKind, SyncManifest>> = {}
  for (const kind of SYNC_KINDS) {
    const file = join(root, kind, repo, 'SYNC.json')
    if (!(await pathExists(file))) continue
    try {
      out[kind] = JSON.parse(await readFile(file, 'utf-8')) as SyncManifest
    } catch {
      // ignore
    }
  }
  return out
}

/**
 * 非交互 sync：无 clack 提示，不做任何 git commit/push（由 workflow 的 create-pull-request 负责）。
 * 返回退出码：0 成功（含无变化），2 同步失败或 --repo 未知名。
 */
export async function runSyncCi(options: {
  root: string
  repositories: Record<string, RepositoryConfig>
  repo?: string
  report?: string
}): Promise<number> {
  const { root, repositories, repo, report } = options
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
      before: await readKindManifests(root, name),
      after: {},
    })),
  )

  const service = new UpstreamService(root)
  try {
    await service.updateAll(targets)
    await service.syncAll(targets, false)
  } catch (error) {
    console.error(formatError(error))
    return 2
  }

  for (const snapshot of snapshots) {
    snapshot.after = await readKindManifests(root, snapshot.repo)
  }

  const md = buildSyncReport(snapshots)
  console.log(md)
  if (report) await writeFile(report, md, 'utf-8')
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, md)
  return 0
}
