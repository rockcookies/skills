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
