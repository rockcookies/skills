---
description: Semantic search through git history to find when code was introduced or changed.
allowed-tools: Bash(git log*, git blame*, git show*, git bisect*)
argument-hint: <query> [file-path]
---

# Git Semantic Search

**CRITICAL**: Before proceeding, you MUST load and apply the `git-expert` skill. The skill contains **History Search Commands** that define the exact strategies for git archaeology. **DO NOT PROCEED** without loading it first.

## Input

- **Query**: `$1` (required)
- **File**: `$2` (optional)

## Language Protocol

| Query (`$1`) | Report Language |
|--------------|-----------------|
| Contains Chinese | **Chinese** |
| Otherwise | **English** (default) |

## Workflow

### 1. Strategy Selection

Based on the query characteristics, select the appropriate command from **git-master skill**:

| Query Pattern | Strategy | Command |
|---------------|----------|---------|
| Exact variable/function name | **Pickaxe (`-S`)** | `git log -S "X" --oneline` |
| Fuzzy match / logic change | **Regex (`-G`)** | `git log -G "X" --oneline` |
| Line number / "who wrote" | **Blame** | `git blame -L N,N file` |
| "When did bug start" | **Bisect** | `git bisect start...` |

**DO NOT** just run generic `git log`. Choose the right tool.

### 2. Execute Search

Run the selected command, retrieve the latest 5 relevant records.

Output format:
```
[Hash] | [Date] | [Author] | [Message]
```

### 3. Deep Dive Analysis

If fewer than 3 records found, automatically run:
```bash
git show <hash> --stat
```

Then provide **Git Master Analysis**:
- Explain what logic was changed in this commit
- Confirm whether this is the introduction or removal point of the queried code
- Follow the Language Protocol above

---

## Example Output

> 🕵️‍♂️ **Archaeology Report**
>
> Searching for `MAX_RETRY` using Pickaxe (`-S`) strategy...
>
> | Hash | Date | Author | Message |
> |------|------|--------|---------|
> | `a1b2c3d` | 2023-10-12 | DevOne | feat: implement network retry |
>
> 💡 **Analysis**:
> `MAX_RETRY` was introduced by **DevOne** in Oct 2023 as part of the retry mechanism for network requests.
