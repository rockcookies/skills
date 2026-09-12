---
name: git-semantic-search
description: >-
  Git 考古 —— 用 Pickaxe、Bisect、Blame 追溯代码何时被引入、删除或修改。
  Use when the user asks who wrote a line, when a bug started, where a symbol
  came from, or needs archaeology of any code change. Not for generic git log
  browsing. Not for creating atomic commits (→ git-atomic-commit). Not for
  rebase or history rewriting (→ git-rebase-surgeon).
when_to_use: >-
  谁写的这行, bug 从何时开始, 符号来源, git 考古, pickaxe, blame, bisect,
  代码何时引入
user-invocable: true
metadata:
  author: rockcookies
  version: 3.0.0
---

**范围：** 理解历史（archaeology）。不制造提交（→ `git-atomic-commit`）。不重写历史（→ `git-rebase-surgeon`）。

# Git 语义考古

在 Git 历史中做考古。将查询匹配到合适的工具：

| 查询类型 | 工具 | 考古学名 | 命令骨架 |
|----------|------|----------|----------|
| 精确符号或字符串 | Pickaxe (`-S`) | existence archaeology | `git log -S "<query>"` |
| 模式或逻辑变化 | Regex (`-G`) | behavior archaeology | `git log -G "<query>"` |
| 具体行 / 「谁写的这行」 | Blame | ownership archaeology | `git blame -w -M -C -L N,M <file>` |
| 「这个 bug 从什么时候开始」 | Bisect | causality archaeology | `git bisect start` … |

不要退化成通用的 `git log`。

## Preconditions

1. 在 git 仓库内：`git rev-parse --is-inside-work-tree`
2. 记录 `ORIGINAL_HEAD=$(git rev-parse HEAD)` 与当前分支（若有）
3. 解析搜索范围：默认当前分支历史；用户怀疑其他分支或已合并路径时加 `--all`

### Bisect 子集合同（仅 bisect 路径）

`git bisect start` **之前**：

```bash
git status --short
```

必须为空。否则：提示用户 stash / commit / abort——**不能**直接进入 bisect（会 checkout 其他提交，可能覆盖或困惑工作区）。

进行中：禁止把仓库留在 detached bisect 状态结束会话。定位完成后必须：

```bash
git bisect reset
```

### NEVER（本 skill 相关）

- 在脏工作区启动 bisect
- 跳过 `git bisect reset` 就结束
- `git reset --hard` / `git clean -fd`（除非用户明确确认）
- 用 ours/theirs 自动解冲突（bisect 中若遇冲突：停止报告）

## Plan

将用户问题映射到工具后，先陈述计划（工具、范围、是否需要 bisect 干净工作区），再执行。Bisect 需用户确认 good/bad 边界（或可运行的测试脚本）后再 `start`。

## Execution

### Pass 策略（Pickaxe / Regex）

**Pass 1**（默认）：

```bash
git log -S "<query>" --date=short --no-merges --format="%h | %ad | %an | %s"
# 或 -G
```

单文件场景可加 `--follow -- <file>`。

**Pass 2**（Pass 1 无有用结果时）：去掉 `--no-merges`，必要时加 `--all`——目标字符串可能只在 merge 上下文中首次进入当前历史。

检索最多约 5 条相关提交后进入深挖；不要无结果就退化成裸 `git log`。

### Blame

```bash
git blame -w -M -C -L N,M <file> --date=short
# 若存在 .git-blame-ignore-revs：
git blame --ignore-revs-file .git-blame-ignore-revs -L N,M <file>
```

### Bisect

工作区已干净且用户确认边界后：

```bash
git bisect start
git bisect bad HEAD   # 或用户指定的 bad
git bisect good <已知良好的提交>
```

循环：每次 checkout 后由用户（或 `git bisect run <test-script>`）判定 good/bad，直到报告第一个错误提交，然后 **必须** `git bisect reset`。

### 深挖（引入 / 删除 / 重命名）

对候选提交看完整 diff（非仅 `--stat`）：

```bash
git show <hash> -p
```

判定：

| 证据 | 标签 |
|------|------|
| diff 中 `+` 侧出现 query | **introduced** |
| diff 中 `-` 侧去掉 query | **removed** |
| 伴随重命名/路径迁移 | **migrated**（rename） |
| 仍存在但逻辑大改 | **refactored**（later） |

## Postconditions

报告模板：

```
🕵️ 考古报告

查询：    "MAX_RETRY"
工具：    Pickaxe (-S) — existence archaeology
范围：    当前分支；Pass 1 --no-merges（如启用 Pass 2 请注明）

| Hash    | 日期       | 作者  | 角色        | 提交信息 |
|---------|------------|-------|-------------|---------|
| a1b2c3d | 2023-10-12 | Alice | introduced  | feat: … |
| d4e5f6g | 2024-01-08 | Carol | refactored  | refactor: … |
| h7i8j9k | 2024-06-01 | Dan   | removed     | chore: … |

结论：
  introduced:  a1b2c3d
  later refactored: d4e5f6g
  removed:     h7i8j9k
```

**完成标准：** 给出引入/删除/迁移结论（或明确「未找到」及已尝试的 Pass）；若用了 Bisect，已执行 `git bisect reset`，且 `git status` / `git rev-parse HEAD` 回到进入前的分支状态（对照 `ORIGINAL_HEAD` 所在分支）。

## Failure Recovery

同一操作失败预算 **3**：

1. 诊断后确定性重试（例如 Pass 1 空 → Pass 2）
2. 重评工具选择或范围，向用户确认
3. 停止并报告（含已尝试命令与 `git status`）

Bisect 中途失败或用户中止：优先 `git bisect reset`，确认不停留在 bisect 状态后再结束。
