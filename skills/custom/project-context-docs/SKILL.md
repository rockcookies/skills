---
name: project-context-docs
description: >-
  整理、生成、审计代码仓库里给 Agent 读的上下文文档：根/子目录 AGENTS.md、CLAUDE.md 入口、docs/ 模块文档
  （OKF：markdown + frontmatter）、决策记录（ADR）、文档路由表，并维护 .project-context-docs.json 里的 scopes
  （AGENTS.md 所在目录清单）。布局无关：monorepo、前后端分目录、根目录 go.mod 与前端同级等任意结构都行。
  只要用户提到：项目上下文文档、整理仓库上下文、初始化/补全 AGENTS.md、CLAUDE.md、给每个模块补文档、
  monorepo 文档、文档与代码对不上/过期、检查文档健康度、让 AI 更懂这个仓库、哪些目录需要 AGENTS.md、
  .project-context-docs.json、project-context-docs、repo context、audit docs，就使用本技能。
  不用于：写业务代码、润色单篇 README、笔记/知识库类项目。
when_to_use: >-
  project-context-docs, 项目上下文文档, 模块文档, ADR, OKF, 文档路由
user-invocable: true
metadata:
  author: rockcookies
  version: 1.0.0
---

# Project Context Docs

让任何 Agent 打开仓库就知道：有哪些模块、各自怎么跑、改某处前先读哪份文档。

## 原则

1. **清单即配置**。`.project-context-docs.json` 的 `scopes` 列出哪些目录维护 AGENTS.md：加一行 = 纳入，删一行 = 不再维护。没列的目录永远不会被要求，不需要 exclude。
2. **先发现，后固化**。不假设 `packages/`；首次用 `ctx.mjs init` 按清单文件探测出建议清单，让用户确认后写入，此后以清单为准。
3. **三类内容，三种处理**：事实（模块清单、命令、文档路由）→ 脚本生成进 `ctx` 区块；约定 → 人写，只在一处定义；决策 → ADR，追加不改。
4. **就近 + 继承**。每个作用域一份 `AGENTS.md`，只写本目录特有内容，开头指向上级，不复制上级。
5. **docs 用 OKF 格式**。概念文档 = markdown + frontmatter，最小只要 `type`；`description` 自动成为路由说明，`covers` 让过期可检测。字段与有意偏离见 `references/format.md`。
6. **只动标记内的内容**。脚本只改 `ctx:begin/ctx:end` 之间；其余是人的文字。
7. **仓库自己的文档规范优先**。`audit` 报出 standards（如 `docs/governance/documentation.md`）时先读它，以它为准。
8. **不编造**。`TODO(ctx)` 要读代码、README、manifest 后填；读不出来就写"待确认"并问用户。

## 脚本

零依赖（Node ≥ 18），唯一入口为本技能的 `scripts/ctx.mjs`，下文记作 `$S`；所有子命令都接受 `--root <仓库根>`，默认当前目录。

| 命令 | 作用 |
|---|---|
| `node $S/ctx.mjs init [--write] [--force] [--groups]` | 探测并预览建议的 `scopes`；`--write` 写入 `.project-context-docs.json` |
| `node $S/ctx.mjs discover` | 输出作用域清单 JSON（技术栈、继承链、docs、命令、AGENTS/CLAUDE 状态、未列入的目录） |
| `node $S/ctx.mjs audit [--strict] [--json]` | 健康检查；有 error 退出码 1 |
| `node $S/ctx.mjs sync` | dry-run，列出将要做的事 |
| `node $S/ctx.mjs sync --write [--scaffold] [--add-blocks]` | 落盘：刷新区块 / 新建缺失文件 / 给已有 AGENTS.md 追加区块 |

## 意图路由

| 用户想做 | 读 | 做 |
|---|---|---|
| 第一次整理一个仓库 | `references/scopes.md`、`references/layout.md` | 走下面的工作流，带 `--scaffold` |
| 调整哪些目录有 AGENTS.md | `references/config.md` | 直接改 `scopes`，再 `sync` |
| 给已有 AGENTS.md 的仓库补自动化 | `references/layout.md` | `sync --add-blocks`，不动人写部分 |
| 体检 / 排查文档过期 | `references/audit.md` | `audit`，按检查码逐条处理 |
| 新增模块文档 / ADR / 补 frontmatter | `references/format.md`、`references/templates/` | 复制模板，写准 `type`、`description`、`covers` |
| CLAUDE.md / .cursor / 多工具并存 | `references/adapters.md` | CLAUDE.md 保持单行 @AGENTS.md；分叉先问用户，不自行合并 |

## 工作流

1. **Discover**：没有 `scopes` 时跑 `ctx.mjs init` 预览；向用户用一两句话复述（几个单元、什么技术栈、哪里已有 AGENTS.md、有没有仓库自己的文档规范），请他增删后 `--write`。
2. **Plan**：跑 `audit` 和 `sync`（dry-run），整理成提案给用户确认。已有的 AGENTS.md / CLAUDE.md 一律不覆盖；与 AGENTS.md 分叉的 CLAUDE.md 先问用户怎么合并。
3. **Apply**：确认后 `sync --write`（按需加 `--scaffold` / `--add-blocks`）。再逐个处理 `TODO(ctx)`：读该目录的代码与 manifest，写职责、边界、特有约定。每个文件保持简短（根 ≤160 行，其余 ≤120 行），专项内容下沉到 `docs/` 并由路由表指向。给缺 `type` 的文档补 frontmatter 时，`type` 要依据文档内容判断，拿不准就问。
4. **Verify**：重跑 `audit`，error 必须为 0；warn 要么修掉、要么向用户说明为何保留；`TODO_LEFT` 要么清零、要么向用户说明剩余原因。核对后确认文档无需改动，用 `verified` 记录复核，不要为消告警去改正文。

## 改动前的自检

- 这段内容是事实、约定还是决策？事实交给脚本，别手抄。
- 删掉它，读的人会不会做错事？不会就别写。
- 它在别处已经有权威定义吗？有就链接，不复述。
- 子目录的 AGENTS.md 有没有把上级的话又说了一遍？有就删。

## 修改本技能的脚本时

检查逻辑改动必须同步改 `scripts/tests/ctx.test.mjs`，并保证"每个检查码都被真实触发过"那条用例通过：`node --test scripts/tests/ctx.test.mjs`。新增检查码 = 新增一条"弄坏必报、修好消失"的用例。
