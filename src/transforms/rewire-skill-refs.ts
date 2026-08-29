/**
 * 去掉引用上的 samber 插件前缀，让集合内短名互相指向。
 * 不删技能、不删段落。github.com/samber/... 库路径和 homepage URL 不动。
 *
 * `samber/cc-skills-golang@golang-testing` → `golang-testing`
 * from `samber/cc-skills-golang` → （删掉，避免 dest 里还像在引上游插件）
 */
export function rewireSkillRefs(body: string): string {
  let out = body
  out = out.replaceAll('samber/cc-skills-golang@', '')
  // 裸 `samber/cc-skills-golang` 不能全局删，会弄坏 https://github.com/samber/cc-skills-golang
  out = out.replaceAll(' from `samber/cc-skills-golang`', '')
  return out
}
