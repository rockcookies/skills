import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

interface CatalogFile {
  skills: { name: string; internal: boolean }[]
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function main(): Promise<void> {
  const catalog = JSON.parse(await readFile(join(root, '.build', 'catalog.json'), 'utf8')) as CatalogFile
  // 命令为硬编码常量（无外部输入拼进）；整串传给 shell 避免 Windows 下 pnpm.cmd 的 args+shell 弃用告警
  const result = spawnSync('pnpm exec skills add ./dist-release --list', {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    env: { ...process.env, DISABLE_TELEMETRY: '1', NO_COLOR: '1', CI: '1' },
  })
  const out = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  if (result.status !== 0) {
    console.error(out)
    throw new Error(`skills --list exited with ${result.status}`)
  }

  // --list 的输出格式不是稳定契约：CLI 升级后如误报，先看输出再调整匹配
  const expected = catalog.skills.filter((s) => !s.internal).map((s) => s.name)
  const missing = expected.filter((n) => !new RegExp(`(^|[^a-z0-9-])${escapeRegExp(n)}($|[^a-z0-9-])`).test(out))
  if (missing.length > 0) {
    console.error(out)
    console.error(`not discoverable: ${missing.join(', ')}`)
    process.exitCode = 1
    return
  }
  console.info(`ok: ${expected.length} skills discoverable in dist-release`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
