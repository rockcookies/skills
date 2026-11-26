# Week Retro Templates

Load when filling evidence grades, collection notes, audits, candidates, evals, or anti-patterns.

## Evidence Grade

所有候选改进必须先定级，等级不够就不能往下走：

| 等级 | 含义 | 允许的动作 |
|---|---|---|
| E0 | 只有直觉/社区观点，本周无实际证据 | 不形成改进建议 |
| E1 | 本周发生过一次 | 只记录为观察项 |
| E2 | 本周重复发生，或跨多个相关任务出现 | 可以形成 Candidate |
| E3 | 重复发生 + 造成可观察成本（返工/等待/上下文污染/错误/遗漏） | 可以建议 Promote |
| E4 | 已应用改进，并在后续任务中观察到稳定改善 | 可以建议固化 |

不因社区实践「流行」就制造本地改进需求；不把一次偶发事故直接升级成全局规则。

## Evidence Collection Notes

- 缺的部分跳过并在报告里标「不可用」。
- 会话：标题、摘要、更新时间、必要短摘录；不整篇复制私密 transcript。
- 计划：优先 overview / key decisions / current status / validation / blockers。
- 路径用中性占位（「宿主计划目录」「会话索引」）。

## Workstream

```
Workstream / Representative sessions / Representative plans / Main outcome
```

## Friction

```
Observed:        发生了什么？
Impact:          造成什么成本？
Evidence:        Evidence Grade（E0–E4）+ 具体依据
Pattern:         是否重复发生？
Likely root cause: 为什么发生？
```

根因分类：`routing / context / session boundary / planning / verification / tooling / environment / skill design / instruction conflict / missing automation`。

## Skill Routing Audit

Skill 系统两层问题分开看：**Selection** vs **Execution**。

```
Skill:
Expected trigger:
Observed trigger:
Correctly selected:   yes/no
False positive:       yes/no
False negative:       yes/no
Execution quality:    ok / issue
```

## Gotchas / Failure Patterns

只记录本周实际发生的失败模式：

```
Gotcha:        模型/流程实际做错了什么
Why it happens: 触发条件
Correction:     应该怎么 route / 怎么约束
```

不为「显得完整」虚构 edge case。

## Candidate

必须经过 `Observation → Pattern → Root Cause → Candidate`：

```
Candidate:
What:              改什么
Where:             放在哪里（某 Skill / 某 command / 某 session 规则 / 某 routing description）
Scope:             session / workflow / project / global（默认取最小必要 scope）
Trigger:           什么时候触发
Constraint:        什么时候不要触发
Expected benefit:
Evidence:          E几
Confidence:        low/medium/high
```

### Promote

须全部满足：E2+ 且有重复模式；简短可执行的 workflow constraint；跨项目可复用；明确触发；不与现有规则冲突。说明 `Change surface`。

### Reject

```
Reject:
Reason:
Keep as:   project-local documentation
```

## Evaluation

```
Hypothesis:
Baseline:
Change:
Measure:
Success criteria:
Review window:
```

## Decision Ledger（可选）

```
Decision: ... | Evidence: E几 | Scope: ... | Status: observed/candidate/promoted/rejected/deprecated | Validation: ...
```

status 随后续周验证推进或撤销；不因一次周报永久固化。

## Anti-Patterns

```
Community says X            → 不能直接 promote X
One failure                 → 不能直接创建永久规则
Long transcript             → 不等于需要长回顾
More instructions           → 不等于更好的 Skill
More Skill content          → 不等于更好的行为
Project-specific solution   → 不能直接变成 global rule
Model mistake               → 不要立刻改 workflow，先定级证据
No verification             → 不能标记为「改进成功」
```

核心原则：**Week Retro 是 workflow learning loop，不是 weekly diary。** 目标是让 agent workflow 在真实任务中持续收敛，不是产生越来越长的规则集。
