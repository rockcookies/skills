import { describe, expect, it } from 'vitest'

import { normalizeTextEol } from './eol'

describe('normalizeTextEol', () => {
  it('converts CRLF to LF in text content', () => {
    expect(normalizeTextEol(Buffer.from('a\r\nb\r\n'))).toEqual(Buffer.from('a\nb\n'))
  })

  it('keeps binary content byte-identical', () => {
    const png = Buffer.from([0x89, 0x50, 0x0d, 0x0a, 0x00, 0x1a, 0x0a])
    expect(normalizeTextEol(png)).toBe(png)
  })

  it('is a no-op for pure-LF text', () => {
    const text = Buffer.from('a\nb\n')
    expect(normalizeTextEol(text)).toEqual(text)
  })
})
