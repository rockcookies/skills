---
name: evo-archiving
description: Use after completing implementation to archive changes, update docs/architecture.md and docs/ledger.jsonl for AI context continuity
---

# Archiving Changes

## Overview

After implementation is complete and verified, archive the changes by updating project documentation. This ensures future AI sessions have accurate context about the codebase.

**Announce at start:** "I'm using the evo-archiving skill to document the changes."

## Triggering Scenarios

This skill is triggered in two scenarios with different context sources:

| Scenario | Context Source | How to Gather Changes |
|----------|---------------|----------------------|
| After evo-executing-plans | Plan + implementation | Read the plan file, cross-reference with actual changes made |
| After manual changes | Git diff + conversation | Use `git diff` and `git status` to identify changes, ask user for intent if unclear |

## The Process

### Step 1: Gather Context

**Read existing documentation first:**
1. Read `docs/architecture.md` (understand current documented state)
2. Read last 5 records in `docs/ledger.jsonl` (understand recent changes)

**Identify what changed based on scenario:**

**If after evo-executing-plans:**
- Read the plan file that was executed
- Cross-reference with actual implementation
- Note any deviations from plan

**If after manual changes:**
- Run `git status` to see changed files
- Run `git diff --stat` to understand scope of changes
- Ask user: "What was the goal of these changes?" (if not already clear from conversation)

### Step 2: Summarize Changes

Before updating documentation, summarize:
1. What was implemented/changed (from plan or user explanation)
2. Architectural impact (new components, modified patterns, removed code)
3. Key files added, modified, or deleted

**Present summary to user:** "Here's what I'll archive: [brief summary]. Proceed?"

### Step 3: Update Architecture Document

**File:** `docs/architecture.md`

If file doesn't exist, create it with this structure:

```markdown
# Project Architecture

> Auto-maintained by AI. Last updated: YYYY-MM-DD

## Overview
[Brief description of what this project does]

## Structure
[Key directories and their purposes]

## Components
[Major components and how they interact]

## Patterns
[Design patterns and conventions used]

## Dependencies
[Key external dependencies and why they're used]
```

**When updating:**
- Keep descriptions concise (1-2 sentences per component)
- Focus on "what" and "why", not "how" (code shows how)
- Remove documentation for deleted components
- Update the "Last updated" date
- Preserve sections that haven't changed

### Step 4: Append to Ledger

**File:** `docs/ledger.jsonl`

If file doesn't exist, create it (empty file, will append first record).

**Append one JSON line per logical change:**

```json
{"date": "YYYY-MM-DD", "type": "feature|fix|refactor|docs|chore", "summary": "Brief description", "files": ["path/to/file1", "path/to/file2"], "impact": "none|low|medium|high", "source": "plan|manual"}
```

**Field definitions:**
- `date`: ISO date of the change
- `type`: Category of change
  - `feature`: New functionality
  - `fix`: Bug fix
  - `refactor`: Code restructuring without behavior change
  - `docs`: Documentation only
  - `chore`: Maintenance (dependencies, configs)
- `summary`: One sentence describing the change (< 100 chars)
- `files`: Array of key files changed (max 5 most important)
- `impact`: Architectural impact level
  - `none`: Isolated change, no architectural effect
  - `low`: Minor addition, follows existing patterns
  - `medium`: New component or pattern introduced
  - `high`: Significant structural change
- `source`: How the change was made
  - `plan`: Via evo-executing-plans
  - `manual`: Direct manual changes

### Step 5: Verify and Report

1. Read back the updated architecture.md section
2. Confirm ledger entry is valid JSON
3. Report: "Archived: [summary]. Architecture and ledger updated."

## When to Use

- After completing implementation via evo-executing-plans
- After significant manual code changes
- After refactoring sessions
- When cleaning up technical debt

## When NOT to Use

- For trivial changes (typo fixes, comment updates)
- Mid-implementation (wait until complete)
- For experimental/temporary code

## Key Principles

- **Context first** - Always read existing docs before updating
- **Confirm before writing** - Summarize changes and get user confirmation
- **Preserve unchanged sections** - Only update what actually changed
- **Track change source** - Distinguish plan-driven vs manual changes
- **One logical change per ledger entry** - Multiple related files = one entry

## Example Ledger Entries

```jsonl
{"date": "2026-01-15", "type": "feature", "summary": "Add user authentication with JWT tokens", "files": ["src/auth/jwt.py", "src/middleware/auth.py", "tests/test_auth.py"], "impact": "medium"}
{"date": "2026-01-18", "type": "refactor", "summary": "Extract database layer into repository pattern", "files": ["src/db/repository.py", "src/db/models.py"], "impact": "high"}
{"date": "2026-01-20", "type": "fix", "summary": "Fix race condition in cache invalidation", "files": ["src/cache/manager.py"], "impact": "low"}
```

## Key Principles

- **Concise over complete** - AI can read code for details
- **Append-only ledger** - Never modify past entries
- **Architectural focus** - Skip implementation details
- **Honest impact assessment** - Don't inflate or minimize
- **Machine-readable** - Valid JSON, consistent format
