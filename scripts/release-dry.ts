import { existsSync } from 'node:fs'
import { cp, readdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { simpleGit } from 'simple-git'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const OUT = join(root, 'dist-release')
const wt = process.env.RELEASE_WT ? resolve(process.env.RELEASE_WT) : resolve(root, '..', 'skills-release')

async function main(): Promise<void> {
  if (!existsSync(join(wt, '.git'))) {
    console.info(`worktree missing, adding (detached at main): ${wt}`)
    await simpleGit(root).raw(['worktree', 'add', '--detach', wt, 'main'])
  }

  // 镜像 dist-release 到 worktree：除 .git/.github 外清空再整体复制，模拟 rsync --delete
  for (const entry of await readdir(wt, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.github') continue
    await rm(join(wt, entry.name), { recursive: true, force: true })
  }
  for (const entry of await readdir(OUT, { withFileTypes: true })) {
    await cp(join(OUT, entry.name), join(wt, entry.name), { recursive: true })
  }

  const git = simpleGit({ baseDir: wt })
  console.log(await git.raw(['status', '--short']))
  const statLines = (await git.raw(['diff', '--stat'])).trimEnd().split('\n')
  console.info(statLines[statLines.length - 1] ?? '')
  console.info(`\npreview only — reset with: git -C ${wt} checkout -- . && git -C ${wt} clean -fd`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
