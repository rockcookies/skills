// command 类同步流水线未实现；依赖解析先支持，该类落地后引用自动生效
export type SourceKind = 'skill' | 'agent' | 'rule' | 'command'

/**
 * 单条依赖声明的引用：键为 SourceKind 的复数形式（skills/agents/rules/commands），
 * 数组元素是目标 dest 名
 */
export type Dependency = { [K in SourceKind as `${K}s`]?: string[] }

/**
 * 依赖声明总表：顶层按 SourceKind 分区（复数键 skills/agents/rules/commands），
 * 类内按 dest 名索引（名字唯一性只需类内成立；dependencies.ts 是数据源）
 */
export type Dependencies = { [K in SourceKind as `${K}s`]: Record<string, Dependency> }

/**
 * 单个技能映射配置
 */
export interface SkillMapping {
  /**
   * 源 SKILL.md 路径，相对于仓库根目录
   * - './skills/playwright-cli/SKILL.md'
   */
  source: string

  /**
   * 目标技能名称，输出到 content/{repoKey}/skills/{name}/SKILL.md
   */
  name: string

  /**
   * 只叠在 skill mapping 上的具名变换
   */
  transforms?: string[]
}

/**
 * 单个 agent 映射配置（Cursor plugin / ~/.cursor/agents 单文件 .md）
 */
export interface AgentMapping {
  /**
   * 源 agent .md 路径，相对于仓库根目录
   * - './thermos/agents/thermo-nuclear-review-subagent.md'
   */
  source: string

  /**
   * 目标 agent 名称，输出到 content/{repoKey}/agents/{name}.md
   */
  name: string

  /**
   * 只叠在 agent mapping 上的具名变换
   */
  transforms?: string[]
}

/**
 * 单个 rule 映射配置（rule 单文件 .md，正文原样拷贝，不注入 frontmatter）
 */
export interface RuleMapping {
  /**
   * 源 rule .md 路径，相对于仓库根目录
   * - './rules/anti-patterns.md'
   */
  source: string

  /**
   * 目标 rule 名称，输出到 content/{repoKey}/rules/{name}.md
   */
  name: string

  /**
   * 只叠在 rule mapping 上的具名变换
   */
  transforms?: string[]
}

/**
 * 单个 command 映射配置（command 单文件 .md，正文原样拷贝，不做变换）
 */
export interface CommandMapping {
  /**
   * 源 command .md 路径，相对于仓库根目录
   * - './commands/deploy.md'
   */
  source: string

  /**
   * 目标 command 名称，输出到 content/{repoKey}/commands/{name}.md
   */
  name: string
}

export interface RepositoryTransforms {
  skills?: string[]
  agents?: string[]
  rules?: string[]
}

export interface RepositoryConfig {
  url: string
  branch?: string
  tag?: string
  commit?: string
  transforms?: RepositoryTransforms
  skills?: SkillMapping[]
  agents?: AgentMapping[]
  rules?: RuleMapping[]
  commands?: CommandMapping[]
}

/**
 * 技能包（pack）：面向安装命令生成的策划分组，仅 skills。
 * 成员是显式清单（允许包间重叠），不展开依赖闭包；
 * 成员名必须能解析到映射产物或 skills/custom/ 技能（packs.ts 是数据源）
 */
export interface SkillPack {
  /** 展示标题；缺省用 pack id */
  title?: string
  /** 展示描述；缺省不渲染描述段 */
  description?: string
  skills: string[]
}

export type Packs = Record<string, SkillPack>

/** manifest item 的类 */
export type SyncManifestItemKind = 'skill' | 'agent' | 'rule' | 'command'

export interface SyncManifestItem {
  kind: SyncManifestItemKind
  name: string
  digest: string
}

/**
 * 每 repoKey 一份同步清单（content/{repoKey}/SYNC.json），items 跨类合并
 * （skill/agent/rule/command），按 name 升序
 */
export interface SyncManifest {
  upstream_committed_sha: string
  upstream_committed_at: string
  items_digest: string
  items_changed_at: string
  items: SyncManifestItem[]
}

/** manifest.json 单条内容清单（source 由所在 source 键隐含，不重复存） */
export interface ManifestItem {
  name: string
  digest: string
}

export type ManifestKind = 'skills' | 'agents' | 'rules' | 'commands'

export type ManifestItems = { [K in ManifestKind]: ManifestItem[] }

/**
 * manifest.json 的一个 source：上游同步 source 带 repo/pin 与四个同步字段；
 * custom（手工维护）只有四类内容清单，以有无 repo 字段区分
 */
export interface ManifestSource extends ManifestItems {
  /** 上游仓库 URL（meta.ts）；custom 无 */
  repo?: string
  /** pin（commit > tag > branch）；无 pin 的上游与 custom 均省略 */
  pin?: string
  upstream_committed_sha?: string
  upstream_committed_at?: string
  items_digest?: string
  items_changed_at?: string
}

/** 发布面根级 manifest.json：sources 键 = repoKey（码元序）+ custom；整个同步结构与内容清单 */
export interface PublishManifest {
  schema: 1
  sources: Record<string, ManifestSource>
}
