import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'import', 'unicorn'],
  env: {
    node: true,
    es2025: true,
  },
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
    style: 'off',
    pedantic: 'off',
    restriction: 'off',
    nursery: 'off',
  },
  rules: {
    // TypeScript
    'typescript/no-explicit-any': 'off',
    'typescript/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    'typescript/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-unused-vars': 'off',

    // General
    'no-console': ['warn', { allow: ['info', 'table', 'warn', 'error'] }],
    'prefer-const': 'error',
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-var': 'error',
    'no-underscore-dangle': 'off',

    // Import
    'import/no-duplicates': 'error',
  },
  ignorePatterns: ['**/vendor/**', '**/sources/**', '**/skills/**', '**/upstream/**', '**/node_modules/**'],
})
