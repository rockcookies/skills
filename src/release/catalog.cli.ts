import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { dependencies } from '../../dependencies'
import { repositories } from '../../meta'
import { packs } from '../../packs'
import { buildCatalog, serializeCatalog } from './catalog'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..')

async function main(): Promise<void> {
  const catalog = await buildCatalog({ root, repositories, dependencies, packs })
  const outDir = join(root, '.build')
  await mkdir(outDir, { recursive: true })
  const target = join(outDir, 'catalog.json')
  await writeFile(target, serializeCatalog(catalog))
  console.info(
    `catalog: ${catalog.skills.length} skills · ${catalog.agents.length} agents · ${catalog.rules.length} rules -> ${target}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
