---
name: git-rebase-surgeon
description: >-
  Safe Git history rewriting with pre-flight validation. Use when the user asks to rebase, squash commits, sync a branch with upstream, or rewrite history.
---

# Git Rebase Surgeon

Rewrite history safely — validate, operate, push with `--force-with-lease`.

## Pre-flight — the safety gate

Stop immediately if either check fails:

| Check | Command | Fail condition | Stop message |
|-------|---------|----------------|--------------|
| Clean tree | `git status --short` | Any output | "Stash or commit changes first" |
| Safe branch | `git branch --show-current` | `main` or `master` | "Never rebase a protected branch" |

Both must pass before proceeding.

## Strategy

| User says | Strategy | Command |
|-----------|----------|---------|
| Squash/edit last N, or a count like "3" | **Interactive** | `git rebase -i HEAD~N` |
| Sync with upstream / "pull rebase" | **Rebase pull** | `git pull --rebase origin main` |
| Move onto another branch | **Standard** | `git rebase <branch>` |
| Auto-squash fixups | **Auto-squash** | `git rebase -i --autosquash <target>` |

## Workflow

### 1. Validate

Run both pre-flight checks.

### 2. Confirm the plan

```
🔧 Rebase Plan

Target:   HEAD~3
Strategy: Interactive
Command:  git rebase -i HEAD~3

⚠️  This rewrites history. Force push required after completion.

Proceed? [y/n]
```

### 3. Execute

Run the rebase command.

### 4. Handle conflicts

When the rebase pauses, report the conflicting files from `git status`:

```
⚠️  Rebase Conflict

Conflicting files:
  - src/api/handler.ts
  - src/utils/parser.ts

Resolve in editor, then:
  git add <resolved-files>
  git rebase --continue

To abort: git rebase --abort
```

### 5. Push

```bash
git push --force-with-lease
```

Always `--force-with-lease`, never `--force`.
