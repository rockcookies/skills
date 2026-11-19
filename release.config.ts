/**
 * 决定「什么会发布」的唯一位置：build:release 按这里的清单组装发布分支内容。
 * 发布分支 = 本清单的产物 + CI 生成的 README.md / RELEASE.json，不含仓库源码
 */
export const releaseConfig = {
  /** 原样复制到发布分支根目录的目录 */
  include: ['skills', 'agents', 'rules'],
  /** 若存在则复制到发布分支根目录的文件（缺失跳过） */
  rootFiles: ['LICENSE'],
  /** 复制时跳过的目录/文件名 */
  junk: ['node_modules', '.git', '.DS_Store', '__pycache__'] as readonly string[],
  /** 发布守卫：单文件体积上限 */
  maxFileBytes: 5 * 1024 * 1024,
}
