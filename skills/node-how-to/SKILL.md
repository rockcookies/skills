---
name: node-how-to
description: >-
  Node.js / TypeScript 技能编排器——在任何 Node、TypeScript 或前端工程任务中始终生效。读取任务上下文，
  加载最相关的技能，通常一次加载多个：写一个 HTTP 服务会加载 node-error-handling + node-testing +
  node-async；排查内存泄漏会加载 node-performance + node-observability；做安全审计会加载
  node-security + node-safety。同时负责：当两个技能看似重叠时消歧（performance vs observability、
  safety vs security、types vs design-patterns、error-handling vs safety、async 的并发与取消），
  以及在项目里通过 CLAUDE.md / AGENTS.md 强制触发技能（/node-how-to configure）。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node.js / TypeScript 技能编排器。对每个任务，识别出所有相关技能并一起加载——一个任务很少只属于单个技能。

**模式：**

- **Orchestrate（编排）**——对任何 Node/TS 编码、审查、调试或搭建任务，同时加载主技能与所有适用的次技能。
- **Disambiguate（消歧）**——当两个技能看似重叠时，给出边界表。参见 [disambiguation.md](references/disambiguation.md)。
- **Configure（配置）**——在项目的 `CLAUDE.md` 或 `AGENTS.md` 里追加 `## Required Node skills` 区块。遵循 [project-config.md](references/project-config.md)。

## 技能加载

对每个任务，**同时**加载**主技能**与所有适用的**次技能**。不要等待——在一开始就一起加载。

| 意图 | 主技能 | 同时加载 |
| --- | --- | --- |
| 设计 API、选择模式 | `node-design-patterns` | `node-types`、`node-naming` |
| 命名类型、函数、模块 | `node-naming` | `node-code-style` |
| 惯用方式处理错误 | `node-error-handling` | `node-safety`（充斥 null/undefined 的代码） |
| 写异步、并发、取消 | `node-async` | `node-error-handling`（异步错误传播） |
| 设计类型、接口、泛型 | `node-types` | `node-design-patterns` |
| 写测试 | `node-testing` | `node-async`（异步/计时器测试） |
| 应用性能优化 | `node-performance` | `node-observability`（先度量） |
| 生产环境监控与定位 | `node-observability` | `node-performance`（命中瓶颈后优化） |
| 排查异常行为或崩溃 | `node-safety` | `node-observability`、`node-performance`（若与性能相关） |
| 审计安全漏洞 | `node-security` | `node-safety`、`node-error-handling` |
| 审查格式与风格 | `node-code-style` | `node-naming` |
| 写 TSDoc / README / API 文档 | `node-documentation` | `node-naming` |
| 搭建工程、配置工具链 | `node-dev` | `node-code-style`、`node-testing` |

以上技能标识均为各自 `<name>` 的简写。

## 现有 JS/TS 生态技能

`node-how-to` 还会路由到仓库中已有的前端/Node 技能，按上下文一起加载：

| 场景 | 技能 |
| --- | --- |
| 工程搭建、pnpm/monorepo、tsconfig、库发布、@antfu/ni 工具链 | `node-dev` |
| Vue 3 组件与组合式 API 最佳实践 | `vue-best-practices` |
| Vue 调试与排错 | `vue-debug-guides` |
| Vue JSX/TSX 写法 | `vue-jsx-best-practices` |
| Pinia 状态管理 | `vue-pinia-best-practices` |
| Vue Router | `vue-router-best-practices` |
| Vue 组件测试 | `vue-testing-best-practices` |
| VueUse 组合式函数 | `vueuse-functions` |
| UnoCSS 原子化样式 | `unocss` |
| 浏览器自动化与端到端测试 | `playwright-cli` |
| 高质量前端界面设计 | `frontend-design`、`web-design-guidelines` |

## 分类速览

带 "use when" 钩子的完整目录：[by-category.md](references/by-category.md)

| 分类 | 技能 |
| --- | --- |
| 代码质量 | `node-code-style` `node-documentation` `node-error-handling` `node-naming` `node-safety` `node-security` `node-types` |
| 架构与设计 | `node-async` `node-design-patterns` `node-types` |
| QA 与性能 | `node-observability` `node-performance` `node-testing` |
| 工程搭建 | `node-dev` |

## 竞争簇——边界线

完整边界表与路由示例：[disambiguation.md](references/disambiguation.md)

关键簇及其归属：

- **性能**：`node-performance`（优化模式）· `node-observability`（常驻生产信号）· `node-safety`（崩溃/泄漏的根因排查）
- **错误**：`node-error-handling`（传播与包装惯例）· `node-safety`（预防 null/undefined 与运行时陷阱）
- **风格**：`node-code-style` · `node-naming` · `node-documentation`
- **类型 vs 架构**：`node-types`（类型/接口/泛型设计）vs `node-design-patterns`（架构级模式、DI、中间件）
- **异步内部**：`node-async` 同时覆盖并发协调（Promise/并发上限）与取消（AbortController）——无需拆成两个技能
- **正确性 vs 威胁**：`node-safety`（内部 bug）vs `node-security`（外部威胁）

## Configure 模式

在项目的 `CLAUDE.md` 或 `AGENTS.md` 中强制触发指定技能，使其始终加载。

当以 `/node-how-to configure` 调用时，遵循 [project-config.md](references/project-config.md)。

---

本技能并非详尽无遗。更细的指引请参阅各技能文件以及 Node.js / TypeScript 官方文档。
