import { expect, test } from 'vitest'

import { setFrontmatterName, splitFrontmatter } from './frontmatter'

test('setFrontmatterName sets name last and preserves other keys', () => {
  const input = `---
name: old
description: keep me
license: MIT
---
# Body
`
  const out = setFrontmatterName(input, 'golang-how-to')
  const { data, body } = splitFrontmatter(out)
  expect(data.name).toBe('golang-how-to')
  expect(data.description).toBe('keep me')
  expect(data.license).toBe('MIT')
  expect(body).toMatch(/# Body/)
})

test('setFrontmatterName creates frontmatter when missing', () => {
  const out = setFrontmatterName('# Body\n', 'x')
  const { data, body } = splitFrontmatter(out)
  expect(data.name).toBe('x')
  expect(body).toBe('# Body\n')
})
