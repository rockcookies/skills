import { expect, test } from 'vitest'

import type { SkillContext } from '../context'

import { stripPrinciplePrefix, stripPrinciplePrefixText } from './strip-principle-prefix'

test('strips principle- path prefix in text', () => {
  expect(stripPrinciplePrefixText('see ../principle-foo/SKILL.md')).toBe('see ../foo/SKILL.md')
})

test('rewrites principle- links across markdown files', () => {
  const ctx: SkillContext = {
    name: 'build-the-lever',
    entryPath: 'SKILL.md',
    files: new Map([
      ['SKILL.md', Buffer.from('link ../principle-build-the-lever\n')],
      ['references/a.md', Buffer.from('also ../principle-prove-it-works\n')],
    ]),
  }
  stripPrinciplePrefix(ctx)
  expect(ctx.files.get('SKILL.md')!.toString('utf8')).toBe('link ../build-the-lever\n')
  expect(ctx.files.get('references/a.md')!.toString('utf8')).toBe('also ../prove-it-works\n')
})
