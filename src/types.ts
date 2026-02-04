export interface RepositoryConfig {
  url: string // Git repository URL
  branch?: string // Branch name (e.g., 'main', 'develop')
  tag?: string // Tag name (e.g., 'v1.0.0')
  commit?: string // Commit SHA
  skillsPath?: string // Relative path to skills directory in repository
  skills?: Record<string, string> // Skill mapping: source skill name -> output skill name
}
