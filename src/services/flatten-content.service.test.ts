import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import { flattenContent } from './flatten-content.service'

const tempRoots: string[] = []

afterAll(async () => {
  await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })))
})

async function writeSkillDir(root: string, rel: string): Promise<void> {
  const dir = join(root, 'content', rel)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'SKILL.md'), 'x')
}

describe('flattenContent', () => {
  it('plans flat {kind}/{name} entries across repoKeys and custom', async () => {
    const root = await mkdtemp(join(tmpdir(), 'flatten-'))
    tempRoots.push(root)
    await writeSkillDir(root, join('alpha', 'skills', 'one'))
    await writeSkillDir(root, join('alpha', 'skills', 'one', 'references'))
    await writeFile(join(root, 'content', 'alpha', 'skills', 'one', 'references', 'a.md'), 'x')
    await writeSkillDir(root, join('custom', 'skills', 'two'))
    await mkdir(join(root, 'content', 'alpha', 'agents'), { recursive: true })
    await writeFile(join(root, 'content', 'alpha', 'agents', 'agent-one.md'), 'x')
    await mkdir(join(root, 'content', 'tw93-waza', 'rules'), { recursive: true })
    await writeFile(join(root, 'content', 'tw93-waza', 'rules', 'write.md'), 'x')
    // skill 目录缺 SKILL.md 不入计划；agents 下的非 .md 文件不入计划
    await mkdir(join(root, 'content', 'alpha', 'skills', 'broken'), { recursive: true })
    await writeFile(join(root, 'content', 'alpha', 'agents', 'notes.txt'), 'x')
    await writeFile(join(root, 'content', 'alpha', 'SYNC.json'), '{}')

    const plan = await flattenContent(root)

    expect(plan.map((e) => e.dest).toSorted()).toEqual(['agents/agent-one', 'rules/write', 'skills/one', 'skills/two'])
    expect(plan.find((e) => e.dest === 'skills/one')).toEqual({
      src: 'content/alpha/skills/one',
      dest: 'skills/one',
    })
  })

  it('returns [] when content/ does not exist', async () => {
    const root = await mkdtemp(join(tmpdir(), 'flatten-'))
    tempRoots.push(root)
    expect(await flattenContent(root)).toEqual([])
  })

  it('throws on same-dest conflicts', async () => {
    const root = await mkdtemp(join(tmpdir(), 'flatten-'))
    tempRoots.push(root)
    await mkdir(join(root, 'content', 'alpha', 'agents'), { recursive: true })
    await writeFile(join(root, 'content', 'alpha', 'agents', 'dup.md'), 'x')
    await mkdir(join(root, 'content', 'beta', 'agents'), { recursive: true })
    await writeFile(join(root, 'content', 'beta', 'agents', 'dup.md'), 'x')

    await expect(flattenContent(root)).rejects.toThrow(/flatten conflict: agents\/dup/)
  })
})
