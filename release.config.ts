/**
 * 决定「什么会发布」的唯一位置：build:release 按这里的清单组装发布内容。
 * 产物 = 本清单 + CI 生成的 README.md / RELEASE.json，不含仓库源码。
 * 源目录在 content/ 下，拷贝到产物根时取目录名（发布面保持顶层 skills/agents/rules，
 * 这是 skills CLI 的发现契约）
 */
export const releaseConfig = {
  /** 拷贝到发布内容根目录的源目录（dest 取 basename） */
  include: ['content/skills', 'content/agents', 'content/rules'],
  /** 若存在则复制到发布分支根目录的文件（缺失跳过） */
  rootFiles: ['LICENSE'],
  /** 复制时跳过的目录/文件名 */
  junk: ['node_modules', '.git', '.DS_Store', '__pycache__'] as readonly string[],
  /** 发布守卫：单文件体积上限 */
  maxFileBytes: 5 * 1024 * 1024,
}
