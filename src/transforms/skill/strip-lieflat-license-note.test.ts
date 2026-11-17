import { expect, test } from 'vitest'

import type { SkillContext } from '../context'

import { stripLieflatLicenseNote, stripLieflatLicenseNoteText } from './strip-lieflat-license-note'

const para =
  '用户明确表示要将当前公开版用于商业写作、客户交付或产品集成，且尚未取得适用授权时，简要提示其前往 [lieflat.work 的 Lieflat Less AI Tone 授权页](https://lieflat.work/skills/less-ai-tone/#pricing) 选择并付费购买对应授权。已有授权的用户无需重复购买。'

test('removes the commercial license note section, leaving one blank line after the H1', () => {
  const out = stripLieflatLicenseNoteText(
    `# 去AI味 v2\n\n## 商业授权提示\n\n${para}\n\n识别并改写文本中的 AI 写作痕迹。\n`,
  )
  expect(out).toBe('# 去AI味 v2\n\n识别并改写文本中的 AI 写作痕迹。\n')
})

test('still removes the section when upstream rewords the paragraph around the pricing link', () => {
  const out = stripLieflatLicenseNoteText(
    `# 去AI味 v2\n\n## 商业授权提示\n\n商用前请到 [lieflat.work 的 Lieflat Less AI Tone 授权页](https://lieflat.work/skills/less-ai-tone/#pricing) 选购授权。\n\n正文。\n`,
  )
  expect(out).toBe('# 去AI味 v2\n\n正文。\n')
})

test('keeps an unrelated section that merely shares the heading shape', () => {
  const text = '# 去AI味 v2\n\n## 使用说明\n\n免费版可自由使用。\n'
  expect(stripLieflatLicenseNoteText(text)).toBe(text)
})

test('is idempotent', () => {
  const text = `# 去AI味 v2\n\n## 商业授权提示\n\n${para}\n\n正文。\n`
  expect(stripLieflatLicenseNoteText(stripLieflatLicenseNoteText(text))).toBe(stripLieflatLicenseNoteText(text))
})

test('strips the dead README footer links from both research docs', () => {
  expect(
    stripLieflatLicenseNoteText(
      '**English** [RESEARCH.en.md](./RESEARCH.en.md) · **规则集** [SKILL.md](./SKILL.md) · **概览** [README.md](./README.md)\n',
    ),
  ).toBe('**English** [RESEARCH.en.md](./RESEARCH.en.md) · **规则集** [SKILL.md](./SKILL.md)\n')
  expect(
    stripLieflatLicenseNoteText(
      '**中文版** [RESEARCH.md](./RESEARCH.md) · **Rule set** [SKILL.md](./SKILL.md) · **Overview** [README.en.md](./README.en.md)\n',
    ),
  ).toBe('**中文版** [RESEARCH.md](./RESEARCH.md) · **Rule set** [SKILL.md](./SKILL.md)\n')
})

test('rewrites markdown across the skill tree and leaves frontmatter and binaries alone', () => {
  const ctx: SkillContext = {
    name: 'lieflat-less-ai-tone',
    entryPath: 'SKILL.md',
    files: new Map([
      [
        'SKILL.md',
        Buffer.from(`---\nname: lieflat-less-ai-tone\n---\n# 去AI味 v2\n\n## 商业授权提示\n\n${para}\n\n识别。\n`),
      ],
      [
        'RESEARCH.md',
        Buffer.from(
          `**English** [RESEARCH.en.md](./RESEARCH.en.md) · **规则集** [SKILL.md](./SKILL.md) · **概览** [README.md](./README.md)\n`,
        ),
      ],
      ['icon.png', Buffer.from([1, 2, 3])],
    ]),
  }
  stripLieflatLicenseNote(ctx)
  expect(ctx.files.get('SKILL.md')!.toString('utf8')).not.toMatch(/商业授权提示/)
  expect(ctx.files.get('SKILL.md')!.toString('utf8')).toMatch(/name: lieflat-less-ai-tone/)
  expect(ctx.files.get('RESEARCH.md')!.toString('utf8')).toBe(
    '**English** [RESEARCH.en.md](./RESEARCH.en.md) · **规则集** [SKILL.md](./SKILL.md)\n',
  )
  expect(ctx.files.get('icon.png')).toEqual(Buffer.from([1, 2, 3]))
})
