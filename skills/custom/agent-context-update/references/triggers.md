# 变更 → 文档

> 何时读：判断这次改动要不要更新文档、更新哪里。

## 要更新

| 变更 | 落点 | 做法 |
|---|---|---|
| HTTP / RPC / CLI 的请求、响应、错误语义；公共函数签名 | `covers` 命中的模块文档，以及里面的示例 | 读代码确认后，只改变化的部分 |
| 数据库表、状态机、业务规则、约束 | 模块文档；涉及术语见下 | 同上 |
| 命令、脚本、构建、测试、部署方式 | 生成的 `commands` 区块；手写的操作说明 | 区块用 `sync --write`；手写部分另改 |
| 模块边界、调用流程、依赖方向、目录结构 | 作用域 `AGENTS.md`、架构文档、`units` 区块 | 区块用 `sync --write`；手写说明另改 |
| 新增、改名或改了含义的领域概念 | `docs/glossary.md` | 见「术语」 |
| 重大设计取舍 | ADR | 见「ADR」 |
| 发现文档与代码矛盾（不论是不是这次引入的） | 该文档 | 先确认以代码为准；拿不准问用户 |

## 不用更新

- 纯重命名、局部重构、性能优化，外部行为和接口不变
- 测试的调整，没有改变对外约定
- 注释、格式、依赖的小版本升级
- 文档里本来就没提到的内部细节

这些改动如果落在某份文档的 `covers` 里、`audit` 报了 `DOC_STALE`：按 `agent-context-setup/references/audit.md` 的「语义核对」处理。

## 术语

- 先看 `docs/glossary.md` 里有没有这个词。有就按现有定义用；定义确实变了才改。
- 没有，且值得固化（会在讨论、代码、文档里反复出现，或不同人叫法不一）：含义明确就直接加词条；含义有歧义、或需要你"选一个业务定义"，先问用户。
- 没有术语表文件时，按 `agent-context-setup/references/templates/glossary.md` 新建 `docs/glossary.md`；路由由 `sync` 生成。
- 词条字段和何时拆局部术语表见 `agent-context-setup/references/format.md`。

## ADR

判断条件（三条都成立才写）和写法见 `agent-context-setup/references/format.md`。先问用户；不满足就写进对应模块文档的"Conventions & gotchas"。被新决策取代的旧 ADR：`status: deprecated`，正文链接到新的。

## 写法

写法见 `agent-context-setup/references/format.md`「知识载体分工」。
