# Vendor Management System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use evo-executing-plans to implement this plan task-by-task.

**Goal:** Replace git submodules with a simplified vendor management system using `simple-git` to clone and update repositories in the `vendor/` directory.

**Architecture:** Introduce `VendorService` to manage git repositories (clone, fetch, reset), refactor `SyncService` to use it instead of submodules, update `meta.ts` to unified configuration format, and add vendor/ to .gitignore.

**Tech Stack:** TypeScript, Node.js, simple-git, tsx, @clack/prompts

---

## Prerequisites

Read these documents before starting:
- `docs/specs/2026-02-04-vendor-management/design.md` - Full design specification
- `src/services/git.service.ts` - Existing git operations wrapper
- `src/services/sync.service.ts` - Current sync logic to refactor
- `src/types.ts` - Existing type definitions
- `meta.ts` - Current configuration format

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `src/types.ts`

**Step 1: Add new RepositoryConfig interface**

Add this interface to `src/types.ts`:

```typescript
export interface RepositoryConfig {
  url: string                    // Git repository URL
  ref?: string                   // Git ref: branch name, tag, or commit SHA (optional)
  skillsPath: string             // Relative path to skills directory in repository
  skills: Record<string, string> // Skill mapping: source skill name -> output skill name
}
```

**Step 2: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors (interface added, not used yet)

**Step 3: Verify file compiles**

Run: `pnpm exec eslint src/types.ts`
Expected: No linting errors

---

## Task 2: Create VendorService

**Files:**
- Create: `src/services/vendor.service.ts`

**Step 1: Write failing test for clone behavior**

Create test file `tests/vendor.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VendorService } from '../src/services/vendor.service.ts'
import { GitService } from '../src/services/git.service.ts'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

describe('VendorService', () => {
  const testRoot = join(process.cwd(), 'test-vendor-temp')
  let gitService: GitService
  let vendorService: VendorService

  beforeEach(() => {
    // Clean up test directory
    if (require('node:fs').existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
    mkdirSync(testRoot, { recursive: true })

    gitService = new GitService(testRoot)
    vendorService = new VendorService(testRoot, gitService)
  })

  it('should clone a new repository', async () => {
    const config = {
      url: 'https://github.com/vueuse/skills',
      skillsPath: 'skills',
      skills: { 'test-skill': 'test-skill' }
    }

    await vendorService.ensureRepo('vueuse', config)

    const vendorPath = join(testRoot, 'vendor', 'vueuse')
    expect(require('node:fs').existsSync(vendorPath)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest tests/vendor.service.test.ts`
Expected: FAIL with "VendorService not defined"

**Step 3: Create minimal VendorService class**

Create `src/services/vendor.service.ts`:

```typescript
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type { RepositoryConfig } from '../types.ts'
import type { GitService } from './git.service.ts'

export class VendorService {
  private root: string
  private git: GitService

  constructor(root: string, git: GitService) {
    this.root = root
    this.git = git
  }

  // Initialize all vendor repositories
  async initAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      await this.ensureRepo(name, config)
    }
  }

  // Update all vendor repositories to specified ref
  async updateAll(repos: Record<string, RepositoryConfig>): Promise<void> {
    for (const [name, config] of Object.entries(repos)) {
      await this.ensureRepo(name, config)
    }
  }

  // Get repository current SHA
  async getRepoSha(repoName: string): Promise<string> {
    const repoPath = join(this.root, 'vendor', repoName)
    const repoGit = this.gitForPath(repoPath)
    const sha = await repoGit.revparse(['HEAD'])
    return sha.trim()
  }

  // Clone or update single repository
  async ensureRepo(name: string, config: RepositoryConfig): Promise<void> {
    const vendorPath = join(this.root, 'vendor', name)

    if (!existsSync(vendorPath)) {
      await this.cloneRepo(name, config, vendorPath)
    } else {
      await this.updateRepo(name, config, vendorPath)
    }
  }

  private async cloneRepo(name: string, config: RepositoryConfig, vendorPath: string): Promise<void> {
    const vendorDir = join(this.root, 'vendor')
    if (!existsSync(vendorDir)) {
      mkdirSync(vendorDir, { recursive: true })
    }

    await this.git.clone(config.url, vendorPath)
  }

  private async updateRepo(name: string, config: RepositoryConfig, vendorPath: string): Promise<void> {
    const repoGit = this.gitForPath(vendorPath)

    // Fetch all updates
    await repoGit.fetch()

    // Reset to specified ref or default branch
    const ref = config.ref || await this.getDefaultBranch(repoGit)
    await repoGit.reset(['--hard', ref])
  }

  private gitForPath(path: string) {
    const simpleGit = require('simple-git')
    return simpleGit(path)
  }

  private async getDefaultBranch(git: any): Promise<string> {
    // Try common default branch names
    const branches = ['main', 'master']
    for (const branch of branches) {
      try {
        await git.revparse([`origin/${branch}`])
        return `origin/${branch}`
      } catch {
        // Branch doesn't exist, try next
      }
    }
    throw new Error('Could not determine default branch')
  }
}
```

