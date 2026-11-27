import { cp, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { repositories } from '../../meta'
import { packs } from '../../packs'
import { skillsAddCommand } from '../services/install-commands.service'
import { materializePublishTree } from '../services/publish-tree.service'
import { listFilesRecursive } from '../utils/fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
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

/** 生成的发布面 README：安装命令、packs、目录说明；bash 形态，指回 main 源仓 */
function renderPublishReadme(packList: { id: string; description: string; skills: string[] }[]): string {
  const lines: string[] = [
    '# rockcookies/skills',
    '',
    'Curated agent skills, agents, and rules synced from upstream repositories.',
    'Generated from the [`main` branch](https://github.com/rockcookies/skills) — do not edit by hand.',
    '',
    '## Install',
    '',
    '```bash',
    skillsAddCommand({ skills: '*', scope: 'global', shell: 'bash' }),
    '```',
    '',
  ]
  if (packList.length > 0) {
    lines.push('## Packs', '')
    for (const pack of packList) {
      lines.push(
        `### ${pack.id}`,
        '',
        pack.description,
        '',
        '```bash',
        skillsAddCommand({ skills: pack.skills, scope: 'global', shell: 'bash' }),
        '```',
        '',
      )
    }
  }
  lines.push(
    '## Layout',
    '',
    '- `skills/` — skill bundles (installable via `npx skills add`)',
    '- `agents/` — Cursor single-file subagents (copy to `~/.cursor/agents`)',
    '- `rules/` — rule files (copy to `~/.cursor/rules`)',
    '- `catalog.json` — machine-readable index',
    '- `manifest.json` — per-source upstream sync info + content lists (custom sources carry no sync fields)',
    '',
  )
  return lines.join('\n')
}

/**
 * 组装 Pages 发布面输入 site/public/：content/ 扁平为 {skills,agents,rules,commands}/{name}，
 * 外加 catalog.json、根级 manifest.json 与生成的 README.md。site/public 整体生成
 * （git 未跟踪），每次全量重建。vite 会把 public/ 原样带进 dist/
 */
async function main(): Promise<void> {
  const { entries } = await materializePublishTree(root, publicDir, repositories)

  // catalog 喂前端；扁平 {kind}/{name} 即发布面路径（下载 URL = base + agents|rules/…）。
  // SYNC.json 是内部同步账目，不逐份发布，合并成根级 manifest.json
  await cp(join(root, '.build', 'catalog.json'), join(publicDir, 'catalog.json'))
  await writeFile(
    join(publicDir, 'README.md'),
    renderPublishReadme(Object.entries(packs).map(([id, p]) => ({ id, ...p }))),
  )

  await guard(publicDir)
  console.info(`site inputs prepared -> site/public (${entries} flattened entries)`)
}

// 仅直接执行时跑 main（tsx src/commands/prepare-site.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
