import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export interface FlatEntry {
  /** 相对仓库根的源路径，如 content/samber-golang/skills/golang-cli */
  src: string
  /** 扁平发布面相对路径，如 skills/golang-cli */
  dest: string
}

const PUBLISH_KINDS = ['skills', 'agents', 'rules', 'commands'] as const

export type PublishKind = (typeof PUBLISH_KINDS)[number]

/**
 * content/{repoKey}/{kind}/{name} → {kind}/{name} 扁平发布计划（纯读，不写盘）。
 * skill 目录整棵搬运（须含 SKILL.md）；agent/rule/command 取 kind 目录直属的 .md，
 * 文件名带扩展名进 dest（发布面规格 agents/<name>.md 等）。
 * 同名冲突由 check 的 A3/A4 排除，这里再出现即布局违约，直接抛错。
 */
export async function flattenContent(root: string): Promise<FlatEntry[]> {
  const contentRoot = join(root, 'content')
  let repoKeys: string[]
  try {
    repoKeys = (await readdir(contentRoot, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .toSorted()
  } catch {
    return [] // content/ 不存在
  }

  const plan: FlatEntry[] = []
  const byDest = new Map<string, string>()
  const claim = (dest: string, src: string): void => {
    const previous = byDest.get(dest)
    if (previous) throw new Error(`flatten conflict: ${dest} <- ${src} and ${previous}`)
    byDest.set(dest, src)
    plan.push({ src, dest })
  }

  for (const repoKey of repoKeys) {
    for (const kind of PUBLISH_KINDS) {
      const kindDir = join(contentRoot, repoKey, kind)
      let entries
      try {
        entries = await readdir(kindDir, { withFileTypes: true })
      } catch {
        continue // 该 repo 无此 kind
      }
      for (const entry of entries) {
        if (kind === 'skills') {
          if (!entry.isDirectory()) continue
          if (!existsSync(join(kindDir, entry.name, 'SKILL.md'))) continue
          claim(`skills/${entry.name}`, `content/${repoKey}/skills/${entry.name}`)
        } else {
          if (!entry.isFile() || !entry.name.endsWith('.md')) continue
          claim(`${kind}/${entry.name}`, `content/${repoKey}/${kind}/${entry.name}`)
        }
      }
    }
  }
  return plan
}