**Step 4: Update GitService to add clone method**

Add to `src/services/git.service.ts`:

```typescript
// Clone repository
async clone(url: string, path: string): Promise<void> {
  await this.git.clone(url, path)
}
```

Add after line 42 (after `removeSubmodule` method).

**Step 5: Run test to verify it passes**

Run: `pnpm exec vitest tests/vendor.service.test.ts`
Expected: PASS (test may take time to clone real repo)

**Step 6: Test update behavior**

Add test to `tests/vendor.service.test.ts`:

```typescript
it('should update existing repository', async () => {
  const config = {
    url: 'https://github.com/vueuse/skills',
    ref: 'main',
    skillsPath: 'skills',
    skills: {}
  }

  // First run - clone
  await vendorService.ensureRepo('vueuse', config)

  // Get SHA before update
  const shaBefore = await vendorService.getRepoSha('vueuse')

  // Second run - should reset to same ref
  await vendorService.ensureRepo('vueuse', config)

  const shaAfter = await vendorService.getRepoSha('vueuse')
  expect(shaAfter).toBe(shaBefore)
})
```

Run: `pnpm exec vitest tests/vendor.service.test.ts`
Expected: PASS

---

## Task 3: Refactor SyncService to Use VendorService

**Files:**
- Modify: `src/services/sync.service.ts`

**Step 1: Write test for sync with VendorService**

Create `tests/sync.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { SyncService } from '../src/services/sync.service.ts'
import { VendorService } from '../src/services/vendor.service.ts'
import { GitService } from '../src/services/git.service.ts'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

describe('SyncService', () => {
  const testRoot = join(process.cwd(), 'test-sync-temp')
  let gitService: GitService
  let vendorService: VendorService
  let syncService: SyncService

  beforeEach(() => {
    if (require('node:fs').existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
    mkdirSync(testRoot, { recursive: true })
    mkdirSync(join(testRoot, 'skills'), { recursive: true })

    gitService = new GitService(testRoot)
    vendorService = new VendorService(testRoot, gitService)
    syncService = new SyncService(testRoot, vendorService)
  })

  it('should sync skill from vendor to skills directory', async () => {
    // Setup: create mock vendor structure
    const vendorPath = join(testRoot, 'vendor', 'test-repo')
    const skillsPath = join(vendorPath, 'skills')
    const skillPath = join(skillsPath, 'test-skill')
    mkdirSync(skillPath, { recursive: true })
    writeFileSync(join(skillPath, 'SKILL.md'), '# Test Skill')

    // Mock getRepoSha
    vi.spyOn(vendorService, 'getRepoSha').mockResolvedValue('abc123')

    const config = {
      url: 'https://github.com/test/repo',
      skillsPath: 'skills',
      skills: { 'test-skill': 'test-skill' }
    }

    await syncService.syncVendor('test-repo', config)

    const outputPath = join(testRoot, 'skills', 'test-skill')
    expect(require('node:fs').existsSync(outputPath)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest tests/sync.service.test.ts`
