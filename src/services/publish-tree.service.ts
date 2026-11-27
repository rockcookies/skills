import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import type {
  ManifestItem,
  ManifestKind,
  ManifestSource,
  PublishManifest,
  RepositoryConfig,
  SyncManifest,
} from '../types'

import { digestFile, digestTree } from '../utils/digest'
import { listFilesRecursive } from '../utils/fs'
import { flattenContent } from './flatten-content.service'

export const MANIFEST_FILE = 'manifest.json'

/** 随发布面进 main 的 dev 文档/工作流（从源根原样拷贝） */
export const FACE_DOC_PATHS = ['README.md', 'LICENSE', '.github/workflows/deploy.yml'] as const

/**
 * 发布面物化管线：dev 的 content/{repoKey}/{kind}/{name} → 扁平 {kind}/{name} +
 * 根级 manifest.json。release（main 快照树）、prepare-site（Pages 面输入）与
 * release:tree（本地/CI 复核）共用这一份实现，保证三处字节一致。
 */

async function readSyncManifest(dir: string): Promise<SyncManifest | null> {
  try {
    return JSON.parse(await readFile(join(dir, 'SYNC.json'), 'utf8')) as SyncManifest
  } catch {
    return null // 无清单（custom / 首次同步前）：source 只有内容清单
  }
}

/** pin 优先级与 meta.ts 一致：commit > tag > branch */
function pinOf(config: RepositoryConfig): string | undefined {
  return config.commit ?? config.tag ?? config.branch
}

const byName = (a: ManifestItem, b: ManifestItem): number => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)

/**
 * 组装发布面 manifest.json（纯读不写盘）：内容清单从发布计划现算（与实际发布的
 * 文件一一对应，custom 同样覆盖）；上游同步信息取自各 repo 的 SYNC.json + meta.ts。
 * sources 键码元序，custom 与各 repoKey 混排。
 */
export async function buildPublishManifest(
  root: string,
  repositories: Record<string, RepositoryConfig>,
): Promise<PublishManifest> {
  const plan = await flattenContent(root)
  const sources = new Map<string, ManifestSource>()
  const sourceOf = (repoKey: string): ManifestSource => {
    let source = sources.get(repoKey)
    if (!source) {
      source = { skills: [], agents: [], rules: [], commands: [] }
      sources.set(repoKey, source)
    }
    return source
  }

  for (const entry of plan) {
    const [, repoKey, kind] = entry.src.split('/') as [string, string, ManifestKind]
    const abs = join(root, entry.src)
    const digest = kind === 'skills' ? await digestTree(abs, await listFilesRecursive(abs)) : await digestFile(abs)
    const base = entry.src.split('/').pop()!
    sourceOf(repoKey)[kind].push({ name: kind === 'skills' ? base : base.replace(/\.md$/, ''), digest })
  }

  for (const [repoKey, source] of sources) {
    for (const kind of ['skills', 'agents', 'rules', 'commands'] as const) {
      source[kind].sort(byName)
    }
    if (repoKey === 'custom') continue // 手工维护：无上游同步字段
    const config = repositories[repoKey]
    if (!config) throw new Error(`manifest: repoKey "${repoKey}" has no entry in meta.ts`)
    const sync = await readSyncManifest(join(root, 'content', repoKey))
    if (!sync) continue
    source.repo = config.url
    const pin = pinOf(config)
    if (pin) source.pin = pin
    source.upstream_committed_sha = sync.upstream_committed_sha
    source.upstream_committed_at = sync.upstream_committed_at
    source.items_digest = sync.items_digest
    source.items_changed_at = sync.items_changed_at
  }

  return { schema: 1, sources: Object.fromEntries([...sources.keys()].toSorted().map((k) => [k, sources.get(k)!])) }
}

export interface MaterializeResult {
  /** 扁平条目数 */
  entries: number
  manifest: PublishManifest
}

export interface MaterializeOptions {
  /**
   * 是否随物化拷入发布面文档（FACE_DOC_PATHS）。main 发布面与 deploy.yml 的复核面
   * 都含这三份（release 与 release:tree 传 true）；Pages 面（prepare-site）不含——
   * 它有自己的 README 生成器，也不需要 deploy.yml
   */
  docs?: boolean
}

/** 物化发布树到 out（整体重建）：扁平 {kind}/{name} + manifest.json；空的 kind 不建目录 */
export async function materializePublishTree(
  root: string,
  out: string,
  repositories: Record<string, RepositoryConfig>,
  options: MaterializeOptions = {},
): Promise<MaterializeResult> {
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })
  const plan = await flattenContent(root)
  for (const entry of plan) {
    const destAbs = join(out, entry.dest)
    await mkdir(dirname(destAbs), { recursive: true })
    await cp(join(root, entry.src), destAbs, { recursive: true })
  }
  if (options.docs) {
    for (const doc of FACE_DOC_PATHS) {
      const dest = join(out, doc)
      await mkdir(dirname(dest), { recursive: true })
      await copyFile(join(root, doc), dest)
    }
  }
  const manifest = await buildPublishManifest(root, repositories)
  await writeFile(join(out, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`)
  return { entries: plan.length, manifest }
}
