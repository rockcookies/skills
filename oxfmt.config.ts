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

  ignorePatterns: ['**/vendor/**', '**/sources/**', '**/skills/**', '**/upstream/**', '**/node_modules/**', 'meta.ts'],
})
