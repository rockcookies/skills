# 审计检查码

> 何时读：`audit` 报了问题，需要知道怎么处理；或要核对某份文档是否仍然准确。严重级别：error 必须修；warn 修掉或说明；info 提示。

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
| `DOC_STALE` | warn | `covers` 的代码比文档新：最近提交更晚，或有未提交改动而文档没有；且没有更晚的 `verified` | 做「语义核对」：需要改就改；确认无需改动就加 `verified: { by, at }`（见 `format.md`） |
| `DOC_EXPIRED` | warn | `stale_after` 已过 | 做「语义核对」后更新内容并顺延 `stale_after`；`status: deprecated` 的不检查 |
| `DOC_FRONTMATTER` | warn | docs 下的概念文档缺 frontmatter `type`（README、index.md、log.md 豁免） | 按内容补 `type`（拿不准就问）；存量太多可先 `"docFrontmatter": "off"` 再逐步迁移 |
| `SCOPE_PATH_MISSING` | error | `scopes` 里的目录不存在 | 目录改名/删除了：改 `scopes`；若同时有 `SCAN_INCOMPLETE`，先看是不是没权限读 |
| `SCOPE_UNLISTED` | info | 显式模式下，有清单文件但没列入 `scopes` 的目录 | 要维护就加进 `scopes`；不需要就忽略，或 `reportUnlisted: false` |
| `ROUTE_MISSING` | warn | AGENTS.md 没有指向某些文档 | `sync --add-blocks --write` 生成路由表，或手写指针 |
| `STANDARDS` | info | 发现仓库自己的文档规范 | 改文档前先读，以它为准 |
| `STALE_CHECK_SKIPPED` | info | 过期检查没有（完整）执行：关了 `staleCheck`、没有 git、仓库还没有提交，或读不了工作区状态 | 向用户说明；能修就修（初始化 git、做第一次提交）。此时没有 `DOC_STALE` **不代表**文档是新的 |
| `SCAN_INCOMPLETE` | warn | 有目录/文件读不了（权限、损坏的 package.json 等），发现结果可能不完整 | 修好权限或文件后重跑；修不了就向用户说明，别把这次的"没问题"当结论 |

## 两类检查，别混

- **机械线索**（脚本）：路径是否存在、链接是否有效、区块是否一致、提交时间与未提交改动、`stale_after`。它们快、确定，但只回答"该不该看一眼"。
- **语义准确性**（Agent）：文档说的和代码做的是否一致。脚本不判断这个，也不要往脚本里加。

## 语义核对

收到 `DOC_STALE` / `DOC_EXPIRED`，或日常维护中怀疑某份文档，按下面做，不要凭印象：

1. 读文档，再读它 `covers` 覆盖的代码，以及相关测试、配置。
2. 对文档里每条**重要陈述**（职责、接口、约束、命令、坑）在代码里找依据。
3. 判断：
   - **准确**：陈述有依据；读完知道去哪改、调什么、怎么验证；说清了适用范围。
   - **有出入**：改正文，只改变了的部分。
   - **缺信息**：补不容易从代码结构看出来的知识；能从代码一眼看出的不用写。
   - **重复**：别处已有权威定义的，改成链接。
4. 只有第 3 步判为"准确"且没有改动，才加 `verified: { by, at }`；`at` 用当前时间，带时区偏移。改了正文的不需要 `verified`，提交本身就是复核。

## 为什么每条都要"能被触发"

门禁绿灯只有在它真的能亮红灯时才有意义。`scripts/tests/` 为每个检查码保留"故意弄坏→必须报错；修好→必须消失"的用例，最后一条断言所有检查码都被触发过。新增或修改检查时同步维护（见 `scripts/README.md`）。

## 已知盲区

- `DOC_STALE` 不理解语义：代码里改了注释也会触发；文档里改了错别字也会让它不再触发。它是"该看一眼了"的信号，不是正确性证明。
- 代码和文档**同时**有未提交改动时不报 `DOC_STALE`（认为作者正在同步改），但这不证明两者一致。
- 未提交改动的比较用文件修改时间对照 `verified.at`，时钟不准或检出时批量改写 mtime 时可能误判。
- `verified` 是人/Agent 的声明，脚本无法核实内容是否真的被核对过。
- 链接检查只验证"目标存在"，不验证锚点（`#heading`）。
