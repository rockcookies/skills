import type { Dependencies } from './src/types'

/**
 * Dependency declarations, partitioned by SourceKind, keyed by dest name within each kind.
 *
 * Keys and refs must resolve to: mapped skill/agent/rule (skills|agents|rules/{repoKey}/{name})
 * or a hand-maintained custom skill (skills/custom/{name}).
 * 语义：运行时会读取/调用的才算依赖；纯路由交叉引用（如 grill-and-think → hunt、
 * ask-matt 的全文件路由）、frontmatter 触发词、降级提示不算。指名道姓的条件交接
 * （learn → read "if not installed, warn once"）收录，多装无害。
 * commands 引用在该类落地前一律解析为悬空。仓库外条目（poteto-mode、pstack-models.mdc、
 * Codex imagegen）不声明，避免永久悬空。
 */
export const dependencies: Dependencies = {
  skills: {
    'grill-and-think': {
      skills: ['grill-me', 'grill-with-docs', 'think', 'check', 'git-atomic-commit'],
    },
    'cursor-plan-pipeline': {
      skills: ['grilling', 'domain-modeling', 'think', 'check', 'git-atomic-commit'],
    },
    thermos: {
      agents: ['thermo-nuclear-review-subagent', 'thermo-nuclear-code-quality-review-subagent'],
    },
    impeccable: {
      agents: [
        'impeccable-asset-producer',
        'impeccable-documenter',
        'impeccable-finish-reviewer',
        'impeccable-manual-edit-applier',
      ],
    },

    'grill-me': { skills: ['grilling'] },
    'grill-with-docs': { skills: ['grilling', 'domain-modeling'] },
    implement: { skills: ['tdd', 'code-review'] },
    'implement-spec': { skills: ['tdd', 'code-review'] },
    'improve-codebase-architecture': { skills: ['codebase-design', 'grilling', 'domain-modeling'] },
    tdd: { skills: ['codebase-design'] },
    triage: { skills: ['grilling', 'domain-modeling'] },
    wayfinder: { skills: ['research', 'prototype', 'grilling', 'domain-modeling'] },
    retro: { skills: ['writing-for-agents'] },

    check: { skills: ['write'] },
    health: { skills: ['retro'] },
    learn: { skills: ['read', 'write'] },
    kami: { skills: ['write'] },

    'show-me-your-work': { skills: ['unslop'] },
    'technical-writing': { skills: ['unslop'] },
    'typescript-best-practices': { skills: ['principle-type-system-discipline'] },
    'principle-explain-the-number': { skills: ['benchmark-checklist'] },

    'technical-writing-zh': { skills: ['unslop', 'technical-writing'] },
    'web-code-style': {
      skills: ['typescript-best-practices', 'principle-type-system-discipline', 'react-best-practices'],
    },
    'web-css-guidelines': { skills: ['web-code-style', 'unocss'] },

    'baoyu-infographic': { skills: ['baoyu-image-gen'] },

    // samber-golang 家族：统一习语是 frontmatter 边界（Not for → 路由，不收）+
    // 正文/结尾的「→ See golang-X skill」委托（运行时读取，收）。
    'golang-benchmark': {
      skills: ['golang-performance', 'golang-troubleshooting', 'golang-testing', 'golang-observability'],
    },
    'golang-cli': {
      skills: ['golang-dependency-injection', 'golang-design-patterns', 'golang-project-layout', 'golang-testing'],
    },
    'golang-code-style': {
      skills: [
        'golang-design-patterns',
        'golang-naming',
        'golang-structs-interfaces',
        'golang-gopls',
        'golang-lint',
        'golang-continuous-integration',
        'golang-refactoring',
      ],
    },
    'golang-concurrency': {
      skills: [
        'golang-performance',
        'golang-context',
        'golang-safety',
        'golang-troubleshooting',
        'golang-design-patterns',
        'golang-continuous-integration',
      ],
    },
    'golang-context': {
      skills: [
        'golang-concurrency',
        'golang-database',
        'golang-observability',
        'golang-design-patterns',
        'golang-lint',
      ],
    },
    'golang-continuous-integration': {
      skills: [
        'golang-lint',
        'golang-cli',
        'golang-context',
        'golang-data-structures',
        'golang-database',
        'golang-dependency-injection',
        'golang-dependency-management',
        'golang-modernize',
        'golang-security',
        'golang-testing',
      ],
    },
    'golang-data-structures': {
      skills: [
        'golang-concurrency',
        'golang-design-patterns',
        'golang-safety',
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-performance',
        'golang-structs-interfaces',
        'golang-code-style',
      ],
    },
    'golang-database': { skills: ['golang-security', 'golang-context', 'golang-error-handling', 'golang-testing'] },
    'golang-dependency-injection': {
      skills: ['golang-structs-interfaces', 'golang-samber-do', 'golang-testing', 'golang-project-layout'],
    },
    'golang-dependency-management': {
      skills: ['golang-popular-libraries', 'golang-pkg-go-dev', 'golang-continuous-integration', 'golang-security'],
    },
    'golang-design-patterns': {
      skills: [
        'golang-context',
        'golang-error-handling',
        'golang-structs-interfaces',
        'golang-code-style',
        'golang-security',
        'golang-database',
        'golang-project-layout',
        'golang-data-structures',
        'golang-concurrency',
        'golang-refactoring',
      ],
    },
    'golang-documentation': {
      skills: ['golang-naming', 'golang-project-layout', 'golang-testing', 'golang-pkg-go-dev'],
    },
    'golang-error-handling': {
      skills: [
        'golang-samber-oops',
        'golang-observability',
        'golang-safety',
        'golang-naming',
        'golang-continuous-integration',
      ],
    },
    'golang-google-wire': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-dependency-injection',
        'golang-uber-dig',
        'golang-uber-fx',
        'golang-samber-do',
        'golang-structs-interfaces',
        'golang-testing',
      ],
    },
    'golang-gopls': { skills: ['golang-pkg-go-dev', 'golang-security', 'golang-how-to'] },
    'golang-graphql': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-error-handling',
        'golang-context',
        'golang-testing',
        'golang-observability',
        'golang-security',
        'golang-database',
      ],
    },
    'golang-grpc': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-context',
        'golang-error-handling',
        'golang-observability',
        'golang-testing',
      ],
    },
    'golang-how-to': {
      skills: [
        'golang-design-patterns',
        'golang-naming',
        'golang-structs-interfaces',
        'golang-code-style',
        'golang-error-handling',
        'golang-safety',
        'golang-concurrency',
        'golang-context',
        'golang-database',
        'golang-security',
        'golang-grpc',
        'golang-testing',
        'golang-graphql',
        'golang-cli',
        'golang-spf13-cobra',
        'golang-spf13-viper',
        'golang-stretchr-testify',
        'golang-benchmark',
        'golang-performance',
        'golang-troubleshooting',
        'golang-observability',
        'golang-lint',
        'golang-project-layout',
        'golang-refactoring',
        'golang-documentation',
        'golang-dependency-injection',
        'golang-continuous-integration',
        'golang-popular-libraries',
        'golang-dependency-management',
        'golang-pkg-go-dev',
        'golang-gopls',
        'golang-modernize',
        'golang-data-structures',
        'golang-samber-lo',
        'golang-samber-oops',
        'golang-samber-slog',
        'golang-google-wire',
        'golang-samber-do',
        'golang-uber-dig',
        'golang-uber-fx',
        'golang-stay-updated',
        'golang-swagger',
        'golang-samber-hot',
        'golang-samber-mo',
        'golang-samber-ro',
      ],
    },
    'golang-lint': { skills: ['golang-continuous-integration', 'golang-code-style', 'golang-security'] },
    'golang-modernize': {
      skills: [
        'golang-gopls',
        'golang-lint',
        'golang-continuous-integration',
        'golang-concurrency',
        'golang-error-handling',
        'golang-observability',
        'golang-testing',
        'golang-refactoring',
      ],
    },
    'golang-naming': {
      skills: ['golang-gopls', 'golang-lint', 'golang-code-style', 'golang-structs-interfaces', 'golang-refactoring'],
    },
    'golang-observability': {
      skills: ['golang-context', 'golang-error-handling', 'golang-security', 'golang-troubleshooting'],
    },
    'golang-performance': {
      skills: [
        'golang-troubleshooting',
        'golang-database',
        'golang-benchmark',
        'golang-concurrency',
        'golang-data-structures',
        'golang-safety',
        'golang-observability',
      ],
    },
    'golang-pkg-go-dev': { skills: ['golang-gopls', 'golang-how-to', 'golang-security'] },
    'golang-popular-libraries': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-dependency-management',
        'golang-samber-do',
        'golang-samber-hot',
        'golang-samber-oops',
        'golang-stretchr-testify',
        'golang-grpc',
      ],
    },
    'golang-project-layout': {
      skills: [
        'golang-design-patterns',
        'golang-dependency-injection',
        'golang-naming',
        'golang-lint',
        'golang-how-to',
        'golang-cli',
        'golang-continuous-integration',
        'golang-refactoring',
      ],
    },
    'golang-refactoring': {
      skills: [
        'golang-gopls',
        'golang-safety',
        'golang-security',
        'golang-naming',
        'golang-project-layout',
        'golang-modernize',
        'golang-code-style',
        'golang-design-patterns',
        'golang-testing',
        'golang-lint',
      ],
    },
    'golang-safety': {
      skills: [
        'golang-concurrency',
        'golang-security',
        'golang-design-patterns',
        'golang-lint',
        'golang-data-structures',
        'golang-error-handling',
        'golang-troubleshooting',
        'golang-continuous-integration',
      ],
    },
    'golang-samber-do': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-dependency-injection',
        'golang-structs-interfaces',
        'golang-testing',
      ],
    },
    'golang-samber-hot': {
      skills: ['golang-gopls', 'golang-pkg-go-dev', 'golang-performance', 'golang-observability', 'golang-database'],
    },
    'golang-samber-lo': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-samber-ro',
        'golang-samber-mo',
        'golang-data-structures',
        'golang-performance',
      ],
    },
    'golang-samber-mo': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-samber-lo',
        'golang-error-handling',
        'golang-safety',
        'golang-database',
        'golang-design-patterns',
      ],
    },
    'golang-samber-oops': {
      skills: ['golang-gopls', 'golang-pkg-go-dev', 'golang-error-handling', 'golang-observability'],
    },
    'golang-samber-ro': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-samber-lo',
        'golang-samber-mo',
        'golang-samber-hot',
        'golang-concurrency',
        'golang-observability',
      ],
    },
    'golang-samber-slog': {
      skills: [
        'golang-gopls',
        'golang-pkg-go-dev',
        'golang-observability',
        'golang-error-handling',
        'golang-security',
        'golang-samber-oops',
      ],
    },
    'golang-security': {
      skills: [
        'golang-lint',
        'golang-dependency-management',
        'golang-pkg-go-dev',
        'golang-continuous-integration',
        'golang-database',
        'golang-observability',
        'golang-safety',
      ],
    },
    'golang-spf13-cobra': {
      skills: ['golang-gopls', 'golang-pkg-go-dev', 'golang-spf13-viper', 'golang-cli', 'golang-testing'],
    },
    'golang-spf13-viper': {
      skills: ['golang-gopls', 'golang-pkg-go-dev', 'golang-spf13-cobra', 'golang-cli', 'golang-testing'],
    },
    'golang-stay-updated': { skills: ['golang-pkg-go-dev'] },
    'golang-stretchr-testify': { skills: ['golang-gopls', 'golang-pkg-go-dev', 'golang-lint', 'golang-testing'] },
    'golang-structs-interfaces': {
      skills: [
        'golang-naming',
        'golang-design-patterns',
        'golang-dependency-injection',
        'golang-code-style',
        'golang-gopls',
      ],
    },
    'golang-swagger': { skills: ['golang-security', 'golang-grpc', 'golang-gopls', 'golang-pkg-go-dev'] },
    'golang-testing': {
      skills: [
        'golang-benchmark',
        'golang-lint',
        'golang-stretchr-testify',
        'golang-database',
        'golang-concurrency',
        'golang-continuous-integration',
      ],
    },
    'golang-troubleshooting': {
      skills: [
        'golang-gopls',
        'golang-performance',
        'golang-observability',
        'golang-concurrency',
        'golang-error-handling',
        'golang-safety',
      ],
    },
  },
  agents: {
    'impeccable-asset-producer': { skills: ['impeccable'] },
    'impeccable-finish-reviewer': { skills: ['impeccable'] },
    'impeccable-manual-edit-applier': { skills: ['impeccable'] },
    'thermo-nuclear-review-subagent': { skills: ['thermo-nuclear-review'] },
    'thermo-nuclear-code-quality-review-subagent': { skills: ['thermo-nuclear-code-quality-review'] },
  },
  rules: {},
  commands: {},
}
