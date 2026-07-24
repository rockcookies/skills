---
name: upstream-research
description: >
  对 upstream/<project> 做深度研究，生成或增量更新 docs/upstream/<project>/
  下的四份文档（architecture.md、changelog.md、sync.json、extend.md）。
  当用户提到「同步 upstream」「分析上游项目」「更新 upstream 文档」
  「research upstream」，或点名 upstream/ 下某个目录时，必须使用此技能。
invocation: false
metadata:
  internal: true
---

# Upstream Research

对 `upstream/<project>` 做结构化研究，在 `docs/upstream/<project>/` 写出四份互相配合的文档。

可选参数：`--force`（hash 未变也强制重生成）、`--no-git-check`（跳过 git，纯目录分析）。

## 1. 解析

从请求中提取 `<project>`、`--force`、`--no-git-check`。

若未指定项目，列出 `upstream/` 并停等用户选择。

若 `upstream/<project>` 不存在，列出 `upstream/` 并终止。

**完成标准：** 项目名与 flags 已确定，且目录存在。

## 2. 门禁

按 [references/modes.md](references/modes.md)：比较 `upstream/<project>` HEAD 与 `docs/upstream/<project>/sync.json` 的 `last_synced_hash`。

- hash 相同且无 `--force` → 报告文档已是最新并 **终止**。
- synced hash 看起来比 HEAD「更新」（可能回滚）→ 警告并等待用户确认后再继续。
- 否则将模式定为 `FULL`、`DIFF` 或 `FULL_NO_GIT`。

**完成标准：** 模式已确定，或本轮已以 `SKIP` 结束。

## 3. 采集

收集足以写概述 + 3–7 个模块的材料：

1. `upstream/<project>` 下文件树（排除 `node_modules`、`.git`、`dist`、`build`、`__pycache__`；约 300 条上限）。
2. 存在则读：`README.md`、`CLAUDE.md`、`docs/` 下最多 3 个文件。
3. 存在则读生态配置（`package.json`、`pyproject.toml` / `setup.py`、`Cargo.toml`、`go.mod`）。
4. 略读主入口（导出 / 公开 API），如 `src/index.ts`、`src/main.ts`、`src/lib.rs`、`main.py`、`cmd/*/main.go`。

**完成标准：** 笔记覆盖用途、布局与主要模块。

## 4. 变更分析（仅 DIFF）

`<old_hash>` = `last_synced_hash`，`<new_hash>` = 当前 HEAD。

1. `git -C upstream/<project> log <old_hash>..<new_hash> --oneline --no-merges`
2. `git -C upstream/<project> diff <old_hash>..<new_hash> --stat`
3. 变更文件 ≤ 200 时，按优先级读关键 diff（接口/类型 → 入口 → `CHANGELOG.md` → 变更最多的前 5 个模块）。> 200 时只用 `--stat`，并在 changelog 中注明。

**完成标准：** changelog 所需材料齐备（或因模式非 `DIFF` 已跳过本步）。

## 5. 规则

若存在 `docs/upstream/<project>/extend.md`，读取 `USER_RULES` 区块并约束后续采集与写作。不存在则用默认规则。

**完成标准：** 用户约束已记下（或确认没有）。

## 6. 写入

确保 `docs/upstream/<project>/` 存在，再写四份文件：

| 文件 | 参考 | 规则 |
|------|------|------|
| `architecture.md` | [references/architecture.md](references/architecture.md) | 每次全量覆盖 |
| `changelog.md` | [references/changelog.md](references/changelog.md) | FULL：新建；DIFF：头部插入区块 |
| `sync.json` | [references/sync-json.md](references/sync-json.md) | 每次全量覆盖 |
| `extend.md` | [references/extend.md](references/extend.md) | 新建完整文件，或只替换 `AI_SUGGESTIONS` |

若已有 `extend.md` 的 `USER_RULES` 标记损坏，警告并停止，不覆盖。

**完成标准：** 四条路径均存在且符合各自模板。

## 7. 汇报

向用户说明：模式、hash 区间（如有）、哪些文件有变动、≤3 行实质摘要（DIFF 为变更摘要；FULL 为项目定位）。

**完成标准：** 用户无需再问即可核验四条产物路径。
