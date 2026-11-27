import type { CheckInput } from './services/check.service'
import type { RepositoryConfig } from './types'

import { check } from './services/check.service'

export interface CatalogSkill {
  name: string
  description: string
  vendor: string
  /** 相对仓库根，如 content/samber-golang/skills/golang-how-to */
  path: string
  internal: boolean
  requires: { skills: string[]; agents: string[]; rules: string[] }
  /** 上游来源（meta.ts 的 url 与 pin）；手工技能（custom）为 undefined */
  source?: { repo: string; pin?: string }
}

export interface CatalogFileItem {
  name: string
  /** repoKey；手工条目为 custom */
  vendor: string
  /** 相对仓库根，如 content/impeccable/agents/impeccable-documenter.md */
  path: string
}

export interface CatalogAgent extends CatalogFileItem {
  description?: string
}

export interface CatalogPack {
  id: string
  /** 展示标题（SkillPack.title，缺省渲染端回落到 id） */
  title?: string
  description: string
  skills: string[]
}

export interface Catalog {
  schema: 1
  skills: CatalogSkill[]
  agents: CatalogAgent[]
  rules: CatalogFileItem[]
  commands: CatalogFileItem[]
  packs: CatalogPack[]
}

/** localeCompare 受运行环境影响（跨机器不定），catalog 要求跨环境字节一致，用码元序 */
function compareBy(
  field: 'name' | 'path',
): (a: Record<typeof field, string>, b: Record<typeof field, string>) => number {
  return (a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0)
}

function sourceOf(config: RepositoryConfig): { repo: string; pin?: string } {
  const pin = config.commit ?? config.tag ?? config.branch
  return pin ? { repo: config.url, pin } : { repo: config.url }
}

/** catalog JSON 的唯一序列化出口：catalog 入口与 site:build 共用，保证字节一致 */
export function serializeCatalog(catalog: Catalog): string {
  return JSON.stringify(catalog, null, 2) + '\n'
}

/** catalog 建立在零 error 的检查之上；有 error 直接抛（先跑 pnpm check 看报告） */
export async function buildCatalog(input: CheckInput): Promise<Catalog> {
  const r = await check(input)
  const errors = r.findings.filter((f) => f.severity === 'error')
  if (errors.length > 0) {
    throw new Error(`catalog: check has ${errors.length} error(s); run pnpm check`)
  }
  const vendorOf = (path: string): string => path.split('/')[1] ?? ''
  return {
    schema: 1,
    skills: r.skills
      .map((s) => {
        const dep = input.dependencies.skills[s.name]
        const repoConfig = s.vendor === 'custom' ? undefined : input.repositories[s.vendor]
        return {
          name: s.name,
          description: s.description,
          vendor: s.vendor,
          path: s.dir,
          internal: s.internal,
          requires: { skills: dep?.skills ?? [], agents: dep?.agents ?? [], rules: dep?.rules ?? [] },
          source: repoConfig ? sourceOf(repoConfig) : undefined,
        }
      })
      .toSorted(compareBy('name')),
    agents: r.agents
      .map((a) => ({ name: a.name, vendor: vendorOf(a.file), path: a.file, description: a.description }))
      .toSorted(compareBy('path')),
    rules: r.rules.map((a) => ({ name: a.name, vendor: vendorOf(a.file), path: a.file })).toSorted(compareBy('path')),
    commands: r.commands
      .map((a) => ({ name: a.name, vendor: vendorOf(a.file), path: a.file }))
      .toSorted(compareBy('path')),
    packs: Object.entries(input.packs).map(([id, pack]) => ({
      id,
      title: pack.title,
      description: pack.description ?? '',
      skills: pack.skills,
    })),
  }
}
