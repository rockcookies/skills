import { describe, expect, it } from 'vitest'

import type { Dependency } from '../types'

import { fileCopyCommands, resolveRequirements, skillsAddCommand } from './install-commands'

describe('skillsAddCommand', () => {
  it('joins with shell-specific continuations and no trailing spaces', () => {
    const bash = skillsAddCommand({ skills: ['a', 'b'], scope: 'global', shell: 'bash' })
    expect(bash).toBe(['npx skills add rockcookies/skills \\', '  --skill a \\', '  --skill b \\', '  -g'].join('\n'))

    const powershell = skillsAddCommand({ skills: ['a', 'b'], scope: 'global', shell: 'powershell' })
    expect(powershell).toBe(
      ['npx skills add rockcookies/skills `', '  --skill a `', '  --skill b `', '  -g'].join('\n'),
    )
    for (const line of powershell.split('\n')) expect(line.endsWith(' ')).toBe(false)

    expect(skillsAddCommand({ skills: ['a', 'b'], scope: 'global', shell: 'cmd' })).toContain('  --skill a ^')
  })

  it('quotes the star per shell and keeps the short form', () => {
    const bash = skillsAddCommand({ skills: '*', scope: 'global', shell: 'bash' })
    expect(bash).toBe(['npx skills add rockcookies/skills \\', "  --skill '*' \\", '  -g'].join('\n'))
    expect(skillsAddCommand({ skills: '*', scope: 'global', shell: 'cmd' })).toContain('  --skill "*"')
    expect(bash).not.toContain('full-depth')
  })

  it('supports agents, yes, project scope and custom source', () => {
    expect(
      skillsAddCommand({
        skills: ['a'],
        scope: 'project',
        agents: ['claude-code'],
        yes: true,
        shell: 'bash',
        source: './dist-release',
      }),
    ).toBe(['npx skills add ./dist-release \\', '  --skill a \\', '  -a claude-code \\', '  -y'].join('\n'))
  })

  it('rejects unsafe names', () => {
    expect(() => skillsAddCommand({ skills: ['a; rm -rf /'], scope: 'global', shell: 'bash' })).toThrow()
    expect(() => skillsAddCommand({ skills: ['a'], agents: ['x y'], scope: 'global', shell: 'bash' })).toThrow()
  })
})

describe('resolveRequirements', () => {
  const deps: Record<string, Dependency> = {
    thermos: { agents: ['x-subagent'], skills: ['review'] },
    review: { agents: ['y-subagent'], rules: ['z-rule'] },
    deep: { skills: ['review'] },
  }

  it('follows skill->skill deps and collects agents/rules', () => {
    expect(resolveRequirements(['thermos'], deps)).toEqual({
      missingSkills: ['review'],
      agents: ['x-subagent', 'y-subagent'],
      rules: ['z-rule'],
    })
  })

  it('walks transitively and treats selected deps as covered', () => {
    expect(resolveRequirements(['thermos', 'review'], deps)).toEqual({
      missingSkills: [],
      agents: ['x-subagent', 'y-subagent'],
      rules: ['z-rule'],
    })
    expect(resolveRequirements(['deep'], deps).missingSkills).toEqual(['review'])
  })

  it('tolerates unknown names', () => {
    expect(resolveRequirements(['ghost'], deps)).toEqual({ missingSkills: [], agents: [], rules: [] })
  })
})

describe('fileCopyCommands', () => {
  // catalog 记录仓库真实路径（content/ 前缀），URL 用发布面路径（剥前缀）
  const files = ['content/agents/tw93-waza/kimi.md']
  const options = { baseUrl: 'https://x.test/skills', targetDir: '.cursor/agents' }

  it('builds bash commands with mkdir -p and curl', () => {
    expect(fileCopyCommands(files, { ...options, shell: 'bash' })).toBe(
      [
        'mkdir -p ~/.cursor/agents',
        'curl -fsSL https://x.test/skills/agents/tw93-waza/kimi.md -o ~/.cursor/agents/kimi.md',
      ].join('\n'),
    )
  })

  it('builds PowerShell commands with New-Item and Invoke-WebRequest', () => {
    expect(fileCopyCommands(files, { ...options, shell: 'powershell' })).toBe(
      [
        'New-Item -ItemType Directory -Force "$HOME/.cursor/agents" | Out-Null',
        'Invoke-WebRequest https://x.test/skills/agents/tw93-waza/kimi.md -OutFile "$HOME/.cursor/agents/kimi.md"',
      ].join('\n'),
    )
  })

  it('builds cmd commands with %USERPROFILE% and backslashes', () => {
    expect(
      fileCopyCommands(['content/rules/tw93-waza/tone.md'], { ...options, shell: 'cmd', targetDir: '.cursor/rules' }),
    ).toBe(
      [
        'if not exist "%USERPROFILE%\\.cursor\\rules" mkdir "%USERPROFILE%\\.cursor\\rules"',
        'curl -fsSL https://x.test/skills/rules/tw93-waza/tone.md -o "%USERPROFILE%\\.cursor\\rules\\tone.md"',
      ].join('\n'),
    )
  })

  it('rejects unsafe file paths', () => {
    expect(() => fileCopyCommands(['../escape.md'], { ...options, shell: 'bash' })).toThrow()
    expect(() => fileCopyCommands(['content/skills/x/SKILL.md'], { ...options, shell: 'bash' })).toThrow()
  })
})
