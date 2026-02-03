# Reference: Git Rebase Surgeon Workflow

## Core Logic

Validate safety → Select strategy → Execute rebase → Handle conflicts → Safe push.

---

## Safety Rules

### Golden Rules

- **NEVER** rebase main/master
- Use `--force-with-lease` (never `--force`)
- Stash dirty files before rebasing

### Pre-flight Checks

**Before executing ANY rebase command, MUST perform these checks:**

| Check | Command | Fail Condition | Action |
|-------|---------|----------------|--------|
| Dirty tree | `git status --short` | Has output | 🛑 STOP: "Stash or commit changes first" |
| Protected branch | `git branch --show-current` | main/master | 🛑 STOP: "Do not rebase protected branch" |

---

## Strategy Selection

### Quick Reference

| Scenario | Target Example | Strategy | Command |
|----------|----------------|----------|---------|
| Cleanup (Squash/Edit last N) | `HEAD~3` or `3` | **Interactive** | `git rebase -i HEAD~N` |
| Sync (Update with base) | `origin/main` | **Rebase Pull** | `git pull --rebase origin main` |
| Replant (Move branch) | `other-branch` | **Standard** | `git rebase other-branch` |
| Fixup (Auto-squash) | `--autosquash` | **Auto-Squash** | `git rebase -i --autosquash <target>` |

---

## Workflow

### Step 1: Validate Safety

```bash
# Check for dirty tree
git status --short

# Check current branch
git branch --show-current
```

If either check fails → STOP and warn user.

### Step 2: Select Strategy

Analyze target to determine operation mode:
- Number or `HEAD~N` → Interactive rebase
- Remote branch → Rebase pull
- Local branch → Standard rebase

### Step 3: Execute Rebase

```bash
# Interactive: squash/edit commits
git rebase -i HEAD~3

# Sync: update with upstream
git pull --rebase origin main

# Replant: move onto another branch
git rebase other-branch
```

> ⚠️ **WARNING**: This will rewrite history. Force push required after completion.

### Step 4: Handle Conflicts

If rebase stops due to conflicts:

```bash
# 1. Check conflicting files
git status

# 2. After resolving conflicts
git add <resolved-files>
git rebase --continue

# 3. Or abort to return to safety
git rebase --abort
```

### Step 5: Safe Push

After successful rebase:

```bash
git push --force-with-lease
```

**NEVER** use `--force`. Always use `--force-with-lease` to prevent overwriting others' work.

---

## Output Format

```
🔧 Rebase Plan

Target: HEAD~3
Strategy: Interactive
Command: git rebase -i HEAD~3

⚠️ This will rewrite history.
   You will need to force push after completion.

Proceed? [y/n]
```

### Conflict Output

```
⚠️ Rebase Conflict Detected

Conflicting files:
  - src/api/handler.ts
  - src/utils/parser.ts

Next steps:
  1. Resolve conflicts in your editor
  2. Run: git add <resolved-files>
  3. Run: git rebase --continue

To abort: git rebase --abort
```
