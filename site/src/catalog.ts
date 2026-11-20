export interface CatalogSkill {
  name: string
  description: string
  vendor: string
  path: string
  internal: boolean
  requires: { skills: string[]; agents: string[]; rules: string[] }
  source?: { repo: string; pin?: string }
}

export interface Catalog {
  schema: 1
  skills: CatalogSkill[]
  agents: { name: string; path: string }[]
  rules: { name: string; path: string }[]
  packs: { id: string; description: string; skills: string[] }[]
}

/** resolveRequirements 的输入形状（与仓库 dependencies.ts 的 Dependency 同形） */
export interface SkillDependency {
  skills?: string[]
  agents?: string[]
  rules?: string[]
}

export async function fetchCatalog(): Promise<Catalog> {
  const res = await fetch(`${import.meta.env.BASE_URL}catalog.json`)
  if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`)
  return (await res.json()) as Catalog
}

export function dependencyMap(catalog: Catalog): Record<string, SkillDependency> {
  return Object.fromEntries(catalog.skills.map((skill) => [skill.name, skill.requires]))
}
