import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { Dependencies, Packs, RepositoryConfig } from '../../../types'

import { digestFile, digestTree } from '../../../utils/digest'
import { listFilesRecursive } from '../../../utils/fs'

/** audit/catalog 测试共用的最小仓库形状：1 个映射上游（alpha）+ 1 个手工技能（two） */
export const fixtureRepositories: Record<string, RepositoryConfig> = {
  alpha: {
    url: 'https://example.com/alpha',
    tag: 'v1.0.0',
    skills: [{ source: './upstream/alpha/one/SKILL.md', name: 'one' }],
    agents: [{ source: './upstream/alpha/agent-one.md', name: 'agent-one' }],
    rules: [{ source: './upstream/alpha/rule-one.md', name: 'rule-one' }],
  },
}

export const fixtureDependencies: Dependencies = {
  skills: { one: { skills: ['two'] } },
  agents: {},
  rules: {},
  commands: {},
}

export const fixturePacks: Packs = {
  complete: { description: 'covers all fixture skills', skills: ['one', 'two'] },
}

/** relDir 形如 `{repoKey}/skills/{name}`，写入该目录的 SKILL.md */
export async function writeSkill(root: string, relDir: string, name: string, description: string): Promise<void> {
  const skillDir = join(root, 'content', relDir)
  await mkdir(skillDir, { recursive: true })
  await writeFile(join(skillDir, 'SKILL.md'), `---\nname: ${name}\ndescription: ${description}\n---\n\nbody\n`)
}

/** 干净 fixture：磁盘内容、content/alpha/SYNC.json 与 meta 声明全部自洽，audit 零 error */
export async function writeCleanFixture(root: string): Promise<void> {
  await writeSkill(root, join('alpha', 'skills', 'one'), 'one', 'Skill one')
  await writeSkill(root, join('custom', 'skills', 'two'), 'two', 'Skill two')
  await mkdir(join(root, 'content', 'alpha', 'agents'), { recursive: true })
  await writeFile(join(root, 'content', 'alpha', 'agents', 'agent-one.md'), 'agent body\n')
  await mkdir(join(root, 'content', 'alpha', 'rules'), { recursive: true })
  await writeFile(join(root, 'content', 'alpha', 'rules', 'rule-one.md'), 'rule body\n')

  const committedAt = '2026-01-01T00:00:00Z'
  const base = {
    upstream_committed_sha: 'a'.repeat(40),
    upstream_committed_at: committedAt,
    items_digest: 'sha256:not-recomputed-here',
    items_changed_at: committedAt,
  }
  const skillDir = join(root, 'content', 'alpha', 'skills', 'one')
  // items 跨类合并、按 name 升序：agent-one, one, rule-one
  await writeFile(
    join(root, 'content', 'alpha', 'SYNC.json'),
    JSON.stringify(
      {
        ...base,
        items: [
          {
            kind: 'agent',
            name: 'agent-one',
            digest: await digestFile(join(root, 'content', 'alpha', 'agents', 'agent-one.md')),
          },
          { kind: 'skill', name: 'one', digest: await digestTree(skillDir, await listFilesRecursive(skillDir)) },
          {
            kind: 'rule',
            name: 'rule-one',
            digest: await digestFile(join(root, 'content', 'alpha', 'rules', 'rule-one.md')),
          },
        ],
      },
      null,
      2,
    ) + '\n',
  )
}
