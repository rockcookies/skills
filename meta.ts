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
    tag: 'v2.0.0',
    transforms: { skills: ['strip-samber'] },
    skills: [
      { name: 'golang-benchmark', source: './skills/golang-benchmark/SKILL.md' },
      { name: 'golang-cli', source: './skills/golang-cli/SKILL.md' },
      { name: 'golang-code-style', source: './skills/golang-code-style/SKILL.md' },
      { name: 'golang-concurrency', source: './skills/golang-concurrency/SKILL.md' },
      { name: 'golang-context', source: './skills/golang-context/SKILL.md' },
      { name: 'golang-continuous-integration', source: './skills/golang-continuous-integration/SKILL.md' },
      { name: 'golang-data-structures', source: './skills/golang-data-structures/SKILL.md' },
      { name: 'golang-database', source: './skills/golang-database/SKILL.md' },
      { name: 'golang-dependency-injection', source: './skills/golang-dependency-injection/SKILL.md' },
      { name: 'golang-dependency-management', source: './skills/golang-dependency-management/SKILL.md' },
      { name: 'golang-design-patterns', source: './skills/golang-design-patterns/SKILL.md' },
      { name: 'golang-documentation', source: './skills/golang-documentation/SKILL.md' },
      { name: 'golang-error-handling', source: './skills/golang-error-handling/SKILL.md' },
      { name: 'golang-google-wire', source: './skills/golang-google-wire/SKILL.md' },
      { name: 'golang-gopls', source: './skills/golang-gopls/SKILL.md' },
      { name: 'golang-graphql', source: './skills/golang-graphql/SKILL.md' },
      { name: 'golang-grpc', source: './skills/golang-grpc/SKILL.md' },
      { name: 'golang-how-to', source: './skills/golang-how-to/SKILL.md' },
      { name: 'golang-lint', source: './skills/golang-lint/SKILL.md' },
      { name: 'golang-modernize', source: './skills/golang-modernize/SKILL.md' },
      { name: 'golang-naming', source: './skills/golang-naming/SKILL.md' },
      { name: 'golang-observability', source: './skills/golang-observability/SKILL.md' },
      { name: 'golang-performance', source: './skills/golang-performance/SKILL.md' },
      { name: 'golang-pkg-go-dev', source: './skills/golang-pkg-go-dev/SKILL.md' },
      { name: 'golang-popular-libraries', source: './skills/golang-popular-libraries/SKILL.md' },
      { name: 'golang-project-layout', source: './skills/golang-project-layout/SKILL.md' },
      { name: 'golang-refactoring', source: './skills/golang-refactoring/SKILL.md' },
      { name: 'golang-safety', source: './skills/golang-safety/SKILL.md' },
      { name: 'golang-samber-do', source: './skills/golang-samber-do/SKILL.md' },
      { name: 'golang-samber-hot', source: './skills/golang-samber-hot/SKILL.md' },
      { name: 'golang-samber-lo', source: './skills/golang-samber-lo/SKILL.md' },
      { name: 'golang-samber-mo', source: './skills/golang-samber-mo/SKILL.md' },
      { name: 'golang-samber-oops', source: './skills/golang-samber-oops/SKILL.md' },
      { name: 'golang-samber-ro', source: './skills/golang-samber-ro/SKILL.md' },
      { name: 'golang-samber-slog', source: './skills/golang-samber-slog/SKILL.md' },
      { name: 'golang-security', source: './skills/golang-security/SKILL.md' },
      { name: 'golang-spf13-cobra', source: './skills/golang-spf13-cobra/SKILL.md' },
      { name: 'golang-spf13-viper', source: './skills/golang-spf13-viper/SKILL.md' },
      { name: 'golang-stay-updated', source: './skills/golang-stay-updated/SKILL.md' },
      { name: 'golang-stretchr-testify', source: './skills/golang-stretchr-testify/SKILL.md' },
      { name: 'golang-structs-interfaces', source: './skills/golang-structs-interfaces/SKILL.md' },
      { name: 'golang-swagger', source: './skills/golang-swagger/SKILL.md' },
      { name: 'golang-testing', source: './skills/golang-testing/SKILL.md' },
      { name: 'golang-troubleshooting', source: './skills/golang-troubleshooting/SKILL.md' },
      { name: 'golang-uber-dig', source: './skills/golang-uber-dig/SKILL.md' },
      { name: 'golang-uber-fx', source: './skills/golang-uber-fx/SKILL.md' },
    ],
  },
  vercel: {
    url: 'https://github.com/vercel-labs/skills',
    skills: [{ name: 'find-skills', source: './skills/find-skills/SKILL.md' }],
  },
  'vercel-agent-browser': {
    url: 'https://github.com/vercel-labs/agent-browser',
    skills: [
      { name: 'agent-browser', source: './skills/agent-browser/SKILL.md' },
    ],
  },
  'vercel-agent': {
    url: 'https://github.com/vercel-labs/agent-skills',
    skills: [
      { name: 'web-design-guidelines', source: './skills/web-design-guidelines/SKILL.md' },
      { name: 'react-best-practices', source: './skills/react-best-practices/SKILL.md' }
    ],
  },
  anthropics: {
    url: 'https://github.com/anthropics/skills',
    transforms: { skills: ['exclude-license-txt'] },
    skills: [
      { name: 'frontend-design', source: './skills/frontend-design/SKILL.md' },
      { name: 'skill-creator', source: './skills/skill-creator/SKILL.md' },
    ],
  },
  'playwright-cli': {
    url: 'https://github.com/microsoft/playwright-cli',
    skills: [{ name: 'playwright-cli', source: './skills/playwright-cli/SKILL.md' }],
  },
  vueuse: {
    url: 'https://github.com/vueuse/skills',
    skills: [{ name: 'vueuse-functions', source: './skills/vueuse-functions/SKILL.md' }],
  },
  'vuejs-ai': {
    url: 'https://github.com/vuejs-ai/skills',
    skills: [
      { name: 'vue-best-practices', source: './skills/vue-best-practices/SKILL.md' },
      { name: 'vue-debug-guides', source: './skills/vue-debug-guides/SKILL.md' },
      { name: 'vue-jsx-best-practices', source: './skills/vue-jsx-best-practices/SKILL.md' },
      { name: 'vue-options-api-best-practices', source: './skills/vue-options-api-best-practices/SKILL.md' },
      { name: 'vue-pinia-best-practices', source: './skills/vue-pinia-best-practices/SKILL.md' },
      { name: 'vue-router-best-practices', source: './skills/vue-router-best-practices/SKILL.md' },
      { name: 'vue-testing-best-practices', source: './skills/vue-testing-best-practices/SKILL.md' },
    ],
  },
  antfu: {
    url: 'https://github.com/antfu/skills',
    transforms: { skills: ['exclude-generation-md'] },
    skills: [
      { name: 'vite', source: './skills/vite/SKILL.md' },
      { name: 'vitest', source: './skills/vitest/SKILL.md' },
      { name: 'unocss', source: './skills/unocss/SKILL.md' },
      { name: 'antfu', source: './skills/antfu/SKILL.md' },
    ]
  },
  hono: {
    url: 'https://github.com/honojs/skills',
    skills: [
      { name: 'hono', source: './skills/hono/SKILL.md' },
      { name: 'hono-jsx', source: './skills/hono-jsx/SKILL.md' }
    ],
  },
  'tanstack-agent': {
    url: 'https://github.com/deckardger/tanstack-agent-skills',
    skills: [
      { name: 'tanstack-integration', source: './skills/tanstack-integration/SKILL.md' },
      { name: 'tanstack-query', source: './skills/tanstack-query/SKILL.md' },
      { name: 'tanstack-router', source: './skills/tanstack-router/SKILL.md' },
      { name: 'tanstack-start', source: './skills/tanstack-start/SKILL.md' },
    ],
  },
  'mattpocock': {
    url: 'https://github.com/mattpocock/skills',
    tag: 'v1.2.3',
    skills: [
      // engineering
      { name: 'ask-matt', source: './skills/engineering/ask-matt/SKILL.md' },
      { name: 'code-review', source: './skills/engineering/code-review/SKILL.md' },
      { name: 'codebase-design', source: './skills/engineering/codebase-design/SKILL.md' },
      { name: 'diagnosing-bugs', source: './skills/engineering/diagnosing-bugs/SKILL.md' },
      { name: 'domain-modeling', source: './skills/engineering/domain-modeling/SKILL.md' },
      { name: 'grill-with-docs', source: './skills/engineering/grill-with-docs/SKILL.md' },
      { name: 'implement', source: './skills/engineering/implement/SKILL.md' },
      { name: 'improve-codebase-architecture', source: './skills/engineering/improve-codebase-architecture/SKILL.md' },
      { name: 'prototype', source: './skills/engineering/prototype/SKILL.md' },
      { name: 'research', source: './skills/engineering/research/SKILL.md' },
      { name: 'resolving-merge-conflicts', source: './skills/engineering/resolving-merge-conflicts/SKILL.md' },
      { name: 'setup-matt-pocock-skills', source: './skills/engineering/setup-matt-pocock-skills/SKILL.md' },
      { name: 'tdd', source: './skills/engineering/tdd/SKILL.md' },
      { name: 'to-spec', source: './skills/engineering/to-spec/SKILL.md' },
      { name: 'to-tickets', source: './skills/engineering/to-tickets/SKILL.md' },
      { name: 'triage', source: './skills/engineering/triage/SKILL.md' },
      { name: 'wayfinder', source: './skills/engineering/wayfinder/SKILL.md' },
      { name: 'wizard', source: './skills/engineering/wizard/SKILL.md' },
      // productivity
      { name: 'grill-me', source: './skills/productivity/grill-me/SKILL.md' },
      { name: 'grilling', source: './skills/productivity/grilling/SKILL.md' },
      { name: 'handoff', source: './skills/productivity/handoff/SKILL.md' },
      { name: 'teach', source: './skills/productivity/teach/SKILL.md' },
      { name: 'to-questionnaire', source: './skills/productivity/to-questionnaire/SKILL.md' },
      { name: 'wait-what', source: './skills/productivity/wait-what/SKILL.md' },
      { name: 'writing-for-agents', source: './skills/productivity/writing-for-agents/SKILL.md' },
    ],
  },
  'shadcn-improve': {
    url: 'https://github.com/shadcn/improve',
    skills: [
      { name: 'improve', source: './skills/improve/SKILL.md' },
    ],
  },
  'impeccable': {
    url: 'https://github.com/pbakaus/impeccable',
    skills: [
      { name: 'impeccable', source: './.claude/skills/impeccable/SKILL.md' },
    ],
    agents: [
      { name: 'impeccable-asset-producer', source: './.claude/agents/impeccable-asset-producer.md' },
      { name: 'impeccable-documenter', source: './.claude/agents/impeccable-documenter.md' },
      { name: 'impeccable-finish-reviewer', source: './.claude/agents/impeccable-finish-reviewer.md' },
      { name: 'impeccable-manual-edit-applier', source: './.claude/agents/impeccable-manual-edit-applier.md' },
    ],
  },
  'cursor-plugins': {
    url: 'https://github.com/cursor/plugins',
    skills: [
      { name: 'encode-lessons-in-structure', source: './pstack/skills/principle-encode-lessons-in-structure/SKILL.md' },
      { name: 'boundary-discipline', source: './pstack/skills/principle-boundary-discipline/SKILL.md' },
      { name: 'type-system-discipline', source: './pstack/skills/principle-type-system-discipline/SKILL.md' },
      { name: 'typescript-best-practices', source: './pstack/skills/typescript-best-practices/SKILL.md' },
      { name: 'laziness-protocol', source: './pstack/skills/principle-laziness-protocol/SKILL.md' },
      { name: 'subtract-before-you-add', source: './pstack/skills/principle-subtract-before-you-add/SKILL.md' },
      { name: 'foundational-thinking', source: './pstack/skills/principle-foundational-thinking/SKILL.md' },
      { name: 'build-the-lever', source: './pstack/skills/principle-build-the-lever/SKILL.md', transforms: ['strip-principle-prefix'] },
      { name: 'migrate-callers-then-delete-legacy-apis', source: './pstack/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md' },
      { name: 'prove-it-works', source: './pstack/skills/principle-prove-it-works/SKILL.md' },
      { name: 'fix-root-causes', source: './pstack/skills/principle-fix-root-causes/SKILL.md' },
      { name: 'redesign-from-first-principles', source: './pstack/skills/principle-redesign-from-first-principles/SKILL.md' },
      { name: 'exhaust-the-design-space', source: './pstack/skills/principle-exhaust-the-design-space/SKILL.md' },
      { name: 'outcome-oriented-execution', source: './pstack/skills/principle-outcome-oriented-execution/SKILL.md' },
      { name: 'separate-before-serializing-shared-state', source: './pstack/skills/principle-separate-before-serializing-shared-state/SKILL.md' },

      { name: 'thermos', source: './thermos/skills/thermos/SKILL.md' },
      { name: 'thermo-nuclear-review', source: './thermos/skills/thermo-nuclear-review/SKILL.md' },
      { name: 'thermo-nuclear-code-quality-review', source: './thermos/skills/thermo-nuclear-code-quality-review/SKILL.md' },
      { name: 'unslop', source: './pstack/skills/unslop/SKILL.md' },
      { name: 'how', source: './pstack/skills/how/SKILL.md' },
      { name: 'why', source: './pstack/skills/why/SKILL.md' },
      { name: 'technical-writing', source: './pstack/skills/technical-writing/SKILL.md' },
      { name: 'pstack-tdd', source: './pstack/skills/tdd/SKILL.md' },
      { name: 'create-verification-skill', source: './pstack/skills/create-verification-skill/SKILL.md' },
      { name: 'maintain-verification-skill', source: './pstack/skills/maintain-verification-skill/SKILL.md' },
      { name: 'show-me-your-work', source: './pstack/skills/show-me-your-work/SKILL.md' },
      { name: 'interrogate', source: './pstack/skills/interrogate/SKILL.md' },
      { name: 'arena', source: './pstack/skills/arena/SKILL.md' },
      { name: 'swarm', source: './pstack/skills/swarm/SKILL.md' },
      { name: 'blast-radius', source: './pstack/skills/blast-radius/SKILL.md' },
      { name: 'architect', source: './pstack/skills/architect/SKILL.md' },
    ],
    agents: [
      { name: 'thermo-nuclear-review-subagent', source: './thermos/agents/thermo-nuclear-review-subagent.md' },
      { name: 'thermo-nuclear-code-quality-review-subagent', source: './thermos/agents/thermo-nuclear-code-quality-review-subagent.md' },
    ],
  },
  'tw93-waza': {
    url: 'https://github.com/tw93/Waza',
    tag: 'v3.38.0',
    skills: [
      { name: 'check', source: './skills/check/SKILL.md' },
      { name: 'ui', source: './skills/ui/SKILL.md' },
      { name: 'health', source: './skills/health/SKILL.md' },
      { name: 'hunt', source: './skills/hunt/SKILL.md' },
      { name: 'learn', source: './skills/learn/SKILL.md' },
      { name: 'read', source: './skills/read/SKILL.md' },
      { name: 'think', source: './skills/think/SKILL.md' },
      { name: 'write', source: './skills/write/SKILL.md' },
    ],
  },
  'tw93-kami': {
    url: 'https://github.com/tw93/Kami',
    tag: 'V1.17.0',
    skills: [
      { name: 'kami', source: './skills/kami/SKILL.md' }
    ],
  },
  'majiayu-spellbook': {
    url: 'https://github.com/majiayu000/spellbook',
    skills: [
      { name: 'figma-to-react', source: './skills/figma-to-react/SKILL.md' },
      { name: 'clash-doctor', source: './skills/clash-doctor/SKILL.md' },
      { name: 'clash-routes', source: './skills/clash-routes/SKILL.md' },
      { name: 'ip-check', source: './skills/ip-check/SKILL.md' },
      { name: 'codebase-audit', source: './skills/codebase-audit/SKILL.md' },
    ]
  },
  'humanlayer': {
    url: 'https://github.com/humanlayer/skills',
    skills: [
      { name: 'show-me', source: './plugins/show-me/skills/show-me/SKILL.md' },
    ],
  },
  'zhaoxuya520-reverse': {
    url: 'https://github.com/zhaoxuya520/reverse-skill',
  },
  "baoyu-design": {
    url: "https://github.com/jimliu/baoyu-design",
    skills: [
      { name: "baoyu-design", source: "./skills/baoyu-design/SKILL.md" },
    ],
  },
  'baoyu': {
    url: 'https://github.com/JimLiu/baoyu-skills',
    skills: [
      { name: 'baoyu-image-gen', source: './skills/baoyu-image-gen/SKILL.md' },
      { name: 'baoyu-infographic', source: './skills/baoyu-infographic/SKILL.md' },
    ]
  },
  'humanizer-zh': {
    url: 'https://github.com/op7418/Humanizer-zh',
    skills: [
      // { name: 'humanizer-zh', source: './SKILL.md' },
    ],
  },
  'humanizer': {
    url: 'https://github.com/blader/humanizer',
  },
}