Expected: FAIL (SyncService doesn't accept VendorService yet)

**Step 3: Refactor SyncService constructor**

Modify `src/services/sync.service.ts` constructor:

```typescript
import type { VendorConfig } from '../types.ts'
import type { VendorService } from './vendor.service.ts'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export class SyncService {
  private vendorService: VendorService
  private root: string

  constructor(root: string, vendorService: VendorService) {
    this.root = root
    this.vendorService = vendorService
  }
```

Replace lines 6-12 with the above.

**Step 4: Update syncVendorSkills method**

Replace `syncVendorSkills` method in `src/services/sync.service.ts`:

```typescript
// Sync all vendor skills
async syncVendorSkills(vendors: Record<string, VendorConfig>): Promise<void> {
  // Note: VendorService.updateAll should be called before this

  for (const [vendorName, config] of Object.entries(vendors)) {
    await this.syncVendor(vendorName, config)
  }
}
```

**Step 5: Update syncVendor method**

Replace `syncVendor` method to use `VendorService`:

```typescript
// Sync single vendor
async syncVendor(vendorName: string, config: VendorConfig): Promise<void> {
  const vendorPath = join(this.root, 'vendor', vendorName)
  const vendorSkillsPath = join(vendorPath, config.skillsPath || 'skills')

  if (!existsSync(vendorPath)) {
    throw new Error(`Vendor repository not found: ${vendorName}`)
  }

  if (!existsSync(vendorSkillsPath)) {
    throw new Error(`No skills directory in ${vendorName}`)
  }

  const sha = await this.vendorService.getRepoSha(vendorName)
  if (!sha) {
    throw new Error(`Cannot get SHA for ${vendorName}`)
  }

  for (const [sourceSkillName, outputSkillName] of Object.entries(config.skills)) {
    await this.syncSkill(vendorName, vendorSkillsPath, sourceSkillName, outputSkillName, sha)
  }
}
```

**Step 6: Update syncSkill to record source URL**

Modify `writeSyncMd` call in `syncSkill` method to include source info. First, add source to method signature:

```typescript
private async syncSkill(
  vendorName: string,
  vendorSkillsPath: string,
  sourceSkillName: string,
  outputSkillName: string,
  sha: string,
): Promise<void> {
```

Then update the `writeSyncMd` call (around line 75) to pass vendorName:

```typescript
// Write SYNC.md
this.writeSyncMd(vendorName, sourceSkillName, outputPath, sha)
```

**Step 7: Update writeSyncMd method signature and implementation**

Replace `writeSyncMd` method:

```typescript
// Write SYNC.md
private writeSyncMd(vendorName: string, sourceSkillName: string, outputPath: string, sha: string): void {
  const date = new Date().toISOString().split('T')[0]
  const content = `# Sync Info

- **Source:** \`vendor/${vendorName}/skills/${sourceSkillName}\`
- **Git SHA:** \`${sha}\`
- **Synced:** ${date}
`
  writeFileSync(join(outputPath, 'SYNC.md'), content)
}
```

**Step 8: Run tests**

Run: `pnpm exec vitest tests/sync.service.test.ts`
Expected: PASS

---

## Task 4: Update meta.ts Configuration

**Files:**
- Modify: `meta.ts`

**Step 1: Backup current meta.ts**

Run: `cp meta.ts meta.ts.backup`

**Step 2: Add RepositoryConfig type import**

Add at top of `meta.ts`:

```typescript
import type { RepositoryConfig } from './src/types.ts'
```

**Step 3: Replace vendors with repositories**

Replace the `vendors` export with:

```typescript
/**
 * Repositories to clone and sync skills from
 */
export const repositories: Record<string, RepositoryConfig> = {
  'vueuse': {
    official: true,
    source: 'https://github.com/vueuse/skills',
    skillsPath: 'skills',
    skills: {
      'vueuse-functions': 'vueuse-functions',
    },
  },
  'tsdown': {
    official: true,
    source: 'https://github.com/rolldown/tsdown',
    skillsPath: 'skills',
    skills: {
      tsdown: 'tsdown',
    },
  },
  'vuejs-ai': {
    source: 'https://github.com/vuejs-ai/skills',
    skillsPath: 'skills',
    skills: {
      'vue-best-practices': 'vue-best-practices',
      'vue-router-best-practices': 'vue-router-best-practices',
      'vue-testing-best-practices': 'vue-testing-best-practices',
    },
  },
  'turborepo': {
    official: true,
    source: 'https://github.com/vercel/turborepo',
    skillsPath: '.claude/skills',
    skills: {
      turborepo: 'turborepo',
    },
  },
  'web-design-guidelines': {
    source: 'https://github.com/vercel-labs/agent-skills',
    skillsPath: 'skills',
    skills: {
      'web-design-guidelines': 'web-design-guidelines',
    },
  },
}
```

**Step 4: Update VendorSkillMeta interface**

Update the interface at top of file:

```typescript
export interface VendorSkillMeta {
  official?: boolean
  source: string
  skillsPath?: string
  skills: Record<string, string> // sourceSkillName -> outputSkillName
}
```

**Step 5: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

---

## Task 5: Update CLI Commands

**Files:**
- Modify: `src/cli-commands/init.command.ts`
- Modify: `src/cli-commands/sync.command.ts`

**Step 1: Update init.command.ts**

Replace content of `src/cli-commands/init.command.ts`:

```typescript
import type { RepositoryConfig } from '../types.ts'
import * as p from '@clack/prompts'
import { VendorService } from '../services/vendor.service.ts'
import { GitService } from '../services/git.service.ts'
import { formatError } from '../utils/error.ts'

