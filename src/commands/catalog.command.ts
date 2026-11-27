import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { dependencies } from '../../dependencies'
import { repositories } from '../../meta'
import { packs } from '../../packs'
import { buildCatalog, serializeCatalog } from '../catalog'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

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

// 仅直接执行时跑 main（tsx src/commands/catalog.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
