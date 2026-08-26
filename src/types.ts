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
   * 目标技能名称，输出到 skills/{repoKey}/{target}/SKILL.md
   */
  target: string

  /**
   * 额外的包含 glob（相对于技能目录），默认同步所有文件
   */
  includes?: string[]

  /**
   * 排除的 glob（优先级高于 includes）
   */
  excludes?: string[]
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
   * 目标 agent 名称，输出到 agents/{repoKey}/{target}.md
   */
  target: string
}

export interface RepositoryConfig {
  url: string
  branch?: string
  tag?: string
  commit?: string
  skills?: SkillMapping[]
  agents?: AgentMapping[]
}
