/**
 * 单个技能映射配置
 */
export interface SkillMapping {
  /**
   * 源路径，相对于仓库的 skillsPath
   * - 空字符串 '' 表示整个 skillsPath 目录
   * - 'skill-name' 表示单个技能目录
   * - 'path/to/skill' 支持嵌套路径
   */
  source: string

  /**
   * 目标路径，相对于本地 skills/ 目录
   * - 'skill-name' 输出到 skills/skill-name/
   * - 'category/skill' 支持嵌套输出
   */
  target: string

  /**
   * 可选的 glob 模式，用于过滤要同步的文件
   * 示例：
   * - '**\/*.md' 只同步 .md 文件
   * - 'src\/**\/*.ts' 只同步 src 目录下的 .ts 文件
   * - '*.{md,txt}' 同步多个扩展名
   */
  glob?: string
}

/**
 * 向后兼容：旧的 Record 格式
 */
export type LegacySkillsMapping = Record<string, string>

/**
 * 支持新旧两种格式的联合类型
 */
export type SkillsConfig = SkillMapping[] | LegacySkillsMapping

export interface RepositoryConfig {
  url: string // Git repository URL
  branch?: string // Branch name (e.g., 'main', 'develop')
  tag?: string // Tag name (e.g., 'v1.0.0')
  commit?: string // Commit SHA
  skillsPath?: string // Relative path to skills directory in repository
  skills?: SkillsConfig // Skill mapping: supports both array and legacy Record format
}
