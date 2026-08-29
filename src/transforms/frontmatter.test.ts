import assert from 'node:assert/strict'
import { test } from 'node:test'

import { applyFrontmatter, splitFrontmatter } from './frontmatter'
import { replaceInMarkdown } from './replace-in-markdown'

test('applyFrontmatter sets name last and preserves other keys', () => {
  const input = `---
name: old
description: keep me
license: MIT
---
# Body
`
  const out = applyFrontmatter(input, { name: 'golang-how-to', delete: ['license'], set: { description: 'new' } })
  const { data, body } = splitFrontmatter(out)
  assert.equal(data.name, 'golang-how-to')
  assert.equal(data.description, 'new')
  assert.equal(data.license, undefined)
  assert.match(body, /# Body/)
})

test('applyFrontmatter creates frontmatter when missing', () => {
  const out = applyFrontmatter('# Body\n', { name: 'x' })
  const { data, body } = splitFrontmatter(out)
  assert.equal(data.name, 'x')
  assert.equal(body, '# Body\n')
})

test('body replace does not touch YAML frontmatter', () => {
  const file = `---
description: replace-me
---
replace-me in body
`
  const { body } = splitFrontmatter(file)
  const next = replaceInMarkdown(body, [{ find: 'replace-me', replace: 'gone' }])
  assert.equal(next.includes('gone'), true)
  assert.equal(splitFrontmatter(file).data.description, 'replace-me')
})
