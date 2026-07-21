---
name: git-semantic-search
description: >-
  Git archaeology — trace when code was introduced, removed, or changed using Pickaxe, Bisect, and Blame. Use when the user asks who wrote a line, when a bug started, where a symbol came from, or to hunt down the origin of any code.
---

# Git Semantic Search

Archaeology through Git history. Match the query to the right tool — Pickaxe for exact symbols, Regex for patterns, Blame for line attribution, Bisect for regressions.

## Strategy

| Query | Tool | Command |
|-------|------|---------|
| Exact symbol or string | **Pickaxe (`-S`)** | `git log -S "<query>" --oneline` |
| Pattern or logic change | **Regex (`-G`)** | `git log -G "<query>" --oneline` |
| Specific line / "who wrote this" | **Blame** | `git blame -L N,M <file> --date=short` |
| "When did this bug start" | **Bisect** | `git bisect start` |

Never fall back to a generic `git log`.

## Workflow

### 1. Parse

Map the user's question to one tool:

- Exact identifier → Pickaxe
- Pattern or "changed logic around X" → Regex
- Line number or author attribution → Blame
- Regression hunt → Bisect

### 2. Retrieve

Retrieve up to 5 relevant commits:

```bash
# Pickaxe
git log -S "<query>" --date=short --format="%h | %ad | %an | %s"

# Regex
git log -G "<query>" --date=short --format="%h | %ad | %an | %s"

# Blame
git blame -L N,M <file> --date=short

# Bisect
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
```

### 3. Deep-dive

When fewer than 3 commits surface, inspect each:

```bash
git show <hash> --stat
```

Note whether each commit introduced or removed the target.

### 4. Report

```
🕵️ Archaeology Report

Query:    "MAX_RETRY"
Tool:     Pickaxe (-S)

| Hash    | Date       | Author | Message                       |
|---------|------------|--------|-------------------------------|
| a1b2c3d | 2023-10-12 | Alice  | feat: implement network retry |
| e4f5g6h | 2023-09-05 | Bob    | refactor: extract constants   |

💡 MAX_RETRY was introduced by Alice in Oct 2023 as part
of the retry mechanism (a1b2c3d).
```
