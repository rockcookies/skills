---
name: grill-and-think
description: >-
  跨运行时设计流水线：拷问 → 深思 → 实现 → 审查。编排 grill-me/grill-with-docs、
  think、check。宿主有原生计划批准 UI 时用该闸口且 think 只做审查；否则跑
  think 全文并口头批准。用户说 grill-and-think、拷问深思、设计落地流水线时触发。
  Not for Cursor Plan Mode (→ cursor-plan-pipeline). Not for live incident 排障
  (→ hunt).
when_to_use: >-
  grill-and-think, 拷问深思, 设计落地流水线, 功能流水线, grill then think
user-invocable: true
metadata:
  author: rockcookies
  version: 1.1.0
---

# 功能流水线：拷问 → 深思 → 实现 → 审查

跨运行时通用（任意支持 Agent Skills 的宿主）。本技能编排顺序与闸口；`grill-me` / `grill-with-docs`、`think`、`check` 按各自 SKILL.md 运行。列出的 skill 缺失时停下并报告缺哪个，不要假装模拟。

Cursor 且明确要 Plan Mode 专用路径时，用 `/cursor-plan-pipeline`。

阶段之间等宿主 UI 批准或用户明确批准后再进入下一阶段。

## 输入

要构建的粗略想法（slash 参数或当前消息）。没有想法时先问清楚，再进入 Stage 1。

参数含 `--docs` → Stage 1 用 **grill-with-docs**；否则用 **grill-me**。

## Stage 1 —— 拷问（Grill）

**完成标准：** 设计树每个分支已钉死；已写出「已对齐需求」摘要（问题、范围、明确不做的事、关键决策）。还有开放问题就继续追问，不总结、不往下推进。

1. 调用对应拷问 skill，主题为上面的想法。
2. 按该 skill 连环追问，直到设计树钉死。
3. 写简短的 **「已对齐需求」摘要**。

## Stage 2 —— 深思（Think）

**完成标准：** 闸口路径已选定；decision-complete 计划已产出；已停在对应闸口（原生 UI 批准，或口头批准）。

把「已对齐需求」喂给 think 作为问题陈述——不把想法从头再讲一遍。

### 闸口探测（按能力，不按品牌）

判断当前宿主是否同时具备：

1. **只读计划模式**（可研究与出计划，默认不改项目文件）
2. **计划批准控件**（用户在 UI 上批准/拒绝计划，批准后才进入实现）

两者都有 → **原生闸口路径**。否则 → **口头闸口路径**。

### 原生闸口路径

think **只做审查**，不再开第二轮面试，也不把已钉死的问题再问一遍。

读取 think skill 下列节当检查清单：

- Check for Official Solutions First
- Simplicity Gate
- Validate Before Handing Off
- Hard Rules（无占位、阶段可独立合并、禁止 Phase 0）
- Output：Building / Not building / Approach / Key decisions

审查失败：缩范围或改方案后再出计划。审查通过后，用宿主计划工具写出决策完整的计划。计划必须包含：选定方案、一条否决的接近方案（或明确无）、脆弱假设、验证命令。

**在这里停下。** 宿主计划 UI 的批准就是闸口。

### 口头闸口路径

跑 **think skill 全文**（含挑战假设），产出决策完整、其它 agent 也能照着实现的计划。完整展示。

**在这里停下。** 明确请用户批准或提出修改；批准后再实现。

## Stage 3 —— 实现（Implement）

**完成标准：** 已声明执行哪份计划；工作区相对计划无不安全漂移；计划中的实现项已落地。用户改计划而非批准时，改完回到 Stage 2，再等批准。

仅在下列之一成立后开始：

- 原生闸口路径：用户在计划 UI 批准，或明确说「实现吧」「可以干」「Implement the plan」等
- 口头闸口路径：用户明确批准（同上措辞）

1. 声明正在执行哪份计划，检查相对计划的工作区漂移；漂移不安全则停下报告。
2. 按计划实现。

## Stage 4 —— 审查（Check）

**完成标准：** `check` 已用证据验证结果；若 `git-atomic-commit` 可用且检查通过，本地原子提交已落地（不推送）；审查结论已呈现；已停在推送/合并/发布闸口。

实现完成后：

1. 调用 **check** skill，用证据验证结果。
2. 若 **git-atomic-commit** 可用且检查通过：按逻辑单元落成本地提交（只本地，不推送）；check 未过或用户要求返工时先修再重走本阶段。
3. 呈现审查结论与提交清单（若有）。若 check 给出推送/合并/发布等后续选项，只呈现给用户。
4. **在这里停下。** 等用户明确确认后再推送、合并或发布。

## 交叉引用

- → `cursor-plan-pipeline`：Cursor Plan Mode 专用路径
- → `grill-me` / `grill-with-docs`：Stage 1
- → `think`：Stage 2（原生闸口用审查清单；口头闸口跑全文）
- → `check`：Stage 4
- → `git-atomic-commit`：检查通过后的本地原子提交（若已安装）
- → `hunt`：线上故障 / 回归排障，不走本流水线
