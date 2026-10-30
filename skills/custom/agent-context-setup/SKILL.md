---
name: agent-context-setup
description: >-
  第一次整理仓库的 Agent 上下文（init）、体检或排查文档过期（audit）、接入已有的 AGENTS.md / CLAUDE.md / docs（migrate）、调整哪些目录有 AGENTS.md（rescope，改 .agent-context.json 的 scopes）。
  编码后的增量更新用 agent-context-update。
user-invocable: true
metadata:
  author: rockcookies
  version: 1.1.0
---

# Agent Context Setup

让任何 Agent 打开仓库就知道：有哪些模块、各自怎么跑、改某处前先读哪份文档。

唯一入口 `scripts/ctx.mjs`（init / discover / audit / sync）。下文的子命令即 `node scripts/ctx.mjs <子命令>`；旗标以文件头为准。

## 模式

只进入与意图对应的一个模式。

### init：第一次整理一个仓库
读 `references/scopes.md`、`references/layout.md`。
1. `init` 预览；用一两句话向用户复述（几个单元、什么技术栈、哪里已有 AGENTS.md、有没有仓库自己的文档规范），请他增删后 `--write`。
2. `sync` dry-run，整理成提案；确认后 `sync --write --scaffold`。
3. 逐个处理 `TODO(ctx)`：读该目录的代码与 manifest，写职责、边界、特有约定。读不出来写「待确认」并问用户。行数上限见 `references/config.md` 的 `rootAgentsMaxLines` / `agentsMaxLines`，超出则下沉 `docs/` 并由路由表指向。
4. `audit`。

**完成条件**：error 为 0；warn 已修或向用户说明为何保留；`TODO_LEFT` 清零或说明剩余原因。

### audit：体检 / 排查文档过期
读 `references/audit.md`。
1. `audit --json`。先看 `SCAN_INCOMPLETE` 和 `STALE_CHECK_SKIPPED`：它们说明哪些检查没做，先处理或向用户说明。
2. 按检查码逐条处理。`DOC_STALE` / `DOC_EXPIRED` 按 `audit.md` 的「语义核对」处理。

**完成条件**：error 为 0；每条 warn 有处理或说明；每个新增的 `verified` 都对应一次真实核对。

### migrate：仓库已有 AGENTS.md / CLAUDE.md / docs
读 `references/layout.md`「已有仓库接入」、`references/adapters.md`。
1. 先读已有内容和 `STANDARDS`，保留原有风格；已有文件一律不覆盖。
2. `sync --add-blocks --write` 在末尾追加区块，原文一字不动。
3. 与 AGENTS.md 分叉的 CLAUDE.md：先问用户并入还是保持分叉。
4. 缺 `type` 的 docs 分批补 frontmatter，`type` 依内容判断，拿不准就问；存量太多先 `"docFrontmatter": "off"`。

**完成条件**：原有人写内容没有丢失；`audit` 没有新增 error。

### rescope：调整哪些目录有 AGENTS.md
读 `references/config.md`。改 `scopes` → `sync` → `audit`。

**完成条件**：`scopes` 与磁盘一致；`audit` 没有新增 error；未列入的目录不再被要求补 `AGENTS.md`。

写模块文档、ADR 或术语表：读 `references/format.md`，复制 `references/templates/` 里的模板。

编码后的增量维护用 `agent-context-update`。
