# Reference: Git Semantic Search Workflow

## Core Logic

Parse query → Select strategy → Execute search → Analyze results → Generate report.

---

## Language Protocol

| Query | Report Language |
|-------|-----------------|
| Contains Chinese | **Chinese** |
| Otherwise | **English** (default) |

---

## Search Strategies

### Quick Reference

| Goal | Command |
|------|---------|
| When was "X" added? | `git log -S "X" --oneline` |
| What commits touched "X"? | `git log -G "X" --oneline` |
| Who wrote line N? | `git blame -L N,N file` |
| When did bug start? | `git bisect start && git bisect bad && git bisect good <tag>` |

### Strategy Selection

Based on query characteristics, select the appropriate command:

| Query Pattern | Strategy | Command |
|---------------|----------|---------|
| Exact variable/function name | **Pickaxe (`-S`)** | `git log -S "X" --oneline` |
| Fuzzy match / logic change | **Regex (`-G`)** | `git log -G "X" --oneline` |
| Line number / "who wrote" | **Blame** | `git blame -L N,N file` |
| "When did bug start" | **Bisect** | `git bisect start...` |

**DO NOT** just run generic `git log`. Choose the right tool.

---

## Workflow

### Step 1: Parse Query

Identify query type:
- Exact string → Pickaxe
- Pattern/regex → Regex search
- Line-specific → Blame
- Regression → Bisect

### Step 2: Execute Search

Run the selected command, retrieve the latest 5 relevant records.

```bash
# Pickaxe: find when string was added/removed
git log -S "X" --oneline --date=short --format="%h | %ad | %an | %s"

# Regex: find commits that changed matching lines
git log -G "X" --oneline --date=short --format="%h | %ad | %an | %s"

# Blame: find who wrote specific lines
git blame -L N,M file --date=short

# Bisect: find regression point
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
```

### Step 3: Deep Dive Analysis

If fewer than 3 records found, automatically run:

```bash
git show <hash> --stat
```

Then provide analysis:
- Explain what logic was changed in this commit
- Confirm whether this is the introduction or removal point of the queried code
- Follow the Language Protocol above

### Step 4: Generate Report

Format results as archaeology report with:
- Strategy used
- Commit table
- Analysis summary

---

## Output Format

```
🕵️‍♂️ Archaeology Report

Query: "MAX_RETRY"
Strategy: Pickaxe (-S)

| Hash | Date | Author | Message |
|------|------|--------|---------|
| a1b2c3d | 2023-10-12 | DevOne | feat: implement network retry |
| e4f5g6h | 2023-09-05 | DevTwo | refactor: extract constants |

💡 Analysis:
`MAX_RETRY` was introduced by DevOne in Oct 2023 as part of
the retry mechanism for network requests.
```
