---
name: git-atomic-commit
description: >-
  生成原子化的 Git 提交——每个提交只包含一个逻辑变更（One logical change → One
  revertable commit），格式遵循与项目风格一致的 Conventional Commits。
  Use when the user has multiple files or concerns to commit, needs to split a
  mixed index into atomic commits, or asks for Conventional Commits / 原子提交.
  Not for history rewriting or rebase (→ git-rebase-surgeon). Not for pickaxe /
  blame / bisect archaeology (→ git-semantic-search).
when_to_use: >-
  原子提交, 拆 commit, 多个改动一起提交, Conventional Commits, 暂存区混了多个逻辑,
  按逻辑拆分提交
user-invocable: true
metadata:
  author: rockcookies
  version: 3.0.0
---

**范围：** 制造历史（commit）。不重写已推送历史（→ `git-rebase-surgeon`）。不追溯符号/回归来源（→ `git-semantic-search`）。

**核心 invariant：** One logical change → One revertable commit。

# Git 原子提交

将一批改动拆分为多个原子提交，每个提交只做一件事，并写出符合规范的 Conventional Commit。

## Preconditions

不满足则停止，不进入 Plan：

1. 在 git 仓库内：`git rev-parse --is-inside-work-tree`
2. 记录 `ORIGINAL_HEAD=$(git rev-parse HEAD)`
3. 识别分支：`git rev-parse --abbrev-ref HEAD`
   - detached HEAD → 提示用户，确认是否仍要继续提交
4. 无进行中操作：`.git/MERGE_HEAD`、`.git/rebase-merge`、`.git/rebase-apply`、`.git/CHERRY_PICK_HEAD`、`.git/BISECT_LOG` 任一存在 → 停止，先处理完当前操作
5. 解析 upstream（可选）：`git rev-parse --abbrev-ref --symbolic-full-name @{u}`
   - 失败 → 记 `no upstream configured`，**不当作失败**
6. 受保护分支（`main` / `master` / `develop` / `release/*`）→ 提示一次，等待确认后再继续

### NEVER

- `git reset --hard`（除非用户对某个 backup 明确确认恢复）
- `git clean -fd`
- `git push --force`（无 lease）
- 未 fetch 且未记录 expected remote SHA 的 `--force-with-lease`
- `--no-verify` / 绕过 hooks
- 丢弃无关工作区改动
- 用 ours/theirs 自动解冲突
- `git add -p`（交互式；改用 `git apply --cached`）
- 会打开编辑器的 `git rebase -i`

## Plan

### 模式判断

| 暂存区（index） | 未暂存 / untracked | 模式 |
|-----------------|-------------------|------|
| 有改动 | — | **Direct**：`commit candidates = index only`；工作区未暂存与 untracked 默认 **immutable** |
| 空 | 有改动 | **Plan**：输出暂存计划，等待确认后再 add + commit |
| 空 | 空 | **Exit**：提示「没有可提交的改动，工作区干净」 |

Direct 模式下暂存区内容不能默认视为一个整体——它同样可能混杂多个逻辑变更，必须经过原子化分组后再决定拆成几个 commit。

### 1. 收集上下文

```bash
git status --short
git diff --staged
git diff
git ls-files --others --exclude-standard
git log -30 --pretty=format:"%s"
```

**完成标准：** 能看到最近 30 条提交信息（风格检测）；staged + unstaged 全量 diff；untracked 路径列表。每个 untracked 文件必须**读取文件内容**后再分组——`git diff` 看不到它们。

### 2. 提交前安全检查

扫描 diff 与 untracked 内容，按**语义**判断风险，而非机械字符串匹配：

| 类别 | 处理 |
|------|------|
| 疑似密钥/凭证（`.env`、API key、token、私钥） | 阻断，向用户确认 |
| 体积异常的二进制/大文件 | 阻断，向用户确认 |
| 明显调试残留（临时 `debugger`、明显的调试打印、注释掉的实验代码） | 阻断 |
| 疑似调试残留（`console.log` / `fmt.Println` 等，语境不明） | 标记风险，询问是否继续 |
| 正常业务 / CLI 输出 | 不阻断 |

### 3. 检测提交风格

扫描最近 30 条 `%s`。优先 Conventional Commits；若项目使用其他格式则适配之。不把规范全文复述进本 skill。

