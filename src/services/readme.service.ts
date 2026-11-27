import type { Catalog, CatalogSkill } from '../catalog'

export interface ReadmeBlock {
  /** 标记名：对应 README 中 `<!-- {name}:start -->` / `<!-- {name}:end -->` */
  name: string
  body: string
}

/** 表格单元格转义：竖线会破列，换行会破行 */
const escapeCell = (text: string): string => text.replaceAll('|', '\\|').replaceAll('\r\n', ' ').replaceAll('\n', ' ')

export type ReadmeKind = 'skills' | 'agents' | 'rules' | 'commands'

const KIND_SINGULAR: Record<ReadmeKind, string> = {
  skills: 'Skill',
  agents: 'Agent',
  rules: 'Rule',
  commands: 'Command',
}

/** 扁平发布面里的文件形态：skill 是目录，其余是 .md */
const KIND_EXT: Record<ReadmeKind, string> = { skills: '', agents: '.md', rules: '.md', commands: '.md' }

export interface ReadmeEntry {
  name: string
  /** repoKey；手工条目为 custom */
  vendor: string
  description?: string
}

/**
 * 一个 kind 的表：custom 只有名称与描述两列；synced 加 Upstream 列（= repoKey，
 * 与 manifest.json 的 sources 键一致）。链接指向扁平发布面路径（main 上的真实位置）。
 * 空集合渲染占位行，标记区块保持就位
 */
export function renderKindTable(kind: ReadmeKind, entries: ReadmeEntry[], synced: boolean): string {
  if (entries.length === 0) return '*(none)*'
  const label = KIND_SINGULAR[kind]
  const link = (e: ReadmeEntry): string => `[${e.name}](${kind}/${e.name}${KIND_EXT[kind]})`
  const rows = entries.map((e) =>
    synced
      ? `| ${link(e)} | ${e.vendor} | ${escapeCell(e.description ?? '')} |`
      : `| ${link(e)} | ${escapeCell(e.description ?? '')} |`,
  )
  const header = synced ? `| ${label} | Upstream | Description |` : `| ${label} | Description |`
  const separator = synced ? '| --- | --- | --- |' : '| --- | --- |'
  return [header, separator, ...rows].join('\n')
}

/**
 * 用生成内容替换 README 的标记区块。缺标记直接抛——标记缺失意味着
 * 手写漂移已经发生，不允许静默跳过
 */
export function replaceBlocks(md: string, blocks: ReadmeBlock[]): string {
  let out = md
  for (const block of blocks) {
    const re = new RegExp(`<!-- ${block.name}:start -->\\n[\\s\\S]*?<!-- ${block.name}:end -->`)
    if (!re.test(out)) throw new Error(`README missing block markers: ${block.name}:start/end`)
    out = out.replace(re, `<!-- ${block.name}:start -->\n${block.body}\n<!-- ${block.name}:end -->`)
  }
  return out
}

/** README 生成区块消费的 catalog 子集（skills 剔除 internal，文件类带描述） */
export function catalogEntries(kind: ReadmeKind, catalog: Catalog): { synced: ReadmeEntry[]; custom: ReadmeEntry[] } {
  const entries = catalog[kind]
    .filter((e) => kind !== 'skills' || !(e as CatalogSkill).internal)
    .map((e) => ({
      name: e.name,
      vendor: e.vendor,
      description: 'description' in e ? e.description : undefined,
    }))
  return {
    custom: entries.filter((e) => e.vendor === 'custom'),
    synced: entries.filter((e) => e.vendor !== 'custom'),
  }
}
