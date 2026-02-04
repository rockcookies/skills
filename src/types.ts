export interface RepositoryConfig {
  url: string // Git repository URL
  ref?: string // Git ref: branch name, tag, or commit SHA (optional)
  skillsPath: string // Relative path to skills directory in repository
  skills: Record<string, string> // Skill mapping: source skill name -> output skill name
}
