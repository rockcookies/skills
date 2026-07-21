import type { RepositoryConfig } from './src/types'

/**
 * Repositories to clone and sync skills from
 *
 * Version locking options (priority: commit > tag > branch):
 * - branch: Lock to a specific branch (e.g., 'main', 'develop')
 * - tag: Lock to a specific tag (e.g., 'v1.0.0')
 * - commit: Lock to a specific commit SHA
 * - If none specified, uses the default branch
 */
export const repositories: Record<string, RepositoryConfig> = {
  'samber-golang': {
    url: 'https://github.com/samber/cc-skills-golang',
    tag: 'v1.9.0',
    skills: [
      { target: 'golang-benchmark', source: './skills/golang-benchmark/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-cli', source: './skills/golang-cli/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-code-style', source: './skills/golang-code-style/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-concurrency', source: './skills/golang-concurrency/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-context', source: './skills/golang-context/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-continuous-integration', source: './skills/golang-continuous-integration/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-data-structures', source: './skills/golang-data-structures/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-database', source: './skills/golang-database/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-dependency-injection', source: './skills/golang-dependency-injection/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-dependency-management', source: './skills/golang-dependency-management/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-design-patterns', source: './skills/golang-design-patterns/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-documentation', source: './skills/golang-documentation/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-error-handling', source: './skills/golang-error-handling/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-google-wire', source: './skills/golang-google-wire/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-gopls', source: './skills/golang-gopls/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-graphql', source: './skills/golang-graphql/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-grpc', source: './skills/golang-grpc/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-how-to', source: './skills/golang-how-to/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-lint', source: './skills/golang-lint/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-modernize', source: './skills/golang-modernize/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-naming', source: './skills/golang-naming/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-observability', source: './skills/golang-observability/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-performance', source: './skills/golang-performance/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-pkg-go-dev', source: './skills/golang-pkg-go-dev/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-popular-libraries', source: './skills/golang-popular-libraries/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-project-layout', source: './skills/golang-project-layout/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-refactoring', source: './skills/golang-refactoring/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-safety', source: './skills/golang-safety/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-samber-do', source: './skills/golang-samber-do/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-samber-hot', source: './skills/golang-samber-hot/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-samber-lo', source: './skills/golang-samber-lo/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-samber-mo', source: './skills/golang-samber-mo/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-samber-oops', source: './skills/golang-samber-oops/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-samber-ro', source: './skills/golang-samber-ro/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-samber-slog', source: './skills/golang-samber-slog/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-security', source: './skills/golang-security/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-spf13-cobra', source: './skills/golang-spf13-cobra/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-spf13-viper', source: './skills/golang-spf13-viper/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-stay-updated', source: './skills/golang-stay-updated/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-stretchr-testify', source: './skills/golang-stretchr-testify/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-structs-interfaces', source: './skills/golang-structs-interfaces/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-swagger', source: './skills/golang-swagger/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-testing', source: './skills/golang-testing/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-troubleshooting', source: './skills/golang-troubleshooting/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-uber-dig', source: './skills/golang-uber-dig/SKILL.md', excludes: ['evals/**'] },
      { target: 'golang-uber-fx', source: './skills/golang-uber-fx/SKILL.md', excludes: ['evals/**'] },
    ],
  },
  vercel: {
    url: 'https://github.com/vercel-labs/skills',
    skills: [{ target: 'find-skills', source: './skills/find-skills/SKILL.md' }],
  },
  'vercel-agent': {
    url: 'https://github.com/vercel-labs/agent-skills',
    skills: [
      { target: 'web-design-guidelines', source: './skills/web-design-guidelines/SKILL.md' },
      { target: 'react-best-practices', source: './skills/react-best-practices/SKILL.md' }
    ],
  },
  anthropics: {
    url: 'https://github.com/anthropics/skills',
    skills: [
      { target: 'frontend-design', source: './skills/frontend-design/SKILL.md', excludes: ['LICENSE.txt'] },
      { target: 'skill-creator', source: './skills/skill-creator/SKILL.md', excludes: ['LICENSE.txt'] },
    ],
  },
  'playwright-cli': {
    url: 'https://github.com/microsoft/playwright-cli',
    skills: [{ target: 'playwright-cli', source: './skills/playwright-cli/SKILL.md' }],
  },
  vueuse: {
    url: 'https://github.com/vueuse/skills',
    skills: [{ target: 'vueuse-functions', source: './skills/vueuse-functions/SKILL.md' }],
  },
  'vuejs-ai': {
    url: 'https://github.com/vuejs-ai/skills',
    skills: [
      { target: 'vue-best-practices', source: './skills/vue-best-practices/SKILL.md' },
      { target: 'vue-debug-guides', source: './skills/vue-debug-guides/SKILL.md' },
      { target: 'vue-jsx-best-practices', source: './skills/vue-jsx-best-practices/SKILL.md' },
      { target: 'vue-pinia-best-practices', source: './skills/vue-pinia-best-practices/SKILL.md' },
      { target: 'vue-router-best-practices', source: './skills/vue-router-best-practices/SKILL.md' },
      { target: 'vue-testing-best-practices', source: './skills/vue-testing-best-practices/SKILL.md' },
    ],
  },
  antfu: {
    url: 'https://github.com/antfu/skills',
    skills: [
      { target: 'vite', source: './skills/vite/SKILL.md', excludes: ['GENERATION.md'] },
      { target: 'vitest', source: './skills/vitest/SKILL.md', excludes: ['GENERATION.md'] },
      { target: 'unocss', source: './skills/unocss/SKILL.md', excludes: ['GENERATION.md'] },
      { target: 'antfu', source: './skills/antfu/SKILL.md' },
    ]
  },
  hono: {
    url: 'https://github.com/yusukebe/hono-skill',
    skills: [
      { target: 'hono-skills', source: './skills/hono/SKILL.md' }
    ],
  },
  'tanstack-agent': {
    url: 'https://github.com/deckardger/tanstack-agent-skills',
    skills: [
      { target: 'tanstack-integration', source: './skills/tanstack-integration/SKILL.md' },
      { target: 'tanstack-query', source: './skills/tanstack-query/SKILL.md' },
      { target: 'tanstack-router', source: './skills/tanstack-router/SKILL.md' },
      { target: 'tanstack-start', source: './skills/tanstack-start/SKILL.md' },
    ],
  },
  'mattpocock': {
    url: 'https://github.com/mattpocock/skills',
    tag: 'v1.1.0',
    skills: [
      { target: 'ask-matt', source: './skills/engineering/ask-matt/SKILL.md' },
      { target: 'code-review', source: './skills/engineering/code-review/SKILL.md' },
      { target: 'codebase-design', source: './skills/engineering/codebase-design/SKILL.md' },
      { target: 'diagnosing-bugs', source: './skills/engineering/diagnosing-bugs/SKILL.md' },
      { target: 'domain-modeling', source: './skills/engineering/domain-modeling/SKILL.md' },
      { target: 'grill-with-docs', source: './skills/engineering/grill-with-docs/SKILL.md' },
      { target: 'implement', source: './skills/engineering/implement/SKILL.md' },
      { target: 'improve-codebase-architecture', source: './skills/engineering/improve-codebase-architecture/SKILL.md' },
      { target: 'prototype', source: './skills/engineering/prototype/SKILL.md' },
      { target: 'research', source: './skills/engineering/research/SKILL.md' },
      { target: 'resolving-merge-conflicts', source: './skills/engineering/resolving-merge-conflicts/SKILL.md' },
      { target: 'setup-matt-pocock-skills', source: './skills/engineering/setup-matt-pocock-skills/SKILL.md' },
      { target: 'tdd', source: './skills/engineering/tdd/SKILL.md' },
      { target: 'to-spec', source: './skills/engineering/to-spec/SKILL.md' },
      { target: 'to-tickets', source: './skills/engineering/to-tickets/SKILL.md' },
      { target: 'triage', source: './skills/engineering/triage/SKILL.md' },
      { target: 'wayfinder', source: './skills/engineering/wayfinder/SKILL.md' },
      { target: 'grill-me', source: './skills/productivity/grill-me/SKILL.md' },
      { target: 'grilling', source: './skills/productivity/grilling/SKILL.md' },
      { target: 'handoff', source: './skills/productivity/handoff/SKILL.md' },
      { target: 'teach', source: './skills/productivity/teach/SKILL.md' },
      { target: 'writing-great-skills', source: './skills/productivity/writing-great-skills/SKILL.md' },
    ],
  },
  'shadcn-improve': {
    url: 'https://github.com/shadcn/improve',
    skills: [
      { target: 'improve', source: './skills/improve/SKILL.md' },
    ],
  },
  'tw93-waza': {
    url: 'https://github.com/tw93/Waza',
    tag: 'v3.32.0',
    skills: [
      { target: 'check', source: './skills/check/SKILL.md', excludes: ['scripts/check-update.sh'] },
      { target: 'ui', source: './skills/ui/SKILL.md', excludes: ['scripts/check-update.sh'] },
      { target: 'health', source: './skills/health/SKILL.md', excludes: ['scripts/check-update.sh'] },
      { target: 'hunt', source: './skills/hunt/SKILL.md', excludes: ['scripts/check-update.sh'] },
      { target: 'learn', source: './skills/learn/SKILL.md', excludes: ['scripts/check-update.sh'] },
      { target: 'read', source: './skills/read/SKILL.md', excludes: ['scripts/check-update.sh'] },
      { target: 'think', source: './skills/think/SKILL.md', excludes: ['scripts/check-update.sh'] },
      { target: 'write', source: './skills/write/SKILL.md', excludes: ['scripts/check-update.sh'] },
    ],
  },
  "baoyu-design": {
    url: "https://github.com/jimliu/baoyu-design",
    skills: [
      { target: "baoyu-design", source: "./skills/baoyu-design/SKILL.md" },
    ],
  },
  'baoyu': {
    url: 'https://github.com/JimLiu/baoyu-skills',
  },
  'obra-superpowers': {
    url: 'https://github.com/obra/superpowers',
  },
  'humanizer-zh': {
    url: 'https://github.com/op7418/Humanizer-zh',
    skills: [
      // { target: 'humanizer-zh', source: './SKILL.md', includes: ['README.md', 'LICENSE'], excludes: ['LICENSE'] },
    ],
  },
  'humanizer': {
    url: 'https://github.com/blader/humanizer',
  },
}