### 4. 拆分为原子单元

将每个改动文件（或 hunk）精确分配到一个分组。出现以下情况时应拆分：

- 位于不同的顶层目录或模块
- 属于不同的组件类型（component / composable / util / config / test）
- 可以被独立回退（revert）
- 新增文件与已有文件的修改混在一起
- **同一文件内包含多个不相关的改动块** —— 不能整文件归一组；用下方 hunk 暂存流程拆分

每个分组必须通过可回退性测试：单独 revert 这一个提交，不影响其他提交。

若某个文件的归属存在歧义，不要臆断，向用户提出并等待确认。

### 5. 撰写提交信息

格式：`<type>(<scope>): <subject>`

- Subject：祈使句、小写开头、不带句号、≤ 50 字符
- Type：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore`
- Body（如需要）：与 subject 空一行，按 72 字符换行，解释「为什么」
- Footer（如需要）：`BREAKING CHANGE:` / `feat(api)!:` / `Closes #123`

### 6. 展示计划

**Direct 模式：**

```
=== 提交计划 ===

[1/2] feat(auth): add login validation
  - src/auth/validator.ts  (modified, index)
  - src/auth/types.ts      (new, index)

[2/2] test(auth): add validator unit tests
  - tests/auth/validator.test.ts  (new, index)

工作区未暂存 / untracked：保持不动（除非用户确认进入 Plan 模式一并处理）

是否按此计划提交？[y/n]
```

**Plan 模式：**

```
=== 暂存计划 ===

[1/2] feat(auth): add login validation
  - src/auth/validator.ts
  - src/auth/types.ts

[2/2] test(auth): add validator unit tests
  - tests/auth/validator.test.ts

是否按此计划暂存并提交？[y/n]
```

用户确认前不执行任何 mutation。

## Execution

确认后按分组依次执行。每组提交前确保 index **只**包含该组内容。

### Hunk 暂存（禁止 `git add -p`）

```bash
git diff --unified=0 -- <path>   # 或 git diff --cached --unified=0
# 构造仅含目标 hunk 的 patch 文件
git apply --cached /tmp/group-N.patch
git diff --cached --stat
git diff --cached
```

**完成标准：** `git diff --cached` 与计划中该组内容一致。不匹配则停止（计入 Failure Recovery），不 `reset --hard`。

整文件归属明确时可用 `git add -- <path>`（仅 Plan 模式或用户已确认要把 worktree 纳入时）。

### Direct：同文件 staged + unstaged 混合

1. 保存当前 index：`git diff --cached > /tmp/index-snapshot.patch`
2. 确认工作区是否已包含全部 index 内容（对比 `git diff --cached` 与工作区）
3. 若工作区已覆盖 index：`git reset`（mixed，默认）清空 index，再按组 `git apply --cached` 逐组提交；每组提交后工作区未纳入的 hunk 保持未暂存
4. 若 index 有工作区没有的 hunk → **停止**，向用户说明，等确认后再继续（不可擅自丢弃 index 或 worktree）

Direct 默认：**不**把 unstaged / untracked 纳入 commit candidates。

### 每条 commit 前

```bash
git diff --cached --check
git diff --cached --stat
```

`--check` 捕获 trailing whitespace 与冲突标记（`<<<<<<<` 等）。失败则停止，不 commit。

然后：

```bash
git commit -m "$(cat <<'EOF'
<message>

EOF
)"
```

**任何 commit 失败（hook / lint / test / editor）→ 立即停止后续分组。** 运行 `git status` 与 `git diff --staged` 诊断；不跳过、不 `--no-verify`、不自动 restore 无关改动。

## Postconditions

每次提交完成后：

```bash
git log --oneline -n <本次提交数量>
git status --short
```

确认：提交数量与信息与计划一致；Direct 下未纳入计划的 unstaged/untracked 仍在；Plan 模式下该批完成后 index 符合预期（通常为空或仅剩未确认组）。

**完成标准：** 每个分组都有独立提交，且经上述命令验证无误。报告时写出实际用过的非交互命令。

## Failure Recovery

同一操作失败预算 **3**：

1. 诊断后仅在确定性修复下重试一次
2. 重评计划，向用户确认
3. 停止并报告现状（含 `git status`、`ORIGINAL_HEAD`）

任何命令失败：立刻 `git status`，不吞错，不继续下一组。
