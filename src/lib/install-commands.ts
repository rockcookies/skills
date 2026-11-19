import type { Dependency } from '../types'

export type Shell = 'bash' | 'powershell' | 'cmd'

/** dest 技能名约束：小写字母数字连字符；audit 的 A2 与命令生成的白名单共用 */
export const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const DEFAULT_SOURCE = 'rockcookies/skills'

const SAFE_NAME = /^[a-z0-9][a-z0-9._-]*$/
const SAFE_FILE = /^(agents|rules)\/[\w.-]+\/[\w.-]+\.md$/

const SHELL_CONTINUATION: Record<Shell, string> = {
  bash: ' \\',
  powershell: ' `',
  cmd: ' ^',
}

const STAR: Record<Shell, string> = { bash: "'*'", powershell: "'*'", cmd: '"*"' }

const HOME: Record<Shell, (rel: string) => string> = {
  bash: (r) => `~/${r}`,
  powershell: (r) => `"$HOME/${r}"`,
  cmd: (r) => `"%USERPROFILE%\\${r.replaceAll('/', '\\')}"`,
}

function assertSafe(kind: string, value: string): void {
  if (!SAFE_NAME.test(value)) throw new Error(`unsafe ${kind}: ${JSON.stringify(value)}`)
}

export interface SkillsAddOptions {
  /** 显式技能名清单，或 '*' 安装全部 */
  skills: string[] | '*'
  /** global 写 -g；project 为 CLI 默认，不加 flag */
  scope: 'global' | 'project'
  /** skills CLI 的 -a 目标 agent（如 claude-code / cursor） */
  agents?: string[]
  yes?: boolean
  shell: Shell
  /** GitHub 简写源或本地路径；默认本仓库 */
  source?: string
}

/**
 * 生成多行 `npx skills add` 命令：短写法（实测发布布局无需 --full-depth，带上反而会把
 * 本地 upstream/ checkout 扫进发现集合），每个参数一行（2 空格缩进），续行符按 shell 取，
 * 行尾不留空格（PowerShell 反引号续行对行尾空格敏感）。
 * 所有进入命令行的名字都过白名单校验——命令会被用户复制进 shell
 */
export function skillsAddCommand(o: SkillsAddOptions): string {
  const cont = SHELL_CONTINUATION[o.shell]
  const lines = [`npx skills add ${o.source ?? DEFAULT_SOURCE}${cont}`]
  if (o.skills === '*') {
    lines.push(`  --skill ${STAR[o.shell]}${cont}`)
  } else {
    for (const s of o.skills) {
      assertSafe('skill', s)
      lines.push(`  --skill ${s}${cont}`)
    }
  }
  for (const a of o.agents ?? []) {
    assertSafe('agent', a)
    lines.push(`  -a ${a}${cont}`)
  }
  if (o.scope === 'global') lines.push('  -g')
  if (o.yes) lines.push('  -y')
  return lines.join('\n')
}

const sorted = (set: Set<string>) => [...set].toSorted()

/**
 * 传递闭包：选中技能还需要哪些 skill / agent / rule（只沿 skill→skill 依赖展开）。
 * missingSkills 是选中集合之外的硬依赖；deps 传 dependencies.ts 的 skills 分区
 */
export function resolveRequirements(
  selected: string[],
  deps: Record<string, Dependency>,
): { missingSkills: string[]; agents: string[]; rules: string[] } {
  const chosen = new Set(selected)
  const missingSkills = new Set<string>()
  const agents = new Set<string>()
  const rules = new Set<string>()
  const seen = new Set<string>()
  const stack = [...selected]
  while (stack.length > 0) {
    const name = stack.pop()!
    if (seen.has(name)) continue
    seen.add(name)
    const dep = deps[name]
    if (!dep) continue
    for (const a of dep.agents ?? []) agents.add(a)
    for (const r of dep.rules ?? []) rules.add(r)
    for (const s of dep.skills ?? []) {
      if (!chosen.has(s)) missingSkills.add(s)
      stack.push(s)
    }
  }
  return { missingSkills: sorted(missingSkills), agents: sorted(agents), rules: sorted(rules) }
}

export interface CopyOptions {
  shell: Shell
  /** 文件可下载的根 URL（不以 / 结尾），如 https://rockcookies.github.io/skills */
  baseUrl: string
  /** 相对用户目录，如 .cursor/agents */
  targetDir: string
}

/**
 * agents/rules 的下载命令：npx skills add 不会安装它们，需要单独复制到用户目录。
 * 文件路径来自 catalog（agents|rules/{vendor}/{name}.md），过白名单防路径逃逸
 */
export function fileCopyCommands(files: string[], o: CopyOptions): string {
  const h = HOME[o.shell]
  const lines: string[] = []
  if (o.shell === 'bash') lines.push(`mkdir -p ${h(o.targetDir)}`)
  else if (o.shell === 'powershell') lines.push(`New-Item -ItemType Directory -Force ${h(o.targetDir)} | Out-Null`)
  else lines.push(`if not exist ${h(o.targetDir)} mkdir ${h(o.targetDir)}`)

  for (const f of files) {
    if (!SAFE_FILE.test(f)) throw new Error(`unsafe file path: ${f}`)
    const url = `${o.baseUrl}/${f}`
    const dest = h(`${o.targetDir}/${f.split('/').pop()}`)
    lines.push(o.shell === 'powershell' ? `Invoke-WebRequest ${url} -OutFile ${dest}` : `curl -fsSL ${url} -o ${dest}`)
  }
  return lines.join('\n')
}
