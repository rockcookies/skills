---
name: week-retro
description: >-
  跨运行时周回顾与 workflow learning loop：从本周真实会话与计划提取证据，按
  Evidence → Friction/Success → Root Cause → Candidate → Promote/Reject → Eval
  闭环分析；区分可跨项目复用的流水线约束与不可提升的项目特例；审查 Skill
  Selection vs Execution。只报告与建议，不自动改全局文件。用于 week-retro、
  周回顾、优化 workflow、Skill 路由审查、上下文卫生检查。Not for weekly diary.
  Not for live incident 排障 (→ hunt).
when_to_use: >-
  week-retro, 周回顾, 优化 workflow, 社区 AI 技巧, skill routing audit,
  context hygiene
user-invocable: true
metadata:
  author: rockcookies
  version: 1.1.0
---

# Week Retro

**workflow learning loop**，不是「总结做了什么」的周报：

```
Evidence → Work Pattern → Friction/Success → Root Cause
  → Candidate → Promote/Reject → Scope + Eval → Next Week Verify
```

核心问题：

1. 本周哪些工作方式已证明有效，值得保留？
2. 哪些摩擦反复发生？
3. 摩擦的根因是什么（routing / context / session 边界 / 验证缺失 / 环境）？
4. 哪些经验有跨项目复用价值，可写成薄规则？
5. 哪些只是项目特例，必须拒绝提升？
6. 下一周怎么验证候选改进是否真的有效？

**只报告与建议，不自动修改 `AGENTS.md`、`CLAUDE.md`、全局 rules、skills 或其他全局配置**，除非用户在本轮明确授权某项具体改动。

> **Community practice can explain a local problem, but cannot create a local problem.**
> 社区实践可以解释本地问题，但不能替你制造改进需求。

填写表格与审计模板时加载 [templates.md](./references/templates.md)。用户明确要求社区技巧、或本地摩擦需要外部对照时，再加载 [community.md](./references/community.md)。

---

## 1. Scope

**完成标准：** 时间窗与分析范围已锁定。

- 默认时间窗：最近 7 个自然日（含今天）；用户指定日期范围以用户为准。
- 默认只分析与当前请求相关的会话、计划与工作流；只有用户明确要求「跨项目 / 全量 / 所有会话 / 长周期趋势」时才扩大范围。

## 2. Collect Evidence

**完成标准：** 可用证据已并行收集；缺失项在报告里标「不可用」，不编造、不报成故障。

尽量并行收集。填充分级与收集细则见 [templates.md](./references/templates.md)。

1. **会话历史**：宿主对话/会话索引（标题、摘要、更新时间、必要短摘录）。不整篇复制私密 transcript。
2. **计划文件**：宿主计划目录里本周更新的计划；优先 overview / key decisions / current status / validation / blockers。
3. **社区实践（可选）**：仅当用户明确要求「社区最新技巧」「AI 技巧」一类，或本周问题明显需要外部对照时检索。加载 [community.md](./references/community.md)；结果只作 *Community Inspiration*，不直接成为 *Local Rule*。

路径用中性占位（「宿主计划目录」「会话索引」），不写死本机用户目录。

## 3. Reconstruct Workstreams

**完成标准：** 本周工作归并为 1–3 条主线，每条有代表会话/计划与主结果。

按用户目标 / workflow 阶段 / 技术问题归类，不按聊天数量机械分类。模板见 [templates.md](./references/templates.md)。

## 4. Success Patterns

**完成标准：** 最多 5 条，每条都有证据支持；不把模型默认能力包装成 Skill 价值。

重点看：是否减少重复沟通、降低上下文污染、减少返工、更早发现错误、提高验证覆盖、正确使用 Skill/Command/Subagent、合理拆分 session、正确区分 research / planning / implementation / verification。

## 5. Friction Analysis

**完成标准：** 最多 5 个主要摩擦；每条已定 Evidence Grade，并写出 Observed / Impact / Pattern / Likely root cause。

优先识别：双重规划、重复调查、上下文污染、Skill 误触发/漏触发、错误的 session 边界、research/implementation 混杂、验证缺失、一次性问题被错误固化、环境问题污染业务 workflow、社区建议与本地实际不匹配。

模板与根因分类见 [templates.md](./references/templates.md)。

