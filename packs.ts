import type { Packs } from './src/types'

/**
 * 技能包（pack）：面向 site 展示与 `pnpm packs` 安装命令生成的策划分组，仅 skills，
 * 手维护。README 生成区块不再含 pack（四类 Custom/Synced 表），pack 只进 catalog.json。
 * - 成员是显式清单，允许包间重叠；不展开 dependencies.ts 的传递闭包
 * - 成员名必须能解析到映射产物或 content/custom/skills/ 技能（pnpm packs 与 check 校验）
 * - 成员顺序即安装命令中 --skill 的顺序
 */
export const packs: Packs = {
  // ── Go skills（samber/cc-skills-golang）───────────────────────────────
  'golang-essential': {
    description: 'General-purpose set for every Go project (includes the golang-how-to orchestrator)',
    skills: [
      'golang-how-to',
      'golang-code-style',
      'golang-data-structures',
      'golang-database',
      'golang-design-patterns',
      'golang-documentation',
      'golang-error-handling',
      'golang-modernize',
      'golang-naming',
      'golang-refactoring',
      'golang-safety',
      'golang-security',
      'golang-testing',
      'golang-troubleshooting',
    ],
  },
  'golang-code-quality': {
    description: 'Conventions and guardrails: style, naming, docs, lint, error handling, safety',
    skills: [
      'golang-code-style',
      'golang-naming',
      'golang-documentation',
      'golang-lint',
      'golang-error-handling',
      'golang-safety',
      'golang-security',
      'golang-structs-interfaces',
      'golang-samber-oops',
    ],
  },
  'golang-architecture': {
    description: 'Structure and wiring: concurrency, context, data structures, storage, DI, patterns',
    skills: [
      'golang-concurrency',
      'golang-context',
      'golang-data-structures',
      'golang-database',
      'golang-dependency-injection',
      'golang-design-patterns',
      'golang-structs-interfaces',
      'golang-samber-do',
    ],
  },
  'golang-performance': {
    description: 'Profiling, benchmarking and observability',
    skills: ['golang-benchmark', 'golang-performance', 'golang-observability', 'golang-troubleshooting'],
  },
  'golang-testing': {
    description: 'Testing practices plus the testify library skill',
    skills: ['golang-testing', 'golang-stretchr-testify', 'golang-benchmark'],
  },

  // ── JS / TypeScript skills ────────────────────────────────────────────
  'web-standards': {
    description: 'Type discipline, React best practices, code and CSS style conventions',
    skills: [
      'principle-type-system-discipline',
      'principle-encode-lessons-in-structure',
      'typescript-best-practices',
      'react-best-practices',
      'web-code-style',
      'web-css-guidelines',
    ],
  },
  'web-tooling': {
    description: 'Build and test tooling (Vite ecosystem)',
    skills: ['vite', 'vitest'],
  },
  'web-unocss': {
    description: 'Atomic CSS engine',
    skills: ['unocss'],
  },
  'web-tanstack': {
    description: 'TanStack Router and Query',
    skills: ['tanstack-router', 'tanstack-query'],
  },
  'web-vue': {
    description: 'Vue full set: best practices, router, pinia, testing, JSX, plus vueuse',
    skills: [
      'vue-best-practices',
      'vue-debug-guides',
      'vue-jsx-best-practices',
      'vue-options-api-best-practices',
      'vue-pinia-best-practices',
      'vue-router-best-practices',
      'vue-testing-best-practices',
      'vueuse-functions',
    ],
  },
}
