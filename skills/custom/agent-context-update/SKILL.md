---
name: agent-context-update
description: >-
  代码改动完成后，核对并增量更新受影响的项目上下文文档（AGENTS.md、docs/ 模块文档、术语表、ADR）。
  在改动了公共接口 / schema / 错误语义、命令 / 构建 / 部署方式、模块边界或依赖方向、领域术语或业务规则，或发现文档与代码矛盾时使用。
  外部行为不变就结束：用一句话说明原因，不改文件。
  前提：仓库已用 agent-context-setup 整理过（有 AGENTS.md 和 .agent-context.json）。
  整仓初始化、体检、迁移、调整 scopes 请用 agent-context-setup。
user-invocable: true
metadata:
  author: rockcookies
  version: 1.1.0
---

# Agent Context Update

改完代码后，只更新这次改动影响到的项目知识，别的不碰。

脚本 `$S` 指同级技能的 `../agent-context-setup/scripts`。找不到就手工完成下面的步骤，并告诉用户这次没有跑 `audit`。

## 流程

1. **看实际改动**：`git status --short` 和 `git diff`，包含未提交的。没有 git 就用本次任务改过的文件。
2. **判断是否影响项目知识**：对照 `references/triggers.md`。外部行为不变，或全部落在「不用更新」：用一句话说明原因后结束，不改文件。
3. **定位**：改动文件最近的 `AGENTS.md`；`node $S/ctx.mjs discover` 里 `covers` 命中这些文件的文档；`audit --json` 里相关的 `DOC_STALE`。
4. **目录不在 scopes**：改动落在没有 `AGENTS.md`、也没列入 `scopes` 的目录时，向用户提一句，交给 `agent-context-setup` 的 rescope，然后结束。
5. **读**：先读已有文档，再读权威来源（代码、测试、配置）。冲突时以代码为准；拿不准代码是不是有 bug，问用户。
6. **增量更新**：只改变化了的知识。
   - 生成区块（`ctx:begin/end` 之间）：`node $S/ctx.mjs sync --write`，不手改。
   - 人写内容：就地改相关句子，不重写整节，不碰无关文档。
   - 术语、ADR：按 `triggers.md`；术语有歧义、要写 ADR 都先问用户。
7. **核对**：文档可能无需改正文时，按 `agent-context-setup/references/audit.md` 的「语义核对」处理。
8. **收尾**：`node $S/ctx.mjs audit`，确认没有引入新的 error；看最终 diff，改动范围就是预期的那些文件。

## 完成条件

- 改动后的行为与文档没有已知矛盾
- 每处文档改动都能对应到一处代码改动
- 无关文档和人写的区域没有被改
- 没解决的领域定义和架构取舍交给了用户，没有猜
