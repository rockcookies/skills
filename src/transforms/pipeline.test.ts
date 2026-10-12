import { expect, test } from 'vitest'

import type { RepositoryConfig, RuleMapping, SkillMapping } from '../types'
import type { RuleContext, SkillContext } from './context'

import { splitFrontmatter } from './frontmatter'
import { resolveTransformNames, runRulePipeline, runSkillPipeline } from './pipeline'

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

test('resolveTransformNames reads transforms.rules for rule kind', () => {
  const repo: RepositoryConfig = {
    url: 'https://example.com/r',
    transforms: { rules: ['repo-rule-transform'] },
  }
  const mapping: RuleMapping = {
    name: 'x',
    source: './rules/x.md',
    transforms: ['mapping-rule-transform'],
  }
  expect(resolveTransformNames(repo, 'rule', mapping)).toEqual(['repo-rule-transform', 'mapping-rule-transform'])
})

test('runRulePipeline copies content verbatim and rejects unknown names', () => {
  const content = '# Anti-Patterns\n\nBody without YAML head.\n'
  const ctx: RuleContext = { name: 'anti-patterns', content }
  runRulePipeline(ctx, [])
  expect(ctx.content).toBe(content)
  expect(ctx.content).not.toContain('name:')

  expect(() => runRulePipeline(ctx, ['not-a-real-transform'])).toThrow(/Unknown rule transform/)
})
