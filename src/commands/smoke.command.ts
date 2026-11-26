import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

interface CatalogFile {
  skills: { name: string; internal: boolean }[]
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export async function runSmoke(smokeRoot: string = root): Promise<void> {
  const catalog = JSON.parse(await readFile(join(smokeRoot, '.build', 'catalog.json'), 'utf8')) as CatalogFile
  // 仓库根即用户安装面：skills.sh.json 把 ./content 声明为发现容器（深度 3 扫描直达
  // content/{repoKey}/{kind}/{name}）。命令为硬编码常量（无外部输入拼进）；整串传给 shell
  // 避免 Windows 下 pnpm.cmd 的 args+shell 弃用告警
  const result = spawnSync('pnpm exec skills add ./ --list', {
    cwd: smokeRoot,
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
  console.info(`ok: ${expected.length} skills discoverable from repo root`)
}

async function main(): Promise<void> {
  await runSmoke()
}

// 仅直接执行时跑 main（tsx src/commands/smoke.command.ts）；被 import 不触发
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
