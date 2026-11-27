import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { dependencies } from '../../dependencies'
import { repositories } from '../../meta'
import { packCategories, packs } from '../../packs'
import { buildCatalog } from '../catalog'
import { renderAgentsTable, renderPackCategory, renderSkillsTable, replaceBlocks } from '../services/readme.service'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** 每个 pack 恰好归属一个分类；否则 README 渲染结果不唯一，先拦在生成前 */
function validateCategoryCoverage(): void {
  const owner = new Map<string, string>()
  for (const category of packCategories) {
    for (const id of category.packs) {
      const prev = owner.get(id)
      if (prev !== undefined) throw new Error(`pack "${id}" belongs to multiple categories: ${prev}, ${category.id}`)
      owner.set(id, category.id)
    }
  }
  for (const id of Object.keys(packs)) {
    if (!owner.has(id)) throw new Error(`pack "${id}" is not listed in any packCategories entry`)
  }
}

async function main(): Promise<void> {
  const checkOnly = process.argv.includes('--check')
  validateCategoryCoverage()
  const catalog = await buildCatalog({ root, repositories, dependencies, packs, packCategories })
  const blocks = [
    ...packCategories.map((category) => ({
      name: `packs:${category.id}`,
      body: renderPackCategory(category, catalog),
    })),
    { name: 'skills', body: renderSkillsTable(catalog.skills) },
    { name: 'agents', body: renderAgentsTable(catalog.agents) },
  ]
  const readmePath = join(root, 'README.md')
  const current = await readFile(readmePath, 'utf8')
  const next = replaceBlocks(current, blocks)
  const summary = `${catalog.skills.length} skills · ${catalog.agents.length} agents · ${catalog.packs.length} packs`
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