## 6. Context Hygiene + Skill Routing Audit

**完成标准：** 卫生检查与路由审查已做完；Selection 问题与 Execution 问题已分开记录。

**Hygiene** — 检查：无关调查是否进主任务；历史是否导致重复决策；Skill instructions 是否互相竞争；阶段切换是否应新开 execution context；长期 reference 是否应从 SKILL.md 移到 `references/`；本应 route 到 `hunt` 的环境问题是否留在了设计流水线；一次性事故是否污染长期 workflow。

只有上下文长度、阶段变化或历史信息造成可观察成本（E2+）时，才建议调整 session boundary——不把 `long session` 本身当成问题。

**Routing** — 分开看 **Selection**（有没有选对 Skill）与 **Execution**（选对了有没有做对）。「正确 Skill + 错误执行」和「错误 Skill + 正确执行」是两种故障，后者尤其危险。

routing 问题（false positive/negative）优先调 `description` / trigger words / scope / competing skills / explicit non-triggers；不靠加长 Skill 正文修路由。

模板见 [templates.md](./references/templates.md)。

## 7. Candidate → Promote / Reject

**完成标准：** 每个候选都走过 `Observation → Pattern → Root Cause → Candidate`；Promote / Reject 已判定，Promote 含 Change surface。

不从 `Problem → Rule` 直接跳。每个候选写 What / Where / Scope（默认最小必要）/ Trigger / Constraint / Expected benefit / Evidence / Confidence。

**Promote**（须全部满足）：E2+ 且有重复模式；能写成简短可执行的 workflow constraint（不写「以后注意上下文」类空泛建议）；跨项目可复用；有明确触发；不与现有规则冲突。必须说明 `Change surface`。

**Reject：** 项目路径、表名、本机路径、一次性事故、产品私有边界、特定模型偶然行为、临时环境/工具链问题、仅由社区热点产生的建议 → 保持项目局部文档。

模板见 [templates.md](./references/templates.md)。

## 8. Evaluation

**完成标准：** 每条重要 Promote 有下周验证方法（Hypothesis / Baseline / Change / Measure / Success criteria / Review window）。

高影响规则优先 `baseline → candidate → compare`，不直接改长期规则。可选 Decision Ledger 便于跨周追踪。模板见 [templates.md](./references/templates.md)。

## 9. Output

**完成标准：** 下列结构已输出；未经用户批准不改全局文件。

用简洁中文（代码/命令标识保持英文）：

1. **本周工作脉络** — 1–3 条主线，各附代表会话/计划短名（勿贴绝对路径）。
2. **做得好的** — 最多 5 条，证据支持。
3. **摩擦** — 最多 5 条，每条含 `摩擦 → 证据(E几) → 根因`。
4. **Skill / Workflow Audit** — 有明显问题时分别指出 Selection / Execution / Context / Verification；没有则省略。
5. **Promote** — 每条含 `Change surface / Rule / Trigger / Scope / Evidence / Confidence`。
6. **Do not promote** — 含 Reason。
7. **Evaluation** — 下一周 1–3 个假设。
8. **可选下一步** — 用户批准后才执行；列出 `File / Change / Reason / Validation`。

若输出适合做成可重访的分析件且宿主支持 Canvas，可用 Canvas；否则纯 Markdown。

## Hard Rules

- Evidence first；证据不足就降低置信度，不用假设替代。
- Community practice cannot create a local problem.
- Never turn one incident into a global rule.
- Prefer the smallest effective scope.
- Separate selection problems from execution problems.
- Separate environment problems from business workflow problems（环境类重复故障默认 route 到 `hunt`，不塞进设计流水线）。
- Prefer workflow constraints over prose advice.
- 每条重要 Promote 规则都应有验证方法。
- 不默默编辑全局文件；建议归用户确认。
- 不泄露密钥、token、完整私密对话。
- 更少但经过验证的规则优于大量推测性规则。
- 不报告本周未发生的工作；不把「证据不可用」写成「本周做得不好」。

反模式清单见 [templates.md](./references/templates.md)。

## 交叉引用

- → [templates.md](./references/templates.md)：证据分级、收集细则、审计与候选模板、反模式
- → [community.md](./references/community.md)：社区对照（仅检索时）
