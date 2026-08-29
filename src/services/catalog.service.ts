import { execFile } from 'node:child_process'
import { readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { promisify } from 'node:util'

import type { Catalog, CatalogItem } from '../types'

import { digestFile, digestTree } from '../utils/digest'
import { pathExists } from '../utils/fs'
import { listFilesRecursive } from '../utils/list-files'

const execFileAsync = promisify(execFile)
const CATALOG_REL = 'catalog.json'

export interface CatalogDiff {
  added: string[]
  removed: string[]
  changed: string[]
  unchanged: number
}

/**
 * 扫描 dest 生成 catalog.json。name 用目录名 / agent 文件名，同 kind 不可重复。
 * 含 skills/custom；不索引 SYNC.json。
 */
export class CatalogService {
  constructor(private root: string) {}

  async build(): Promise<Catalog> {
    const items = [...(await this.collectSkills()), ...(await this.collectAgents())].toSorted(
      (a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name),
    )
    this.assertUnique(items)
    return { generated: new Date().toISOString(), items }
  }

  async write(catalog: Catalog): Promise<string> {
    const path = join(this.root, CATALOG_REL)
    await writeFile(path, `${JSON.stringify(catalog, null, 2)}\n`)
    return path
  }

  /** 读 HEAD 上的 catalog.json；仓库里还没有则当空。 */
  async loadPrevious(): Promise<Catalog | null> {
    try {
      const { stdout } = await execFileAsync('git', ['show', `HEAD:${CATALOG_REL}`], {
        cwd: this.root,
        encoding: 'utf8',
      })
      return JSON.parse(stdout) as Catalog
    } catch {
      return null
    }
  }

  diff(current: Catalog, previous: Catalog | null): CatalogDiff {
    const currMap = new Map(current.items.map((item) => [itemKey(item), item]))
    const prevMap = new Map((previous?.items ?? []).map((item) => [itemKey(item), item]))
    const added = [...currMap.keys()].filter((key) => !prevMap.has(key)).toSorted()
    const removed = [...prevMap.keys()].filter((key) => !currMap.has(key)).toSorted()
    const changed = [...currMap.keys()]
      .filter((key) => prevMap.has(key) && prevMap.get(key)!.digest !== currMap.get(key)!.digest)
      .toSorted()
    const unchanged = [...currMap.keys()].filter(
      (key) => prevMap.has(key) && prevMap.get(key)!.digest === currMap.get(key)!.digest,
    ).length
    return { added, removed, changed, unchanged }
  }

  private assertUnique(items: CatalogItem[]): void {
    const seen = new Map<string, CatalogItem>()
    for (const item of items) {
      const key = itemKey(item)
      const existing = seen.get(key)
      if (existing) {
        throw new Error(`Duplicate catalog ${item.kind} name "${item.name}"`)
      }
      seen.set(key, item)
    }
  }

  private async collectSkills(): Promise<CatalogItem[]> {
    const skillsRoot = join(this.root, 'skills')
    if (!(await pathExists(skillsRoot))) return []
    const items: CatalogItem[] = []
    for (const repoKey of await dirNames(skillsRoot)) {
      const repoDir = join(skillsRoot, repoKey)
      for (const target of await dirNames(repoDir)) {
        const skillDir = join(repoDir, target)
        if (!(await pathExists(join(skillDir, 'SKILL.md')))) continue
        const files = await listFilesRecursive(skillDir)
        items.push({ kind: 'skill', name: target, digest: await digestTree(skillDir, files) })
      }
    }
    return items
  }

  private async collectAgents(): Promise<CatalogItem[]> {
    const agentsRoot = join(this.root, 'agents')
    if (!(await pathExists(agentsRoot))) return []
    const items: CatalogItem[] = []
    for (const repoKey of await dirNames(agentsRoot)) {
      const repoDir = join(agentsRoot, repoKey)
      const entries = await readdir(repoDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile() || entry.name === 'SYNC.json' || !entry.name.endsWith('.md')) continue
        const name = basename(entry.name, '.md')
        items.push({ kind: 'agent', name, digest: await digestFile(join(repoDir, entry.name)) })
      }
    }
    return items
  }
}

export function itemKey(item: CatalogItem): string {
  return `${item.kind}:${item.name}`
}

async function dirNames(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}
