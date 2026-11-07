import { expect, test } from 'vitest'

import type { SkillContext } from '../context'

import { excludeGenerationMd } from './exclude-generation-md'
import { excludeLicenseTxt } from './exclude-license-txt'
import { excludeLieflatChrome } from './exclude-lieflat-chrome'

test('exclude-license-txt removes LICENSE.txt and keeps other files', () => {
  const ctx: SkillContext = {
    name: 'frontend-design',
    entryPath: 'SKILL.md',
    files: new Map([
      ['SKILL.md', Buffer.from('body')],
      ['LICENSE.txt', Buffer.from('mit')],
      ['nested/LICENSE.txt', Buffer.from('mit2')],
      ['README.md', Buffer.from('readme')],
    ]),
  }
  excludeLicenseTxt(ctx)
  expect(ctx.files.has('LICENSE.txt')).toBe(false)
  expect(ctx.files.has('nested/LICENSE.txt')).toBe(false)
  expect(ctx.files.has('SKILL.md')).toBe(true)
  expect(ctx.files.has('README.md')).toBe(true)
})

test('exclude-generation-md removes GENERATION.md and keeps other files', () => {
  const ctx: SkillContext = {
    name: 'vite',
    entryPath: 'SKILL.md',
    files: new Map([
      ['SKILL.md', Buffer.from('body')],
      ['GENERATION.md', Buffer.from('gen')],
      ['docs/GENERATION.md', Buffer.from('gen2')],
    ]),
  }
  excludeGenerationMd(ctx)
  expect(ctx.files.has('GENERATION.md')).toBe(false)
  expect(ctx.files.has('docs/GENERATION.md')).toBe(false)
  expect(ctx.files.has('SKILL.md')).toBe(true)
})

test('exclude-lieflat-chrome removes root repo chrome and assets subtree, keeps referenced files', () => {
  const ctx: SkillContext = {
    name: 'lieflat-less-ai-tone',
    entryPath: 'SKILL.md',
    files: new Map([
      ['SKILL.md', Buffer.from('body')],
      ['README.md', Buffer.from('zh')],
      ['README.en.md', Buffer.from('en')],
      ['LICENSE', Buffer.from('cc')],
      ['.gitignore', Buffer.from('ign')],
      ['assets/hero.png', Buffer.from('img')],
      ['examples/agent-memory-case/README.md', Buffer.from('case')],
      ['scripts/detect.py', Buffer.from('py')],
    ]),
  }
  excludeLieflatChrome(ctx)
  expect(ctx.files.has('README.md')).toBe(false)
  expect(ctx.files.has('README.en.md')).toBe(false)
  expect(ctx.files.has('LICENSE')).toBe(false)
  expect(ctx.files.has('.gitignore')).toBe(false)
  expect(ctx.files.has('assets/hero.png')).toBe(false)
  expect(ctx.files.has('SKILL.md')).toBe(true)
  expect(ctx.files.has('examples/agent-memory-case/README.md')).toBe(true)
  expect(ctx.files.has('scripts/detect.py')).toBe(true)
})
