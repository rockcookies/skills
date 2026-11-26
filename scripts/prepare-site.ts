import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { listFilesRecursive } from '../src/utils/list-files'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'site', 'public')
const MAX_FILE_BYTES = 5 * 1024 * 1024

/** 站点公开输入守卫：单文件体积上限 + 疑似泄密文件名（.env / 私钥）一票拦截 */
async function guard(dir: string): Promise<void> {
  for (const f of await listFilesRecursive(dir)) {
    const size = (await stat(join(dir, f))).size
    if (size > MAX_FILE_BYTES) throw new Error(`site guard: ${f} is ${size} bytes`)
    if (/(^|\/)\.env(\.|$)/.test(f) || /(^|\/)(id_rsa|.*\.pem)$/.test(f))
      throw new Error(`site guard: suspicious file ${f}`)
  }
}

async function main(): Promise<void> {
  await rm(join(publicDir, 'agents'), { recursive: true, force: true })
  await rm(join(publicDir, 'rules'), { recursive: true, force: true })
  await mkdir(publicDir, { recursive: true })
  // catalog 喂前端；agents/rules 以发布面路径暴露在 Pages 域（下载 URL = base + agents|rules/…）。
  // SYNC.json 是内部同步账目，不发布
  await cp(join(root, '.build', 'catalog.json'), join(publicDir, 'catalog.json'))
  await cp(join(root, 'content', 'agents'), join(publicDir, 'agents'), {
    recursive: true,
    filter: (src) => basename(src) !== 'SYNC.json',
  })
  await cp(join(root, 'content', 'rules'), join(publicDir, 'rules'), {
    recursive: true,
    filter: (src) => basename(src) !== 'SYNC.json',
  })
  await guard(join(publicDir, 'agents'))
  await guard(join(publicDir, 'rules'))
  console.info('site inputs prepared -> site/public')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
