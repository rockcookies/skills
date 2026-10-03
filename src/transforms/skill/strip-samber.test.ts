import { expect, test } from 'vitest'

import type { SkillContext } from '../context'

import { stripSamber, stripSamberText } from './strip-samber'

test('strips plugin prefix so golang ids point at dest names', () => {
  const out = stripSamberText(
    'See `samber/cc-skills-golang@golang-testing` and `samber/cc-skills-golang@golang-samber-lo`.',
  )
  expect(out).toMatch(/`golang-testing`/)
  expect(out).toMatch(/`golang-samber-lo`/)
  expect(out).not.toMatch(/samber\/cc-skills-golang@/)
})

test('drops plugin attribution so dest rules do not cite the upstream plugin', () => {
  const out = stripSamberText('The following Go skills from `samber/cc-skills-golang` MUST always be applied.')
  expect(out).toBe('The following Go skills MUST always be applied.')
})

test('does not strip github.com/samber library paths', () => {
  const out = stripSamberText('Use `github.com/samber/lo` instead of a dedicated skill.')
  expect(out).toMatch(/github.com\/samber\/lo/)
})

test('does not break upstream homepage URLs', () => {
  const out = stripSamberText('homepage: https://github.com/samber/cc-skills-golang')
  expect(out).toBe('homepage: https://github.com/samber/cc-skills-golang')
})

test('rewrites markdown under references/', () => {
  const ctx: SkillContext = {
    name: 'golang-testing',
    entryPath: 'SKILL.md',
    files: new Map([
      ['SKILL.md', Buffer.from('---\nname: x\n---\nsee samber/cc-skills-golang@golang-cli\n')],
      ['references/notes.md', Buffer.from('use samber/cc-skills-golang@golang-lint\n')],
      ['icon.png', Buffer.from([1, 2, 3])],
    ]),
  }
  stripSamber(ctx)
  expect(ctx.files.get('SKILL.md')!.toString('utf8')).toMatch(/golang-cli/)
  expect(ctx.files.get('SKILL.md')!.toString('utf8')).not.toMatch(/samber\/cc-skills-golang@/)
  expect(ctx.files.get('references/notes.md')!.toString('utf8')).toMatch(/golang-lint/)
  expect(ctx.files.get('icon.png')).toEqual(Buffer.from([1, 2, 3]))
})
