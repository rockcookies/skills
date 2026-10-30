# scripts：维护者说明

> 给修改本技能脚本的人看，运行时的 Agent 不需要读。
> 行为场景在 `evals/scenarios.md`；`agent-context-update` 的在 `../agent-context-update/evals/scenarios.md`。运行时不读。

## 目录

- `ctx.mjs`：唯一 CLI 入口（init / discover / audit / sync）
- `lib.mjs`：配置、目录扫描、glob、frontmatter、git 查询
- `discover.mjs`：发现作用域与文档；`scanIssues` 记录读不了的目录/文件
- `audit.mjs`：检查码与审计逻辑
- `render.mjs` / `sync.mjs`：生成区块与落盘
- `tests/ctx.test.mjs`：测试

## 改动规则

检查逻辑改动必须同步改 `tests/ctx.test.mjs`，并保证"每个检查码都被真实触发过"那条用例通过：

```
node --test scripts/tests/ctx.test.mjs
```

新增检查码 = 新增一条"弄坏必报、修好消失"的用例，同时更新 `references/audit.md` 的检查码表。

## v1.1.0 检查

`STALE_CHECK_SKIPPED`、`SCAN_INCOMPLETE`、未提交改动的 `DOC_STALE`、`normalizeScopes` 抛错，都在 `tests/ctx.test.mjs` 里有「弄坏必报、修好消失」用例。`lastCommitTime` 仍是 `gitLastCommit(...).time` 的包装。
