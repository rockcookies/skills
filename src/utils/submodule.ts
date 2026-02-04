import type { VendorConfig } from '../types.ts'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export function getExistingSkillNames(root: string): string[] {
  const skillsDir = join(root, 'skills')
  if (!existsSync(skillsDir))
    return []

  return readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

export function getExpectedSkillNames(
  submodules: Record<string, string>,
  vendors: Record<string, VendorConfig>,
  manual: string[],
): Set<string> {
  const expected = new Set<string>()

  // Skills from submodules
  for (const name of Object.keys(submodules)) {
    expected.add(name)
  }

  // Skills from vendors
  for (const config of Object.values(vendors)) {
    const vendorConfig = config as VendorConfig
    for (const outputName of Object.values(vendorConfig.skills)) {
      expected.add(outputName)
    }
  }

  // Manual skills
  for (const name of manual) {
    expected.add(name)
  }

  return expected
}
