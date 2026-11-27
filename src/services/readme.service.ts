import type { Catalog, CatalogPack, CatalogSkill } from '../catalog'
import type { Dependency, PackCategory } from '../types'

import { resolveRequirements, skillsAddCommand } from './install-commands.service'

export interface ReadmeBlock {
  /** 标记名：对应 README 中 `<!-- {name}:start -->` / `<!-- {name}:end -->` */
  name: string
  body: string
}

/** 表格单元格转义：竖线会破列，换行会破行 */
const escapeCell = (text: string): string => text.replaceAll('|', '\\|').replaceAll('\r\n', ' ').replaceAll('\n', ' ')

/** pack 闭包里的 agents/rules 不随 `npx skills add` 安装，渲染提醒行 */
function copyNote(kind: 'agent' | 'rule', names: string[]): string {
  const listed = names.map((n) => `\`${n}\``).join(', ')
  return `Also copy the ${kind} files — not installed by \`npx skills add\` (see [Installation](#installation)): ${listed}.`
}

function packBody(pack: CatalogPack, deps: Record<string, Dependency>): string {
  const req = resolveRequirements(pack.skills, deps)
  const sections: string[] = [`#### ${pack.title ?? pack.id}`]
  if (pack.description) sections.push(pack.description)
  if (req.agents.length > 0) sections.push(copyNote('agent', req.agents))
  if (req.rules.length > 0) sections.push(copyNote('rule', req.rules))
  // 与 pnpm packs 输出同源：bash、全局安装（-g）
  sections.push(
    ['```bash', skillsAddCommand({ skills: pack.skills, scope: 'global', shell: 'bash' }), '```'].join('\n'),
  )
  return sections.join('\n\n')
}

/** 一个分类渲染为 `### 标题` + 简介 + 成员 pack 的 `####` 安装小节 */
export function renderPackCategory(category: PackCategory, catalog: Catalog): string {
  const deps: Record<string, Dependency> = Object.fromEntries(catalog.skills.map((s) => [s.name, s.requires]))
  const sections: string[] = [`### ${category.title}`]
  if (category.intro) sections.push(category.intro)
  for (const id of category.packs) {
    const pack = catalog.packs.find((p) => p.id === id)
    if (!pack) throw new Error(`pack category "${category.id}" references unknown pack "${id}"`)
    sections.push(packBody(pack, deps))
  }
  return sections.join('\n\n')
}

/** 全量技能扁平大表（排除 internal），vendor 列为 repoKey（custom = 手维护） */
export function renderSkillsTable(skills: CatalogSkill[]): string {
  const rows = skills
    .filter((s) => !s.internal)
    .map((s) => `| [${s.name}](${s.path}) | ${s.vendor} | ${escapeCell(s.description)} |`)
  return ['| Skill | Vendor | Description |', '| --- | --- | --- |', ...rows].join('\n')
}

/** 全量 agent 扁平大表；vendor 取路径的 repoKey 段 */
export function renderAgentsTable(agents: Catalog['agents']): string {
  const vendorOf = (path: string): string => path.split('/')[1] ?? ''
  const rows = agents.map(
    (a) => `| [${a.name}](${a.path}) | ${vendorOf(a.path)} | ${escapeCell(a.description ?? '')} |`,
  )
  return ['| Agent | Vendor | Description |', '| --- | --- | --- |', ...rows].join('\n')
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
