import { describe, expect, it } from 'vitest'

import { isForbiddenPath, nextTag, parseSourceCommit, PUBLISH_PATHS } from './release.command'

describe('nextTag', () => {
  it('uses the plain day tag when free', () => {
    expect(nextTag([], '2026-11-27')).toBe('v2026-11-27')
  })

  it('appends .2/.3 for same-day re-releases, ignoring peeled refs', () => {
    const existing = ['v2026-11-26', 'v2026-11-27', 'v2026-11-27.2^{}']
    expect(nextTag(existing, '2026-11-27')).toBe('v2026-11-27.3')
    expect(nextTag(existing, '2026-11-26')).toBe('v2026-11-26.2')
  })
})

describe('parseSourceCommit', () => {
  it('reads the trailer from a release commit message', () => {
    const message = 'release: 2026-11-27 (abc1234)\n\nSource-Commit: 4cb48a11adf9d7086d7102c9b9a2dc3879787a6c'
    expect(parseSourceCommit(message)).toBe('4cb48a11adf9d7086d7102c9b9a2dc3879787a6c')
  })

  it('returns null when the message has no trailer', () => {
    expect(parseSourceCommit('chore(fmt): oxfmt 忽略 content/，生成物不参与格式化')).toBeNull()
  })
})

describe('isForbiddenPath', () => {
  it('blocks dev-tree paths from entering main', () => {
    expect(isForbiddenPath('src/commands/release.command.ts')).toBe(true)
    expect(isForbiddenPath('site/src/App.tsx')).toBe(true)
    expect(isForbiddenPath('meta.ts')).toBe(true)
    expect(isForbiddenPath('AGENTS.md')).toBe(true)
    expect(isForbiddenPath('.github/workflows/ci.yml')).toBe(true)
    expect(isForbiddenPath('.github/actions/setup/action.yml')).toBe(true)
  })

  it('allows publish paths through', () => {
    expect(isForbiddenPath('content/custom/skills/demo/SKILL.md')).toBe(false)
    expect(isForbiddenPath('skills.sh.json')).toBe(false)
    expect(isForbiddenPath('README.md')).toBe(false)
    expect(isForbiddenPath('LICENSE')).toBe(false)
    expect(isForbiddenPath('.github/workflows/deploy.yml')).toBe(false)
  })

  it('keeps every publish path out of the forbidden set', () => {
    // 白名单与禁止清单不能自相矛盾，否则发布必然失败
    for (const p of PUBLISH_PATHS) expect(isForbiddenPath(`${p}/placeholder`)).toBe(false)
  })
})
