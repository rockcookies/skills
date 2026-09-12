---
name: git-rebase-surgeon
description: >-
  带前置校验的安全 Git 历史重写。用于用户要求 rebase、squash 提交、与上游同步分支，
  或重写历史时。Use when the user asks to rebase, squash commits, sync a branch
  with upstream, or rewrite history with a safety net and force-with-lease.
  Not for creating new atomic commits (→ git-atomic-commit). Not for pickaxe /
  blame / bisect archaeology (→ git-semantic-search).
when_to_use: >-
  rebase, squash 提交, 与上游同步, 重写历史, force-with-lease, pull --rebase,
  交互式 rebase
user-invocable: true
metadata:
  author: rockcookies
  version: 3.0.0
---

**范围：** 重写历史（rebase / squash / onto）。不制造新的原子提交分组（→ `git-atomic-commit`）。不追溯符号/回归来源（→ `git-semantic-search`）。

# Git Rebase 外科手术

安全地重写历史 —— Preconditions → 安全网 → Plan → Execution → Postconditions；推送只用带 expected SHA 的 `--force-with-lease`。

## Preconditions

以下任一不通过，立即停止：

| 检查项 | 命令 / 证据 | 失败条件 | 停止提示 |
|--------|-------------|---------|----------|
| 在 git 仓库内 | `git rev-parse --is-inside-work-tree` | 非仓库 | 停止 |
| 记录 ORIGINAL_HEAD | `ORIGINAL_HEAD=$(git rev-parse HEAD)` | — | 必须记录 |
| 工作区干净 | `git status --short` | 有输出 | 请先 stash 或提交当前改动 |
| 非受保护分支 | `git branch --show-current` | `main` / `master` / `develop` / `release/*` | 禁止在受保护分支上直接 rebase |
| 非进行中状态 | `.git/rebase-merge`、`.git/rebase-apply`、`.git/MERGE_HEAD`、`.git/CHERRY_PICK_HEAD`、`.git/BISECT_LOG` | 存在 | 先 `--continue` 或 `--abort` |
| 未分离 HEAD | `git symbolic-ref -q HEAD` | 无输出 | 当前处于 detached HEAD，确认后再重写 |

### Upstream（repository-aware，禁止写死 `origin`）

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
# 例：origin/feature/foo → remote=origin，upstream_ref=feature/foo
```

- 成功 → 拆出 `REMOTE` 与 `UPSTREAM_REF`，后续 `fetch` / `pull` / 对比都用它们
- 失败 → 记 `no upstream configured`，**不当作失败**；跳过远程对比，计划中写明

有 upstream 时的共享提交检查：

```bash
git fetch "$REMOTE"
git log --oneline @{u}..HEAD   # 尚未推送的提交
git log --oneline HEAD..@{u}   # 远程领先本地
```

- 要重写的范围含**已推送**提交 → 告知可能造成协作者分叉，需二次确认
- 远程有本地没有的新提交 → 提示先决定是否基于最新远程操作

### NEVER

- `git reset --hard`（除非用户对**本 backup 分支**明确确认恢复）
- `git clean -fd`
- `git push --force`（无 lease）
- 未 fetch 且未记录 expected remote SHA 的 `--force-with-lease`
- `--no-verify` / 绕过 hooks
- 丢弃无关工作区改动
- 用 ours/theirs 自动解冲突
- `git add -p`
- **会打开编辑器的** `git rebase -i`（必须配合 `GIT_SEQUENCE_EDITOR`）

## Plan

### 策略选择

| 用户诉求 | 策略 | 执行方式（agent-safe） |
|----------|------|------------------------|
| squash/编辑最近 N 个提交 | **交互式（非交互执行）** | `GIT_SEQUENCE_EDITOR=... git rebase -i HEAD~N` |
| 与上游同步 / pull rebase | **Rebase pull** | `git pull --rebase "$REMOTE" "$UPSTREAM_REF"`（无 upstream 则先确认目标 ref） |
| 变基到另一分支 | **标准** | `git fetch "$REMOTE" <branch>`，再 `git rebase "$REMOTE/<branch>"`（或用户给出的本地 ref） |
| 自动合并 fixup | **自动 squash** | `GIT_SEQUENCE_EDITOR=... git rebase -i --autosquash <target>` |

### 创建安全网

```bash
BACKUP_BRANCH="backup/pre-rebase-$(date +%Y%m%d%H%M%S)"
git branch "$BACKUP_BRANCH"
# 验证：git rev-parse "$BACKUP_BRANCH" 必须等于 ORIGINAL_HEAD
```

计划中必须记录：

- original branch
- `ORIGINAL_HEAD`
- upstream（或 `no upstream configured`）
- target / 策略
- backup 分支名

### 确认计划（用户确认前不 mutation）

```
🔧 Rebase 计划

