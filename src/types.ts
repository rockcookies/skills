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

/**
 * pack 的 README 分类（packs.ts 是数据源）：一个分类渲染为一级 `###` 标题 +
 * 简介 + 成员 pack 的 `####` 安装小节，产物落在 README 的 `<!-- packs:{id} -->` 标记区块
 */
export interface PackCategory {
  /** 标记后缀：`<!-- packs:{id}:start/end -->` */
  id: string
  /** `###` 级分类标题（展示字符串，可含上游链接与 pin） */
  title: string
  /** 分类简介段（标题与首个 pack 小节之间） */
  intro?: string
  /** 成员 pack id，按 README 渲染顺序；每个 pack 必须恰好归属一个分类 */
  packs: string[]
}

/** manifest item 的类；commands 管线未建，暂只有三类 */
export type SyncManifestItemKind = 'skill' | 'agent' | 'rule'

export interface SyncManifestItem {
  kind: SyncManifestItemKind
  name: string
  digest: string
}

/**
 * 每 repoKey 一份同步清单（content/{repoKey}/SYNC.json），items 跨类合并
 * （skill/agent/rule），按 name 升序
 */
export interface SyncManifest {
  upstream_committed_sha: string
  upstream_committed_at: string
  items_digest: string
  items_changed_at: string
  items: SyncManifestItem[]
}
