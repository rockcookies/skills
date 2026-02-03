---
description: Analyzes staged/unstaged changes and generates context-aware, atomic commit messages following git-expert skill principles.
allowed-tools: Bash(git status*, git diff*, git log*, git add*, git commit*)
argument-hint: [intent]
---

# Git Smart Commit

**CRITICAL**: Before proceeding, you MUST load and apply the `git-expert` skill. All commit splitting rules, atomic principles, and style detection logic are defined in that skill. **DO NOT PROCEED** without loading it first.

## Workflow

1. **Gather Context**
   ```bash
   git status --short
   git diff --staged --name-only
   git diff --name-only
   git log -30 --pretty=format:"%s"
   ```

2. **Determine Mode**

   | Staged | Unstaged | Mode |
   |--------|----------|------|
   | ✅ Has changes | - | **Direct**: Process staged changes |
   | ❌ Empty | ✅ Has changes | **Plan**: Analyze unstaged, output staging plan, then execute |
   | ❌ Empty | ❌ Empty | **Exit**: "Nothing to commit, working tree clean" |

3. **Apply Atomic Guard** (per skill's rules)
   - Analyze changes (staged or unstaged) against splitting rules
   - Group files by directory/module/concern into atomic commits
   - If single commit violates thresholds → Generate **multi-commit plan**

4. **Detect Style**
   - Analyze commit history for format (SEMANTIC/PLAIN) and emoji preference

5. **Determine Language**

   | User Intent (`$1`) | Output Language |
   |--------------------|-----------------|
   | Contains Chinese   | **Chinese** (forced) |
   | Contains English   | **English** (forced) |
   | Empty              | Infer from commit history |

6. **Execute**
   - **Direct Mode**: Generate commit message(s), display for review, only execute `git commit` if user explicitly requests auto-commit
   - **Plan Mode**: Execute `git add` per group, display commit messages for review, only execute `git commit` per group if user explicitly requests auto-commit

---

**Examples**:
- `/git:smart-commit` → Infer language, process staged or plan unstaged
- `/git:smart-commit fix login bug` → English, auto stage + commit
- `/git:smart-commit 修复登录` → Chinese output
