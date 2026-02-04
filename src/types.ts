export interface Project {
  name: string
  url: string
  type: 'source' | 'vendor'
  path: string
}

export interface VendorConfig {
  source: string
  skills: Record<string, string> // sourceSkillName -> outputSkillName
}
