import assert from 'node:assert/strict'
import { test } from 'node:test'

import { rewireSkillRefs } from './rewire-skill-refs'

test('strips plugin prefix so golang ids point at dest names', () => {
  const out = rewireSkillRefs(
    'See `samber/cc-skills-golang@golang-testing` and `samber/cc-skills-golang@golang-samber-lo`.',
  )
  assert.match(out, /`golang-testing`/)
  assert.match(out, /`golang-samber-lo`/)
  assert.doesNotMatch(out, /samber\/cc-skills-golang@/)
})

test('drops plugin attribution so dest rules do not cite the upstream plugin', () => {
  const out = rewireSkillRefs('The following Go skills from `samber/cc-skills-golang` MUST always be applied.')
  assert.equal(out, 'The following Go skills MUST always be applied.')
})

test('does not strip github.com/samber library paths', () => {
  const out = rewireSkillRefs('Use `github.com/samber/lo` instead of a dedicated skill.')
  assert.match(out, /github.com\/samber\/lo/)
})

test('does not break upstream homepage URLs', () => {
  const out = rewireSkillRefs('homepage: https://github.com/samber/cc-skills-golang')
  assert.equal(out, 'homepage: https://github.com/samber/cc-skills-golang')
})
