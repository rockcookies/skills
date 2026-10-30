# 文档格式：OKF v0.2 基础

> 何时读：新建/整理 docs 下的文档、写 frontmatter、判断审计报的 `DOC_FRONTMATTER` / `DOC_STALE` / `DOC_EXPIRED`。

格式基础：[Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md)——知识用 markdown + YAML frontmatter 的目录表示，人和 Agent 读同一份文件。本文只列本技能实际用到的字段和**有意偏离**之处，其余以规范为准。

## 范围

- **bundle = 每个 docs 目录**：根级 `docs/`、各单元的 `<单元>/docs/`（`docsDirs` / scopes 的 `docs` 可改）。bundle 内的概念文档按本文约定写。
- **bundle 之外不写 frontmatter**：`AGENTS.md`、`CLAUDE.md` 是给运行时 Agent 的入口契约，不是知识概念。
- 生成区块（`ctx:begin/end`）只存在于 `AGENTS.md`，不属于 OKF，不影响 bundle 合规。

## 字段速查

| 字段 | OKF 地位 | 本技能怎么用 |
|---|---|---|
| `type` | **必填**，自由文本 | `DOC_FRONTMATTER` 检查；出现时路由表多一列"类型" |
| `description` | 推荐，一句话 | 路由表"说明"列的来源——写它就等于维护路由 |
| `title` / `tags` | 推荐 | 不检查；`title` 缺省取正文第一个 `#` 标题 |
| `status` | `draft` \| `stable` \| `deprecated`，缺省 stable | `deprecated`：不进路由、不要求被路由、不查过期 |
| `verified` | 可选，复核记录 `{ by, at }` | 复核时间晚于所覆盖代码的最后提交 → 不报 `DOC_STALE` |
| `stale_after` | 可选，绝对时刻 | 当前时间 ≥ 该值 → `DOC_EXPIRED` |
| `generated` / `sources` | 可选，产出者与来源 | 不检查、不改动，原样保留 |
| `covers` | **本技能扩展**（OKF 允许额外字段） | 文档覆盖的代码 glob，驱动 `COVERS_EMPTY` / `DOC_STALE` |

约定：

- 时间一律 ISO 8601 且带时区偏移，如 `2026-10-26T10:00:00+08:00`；只写日期的值按 UTC 解析，容易差一天。
- 行动者：人 `human:<id>`，Agent/工具 `<产出者>/<版本>`，自动流程 `process:<id>`。
- `covers` 的路径相对于文档所属单元目录；根级 `docs/` 下相对仓库根。
- **只写有值的字段**。最小合规就是一行 `type`；写了 `description` 路由就有说明；写了 `covers` 才有过期检测。

## 推荐的 type 取值

自由文本，消费者必须容忍未知值。为便于筛选，建议在仓库内固定一小套：`architecture`、`standard`、`module-doc`、`decision-record`、`glossary`、`guide`、`reference`。

## 知识载体分工

每类知识只有一个主要落点，其余地方用链接。

| 载体 | 回答什么 | 不放什么 |
|---|---|---|
| `AGENTS.md` | 在这里工作要遵循什么规则、先读什么 | 详细设计 |
| `docs/glossary.md` | 项目里某个术语的标准含义 | 实现细节 |
| 模块文档 | 模块职责、接口、约束、陷阱 | 全局规范、历史讨论 |
| ADR | 为什么选 A 不选 B | 没有取舍的普通实现细节 |
| 代码、测试、配置 | 系统现在具体怎么工作 | —（文档里不要抄第二份会漂移的副本） |

写法：

- 只写读代码看不出来的东西。
- 别处已有定义就链接，不另写一份。
- 删掉这句话，读的人会做错事吗？不会就不写。

### 术语表（`docs/glossary.md`）

- 模板见 `templates/glossary.md`；frontmatter `type: glossary`，路由表自动收录。
- **默认只有根一份，且按需创建**：仓库里第一个值得固化的术语出现时才建，不随脚手架生成。
- Agent 指令的作用域（哪个目录有 AGENTS.md）不等于领域边界，**不要给每个 AGENTS.md 配一份术语表**。只有同一个词在不同业务上下文里含义确实不同，才增加局部术语表，并在根术语表里指向它们。
- 每个词条：一句话定义；`Avoid`（不要混用的别名）；`Code`（对应的标识符或路径）。不收实现细节和通用技术名词。
- 术语有歧义时问用户，不自己选业务定义；定义一旦确定就立刻写入，不要攒到最后。

### ADR 何时写

**三条都成立**才写：

1. 将来推翻它代价高；
2. 缺少背景时，后来者会对现状感到困惑；
3. 存在真实的备选方案，且确实做了取舍。

只满足一两条，写进对应模块文档的"Conventions & gotchas"。创建 ADR 前先问用户。

## 最小示例

模块文档（放在 `<单元>/docs/redis.md`）：

```yaml
---
type: module-doc
description: Redis 适配器的连接、重试与锁
covers:
  - src/redis/**
---
```

决策记录（放在 `docs/architecture/decisions/0003-xxx.md`）：

```yaml
---
type: decision-record
description: 选用 oRPC 而非 tRPC
status: stable
---
```

ADR 的生命周期映射到 OKF：已采纳 = `stable`；被新决策取代 = `deprecated`，并在正文链接到取代它的那一篇。

复核而无需改正文：

```yaml
verified: { by: human:rockcookies, at: 2026-10-26T10:00:00+08:00 }
```

## 与 OKF 的有意偏离

| 处 | OKF | 本技能 | 理由 |
|---|---|---|---|
| `README.md` | 非保留名 ⇒ 概念文档，须有 frontmatter | 视为目录入口，**豁免**（同 `index.md`、`log.md`） | 仓库里 README 就是各目录的人类入口，强加 frontmatter 只是噪音；想加也不禁止 |
| 缺 `type` | bundle 不合规 | 只报 warn（`DOC_FRONTMATTER`），且可 `"docFrontmatter": "off"` | 存量文档要逐步迁移，不能一上来全红 |
| 链接 | 推荐以 `/` 开头的 bundle 相对链接 | 两种都认；`/x.md` 先按所在 docs 根解析，找不到再按仓库根 | 与 GitHub 的仓库根链接习惯兼容 |
| `log.md` | 可选的变更日志 | **不生成、不要求**；已有的原样保留 | 变更历史交给 git，不维护第二份 |
| `verified` | 只定义语义与信任等级 | 额外约定它与 git 的关系：复核晚于代码最后提交 ⇒ 视为未过期 | 让"核对过、无需改"有地方记录，而不是为消除告警去改正文 |
| Attested Computation（§10）、`sources` 可信度信号 | 可选族 | 不使用、不校验 | 超出代码仓库文档的需要 |

## 本技能的 frontmatter 解析范围

只支持：`key: value`、`key: [a, b]`、`key:` 后跟 `- item` 列表、单行 `{ by: x, at: y }` 映射。块式嵌套映射（`- by: x` 换行 `at: y`）读不出，请用行内写法。读不出时不会报错，只是该字段被忽略。
