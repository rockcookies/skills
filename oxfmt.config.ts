import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 120,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,

  // Import sorting — same group order as eslint-plugin-perfectionist/sort-imports
  sortImports: {
    groups: [
      'type-import',
      ['value-builtin', 'value-external'],
      'type-internal',
      'value-internal',
      ['type-parent', 'type-sibling', 'type-index'],
      ['value-parent', 'value-sibling', 'value-index'],
      'unknown',
    ],
    newlinesBetween: true,
  },

  // content/ 是同步生成物 + 上游原文（安装面逐字节交付），不参与格式化——
  // 旧布局靠 **/skills/** 巧合覆盖，repoKey 优先后 agents/rules 会漏
  // README.md 主体是 pnpm readme 的生成区块（表格/代码围栏），生成器与 fmt 互踩，保持生成器原样
  ignorePatterns: [
    'content/**',
    '**/vendor/**',
    '**/sources/**',
    '**/skills/**',
    '**/upstream/**',
    '**/node_modules/**',
    'meta.ts',
    'README.md',
  ],
})
