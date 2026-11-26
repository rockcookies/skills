import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import type { RepositoryConfig } from '../types'

import { repositories } from '../../meta'
import { UpstreamService } from '../services/upstream.service'

export interface UpstreamOptions {
  force?: boolean
}

/** 确保 upstream/ 里有 checkout 并钉到 pin。force 会删掉 checkout 再 clone。 */
export async function ensureUpstreamRepositories(
  root: string,
  repositories: Record<string, RepositoryConfig>,
  options: UpstreamOptions = {},
): Promise<void> {
  const upstreamService = new UpstreamService(root)

  console.info(
    options.force
      ? 'Force updating upstream repositories (delete and reclone)...'
      : 'Ensuring upstream repositories...',
  )
  if (options.force) await upstreamService.forceUpdateAll(repositories)
  else await upstreamService.updateAll(repositories)
  console.info('All upstream repositories ready')
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { force: { type: 'boolean' } } })
  await ensureUpstreamRepositories(root, repositories, { force: values.force === true })
}

// 仅直接执行时跑 main（tsx src/commands/upstream.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
