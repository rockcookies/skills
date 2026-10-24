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
   * 目标技能名称，输出到 skills/{repoKey}/{name}/SKILL.md
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
   * 目标 agent 名称，输出到 agents/{repoKey}/{name}.md
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
   * 目标 rule 名称，输出到 rules/{repoKey}/{name}.md
   */
  name: string

  /**
   * 只叠在 rule mapping 上的具名变换
   */
  transforms?: string[]
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
}

export interface SyncManifestItem {
  name: string
  digest: string
}

export interface SyncManifest {
  upstream_committed_sha: string
  upstream_committed_at: string
  items_digest: string
  items_changed_at: string
  items: SyncManifestItem[]
}
