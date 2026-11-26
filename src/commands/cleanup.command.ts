import { existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import type { RepositoryConfig } from '../types'

import { repositories } from '../../meta'
import { resolveUpstreamDir } from '../services/upstream.service'

/** 只删 meta.ts 里已经没有的 upstream/ 目录（不动 content/ 产物）；默认只列清单，force 才删除 */
export function cleanupUpstreamRepositories(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  force: boolean = false,
): void {
  const upstreamDir = resolveUpstreamDir(root)

  if (!existsSync(upstreamDir)) {
    console.info('No upstream directory found')
    return
  }

  const configuredRepos = new Set(Object.keys(repositories))
  const existingDirs = readdirSync(upstreamDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

  const toRemove = existingDirs.filter((dir) => !configuredRepos.has(dir))

  if (toRemove.length === 0) {
    console.info('No orphaned repositories found')
    return
  }

  console.info(`Found ${toRemove.length} orphaned repositories:`)
  for (const dir of toRemove) console.info(`  - ${dir}`)

  if (!force) {
    console.info('Dry run — re-run with --force to remove them')
    return
  }

  for (const dir of toRemove) rmSync(join(upstreamDir, dir), { recursive: true, force: true })
  console.info(`Removed ${toRemove.length} orphaned repositories`)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { force: { type: 'boolean' } } })
  cleanupUpstreamRepositories(root, repositories, values.force === true)
}

// 仅直接执行时跑 main（tsx src/commands/cleanup.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
