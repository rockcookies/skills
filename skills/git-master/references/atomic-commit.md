# Reference: Git Atomic Commit Workflow

## Core Logic

Analyze changes → Apply splitting rules → Generate Conventional Commits → Execute atomically.

---

## Operation Modes

| Staged | Unstaged | Mode |
|--------|----------|------|
| ✅ Has changes | - | **Direct**: Process staged changes immediately |
| ❌ Empty | ✅ Has changes | **Plan**: Analyze unstaged, output staging plan, then execute |
| ❌ Empty | ❌ Empty | **Exit**: "Nothing to commit, working tree clean" |

---

## Splitting Rules

### Core Principle: Multiple Commits by Default

**ONE COMMIT = AUTOMATIC FAILURE**

| Files Changed | Minimum Commits |
|---------------|-----------------|
| 3+ files | 2+ commits |
| 5+ files | 3+ commits |
| 10+ files | 5+ commits |

### Splitting Criteria

| Criterion | Action | Example |
|-----------|--------|---------|
| Different directories/modules | SPLIT | `src/api/` vs `src/ui/` |
| Different component types | SPLIT | component vs composable vs util |
| Can be reverted independently | SPLIT | feature A vs feature B |
| Different concerns | SPLIT | UI / logic / config / test |
| New file vs modification | SPLIT | create vs update |

---

## Conventional Commits Specification

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Other changes (tooling, etc.) |

### Rules

- **Subject**: imperative mood, lowercase, no period, ≤50 chars
- **Scope**: optional, indicates affected module/component
- **Breaking changes**: add `!` after type/scope, e.g., `feat!:` or `feat(api)!:`
- **Language**: Follow project's commit history convention

---

## Workflow

### Step 1: Gather Context

```bash
git status --short
git diff --staged --name-only
git diff --name-only
git log -30 --pretty=format:"%s"
```

### Step 2: Mode Selection

```
IF staged has changes:
  → DIRECT MODE
ELSE IF unstaged has changes:
  → PLAN MODE
ELSE:
  → EXIT: "Nothing to commit, working tree clean"
```

### Step 3: Apply Splitting Rules

1. Group files by directory/module/concern
2. Validate against splitting criteria table
3. If unrelated changes exist → **MUST** split into separate commits

### Step 4: Detect Commit Style

From recent 30 commits:
- **Language**: User intent first, otherwise detect from history
- **Format**: Conventional Commits preferred, adapt to project convention

### Step 5: Execute

#### Direct Mode

> ✅ **READY**: Staged changes detected. Generate commit message and execute.

```bash
git commit -m "<type>(<scope>): <subject>"
```

#### Plan Mode

> ⚠️ **IMPORTANT**: Plan Mode requires user review before execution.
> Never auto-commit. Always display the staging plan and wait for explicit confirmation.

```
# Step 1: Output staging plan for review
=== Staging Plan ===

[1/2] feat(auth): add login validation
  - src/auth/validator.ts
  - src/auth/types.ts

[2/2] test(auth): add validator tests
  - tests/auth/validator.test.ts

Proceed with commits? [y/n]
```

```bash
# Step 2: Execute ONLY after user confirms
git add src/auth/validator.ts src/auth/types.ts
git commit -m "feat(auth): add login validation"

git add tests/auth/validator.test.ts
git commit -m "test(auth): add validator tests"
```

---

## Output Format

Always display commit plan for review before execution:

```
=== Commit Plan ===

[1/2] feat(auth): add login validation
  - src/auth/validator.ts (modified)
  - src/auth/types.ts (new)

[2/2] test(auth): add validator tests
  - tests/auth/validator.test.ts (new)

Proceed? [y/n]
```
