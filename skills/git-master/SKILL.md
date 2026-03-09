---
name: git-master
description: >
  Git workflow expert skill: atomic commits, safe rebasing, and history archaeology (blame / bisect / pickaxe).
  Use this skill whenever the user wants to: commit code, split commits, generate commit messages, squash commits,
  rebase branches, resolve rebase conflicts, search code history, git blame, git bisect, or trace code origins.
  Trigger even when "git" is not explicitly mentioned — any version control, committing, rebasing, or history
  tracing operation should invoke this skill.
---

# Git Master

Expert Git workflow skill covering three core capabilities. Load the corresponding reference file based on user intent and follow its workflow exactly.

## Capability Router

| User Intent | Reference File | Signal Words |
|-------------|----------------|--------------|
| Commit code / split commits / generate commit message | `references/atomic-commit.md` | commit, stage, conventional commits, split commits |
| Rebase / squash history / clean up commits | `references/rebase-surgeon.md` | rebase, squash, fixup, force push, clean history |
| Search code history / trace changes | `references/semantic-search.md` | blame, bisect, who wrote, when was added, pickaxe, archaeology |

## Execution Flow

1. **Identify intent**: Match user intent against the router table above
2. **Load reference file**: Use `read_file` to load the corresponding file from `references/`
3. **Execute strictly**: Follow every step in the reference file — never skip safety checks

> If intent is ambiguous, ask for clarification before loading a reference file.
> If multiple capabilities are needed (e.g. "commit then rebase"), load and execute them sequentially.

## Universal Safety Rules

These rules apply to all sub-workflows and must never be violated:

- **NEVER** rebase main/master
- **NEVER** use `git push --force` — always use `--force-with-lease`
- **Before rebasing**: always check for a dirty working tree
- **Before committing**: confirm changes match the commit message
- **Before destructive operations**: output a plan and wait for user confirmation
- **Language protocol**: respond in the same language the user used
