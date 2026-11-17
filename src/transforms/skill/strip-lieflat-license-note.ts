import type { SkillContext } from '../context'

import { mapMarkdownFiles } from '../map-markdown'

/**
 * 剥掉 lieflat 上游的发行层内容，技能本体不动：
 * - SKILL.md 的「商业授权提示」小节：付费授权导流，不随本仓库分发
 * - RESEARCH*.md 尾部指向 README / README.en.md 的死链：这两个根级文件
 *   已被 exclude-lieflat-chrome 排除，链接留着必悬空
 *
 * 授权小节锚定「标题 + 定价链接」：上游微调段落措辞仍能命中；连链接都
 * 挪走时替换不再生效，属于预期维护点（sync 后 dest 内容变化会暴露）。
 */
const licenseNotePattern = /\n## 商业授权提示\n\n[^\n]*lieflat\.work\/skills\/less-ai-tone\/#pricing[^\n]*\n/

export function stripLieflatLicenseNoteText(text: string): string {
  let out = text
  out = out.replace(licenseNotePattern, '')
  out = out.replaceAll(' · **概览** [README.md](./README.md)', '')
  out = out.replaceAll(' · **Overview** [README.en.md](./README.en.md)', '')
  return out
}

export function stripLieflatLicenseNote(ctx: SkillContext): void {
  mapMarkdownFiles(ctx, stripLieflatLicenseNoteText)
}
