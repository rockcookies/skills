import type { Project, VendorConfig } from '../types.ts'

export function buildProjects(
  submodules: Record<string, string>,
  vendors: Record<string, VendorConfig>,
): Project[] {
  const projects: Project[] = []

  // Source submodules
  for (const [name, url] of Object.entries(submodules)) {
    projects.push({
      name,
      url,
      type: 'source',
      path: `sources/${name}`,
    })
  }

  // Vendor submodules
  for (const [name, config] of Object.entries(vendors)) {
    projects.push({
      name,
      url: config.source,
      type: 'vendor',
      path: `vendor/${name}`,
    })
  }

  return projects
}
