import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { dependencies } from '../../dependencies'
import { repositories } from '../../meta'
import { packs } from '../../packs'
import { releaseConfig } from '../../release.config'
import { skillsAddCommand } from '../lib/install-commands'
import { treeDigest } from '../utils/digest'
import { listFilesRecursive } from '../utils/list-files'
import { buildCatalog, serializeCatalog, type Catalog } from './catalog'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..')
const OUT = join(root, 'dist-release')

/** 发布守卫：单文件体积上限 + 疑似泄密文件名（.env / 私钥）一票拦截 */
async function guard(): Promise<void> {
  for (const f of await listFilesRecursive(OUT)) {
    const size = (await stat(join(OUT, f))).size
    if (size > releaseConfig.maxFileBytes) throw new Error(`release guard: ${f} is ${size} bytes`)
    if (/(^|\/)\.env(\.|$)/.test(f) || /(^|\/)(id_rsa|.*\.pem)$/.test(f))
      throw new Error(`release guard: suspicious file ${f}`)
  }
}

export async function renderReadme(catalog: Catalog): Promise<string> {
  const tpl = await readFile(join(root, 'release', 'README.template.md'), 'utf8')
  const packsMd = catalog.packs
    .map((p) => {
      const cmd = skillsAddCommand({ skills: p.skills, scope: 'global', shell: 'bash' })
      return `### ${p.id}\n\n${p.description}\n\n\`\`\`bash\n${cmd}\n\`\`\``
    })
    .join('\n\n')
  return tpl
    .replace(
      '{{COUNTS}}',
      `${catalog.skills.length} skills · ${catalog.agents.length} agents · ${catalog.rules.length} rules`,
    )
    .replace('{{INSTALL_ALL}}', skillsAddCommand({ skills: '*', scope: 'global', shell: 'bash' }))
    .replace('{{PACKS}}', packsMd)
}

async function main(): Promise<void> {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  for (const dir of releaseConfig.include) {
    await cp(join(root, dir), join(OUT, dir), {
      recursive: true,
      filter: (src) => !releaseConfig.junk.includes(basename(src)),
    })
  }
  for (const file of releaseConfig.rootFiles) {
    await cp(join(root, file), join(OUT, file)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error // LICENSE 等可缺省
    })
  }

  await guard()
  // contentDigest 只覆盖发布内容本身（skills/agents/rules/LICENSE），必须在写生成文件之前算
  const contentDigest = treeDigest(
    await Promise.all(
      (await listFilesRecursive(OUT)).map(async (rel) => ({ path: rel, content: await readFile(join(OUT, rel)) })),
    ),
  )

  const catalog = await buildCatalog({ root, repositories, dependencies, packs })
  await writeFile(join(OUT, 'README.md'), await renderReadme(catalog))
  // smoke:release 读 .build/catalog.json 对期望集；build:release 自落一份，CI 无需先跑 build:catalog
  await mkdir(join(root, '.build'), { recursive: true })
  await writeFile(join(root, '.build', 'catalog.json'), serializeCatalog(catalog))

  // pins 只含 meta.ts 显式声明的 pin；不放时间戳与 dev SHA——发布 commit 内容必须确定性
  const pins: Record<string, string> = {}
  for (const [repoKey, config] of Object.entries(repositories)) {
    const pin = config.commit ?? config.tag ?? config.branch
    if (pin) pins[repoKey] = pin
  }
  await writeFile(
    join(OUT, 'RELEASE.json'),
    JSON.stringify(
      {
        schema: 1,
        contentDigest,
        counts: { skills: catalog.skills.length, agents: catalog.agents.length, rules: catalog.rules.length },
        pins,
      },
      null,
      2,
    ) + '\n',
  )
  console.info(`release built: ${catalog.skills.length} skills -> ${OUT}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
