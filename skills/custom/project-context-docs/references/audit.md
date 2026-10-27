# 审计检查码

> 何时读：`audit` 报了问题，需要知道怎么处理。严重级别：error 必须修；warn 修掉或说明；info 提示。

| 码 | 级别 | 含义 | 处理 |
|---|---|---|---|
| `ROOT_AGENTS_MISSING` | error | 仓库根没有 AGENTS.md | `sync --scaffold --write`，再补 TODO |
| `SCOPE_AGENTS_MISSING` | warn | 应有却没有（显式模式：列入 `scopes` 的目录；自动模式：按 `requireAgents`） | `sync --scaffold --write`；确实不需要就从 `scopes` 删掉该行 |
| `AGENTS_TOO_LONG` | warn | 超过行数上限 | 把专项内容下沉到 docs/ 并加路由；不要靠调大上限了事 |
| `CLAUDE_ENTRY` | warn | 缺 CLAUDE.md，或它没导入 AGENTS.md | 让它只含一行 `@AGENTS.md`；有独立内容先问用户 |
| `BLOCK_UNBALANCED` | error | `ctx:begin/end` 不成对或重复 | 人工修标记；在此之前 sync 会跳过该文件 |
| `BLOCK_STALE` | warn | 生成区块与现状不一致 | `sync --write` |
| `TODO_LEFT` | info | 脚手架留下的 `TODO(ctx)` 未填 | 读代码后补全，别编造 |
| `DEAD_LINK` | error | 相对链接或 `@导入` 目标不存在 | 修路径，或删掉过期引用（代码块内的示例不检查） |
| `COVERS_EMPTY` | error | 文档 `covers` 没匹配到任何文件 | 代码被改名/删除：更新 covers，或确认文档本身该退役 |
| `DOC_STALE` | warn | `covers` 的代码最近提交晚于文档，且没有更晚的 `verified` | 对照代码核对文档：需要改就改；确认无需改动就加一条 `verified: { by, at }`（见 `format.md`），不要为消告警而改正文 |
| `DOC_EXPIRED` | warn | `stale_after` 已过 | 复核后更新内容并顺延 `stale_after`；`status: deprecated` 的不检查 |
| `DOC_FRONTMATTER` | warn | docs 下的概念文档缺 frontmatter `type`（README、index.md、log.md 豁免） | 按内容补 `type`（拿不准就问）；存量太多可先 `"docFrontmatter": "off"` 再逐步迁移 |
| `SCOPE_PATH_MISSING` | error | `scopes` 里的目录不存在 | 目录改名/删除了：改 `scopes` |
| `SCOPE_UNLISTED` | info | 显式模式下，有清单文件但没列入 `scopes` 的目录 | 要维护就加进 `scopes`；不需要就忽略，或 `reportUnlisted: false` |
| `ROUTE_MISSING` | warn | AGENTS.md 没有指向某些文档 | `sync --add-blocks --write` 生成路由表，或手写指针 |
| `STANDARDS` | info | 发现仓库自己的文档规范 | 改文档前先读，以它为准 |

## 为什么每条都要"能被触发"

门禁绿灯只有在它真的能亮红灯时才有意义。`scripts/tests/` 为每个检查码保留了"故意弄坏→必须报错；修好→必须消失"的用例，最后一条用例断言所有检查码都被触发过。新增或修改检查时同步维护这些用例。

## 已知盲区

- `DOC_STALE` 只比较提交时间；`verified` 是人/Agent 的声明，脚本无法核实内容是否真的被核对过，不理解语义：代码里改了注释也会触发；文档里改了错别字也会清除。它是"该看一眼了"的信号，不是正确性证明。
- 没有 git 或文档/代码尚未提交时，`DOC_STALE` 静默跳过。
- 链接检查只验证"目标存在"，不验证锚点（`#heading`）。
