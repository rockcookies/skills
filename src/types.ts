export type CatalogKind = 'skill' | 'agent' // 以后可加 command，不必重写流水线

export interface FrontmatterOps {
  /** 写入或覆盖 YAML 字段 */
  set?: Record<string, unknown>
  /** 先删这些键，再应用 set */
  delete?: string[]
}

export interface BodyReplace {
  find: string
  replace: string
}

/** 变换层叠：transforms 按名引用 registry；frontmatter 只 set/delete；replace 是正文精确子串。 */
export interface TransformConfig {
  transforms?: string[]
  frontmatter?: FrontmatterOps
  replace?: BodyReplace[]
}

/**
 * 单个技能映射配置
 */
export interface SkillMapping extends TransformConfig {
  /**
   * 源 SKILL.md 路径，相对于仓库根目录
   * - './skills/playwright-cli/SKILL.md'
   */
  source: string

  /**
   * 目标技能名称，输出到 skills/{repoKey}/{target}/SKILL.md
   */
  target: string

  /**
   * 包含 glob（相对于技能目录）。省略或空则默认同步所有文件；
   * 非空时整表替换默认 glob，不与默认合并。
   */
  includes?: string[]

  /**
   * 排除的 glob（优先级高于 includes），与 repo 级 excludes 取并集
   */
  excludes?: string[]
}

/**
 * 单个 agent 映射配置（Cursor plugin / ~/.cursor/agents 单文件 .md）
 */
export interface AgentMapping extends TransformConfig {
  /**
   * 源 agent .md 路径，相对于仓库根目录
   * - './thermos/agents/thermo-nuclear-review-subagent.md'
   */
  source: string

  /**
   * 目标 agent 名称，输出到 agents/{repoKey}/{target}.md
   */
  target: string
}

export interface RepositoryConfig extends TransformConfig {
  url: string
  branch?: string
  tag?: string
  commit?: string
  /**
   * 该仓库所有 skill mapping 的默认排除 glob，与各 mapping.excludes 取并集
   */
  excludes?: string[]
  /** 只叠在 skill mapping 上的具名变换 */
  skillTransforms?: string[]
  /** 只叠在 agent mapping 上的具名变换 */
  agentTransforms?: string[]
  skills?: SkillMapping[]
  agents?: AgentMapping[]
}

export interface SyncItemRecord {
  sourceDigest: string
  transformId: string
}

export interface SyncInfo {
  /** 上游 HEAD，给人看；跳过不靠这一项 */
  sha: string
  synced: string
  /** 按 target 记录源 digest 与变换身份 */
  items?: Record<string, SyncItemRecord>
}

export interface CatalogItem {
  kind: CatalogKind
  /** dest 目录名或 agent 文件名（不含 .md） */
  name: string
  digest: string
}

export interface Catalog {
  generated: string
  items: CatalogItem[]
}
