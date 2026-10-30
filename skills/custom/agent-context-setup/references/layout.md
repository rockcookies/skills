# 上下文分层与落点

> 何时读：规划文档放哪、判断一条信息该写在哪、给已有仓库接入。

## 三层

| 层 | 文件 | 何时被读 | 放什么 |
|---|---|---|---|
| 入口层 | 根 `AGENTS.md`（`CLAUDE.md` 仅导入它） | 每次会话 | 仓库做什么、顶层布局、全局命令、对每个任务都成立的约定、文档路由 |
| 作用域层 | 各单元/分组的 `AGENTS.md` | 在该目录工作时 | 本目录职责与边界、特有命令与约定、模块文档路由 |
| 文档层 | `docs/**`、`<单元>/docs/**` | 路由表指向时 | 专题详解、架构总览、ADR |

规则：**入口层只放路由，不放细节**。细节下沉一层，并保证上层路由能到达它（没有路由指向的文档等于不存在，`ROUTE_MISSING` 会报）。

## 落点判断

| 信息 | 落点 |
|---|---|
| 模块清单、脚本命令、文档目录 | 生成区块（`units` / `commands` / `doc-routes`） |
| 全仓库通用的命名、提交、测试约定 | 根 `AGENTS.md` 的 "Global conventions" 一节，或 `docs/governance/*` 后在路由里指向 |
| 只对某个单元成立的约定 | 该单元的 `AGENTS.md` |
| 架构总览 | `docs/architecture/overview.md` |

术语、模块文档、ADR 的落点见 `format.md`「知识载体分工」。

## 继承

- 就近原则：离被改文件最近的 `AGENTS.md` 优先，上级补充。
- 子目录文件首行用 `> 继承：通用规则见 [../AGENTS.md](../AGENTS.md)` 声明，**不复制**上级内容。
- 分组目录（如 `backend/`、`packages/`）默认不强制有 AGENTS.md；只有分组本身有"这一组共有的约定"才建（`requireAgents: "all"` 可强制）。
- 单元嵌套（Maven 父子模块等）同理：父单元写共同约定，子单元写差异。

## 模块文档 frontmatter

docs 下的文档遵循 OKF v0.2：最小只要 `type`，`description` 进路由表，`covers` 让过期可检测。字段、`verified` 的用法与有意偏离见 `format.md`。

## 已有仓库接入

1. 先读仓库已有的 AGENTS.md/CLAUDE.md/docs 规范，**保留**原有内容与风格。
2. 用 `sync --add-blocks` 在末尾追加生成区块，原文一字不动。
3. 原 CLAUDE.md 有独立内容时：让用户决定是并入 AGENTS.md 后改成 `@AGENTS.md`，还是保持分叉；不要自行合并。

## 日常维护

接入完成后，改完代码顺手更新文档的工作由 `agent-context-update` 负责；本技能只在需要整仓重整、体检或迁移时再用。
