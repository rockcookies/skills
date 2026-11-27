import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { repositories } from '../../meta'
import { materializePublishTree } from '../services/publish-tree.service'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * 物化发布面：content/ 扁平为 {skills,agents,rules,commands}/{name} + 根级 manifest.json
 * + 发布面文档（README/LICENSE/deploy.yml），与 release 构造的 main 树同构。
 * deploy.yml 的一致性校验与本地复核共用；`--out <dir>` 必填
 */
async function main(): Promise<void> {
  const { values } = parseArgs({ options: { out: { type: 'string' } } })
  if (!values.out) {
    console.error('usage: pnpm release:tree --out <dir>')
    process.exitCode = 1
    return
  }
  const out = resolve(values.out)
  const { entries, manifest } = await materializePublishTree(root, out, repositories, { docs: true })
  console.info(`publish tree: ${entries} flat entries · ${Object.keys(manifest.sources).length} sources -> ${out}`)
}

// 仅直接执行时跑 main（tsx src/commands/publish-tree.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
