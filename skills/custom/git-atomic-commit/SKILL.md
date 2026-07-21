---
name: git-atomic-commit
description: >-
  Generates atomic Git commits — each capturing exactly one logical change — formatted as Conventional Commits that match the project's style. Use when the user has multiple files or concerns to commit. For a single-file, single-concern change, write one Conventional Commit directly.
---

# Git Atomic Commit

Split a changeset into atomic commits, one change each, and write Conventional Commits.

## Modes

| Staged | Unstaged | Mode |
|--------|----------|------|
| ✅ Has changes | — | **Direct**: commit staged immediately |
| ❌ Empty | ✅ Has changes | **Plan**: output a staging plan, wait for confirmation |
| ❌ Empty | ❌ Empty | **Exit**: "Nothing to commit, working tree clean" |

## Workflow

### 1. Gather context

```bash
git status --short
git diff --staged --name-only
git diff --name-only
git log -30 --pretty=format:"%s"
```

Completion: the 30 most recent commit messages are visible for style detection.

### 2. Detect commit style

Scan the 30 commits for the project's convention. Prefer Conventional Commits; adapt when the project uses a different format.

### 3. Group into atomic units

Assign every changed file to exactly one group. Split across groups when files:

- Live in different top-level directories or modules
- Represent different component types (component / composable / util / config / test)
- Can be reverted independently
- Mix new files with modifications

Each group must pass the reversibility test: reverting this commit alone leaves the others intact.

### 4. Write commit messages

Format: `<type>(<scope>): <subject>`

- Subject: imperative, lowercase, no trailing period, ≤ 50 characters
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`
- Breaking changes: `feat!:` or `feat(api)!:`

### 5. Show the plan

**Direct mode** — present, then execute:

```
=== Commit Plan ===

[1/2] feat(auth): add login validation
  - src/auth/validator.ts  (modified)
  - src/auth/types.ts      (new)

[2/2] test(auth): add validator unit tests
  - tests/auth/validator.test.ts  (new)
```

**Plan mode** — present and wait for explicit confirmation before touching anything:

```
=== Staging Plan ===

[1/2] feat(auth): add login validation
  - src/auth/validator.ts
  - src/auth/types.ts

[2/2] test(auth): add validator unit tests
  - tests/auth/validator.test.ts

Proceed with commits? [y/n]
```

Completion: every group has its own commit.
