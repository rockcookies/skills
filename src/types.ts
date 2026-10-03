export type SourceKind = 'skill' | 'agent' // 以后可加 command，不必重写流水线

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

export interface RepositoryTransforms {
  skills?: string[]
  agents?: string[]
}

export interface RepositoryConfig {
  url: string
  branch?: string
  tag?: string
  commit?: string
  transforms?: RepositoryTransforms
  skills?: SkillMapping[]
  agents?: AgentMapping[]
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
