# Vendor Management System Design

**Date:** 2026-02-04
**Status:** Approved
**Author:** AI Assistant

## Overview

Remove git submodule dependency and replace with a simplified vendor management system using `simple-git`. Vendor repositories will be cloned to `vendor/` directory and skills will be synchronized to `skills/` directory using a unified configuration format in `meta.ts`.

## Motivation

Git submodules introduce complexity in state management (detached HEAD issues, complex update workflows, merge conflicts). The new system provides:
- Simpler git operations using `simple-git`
- Unified configuration for all repository sources
- Clear separation between reference repositories and synchronized skills
- Support for branches, tags, and commit SHAs

## Configuration Format

### meta.ts Structure

```typescript
export interface RepositoryConfig {
  url: string                    // Git repository URL
  ref?: string                   // Git ref: branch name, tag, or commit SHA (optional)
  skillsPath: string             // Relative path to skills directory in repository
  skills: Record<string, string> // Skill mapping: source skill name -> output skill name
}

export const repositories: Record<string, RepositoryConfig> = {
  vueuse: {
    url: 'https://github.com/vueuse/skills',
    ref: 'v1.2.0',              // Can be a tag
    skillsPath: 'skills',
    skills: {
      'vueuse-functions': 'vueuse-functions',
    },
  },
  turborepo: {
    url: 'https://github.com/vercel/turborepo',
    ref: 'main',                 // Can be a branch
    skillsPath: '.claude/skills',
    skills: {
      turborepo: 'turborepo',
    },
  },
  'cool-skills': {
    url: 'https://github.com/someone/cool-skills',
    skillsPath: '.claude/skills',
    skills: {},                  // Empty = reference only, no sync
  },
}
```

### Key Design Decisions

1. **Unified Configuration**: Single `repositories` object replaces `submodules` and `vendors`
2. **Explicit Sync Control**: `skills` object explicitly lists skills to sync; empty object means reference only
3. **Flexible Refs**: Supports branches, tags, and commit SHAs through optional `ref` field
4. **Manual Modification Allowed**: Users can modify synced skills; git tracks changes

## Directory Structure

```
skills/
├── scripts/
│   └── cli.ts
├── src/
│   ├── services/
│   │   ├── git.service.ts        # Existing: simple-git wrapper
│   │   ├── vendor.service.ts     # NEW: vendor repository management
│   │   └── sync.service.ts       # REFACTORED: skill synchronization logic
│   ├── cli-commands/
│   │   ├── init.command.ts
│   │   ├── sync.command.ts
│   │   └── ...
│   └── ...
├── skills/                       # Synced skills (version controlled)
├── vendor/                       # Git repository checkouts (NOT version controlled)
│   ├── vueuse/
│   ├── turborepo/
│   └── cool-skills/
├── meta.ts                       # Configuration (version controlled)
└── .gitignore
```

### .gitignore

```
# Vendor directories - managed by meta.ts
vendor/
```

## Service Layer Architecture

### VendorService (NEW)

**Responsibility**: Manage vendor repository lifecycle

```typescript
class VendorService {
  constructor(root: string, git: GitService)

  // Initialize all vendor repositories
  async initAll(repos: Record<string, RepositoryConfig>): Promise<void>

  // Update all vendor repositories to specified ref
  async updateAll(repos: Record<string, RepositoryConfig>): Promise<void>

  // Get repository current SHA (for SYNC.md)
  async getRepoSha(repoName: string): Promise<string>

  // Private: Clone or update single repository
  private async ensureRepo(name: string, config: RepositoryConfig): Promise<void>
}
```

**Core Logic (ensureRepo)**:
1. Check if `vendor/<name>/` exists
2. If not exists: `git clone <url>` to `vendor/<name>/`
3. If exists: `git fetch origin` then `git reset --hard <ref>`
4. If `ref` is empty, use repository's default branch

### SyncService (REFACTORED)

**Changes**:
- Remove submodule-related logic
- Use `VendorService.getRepoSha()` to get SHA
- Keep existing copy, LICENSE, SYNC.md logic
- Add: detect local modifications before overwriting (via git diff)

**Preserved Behavior**:
- Copy skill files from `vendor/<name>/<skillsPath>/<source>/` to `skills/<output>/`
- Copy LICENSE file if present
- Write SYNC.md with source, ref, SHA, and date

## SYNC.md Format

```markdown
# Sync Info

- **Source:** `https://github.com/vueuse/skills@v1.2.0`
- **Skills Path:** `skills`
- **Git SHA:** `61ec8678bf0aeadd15ec02c337050b686eb8b031`
- **Synced:** 2026-02-04
```

## User Experience

### Sync Command Flow

```
1. Read repositories from meta.ts
   ↓
