import type { Dependencies } from './src/types'

/**
 * Dependency declarations, partitioned by SourceKind, keyed by dest name within each kind.
 *
 * Keys and refs must resolve to: mapped skill/agent/rule (skills|agents|rules/{repoKey}/{name})
 * or a hand-maintained custom skill (skills/custom/{name}).
 * 语义：运行时会读取/调用的才算依赖；纯路由交叉引用（如 grill-and-think ↔ cursor-plan-pipeline、
 * → hunt）不算。commands 引用在该类落地前一律解析为悬空。
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
  },
  agents: {
    'impeccable-asset-producer': { skills: ['impeccable'] },
    'impeccable-finish-reviewer': { skills: ['impeccable'] },
    'impeccable-manual-edit-applier': { skills: ['impeccable'] },
  },
  rules: {},
  commands: {},
}
