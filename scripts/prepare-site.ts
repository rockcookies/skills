import { cp, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'site', 'public')

// catalog 给页面数据；agents/rules 走 Pages 域名下载，不依赖 raw.githubusercontent.com
await mkdir(publicDir, { recursive: true })
await cp(join(root, '.build', 'catalog.json'), join(publicDir, 'catalog.json'))
await cp(join(root, 'dist-release', 'agents'), join(publicDir, 'agents'), { recursive: true })
await cp(join(root, 'dist-release', 'rules'), join(publicDir, 'rules'), { recursive: true })
console.info('site/public ready: catalog.json, agents/, rules/')