分支：      <branch>
ORIGINAL_HEAD: <sha>
目标：      HEAD~3 / <onto-ref>
策略：      交互式（GIT_SEQUENCE_EDITOR）
命令：      GIT_SEQUENCE_EDITOR='...' git rebase -i HEAD~3
安全网：    backup/pre-rebase-...
upstream：  origin/feature/foo 或 no upstream configured
已推送提交：无 / 有（如有需二次确认）

⚠️  此操作将重写历史；推送时使用 --force-with-lease=<branch>:<expected-sha>。

是否继续？[y/n]
```

## Execution

### 交互式 rebase（agent-safe）

禁止裸 `git rebase -i`（会打开 vim）。用 `GIT_SEQUENCE_EDITOR` 原地改 todo。

示例：squash 最近 3 个提交（首条 pick，其余 squash）——可移植 Python：

```bash
GIT_SEQUENCE_EDITOR="python -c \"import pathlib,sys; p=pathlib.Path(sys.argv[1]); lines=p.read_text().splitlines(); out=[]; started=False
for line in lines:
    if line.startswith('pick ') or line.startswith('p '):
        if not started:
            out.append(line); started=True
        else:
            out.append('squash ' + line.split(' ',1)[1])
    else:
        out.append(line)
p.write_text('\\n'.join(out)+('\\n' if out else ''))\"" git rebase -i HEAD~3
```

按用户意图调整 todo（`reword` / `edit` / `drop` 等同理）。**Python 不可用 → 停止并报告，不打开 vim。**

消息编辑若需要非交互，设置 `GIT_EDITOR` / `EDITOR` 为确定性脚本，或使用 `-m` 能覆盖的路径；禁止依赖人工在编辑器里保存。

### 冲突

rebase 暂停时，只报告 `git status` 中的冲突文件：

```
⚠️  Rebase 冲突

冲突文件：
  - src/api/handler.ts

解决后：
  git add <已解决文件>
  git rebase --continue

放弃：git rebase --abort
```

**不要**自动选 ours/theirs。等用户解决或明确指示。

### 推送前

1. 确认 rebase 已结束（无 `.git/rebase-merge` / `.git/rebase-apply`）
2. 跑 Postconditions（见下）
3. 有 upstream 时：

```bash
git fetch "$REMOTE"
EXPECTED_REMOTE_SHA=$(git rev-parse @{u})
```

4. 向用户二次确认是否推送

```bash
git push --force-with-lease="<branch>:<EXPECTED_REMOTE_SHA>" "$REMOTE" "HEAD:refs/heads/<branch>"
```

（`<branch>` 为当前分支名；lease 的 expected SHA 为 fetch 后记录的远程 tip。）

推送失败（远程有新提交）→ 再 `fetch`、重评计划；**绝不**降级为 `--force`。

无 upstream / 用户不要求推送 → 跳过推送，保留 backup。

## Postconditions

```bash
git rev-parse "$BACKUP_BRANCH"   # 必须仍等于计划中的 ORIGINAL_HEAD
git log --graph --decorate --oneline -n 15
git status
```

onto 目标时额外：

```bash
git merge-base --is-ancestor <target> HEAD
# 或检查 merge-base 与预期祖先链一致
```

**完成标准：** 历史符合计划；backup SHA == `ORIGINAL_HEAD`；工作区干净；若推送则 lease 成功。报告写出实际用过的非交互命令。

## Failure Recovery

同一操作失败预算 **3**：

1. 诊断后仅确定性重试（例如 lease 过期后重新 fetch 再评估）
2. 重评计划，向用户确认
3. 停止并报告（含 `git status`、`ORIGINAL_HEAD`、backup 分支名）

冲突、hook、push rejection 均计入预算；不吞错、不自动跳过。恢复工作树默认只建议：

```bash
git reset --hard <backup分支>
```

**仅在用户明确确认该 backup 后**才执行。
