import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

import type { Dependencies, RepositoryConfig } from '../types'

import { buildItemIndex } from './dependencies.service'
import {
  combinePackSkills,
  formatInstallCommand,
  listCustomSkillNames,
  resolvePackGaps,
  validatePackMembers,
  REPO_SLUG,
} from './packs.service'

const repositories: Record<string, RepositoryConfig> = {
  alpha: {
    url: 'https://example.com/alpha',
    skills: [
      { name: 'mapped-a', source: './skills/mapped-a/SKILL.md' },
      { name: 'mapped-b', source: './skills/mapped-b/SKILL.md' },
    ],
  },
  beta: {
    url: 'https://example.com/beta',
    skills: [{ name: 'mapped-a', source: './skills/mapped-a/SKILL.md' }],
  },
}

const dependencies: Dependencies = {
  skills: {
    'mapped-a': { skills: ['mapped-b', 'outside-one'] },
    'outside-one': {},
  },
  agents: {},
  rules: {},
  commands: {},
}

describe('listCustomSkillNames', () => {
  const tempRoots: string[] = []

  afterAll(async () => {
    await Promise.all(tempRoots.map((root) => rm(root, { recursive: true, force: true })))
  })

  it('lists custom dirs containing a SKILL.md, sorted', async () => {
    const root = await mkdtemp(join(tmpdir(), 'packs-service-'))
    tempRoots.push(root)
    await Promise.all(
      ['zeta', 'alpha'].map(async (name) => {
        await mkdir(join(root, 'content', 'custom', 'skills', name), { recursive: true })
        await writeFile(join(root, 'content', 'custom', 'skills', name, 'SKILL.md'), 'x')
      }),
    )
    // 无 SKILL.md 的目录不算
    await mkdir(join(root, 'content', 'custom', 'skills', 'empty'), { recursive: true })

    expect(await listCustomSkillNames(root)).toEqual(['alpha', 'zeta'])
  })

  it('returns [] when content/custom/skills does not exist', async () => {
    const root = await mkdtemp(join(tmpdir(), 'packs-service-'))
    tempRoots.push(root)

    expect(await listCustomSkillNames(root)).toEqual([])
  })
})

describe('formatInstallCommand', () => {
  it('builds a bash command with backslash continuations', () => {
    expect(formatInstallCommand(['skill-one', 'skill-two'], 'bash')).toBe(
      [`npx skills add ${REPO_SLUG} \\`, '  --skill skill-one \\', '  --skill skill-two \\', '  -g'].join('\n'),
    )
  })

  it('builds a PowerShell command with backtick continuations and no trailing spaces', () => {
    const powershell = formatInstallCommand(['skill-one', 'skill-two'], 'powershell')
    expect(powershell).toBe(
      ['npx skills add rockcookies/skills `', '  --skill skill-one `', '  --skill skill-two `', '  -g'].join('\n'),
    )
    for (const line of powershell.split('\n')) expect(line.endsWith(' ')).toBe(false)
  })

  it('builds a cmd command with caret continuations', () => {
    expect(formatInstallCommand(['skill-one', 'skill-two'], 'cmd')).toBe(
      ['npx skills add rockcookies/skills ^', '  --skill skill-one ^', '  --skill skill-two ^', '  -g'].join('\n'),
    )
  })
})

describe('resolvePackGaps', () => {
  it('reports direct skill refs outside the pack, sorted and deduped', () => {
    // mapped-a 声明引用 mapped-b 与 outside-one，包里只有 mapped-a 时两者都是缺口
    const gaps = resolvePackGaps(['mapped-a'], dependencies)

    expect(gaps).toEqual(['mapped-b', 'outside-one'])
  })

  it('counts a member ref as covered once it joins the pack', () => {
    const gaps = resolvePackGaps(['mapped-a', 'mapped-b'], dependencies)

    expect(gaps).toEqual(['outside-one'])
  })

  it('returns [] when every ref is a member', () => {
    expect(resolvePackGaps(['mapped-a', 'mapped-b', 'outside-one'], dependencies)).toEqual([])
  })
})

describe('validatePackMembers', () => {
  const { index, duplicates } = buildItemIndex(repositories, ['custom-one'])

  it('reports unknown and duplicate members per pack', () => {
    const errors = validatePackMembers(
      {
        good: { description: '', skills: ['mapped-b', 'custom-one'] },
        unknown: { description: '', skills: ['ghost-skill'] },
        dup: { description: '', skills: ['mapped-a'] },
      },
      index,
      duplicates,
    )

    expect(errors).toEqual([
      'unknown: "ghost-skill" is not a mapped skill or custom skill',
      'dup: "mapped-a" is a duplicate dest name; resolve the ambiguity first',
    ])
  })

  it('returns [] when all members resolve', () => {
    expect(validatePackMembers({ good: { description: '', skills: ['mapped-b'] } }, index, duplicates)).toEqual([])
  })
})

describe('combinePackSkills', () => {
  const packs = {
    first: { description: '', skills: ['one', 'shared'] },
    second: { description: '', skills: ['shared', 'two'] },
  }

  it('merges members in pack order, deduped across packs', () => {
    expect(combinePackSkills(['first', 'second'], packs)).toEqual(['one', 'shared', 'two'])
  })

  it('keeps first occurrence order when selection order flips', () => {
    expect(combinePackSkills(['second', 'first'], packs)).toEqual(['shared', 'two', 'one'])
  })
})
