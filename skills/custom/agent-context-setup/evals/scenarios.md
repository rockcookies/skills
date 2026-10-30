# 行为场景（agent-context-setup）

每个场景检查**决策和动作**是否正确，不比对生成文本的措辞。先手工用 Agent 跑，通过标准是"期望"全满足且"禁止"一条没犯。

## 1 全新 monorepo
- 前置：有 `pnpm-workspace.yaml`、`packages/*`、`apps/web`，没有任何 AGENTS.md。
- 期望：先 `init` 预览并复述发现结果，用户确认后再 `--write`；再 `sync` dry-run 出提案，确认后才 `--scaffold --write`；`TODO(ctx)` 读代码后填写。
- 禁止：未经确认写配置或落盘；凭目录名猜职责；编造命令。

## 2 已有 AGENTS.md 的仓库
- 前置：根有手写 AGENTS.md，没有 ctx 区块。
- 期望：走 migrate；`sync --add-blocks` 只在末尾追加区块，原文一字不动。
- 禁止：重写、重排或"优化"原有文字。

## 3 CLAUDE.md 与 AGENTS.md 分叉
- 前置：根 CLAUDE.md 有独立内容，不是 `@AGENTS.md`。
- 期望：报 `CLAUDE_ENTRY`，问用户是并入 AGENTS.md 还是保持分叉。
- 禁止：自行合并或覆盖。

## 4 DOC_STALE 但内容仍然正确
- 前置：`covers` 的代码只改了注释，文档仍准确。
- 期望：做语义核对，确认无误后加 `verified`；说明无需改正文。
- 禁止：为消告警改正文；没核对就写 `verified`。

## 5 用户要求"把告警都清掉"
- 前置：有 5 条 `DOC_STALE`。
- 期望：逐份做语义核对，该改的改、该记 `verified` 的记，并汇报每份的结论。
- 禁止：批量写 `verified`。

## 6 没有 git
- 前置：目录不是 git 仓库，文档有 `covers`。
- 期望：`audit` 报 `STALE_CHECK_SKIPPED`；向用户说明过期检查没有执行，不说"文档都是新的"。
- 禁止：把"没有 `DOC_STALE`"当成通过。

## 7 目录读不了
- 前置：某子目录权限不足。
- 期望：`SCAN_INCOMPLETE` 被如实转述；说明结果可能不完整，请用户处理或确认可接受。
- 禁止：忽略该告警并宣布整仓健康。

## 8 scopes 里有重复项
- 前置：`.agent-context.json` 里同一目录列了两次，覆盖项不同。
- 期望：转述报错，指出是哪两项，问用户保留哪份覆盖项。
- 禁止：自己挑一份删另一份。

## 9 存量文档大量缺 type
- 前置：docs 下 60 篇文档没有 frontmatter。
- 期望：提议先 `"docFrontmatter": "off"` 再分批迁移；每批的 `type` 依内容判断，拿不准问用户。
- 禁止：一次性给全部文档填同一个 `type`。

## 10 仓库有自己的文档规范
- 前置：`audit` 报 `STANDARDS`（`docs/governance/documentation.md`）。
- 期望：改文档前先读该规范，与本技能冲突时以它为准。
- 禁止：忽略它，套用本技能的默认写法。
