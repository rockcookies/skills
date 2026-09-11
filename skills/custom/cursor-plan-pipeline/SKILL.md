---
name: cursor-plan-pipeline
description: >-
  Cursor Plan Mode 流水线：拷问 → think 审查清单 → CreatePlan；UI 批准后实现，再
  check。仅在 Cursor 且需要 Plan Mode 闸口时使用。用户说 cursor-plan-pipeline、
  Plan Mode 拷问落地、Cursor 里 grill 出计划时触发。Not for other runtimes
  (→ grill-and-think). Not for live incident 排障 (→ hunt).
when_to_use: >-
  cursor-plan-pipeline, Cursor Plan Mode, Plan Mode 拷问落地, Cursor 设计落地
user-invocable: true
metadata:
  author: rockcookies
  version: 1.1.0
---

# Cursor Plan Mode 流水线

仅用于 **Cursor Plan Mode**。其它运行时用 `/grill-and-think`。

本技能编排现有 skill 的顺序与闸口；`grill-me` / `grill-with-docs`、`think`、`check` 按各自 SKILL.md 运行。列出的 skill 缺失时停下并报告缺哪个，不要假装模拟。

阶段之间等宿主 UI 批准或用户明确批准后再进入下一阶段。

## 输入

用户给出的粗略想法（slash 参数或当前消息）。没有想法时先问清楚，再进入 Stage 1。

参数含 `--docs` → Stage 1 用 **grill-with-docs**；否则用 **grill-me**。

## 前置：进入 Plan Mode

**完成标准：** 已在 Plan Mode，或已切到 plan 并说明原因。

当前不在 Plan Mode 时：`SwitchMode` → `plan`，说明原因，再开始 Stage 1。已在 Plan Mode 则直接开始。

Plan Mode 下只读探查、拷问、写计划；不改项目文件。

## Stage 1 —— 拷问（Grill）

**完成标准：** 设计树每个分支已钉死；已写出「已对齐需求」摘要（问题、范围、明确不做的事、关键决策）。还有开放问题就继续追问，不总结、不往下推进。

1. 调用对应拷问 skill，主题为上面的想法。
2. 按该 skill 连环追问，直到设计树钉死。
3. 写简短的 **「已对齐需求」摘要**。

## Stage 2 —— 审查并出计划（Think checklist + CreatePlan）

**完成标准：** think 审查清单全部通过；CreatePlan 已写出 decision-complete 计划；已停在宿主 Plan UI 闸口。

把「已对齐需求」当作问题陈述。跑 think **审查清单**，不再开第二轮面试，也不把已钉死的问题再问一遍。

读取 **think** skill，只用下列节当检查清单：

- Check for Official Solutions First
- Simplicity Gate
- Validate Before Handing Off
- Hard Rules（无占位、阶段可独立合并、禁止 Phase 0）
- Output：Building / Not building / Approach / Key decisions

审查失败：缩范围或改方案后再出计划；只交出已过关的计划。

审查通过后，用宿主计划工具（CreatePlan）写出决策完整的计划。计划必须包含：

- 选定方案与 rationale
- 一条否决的接近方案（或明确「无接近替代」）
- 脆弱假设（premise collapse）
- 可执行的验证命令 / 验收检查

**在这里停下。** 宿主 Plan UI 的批准就是 Stage 2 闸口。

## Stage 3 —— 实现（Implement）

**完成标准：** 已声明执行哪份计划；工作区相对计划无不安全漂移；计划中的实现项已落地。用户改计划而非批准时，改完回到 Stage 2，再等批准。

仅在用户于 UI 批准计划，或明确说「实现吧」「可以干」「Implement the plan」等之后开始：

1. 声明正在执行哪份计划，检查工作区相对计划是否漂移；漂移不安全则停下报告。
2. 按计划实现。

## Stage 4 —— 审查（Check）

**完成标准：** `check` 已用证据验证结果；若 `git-atomic-commit` 可用且检查通过，本地原子提交已落地（不推送）；审查结论已呈现；已停在推送/合并/发布闸口。

实现完成后：

1. 调用 **check** skill，用证据验证结果。
2. 若 **git-atomic-commit** 可用且检查通过：按逻辑单元落成本地提交（只本地，不推送）；check 未过或用户要求返工时先修再重走本阶段。
3. 呈现审查结论与提交清单（若有）。
4. **在这里停下。** 等用户明确确认后再推送、合并或发布。

## 交叉引用

- → `grill-and-think`：非 Cursor / 无 Plan Mode 闸口
- → `grill-me` / `grill-with-docs`：Stage 1
- → `think`：Stage 2 审查清单（Official Solutions / Simplicity Gate / Validate / Hard Rules / Output）
- → `check`：Stage 4
- → `git-atomic-commit`：检查通过后的本地原子提交（若已安装）
- → `hunt`：线上故障 / 回归排障，不走本流水线
