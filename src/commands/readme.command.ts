import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { dependencies } from '../../dependencies'
import { repositories } from '../../meta'
import { packs } from '../../packs'
import { buildCatalog } from '../catalog'
import { catalogEntries, renderKindTable, replaceBlocks, type ReadmeKind } from '../services/readme.service'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const KINDS: ReadmeKind[] = ['skills', 'agents', 'rules', 'commands']

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check')
  const catalog = await buildCatalog({ root, repositories, dependencies, packs })
  const blocks = KINDS.flatMap((kind) => {
    const { custom, synced } = catalogEntries(kind, catalog)
    return [
      { name: `${kind}:custom`, body: renderKindTable(kind, custom, false) },
      { name: `${kind}:synced`, body: renderKindTable(kind, synced, true) },
    ]
  })
  const readmePath = join(root, 'README.md')
  const current = await readFile(readmePath, 'utf8')
  const next = replaceBlocks(current, blocks)
  const summary = `${catalog.skills.length} skills · ${catalog.agents.length} agents · ${catalog.rules.length} rules · ${catalog.commands.length} commands`
  if (checkOnly) {
    if (next !== current) {
      console.error('readme: generated blocks are stale; run `pnpm readme`')
      process.exitCode = 1
      return
    }
    console.info(`readme: generated blocks up to date (${summary})`)
    return
  }
  await writeFile(readmePath, next)
  console.info(`readme: regenerated ${blocks.length} blocks (${summary})`)
}

// 仅直接执行时跑 main（tsx src/commands/readme.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