export async function initSubmodules(root: string, repositories: Record<string, RepositoryConfig>) {
  const gitService = new GitService(root)
  const vendorService = new VendorService(root, gitService)
  const spinner = p.spinner()

  spinner.start('Initializing vendor repositories...')
  try {
    await vendorService.initAll(repositories)
    spinner.stop('Vendor repositories initialized')
  }
  catch (error) {
    spinner.stop(`Failed to initialize: ${formatError(error)}`)
    return
  }

  p.log.success('All repositories initialized')
}
```

**Step 2: Update sync.command.ts**

Replace content of `src/cli-commands/sync.command.ts`:

```typescript
import type { RepositoryConfig } from '../types.ts'
import * as p from '@clack/prompts'
import { SyncService } from '../services/sync.service.ts'
import { VendorService } from '../services/vendor.service.ts'
import { GitService } from '../services/git.service.ts'
import { formatError } from '../utils/error.ts'

export async function syncSubmodules(root: string, repositories: Record<string, RepositoryConfig>) {
  const gitService = new GitService(root)
  const vendorService = new VendorService(root, gitService)
  const syncService = new SyncService(root, vendorService)
  const spinner = p.spinner()

  spinner.start('Updating vendor repositories...')
  try {
    await vendorService.updateAll(repositories)
    spinner.stop('Vendor repositories updated')
  }
  catch (error) {
    spinner.stop(`Failed to update: ${formatError(error)}`)
    return
  }

  p.log.success('All repositories updated')

  spinner.start('Syncing skills...')
  try {
    await syncService.syncVendorSkills(repositories)
    spinner.stop('Skills synced')
  }
  catch (error) {
    spinner.stop(`Failed to sync: ${formatError(error)}`)
    return
  }

  p.log.success('All skills synced')
}
```

**Step 3: Update CLI entry point**

Check `scripts/cli.ts` for imports and ensure it uses the updated types. Verify it passes `repositories` instead of `vendors`.

**Step 4: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

---

## Task 6: Update .gitignore

**Files:**
- Modify: `.gitignore`

**Step 1: Add vendor directory to .gitignore**

Add to `.gitignore`:

```
# Vendor directories - managed by meta.ts
vendor/
```

**Step 2: Verify git ignores vendor**

Run: `git check-ignore vendor/`
Expected: `vendor/` (output means it's ignored)

---

## Task 7: Update Package.json Scripts

**Files:**
- Modify: `package.json`

**Step 1: Remove submodule init from prepare script**

Current line 7:
```json
"prepare": "simple-git-hooks && git submodule update --init --recursive"
```

Change to:
```json
"prepare": "simple-git-hooks"
```

**Step 2: Verify package.json is valid**

Run: `pnpm exec cat package.json | pnpm exec jq .`
Expected: Valid JSON output (if jq is installed)

---

## Task 8: Add Local Modification Detection

**Files:**
- Modify: `src/services/sync.service.ts`

**Step 1: Write test for modification detection**

Add test to `tests/sync.service.test.ts`:

```typescript
it('should warn when overwriting modified skills', async () => {
  const vendorPath = join(testRoot, 'vendor', 'test-repo')
  const skillsPath = join(vendorPath, 'skills')
  const skillPath = join(skillsPath, 'test-skill')
  mkdirSync(skillPath, { recursive: true })
  writeFileSync(join(skillPath, 'SKILL.md'), '# Updated Content')

  const outputPath = join(testRoot, 'skills', 'test-skill')
  mkdirSync(outputPath, { recursive: true })
  writeFileSync(join(outputPath, 'SKILL.md'), '# Local Modification')

  vi.spyOn(vendorService, 'getRepoSha').mockResolvedValue('abc123')

  // Mock git diff to detect changes
  const gitService = new GitService(testRoot)
  vi.spyOn(gitService, 'diff').mockResolvedValue('M skills/test-skill/SKILL.md')

  const config = {
    url: 'https://github.com/test/repo',
    skillsPath: 'skills',
    skills: { 'test-skill': 'test-skill' }
  }

  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

  await syncService.syncVendor('test-repo', config)

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('local modifications'))

  consoleSpy.mockRestore()
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm.exec vitest tests/sync.service.test.ts`
Expected: FAIL (modification detection not implemented)

**Step 3: Add GitService diff method**

Add to `src/services/git.service.ts`:

```typescript
// Get working tree diff
async diff(files?: string[]): Promise<string> {
  const args = ['diff']
  if (files && files.length > 0) {
    args.push('--')
    args.push(...files)
  }
  return await this.git.raw(args)
}
```

**Step 4: Add modification detection to SyncService**

Add method to `src/services/sync.service.ts`:

```typescript
import type { GitService } from './git.service.ts'

// Add to class properties
private gitService: GitService

// Update constructor
constructor(root: string, vendorService: VendorService) {
  this.root = root
  this.vendorService = vendorService
  this.gitService = new GitService(root)
}

// Add method
private async hasLocalModifications(skillPath: string): Promise<boolean> {
  const relativePath = skillPath.replace(this.root + '/', '')
  const diff = await this.gitService.diff([relativePath])
  return diff.trim().length > 0
}
```

**Step 5: Update syncSkill to check for modifications**

Add at start of `syncSkill` method:

```typescript
// Check for local modifications
if (await this.hasLocalModifications(outputPath)) {
  console.log(`⚠️  Skill '${outputSkillName}' has local modifications, will be overwritten`)
}
```

**Step 6: Run tests**

Run: `pnpm exec vitest tests/sync.service.test.ts`
Expected: PASS

---

## Task 9: Integration Test with Real Repository

**Files:**
- Create: `tests/integration.test.ts`

**Step 1: Create integration test**

Create `tests/integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { VendorService } from '../src/services/vendor.service.ts'
import { SyncService } from '../src/services/sync.service.ts'
import { GitService } from '../services/git.service.ts'
import { rmSync } from 'node:fs'
import { join } from 'node:path'

describe('Integration: Full sync workflow', () => {
  const testRoot = join(process.cwd(), 'test-integration-temp')
  let vendorService: VendorService
  let syncService: SyncService

  beforeAll(async () => {
    // Setup
    const gitService = new GitService(testRoot)
    vendorService = new VendorService(testRoot, gitService)
    syncService = new SyncService(testRoot, vendorService)
  })

  afterAll(() => {
    // Cleanup
    if (require('node:fs').existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('should clone and sync a real repository', async () => {
    const config = {
      url: 'https://github.com/vueuse/skills',
      ref: 'main',
      skillsPath: 'skills',
      skills: { 'vueuse-functions': 'vueuse-functions-test' }
    }

    // Clone repository
    await vendorService.ensureRepo('vueuse', config)

    // Verify vendor directory exists
    const vendorPath = join(testRoot, 'vendor', 'vueuse')
    expect(require('node:fs').existsSync(vendorPath)).toBe(true)

    // Get SHA
    const sha = await vendorService.getRepoSha('vueuse')
    expect(sha).toBeTruthy()
    expect(sha.length).toBe(40)

    // Sync skill
    await syncService.syncVendor('vueuse', config)

    // Verify output
    const outputPath = join(testRoot, 'skills', 'vueuse-functions-test')
    expect(require('node:fs').existsSync(outputPath)).toBe(true)
    expect(require('node:fs').existsSync(join(outputPath, 'SYNC.md'))).toBe(true)
  }, 30000) // 30 second timeout for cloning
})
```

**Step 2: Run integration test**

Run: `pnpm exec vitest tests/integration.test.ts`
Expected: PASS (may take 30+ seconds to clone)

---

## Task 10: Documentation Updates

**Files:**
- Modify: `docs/architecture.md`
- Create: `docs/specs/2026-02-04-vendor-management/summary.md`

**Step 1: Update architecture.md**

Update the "Overview" section in `docs/architecture.md`:

Replace line 7 with:
```
A modular CLI tool for managing vendored skill repositories. The tool handles initialization, synchronization, and update checking of external git repositories that contain skill documentation.
```

Update the "Structure" section (lines 11-25):

```
```
skills/
├── scripts/
│   └── cli.ts          # CLI entry point (thin orchestrator)
├── src/
│   ├── cli-commands/   # CLI command handlers
│   ├── services/       # Business logic layer
│   ├── utils/          # Utility functions
│   ├── errors/         # Custom error classes
│   └── types.ts        # Shared TypeScript types
├── skills/             # Synced skill documentation (version controlled)
├── vendor/             # Git repository checkouts (not version controlled)
└── meta.ts             # Configuration for repositories
```
```

Update "Services" section (lines 38-42):

```
### Services (`src/services/`)
- `GitService` - Wrapper around `simple-git` for git operations
- `VendorService` - Vendor repository management (clone, fetch, reset)
- `SyncService` - Handles skill synchronization from vendors
```

**Step 2: Create implementation summary**

Create `docs/specs/2026-02-04-vendor-management/summary.md`:

```markdown
# Vendor Management Implementation Summary

**Implemented:** 2026-02-04

## Changes Made

### Removed
- Git submodule commands and configuration
- `.gitmodules` file
- Submodule-related methods in GitService

### Added
- `VendorService` class for managing git repositories
- `RepositoryConfig` interface for unified configuration
- Local modification detection before sync
- vendor/ directory to .gitignore

### Modified
- `meta.ts` - Unified `submodules` and `vendors` into `repositories`
- `SyncService` - Now uses `VendorService` instead of submodules
- CLI commands - Updated to use new services
- `package.json` - Removed submodule init from prepare script

## Migration Notes

Users who had the old submodule-based system:
1. Run `git submodule deinit -f vendor/*` to remove submodules
2. Run `git rm -f vendor/*` to unbind submodules
3. Delete `.gitmodules` if it exists
4. Run `npm run init` to clone new vendor repositories
5. Run `npm run sync` to sync skills

## Benefits

- Simpler git operations (no submodule complexity)
- Flexible ref support (branches, tags, commits)
- Clear separation between reference and synced repos
- Better error messages and user experience
```

---

## Task 11: Clean Up Old Submodule Code

**Files:**
- Modify: `src/services/git.service.ts`
- Modify: `src/services/submodule.service.ts`
- Delete: `src/services/submodule.service.ts`

**Step 1: Remove submodule methods from GitService**

Remove these methods from `src/services/git.service.ts`:
- `updateSubmodules` (lines 29-37)
- `addSubmodule` (lines 39-42)
- `removeSubmodule` (lines 44-48)
- `submoduleForeach` (lines 55-59)

**Step 2: Delete SubmoduleService file**

Run: `rm src/services/submodule.service.ts`

**Step 3: Remove SubmoduleService imports**

Check for imports of `SubmoduleService` in:
- `src/cli-commands/*.ts`
- `src/services/*.ts`

Remove any found.

**Step 4: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No errors

**Step 5: Run tests**

Run: `pnpm exec vitest`
Expected: All tests pass

---

## Task 12: Final Testing and Verification

**Step 1: Run all tests**

Run: `pnpm exec vitest --run`
Expected: All tests pass

**Step 2: Type check**

Run: `pnpm.exec tsc --noEmit`
Expected: No errors

**Step 3: Lint**

Run: `pnpm lint`
Expected: No linting errors

**Step 4: Manual test - init command**

Run: `npm run start init -- --help`
Expected: Shows init command help

**Step 5: Manual test - sync command**

Run: `npm run start sync -- --help`
Expected: Shows sync command help

**Step 6: Verify gitignore**

Run: `git status vendor/`
Expected: Shows "Ignored" or nothing (not tracked)

---

## Task 13: Commit Changes

**Step 1: Stage changes**

Run: `git add .`

**Step 2: Review changes**

Run: `git diff --cached --stat`
Expected: Shows all modified/new files

**Step 3: Commit**

Run: `git commit -m "feat: replace git submodules with vendor management system

- Add VendorService for git repository management
- Refactor SyncService to use VendorService
- Unify meta.ts configuration format
- Add local modification detection
- Update .gitignore for vendor directory
- Remove submodule-related code"`

**Step 4: Verify commit**

Run: `git log -1 --stat`
Expected: Shows commit with all changes

---

## Success Criteria

After completing all tasks:
- [ ] All tests pass (unit + integration)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] vendor/ directory is gitignored
- [ ] `npm run init` clones repositories
- [ ] `npm run sync` synchronizes skills
- [ ] SYNC.md files contain correct info
- [ ] Local modifications trigger warnings
- [ ] Documentation updated
- [ ] Old submodule code removed
