import type { PackCategory, Packs } from './src/types'

/**
 * 技能包（pack）：面向安装命令生成的策划分组，与 meta.ts（同步映射）、
 * dependencies.ts（运行时依赖声明）平级，手维护。
 * - 成员是显式清单，允许包间重叠；不展开 dependencies.ts 的传递闭包
 * - 成员名必须能解析到映射产物或 skills/custom/ 技能，pack 命令生成前统一校验
 * - 成员顺序即安装命令中 --skill 的顺序
 * - README 的安装命令区块由 packCategories × packs 渲染生成（pnpm readme），改这里即可
 */
export const packs: Packs = {
  // ── Go skills（samber/cc-skills-golang）───────────────────────────────
  'golang-essential': {
    title: '⭐ Recommended',
    description: 'Upstream general-purpose set for every Go project. Includes `golang-how-to` (orchestrator).',
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
    title: 'Code Quality',
    skills: [
      'golang-code-style',
      'golang-documentation',
      'golang-error-handling',
      'golang-lint',
      'golang-naming',
      'golang-safety',
      'golang-security',
      'golang-structs-interfaces',
    ],
  },
  'golang-architecture': {
    title: 'Architecture & Design',
    skills: [
      'golang-concurrency',
      'golang-context',
      'golang-data-structures',
      'golang-database',
      'golang-dependency-injection',
      'golang-design-patterns',
      'golang-modernize',
      'golang-refactoring',
    ],
  },
  'golang-performance': {
    title: 'QA & Performance',
    skills: [
      'golang-benchmark',
      'golang-observability',
      'golang-performance',
      'golang-testing',
      'golang-troubleshooting',
    ],
  },
  'golang-project-setup': {
    title: 'Project Setup',
    skills: [
      'golang-cli',
      'golang-continuous-integration',
      'golang-dependency-management',
      'golang-gopls',
      'golang-pkg-go-dev',
      'golang-popular-libraries',
      'golang-project-layout',
      'golang-stay-updated',
    ],
  },
  'golang-apis': {
    title: 'APIs',
    skills: ['golang-graphql', 'golang-grpc', 'golang-swagger'],
  },
  'golang-dependency-injection': {
    title: 'Dependency Injection',
    skills: ['golang-google-wire', 'golang-uber-dig', 'golang-uber-fx', 'golang-samber-do'],
  },
  'golang-frameworks': {
    title: 'Frameworks',
    skills: ['golang-spf13-cobra', 'golang-spf13-viper'],
  },
  'golang-samber': {
    title: 'samber/*',
    skills: [
      'golang-samber-do',
      'golang-samber-hot',
      'golang-samber-lo',
      'golang-samber-mo',
      'golang-samber-oops',
      'golang-samber-ro',
      'golang-samber-slog',
    ],
  },
  'golang-testing': {
    title: 'Testing (library)',
    skills: ['golang-stretchr-testify'],
  },

  // ── JS / TypeScript skills ────────────────────────────────────────────
  'web-tooling': {
    title: 'Tooling (antfu)',
    skills: ['antfu', 'vite', 'vitest', 'unocss'],
  },
  'web-vue': {
    title: 'Vue',
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
  'web-tanstack': {
    title: 'TanStack',
    skills: ['tanstack-integration', 'tanstack-query', 'tanstack-router', 'tanstack-start'],
  },
  'web-react': {
    title: 'React / Next.js & web guidelines',
    skills: ['react-best-practices', 'web-design-guidelines'],
  },
  'web-typescript-principles': {
    title: 'TypeScript principles (cursor/plugins)',
    skills: [
      'typescript-best-practices',
      'principle-type-system-discipline',
      'principle-boundary-discipline',
      'principle-encode-lessons-in-structure',
    ],
  },
  'web-how-why': {
    title: 'how & why (cursor/plugins)',
    description:
      'Companions driving parallel `generalPurpose` Task subagents: `how` explains how a subsystem works; `why` investigates the forces that shaped it through available MCPs.',
    skills: ['how', 'why'],
  },
  'web-pstack': {
    title: 'pstack set (cursor/plugins)',
    description:
      'All twenty-four engineering principles plus the workflow skills built on them: `benchmark-checklist`, `pstack-tdd` (aliased — `tdd` is taken) and `show-me-your-work`.',
    skills: [
      'benchmark-checklist',
      'principle-attack-the-premise',
      'principle-boundary-discipline',
      'principle-build-the-lever',
      'principle-encode-lessons-in-structure',
      'principle-exhaust-the-design-space',
      'principle-experience-first',
      'principle-explain-the-number',
      'principle-fix-root-causes',
      'principle-foundational-thinking',
      'principle-guard-the-context-window',
      'principle-laziness-protocol',
      'principle-make-operations-idempotent',
      'principle-migrate-callers-then-delete-legacy-apis',
      'principle-minimize-reader-load',
      'principle-model-the-domain',
      'principle-never-block-on-the-human',
      'principle-outcome-oriented-execution',
      'principle-prove-it-works',
      'principle-redesign-from-first-principles',
      'principle-sequence-verifiable-units',
      'principle-separate-before-serializing-shared-state',
      'principle-subtract-before-you-add',
      'principle-test-behavior-not-implementation',
      'principle-type-system-discipline',
      'pstack-tdd',
      'show-me-your-work',
    ],
  },
  'web-writing': {
    title: 'Writing (unslop & technical-writing)',
    description:
      '`technical-writing` applies `unslop` on every doc it touches; `technical-writing-zh` (custom) orchestrates both for Chinese output. Install those three together. `skill-evolution` hard-depends on `writing-for-agents` (runtime stop if missing); install both when you want Skill audit / feedback-loop maintenance.',
    skills: ['unslop', 'technical-writing', 'technical-writing-zh', 'writing-for-agents', 'skill-evolution'],
  },
  'web-hono-playwright': {
    title: 'Hono / Playwright / web style',
    skills: ['hono', 'hono-jsx', 'playwright-cli', 'web-code-style', 'web-css-guidelines'],
  },
  'web-ui-design': {
    title: 'UI / design / image gen',
    skills: ['frontend-design', 'ui', 'baoyu-image-gen', 'impeccable'],
  },
  thermos: {
    title: 'Thermos (branch review)',
    description: 'Branch-review skills plus their matching Task subagents.',
    skills: ['thermos', 'thermo-nuclear-review', 'thermo-nuclear-code-quality-review'],
  },
}

/**
 * pack 的 README 分类：一个分类渲染为 `###` 标题 + 简介，成员 pack 渲染为
 * `####` 安装小节。id 即 README 标记区块后缀（`<!-- packs:go:start/end -->`）。
 * 每个 pack 必须恰好归属一个分类（readme 命令渲染前强校验）。
 */
export const packCategories: PackCategory[] = [
  {
    id: 'go',
    title: 'Go skills ([samber/cc-skills-golang](https://github.com/samber/cc-skills-golang), tag `v2.0.0`)',
    intro:
      'Atomic and cross-referencing — prefer the ⭐ set (or all), then add category / library skills as needed. Installing a skill does **not** pull linked skills automatically.',
    packs: [
      'golang-essential',
      'golang-code-quality',
      'golang-architecture',
      'golang-performance',
      'golang-project-setup',
      'golang-apis',
      'golang-dependency-injection',
      'golang-frameworks',
      'golang-samber',
      'golang-testing',
    ],
  },
  {
    id: 'js',
    title: 'JS / TypeScript skills',
    intro:
      'Hand-maintained web style skills live under `content/custom/skills/` (`web-code-style`, `web-css-guidelines`). Install by stack:',
    packs: [
      'web-tooling',
      'web-vue',
      'web-tanstack',
      'web-react',
      'web-typescript-principles',
      'web-how-why',
      'web-pstack',
      'web-writing',
      'web-hono-playwright',
      'web-ui-design',
      'thermos',
    ],
  },
]
