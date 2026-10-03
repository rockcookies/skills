import { expect, test } from 'vitest'

import type { RepositoryConfig, SkillMapping } from '../types'
import type { SkillContext } from './context'

import { splitFrontmatter } from './frontmatter'
import { resolveTransformNames, runSkillPipeline } from './pipeline'

test('resolveTransformNames puts repo names before mapping names', () => {
  const repo: RepositoryConfig = {
    url: 'https://example.com/r',
    transforms: { skills: ['strip-samber', 'exclude-license-txt'] },
  }
  const mapping: SkillMapping = {
    name: 'x',
    source: './skills/x/SKILL.md',
    transforms: ['strip-principle-prefix'],
  }
  expect(resolveTransformNames(repo, 'skill', mapping)).toEqual([
    'strip-samber',
    'exclude-license-txt',
    'strip-principle-prefix',
  ])
})

test('runSkillPipeline sets dest name last and rejects unknown names', () => {
  const ctx: SkillContext = {
    name: 'dest-name',
    entryPath: 'SKILL.md',
    files: new Map([['SKILL.md', Buffer.from('---\nname: upstream\n---\nbody\n')]]),
  }
  runSkillPipeline(ctx, [])
  expect(splitFrontmatter(ctx.files.get('SKILL.md')!.toString('utf8')).data.name).toBe('dest-name')

  expect(() => runSkillPipeline(ctx, ['not-a-real-transform'])).toThrow(/Unknown skill transform/)
})