2. VendorService updates all vendor repositories (fetch + reset)
   ↓
3. Iterate through each repository's skills config
   ↓
4. For each skill to sync:
   a. Check if skills/<output>/ has local modifications (git diff)
   b. If modified, show warning: "⚠️  Skill 'vueuse-functions' has uncommitted changes, will be overwritten"
   c. Copy skill files, LICENSE
   d. Write SYNC.md (with ref and actual SHA)
   ↓
5. Display summary:
   "✓ Synced 5 skills
    ⚠️  Overwrote 2 skills with local modifications
    ℹ️  2 repositories are reference only"
```

### Example Output

```
○  Updating vendor repositories...
   ✓ vueuse@v1.2.0
   ✓ turborepo@main

⚠️  Detected local modifications in the following skills (will be overwritten):
   • vueuse-functions (5 files changed)
   • turborepo (2 files changed)

○  Syncing skills...
   ✓ vueuse-functions
   ✓ turborepo

✓ Synced 2 skills
⚠️  Overwrote 2 skills with local modifications (changes preserved in git history)
```

### CLI Options

```bash
npm run sync          # Sync all
npm run sync vueuse   # Sync only specified repository
npm run sync -- --force # Skip modification detection, force overwrite
```

## Error Handling

### Error Categories

1. **Network Errors** (clone or fetch failure)
   - Continue processing other repositories
   - Summarize failures at end

2. **Invalid Ref** (tag or branch doesn't exist)
   - Fall back to default branch
   - Warn user

3. **Skills Path Not Found**
   - Skip repository
   - Log to error list

4. **Directory Conflict** (non-git directory in vendor/)
   - Prompt: "Delete and re-clone? (y/n)"

### Edge Cases

- **Empty skills object**: Clone repository only, no sync
- **Duplicate output skill names**: Detect and warn about conflicts
- **meta.ts syntax errors**: Validate at startup, give clear error messages

## Migration Path

### Manual Migration Steps

1. **Backup existing configuration**
   ```bash
   git checkout -b backup/submodules
   ```

2. **Remove submodule configuration**
   ```bash
   git rm --cached vendor/vueuse
   git rm --cached vendor/turborepo
   # ... repeat for all submodules
   rm -rf .git/modules/vendor
   ```

3. **Update .gitignore**
   ```bash
   echo "vendor/" >> .gitignore
   ```

4. **Update meta.ts**
   - Merge `submodules` and `vendors` into unified `repositories`
   - Add appropriate `skillsPath` and `ref` fields

5. **Remove old vendor directory**
   ```bash
   rm -rf vendor/
   ```

6. **Initialize new system**
   ```bash
   npm run init
   ```

7. **Verify sync**
   ```bash
   npm run sync
   ```

### Backward Compatibility

- Existing `skills/` directory structure and SYNC.md format unchanged
- `meta.ts` import paths unchanged
- CLI command interface unchanged (`npm run init`, `npm run sync`, etc.)

### Data Loss Risk

- vendor/ directory can be re-cloned from meta.ts
- Manual modifications in skills/ protected by git
- Commit before migration for safety

## Testing Strategy

### Unit Tests

1. **VendorService**
   - Mock git operations (clone, fetch, reset)
   - Test ref resolution logic
   - Test SHA retrieval

2. **SyncService**
   - Test file copy logic
   - Test SYNC.md generation
   - Test local modification detection

### Integration Tests

1. **Use test repositories**
   - Create temporary test git repositories
   - Verify complete clone → sync → update flow
   - Test tag, branch, commit SHA ref types

2. **Configuration validation**
   - Test error messages for invalid configs
   - Test duplicate skill name detection

### Manual Testing Checklist

- [ ] First-time repository clone
- [ ] Existing repository fetch + reset
- [ ] Use tag, branch, commit SHA as ref
- [ ] Empty skills object (reference only)
- [ ] Warning for local modifications
- [ ] Network error handling
- [ ] Vendor directory conflict handling

## Implementation Notes

1. **Remove submodule dependencies**: No more `git submodule` commands
2. **Preserve existing workflow**: Skills directory structure unchanged
3. **Simple git operations**: Use `simple-git` for all git commands
4. **Vendor as cache**: Vendor directory is rebuildable from meta.ts
5. **Manual edits supported**: Users can modify synced skills; git tracks changes

## Success Criteria

- [ ] No more git submodule commands in codebase
- [ ] vendor/ directory successfully excluded from version control
- [ ] Unified configuration format in meta.ts
- [ ] Support for branches, tags, and commit SHAs
- [ ] Clear warnings before overwriting manual modifications
- [ ] All existing skills sync correctly
- [ ] Reference-only repositories work as expected
