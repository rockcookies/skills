# Simple-Git 重构实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use evo-executing-plans to implement this plan task-by-task.

**目标:** 将 scripts/cli.ts 的 git 操作从 execSync 迁移到 simple-git，提升类型安全和代码质量

**架构:** 采用分层架构，将 git 操作封装到服务层（GitService、SubmoduleService、SyncService），命令层负责业务编排，入口层仅负责路由

**技术栈:** TypeScript, simple-git, @clack/prompts, Node.js fs

---

## 前置准备

### Task 0: 安装依赖和基础类型

**Files:**
- Modify: `package.json`
- Create: `src/models/project.ts`
- Create: `src/models/vendor-config.ts`

**Step 1: 安装 simple-git**

Run: `pnpm add -D simple-git`

Expected: package.json 中添加 `"simple-git": "^3.27.0"`

**Step 2: 创建 Project 类型**

创建 `src/models/project.ts`:

```typescript
export interface Project {
  name: string
  url: string
  type: 'source' | 'vendor'
  path: string
}
```

**Step 3: 创建 VendorConfig 类型**

创建 `src/models/vendor-config.ts`:

```typescript
export interface VendorConfig {
  source: string
  skills: Record<string, string> // sourceSkillName -> outputSkillName
}
```

**Step 4: 创建模型导出**

创建 `src/models/index.ts`:

```typescript
export * from './project'
export * from './vendor-config'
```

---

## 阶段一：基础设施层

### Task 1: 创建错误处理系统

**Files:**
- Create: `src/errors/git.error.ts`
- Create: `src/utils/error.ts`

**Step 1: 创建 GitError 基类**

创建 `src/errors/git.error.ts`:

```typescript
export class GitError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly cwd?: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'GitError'
  }
}

export class SubmoduleNotFoundError extends GitError {
  constructor(path: string, cwd?: string) {
    super(`Submodule not found: ${path}`, 'submodule-status', cwd)
    this.name = 'SubmoduleNotFoundError'
  }
}

export class GitOperationFailedError extends GitError {
  constructor(
    command: string,
    public readonly exitCode?: number,
    cwd?: string,
    originalError?: unknown,
  ) {
    super(`Git command failed: ${command}`, command, cwd, originalError)
    this.name = 'GitOperationFailedError'
  }
}
```

**Step 2: 创建错误格式化工具**

创建 `src/utils/error.ts`:

```typescript
import { GitError } from '../errors/git.error'

export function formatError(error: unknown): string {
  if (error instanceof GitError) {
    const cwd = error.cwd ? ` (${error.cwd})` : ''
    return `${error.message}${cwd}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
```

---

### Task 2: 创建 GitService 基础服务

**Files:**
- Create: `src/services/git.service.ts`

**Step 1: 创建 GitService 类**

创建 `src/services/git.service.ts`:

```typescript
import simpleGit, { SimpleGit } from 'simple-git'

export class GitService {
  private git: SimpleGit

  constructor(cwd: string = process.cwd()) {
    this.git = simpleGit(cwd)
  }

  // 获取当前 HEAD SHA
  async getSha(): Promise<string> {
    const result = await this.git.revparse(['HEAD'])
    return result.trim()
  }

  // 获取相对于 upstream 的落后提交数
  async getBehindCount(): Promise<number> {
    const count = await this.git.revlist(['HEAD..@{u}', '--count'])
    return Number.parseInt(count.trim())
  }

  // 获取远程更新
  async fetch(): Promise<void> {
    await this.git.fetch()
  }

  // 更新 submodule
  async updateSubmodules(options: { remote: boolean, merge: boolean }): Promise<void> {
    const args: string[] = ['update']
    if (options.remote)
      args.push('--remote')
    if (options.merge)
      args.push('--merge')
    await this.git.submodule(args)
  }

  // 添加 submodule
  async addSubmodule(url: string, path: string): Promise<void> {
    await this.git.submodule(['add', url, path])
  }

  // 移除 submodule
  async removeSubmodule(path: string): Promise<void> {
    await this.git.submodule(['deinit', '-f', path])
    await this.git.rm(['-f', path])
  }

  // 检查是否为 git 仓库
  async checkIsRepo(): Promise<boolean> {
    return await this.git.checkIsRepo()
  }

  // 在 submodule 中执行命令
  async submoduleForeach(command: string): Promise<void> {
    await this.git.submodule(['foreach', command])
  }
}
```

**Step 2: 验证导入**

Run: `node -e "import('./src/services/git.service.ts')"`

Expected: 无语法错误

---

### Task 3: 创建 SubmoduleService

**Files:**
- Create: `src/services/submodule.service.ts`

**Step 1: 创建 SubmoduleService 类**

创建 `src/services/submodule.service.ts`:

```typescript
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GitService } from './git.service'

export class SubmoduleService {
  private rootGit: GitService
  private root: string

  constructor(root: string) {
    this.root = root
    this.rootGit = new GitService(root)
  }

  // 读取 .gitmodules 获取所有 submodule 路径
  getSubmodulePaths(): string[] {
    const gitmodules = join(this.root, '.gitmodules')
    try {
      const content = readFileSync(gitmodules, 'utf-8')
      const matches = content.matchAll(/path\s*=\s*(.+)/g)
      return Array.from(matches, m => m[1].trim())
    }
    catch {
      return []
    }
  }

  // 检查指定路径是否为 submodule
  isSubmodule(path: string): boolean {
    return this.getSubmodulePaths().includes(path)
  }

  // 获取指定 submodule 的 SHA
  async getSubmoduleSha(submodulePath: string): Promise<string | null> {
    const gitService = new GitService(join(this.root, submodulePath))
    try {
      return await gitService.getSha()
    }
    catch {
      return null
    }
  }

  // 检查 submodule 是否有更新
  async checkSubmoduleUpdate(submodulePath: string): Promise<number> {
    const gitService = new GitService(join(this.root, submodulePath))
    return await gitService.getBehindCount()
  }

  // 添加新 submodule
  async addSubmodule(url: string, path: string): Promise<void> {
    await this.rootGit.addSubmodule(url, path)
  }

  // 完全移除 submodule
  async removeSubmoduleFully(submodulePath: string): Promise<void> {
    await this.rootGit.removeSubmodule(submodulePath)
  }

  // 更新所有 submodules
  async updateAllSubmodules(): Promise<void> {
    await this.rootGit.updateSubmodules({ remote: true, merge: true })
  }

  // 为所有 submodules 执行 fetch
  async fetchAllSubmodules(): Promise<void> {
    await this.rootGit.submoduleForeach('git fetch')
  }
}
```

**Step 2: 验证导入**

Run: `node -e "import('./src/services/submodule.service.ts')"`

Expected: 无语法错误

---

### Task 4: 创建工具函数

**Files:**
- Create: `src/utils/project-builder.ts`
- Create: `src/utils/submodule.ts`

**Step 1: 创建项目构建工具**

创建 `src/utils/project-builder.ts`:

```typescript
import type { Project } from '../models/project'
import type { VendorConfig } from '../models/vendor-config'

export function buildProjects(
  submodules: Record<string, string>,
  vendors: Record<string, VendorConfig>,
): Project[] {
  const projects: Project[] = []

  // Source submodules
  for (const [name, url] of Object.entries(submodules)) {
    projects.push({
      name,
      url,
      type: 'source',
      path: `sources/${name}`,
    })
  }

  // Vendor submodules
  for (const [name, config] of Object.entries(vendors)) {
    projects.push({
      name,
      url: config.source,
      type: 'vendor',
      path: `vendor/${name}`,
    })
  }

  return projects
}
```

**Step 2: 创建 submodule 工具函数**

创建 `src/utils/submodule.ts`:

```typescript
import type { Project } from '../models/project'
import type { VendorConfig } from '../models/vendor-config'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function getExistingSkillNames(root: string): string[] {
  const skillsDir = join(root, 'skills')
  if (!existsSync(skillsDir))
    return []

  return readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
}

export function getExpectedSkillNames(
  submodules: Record<string, string>,
  vendors: Record<string, VendorConfig>,
  manual: string[],
): Set<string> {
  const expected = new Set<string>()

  // Skills from submodules
  for (const name of Object.keys(submodules)) {
    expected.add(name)
  }

  // Skills from vendors
  for (const config of Object.values(vendors)) {
    const vendorConfig = config as VendorConfig
    for (const outputName of Object.values(vendorConfig.skills)) {
      expected.add(outputName)
    }
  }

  // Manual skills
  for (const name of manual) {
    expected.add(name)
  }

  return expected
}
```

---

## 阶段二：服务层实现

### Task 5: 创建 SyncService

**Files:**
- Create: `src/services/sync.service.ts`

**Step 1: 创建 SyncService 类**

创建 `src/services/sync.service.ts`:

```typescript
import type { VendorConfig } from '../models/vendor-config'
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { SubmoduleService } from './submodule.service'

export class SyncService {
  private submoduleService: SubmoduleService
  private root: string

  constructor(root: string) {
    this.root = root
    this.submoduleService = new SubmoduleService(root)
  }

  // 同步所有 vendor 技能
  async syncVendorSkills(vendors: Record<string, VendorConfig>): Promise<void> {
    await this.submoduleService.updateAllSubmodules()

    for (const [vendorName, config] of Object.entries(vendors)) {
      await this.syncVendor(vendorName, config)
    }
  }

  // 同步单个 vendor
  async syncVendor(vendorName: string, config: VendorConfig): Promise<void> {
    const vendorPath = join(this.root, 'vendor', vendorName)
    const vendorSkillsPath = join(vendorPath, 'skills')

    if (!existsSync(vendorPath)) {
      throw new Error(`Vendor submodule not found: ${vendorName}`)
    }

    if (!existsSync(vendorSkillsPath)) {
      throw new Error(`No skills directory in ${vendorName}`)
    }

    const sha = await this.submoduleService.getSubmoduleSha(`vendor/${vendorName}`)
    if (!sha) {
      throw new Error(`Cannot get SHA for ${vendorName}`)
    }

    for (const [sourceSkillName, outputSkillName] of Object.entries(config.skills)) {
      await this.syncSkill(vendorName, vendorSkillsPath, sourceSkillName, outputSkillName, sha)
    }
  }

  // 同步单个技能
  private async syncSkill(
    vendorName: string,
    vendorSkillsPath: string,
    sourceSkillName: string,
    outputSkillName: string,
    sha: string,
  ): Promise<void> {
    const sourceSkillPath = join(vendorSkillsPath, sourceSkillName)
    const outputPath = join(this.root, 'skills', outputSkillName)

    if (!existsSync(sourceSkillPath)) {
      throw new Error(`Skill not found: ${vendorName}/skills/${sourceSkillName}`)
    }

    // 清理并重建输出目录
    if (existsSync(outputPath)) {
      rmSync(outputPath, { recursive: true })
    }
    mkdirSync(outputPath, { recursive: true })

    // 递归复制文件
    this.copyDirectory(sourceSkillPath, outputPath)

    // 复制 LICENSE
    this.copyLicense(vendorName, outputPath)

    // 写入 SYNC.md
    this.writeSyncMd(vendorName, sourceSkillName, outputPath, sha)
  }

  // 递归复制目录
  private copyDirectory(source: string, target: string): void {
    const files = readdirSync(source, { recursive: true, withFileTypes: true })
    for (const file of files) {
      if (file.isFile()) {
        const srcPath = join(file.parentPath, file.name)
        const relPath = srcPath.replace(source, '')
        const destPath = join(target, relPath)

        mkdirSync(dirname(destPath), { recursive: true })
        cpSync(srcPath, destPath)
      }
    }
  }

  // 复制 LICENSE 文件
  private copyLicense(vendorName: string, outputPath: string): void {
    const vendorPath = join(this.root, 'vendor', vendorName)
    const licenseNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'license.txt']

    for (const name of licenseNames) {
      const licensePath = join(vendorPath, name)
      if (existsSync(licensePath)) {
        cpSync(licensePath, join(outputPath, 'LICENSE.md'))
        break
      }
    }
  }

  // 写入 SYNC.md
  private writeSyncMd(vendorName: string, sourceSkillName: string, outputPath: string, sha: string): void {
    const date = new Date().toISOString().split('T')[0]
    const content = `# Sync Info

- **Source:** \`vendor/${vendorName}/skills/${sourceSkillName}\`
- **Git SHA:** \`${sha}\`
- **Synced:** ${date}
`
    writeFileSync(join(outputPath, 'SYNC.md'), content)
  }
}
```

---

## 阶段三：命令层实现

### Task 6: 实现 init 命令

**Files:**
- Create: `src/cli-commands/init.command.ts`

**Step 1: 创建 init 命令**

创建 `src/cli-commands/init.command.ts`:

```typescript
import type { Project } from '../models/project'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { SubmoduleService } from '../services/submodule.service'
import { formatError } from '../utils/error'

interface InitOptions {
  skipPrompt: boolean
}

export async function initSubmodules(root: string, projects: Project[], options: InitOptions) {
  const submoduleService = new SubmoduleService(root)
  const spinner = p.spinner()

  // 1. 检查并移除额外的 submodules
  const existingPaths = submoduleService.getSubmodulePaths()
  const expectedPaths = new Set(projects.map(p => p.path))
  const extraSubmodules = existingPaths.filter(path => !expectedPaths.has(path))

  if (extraSubmodules.length > 0) {
    p.log.warn(`Found ${extraSubmodules.length} submodule(s) not in meta.ts:`)
    extraSubmodules.forEach(path => p.log.message(`  - ${path}`))

    const shouldRemove = options.skipPrompt
      ? true
      : await p.confirm({ message: 'Remove these extra submodules?', initialValue: true })

    if (p.isCancel(shouldRemove)) {
      p.cancel('Cancelled')
      return
    }

    if (shouldRemove) {
      await removeExtraSubmodules(submoduleService, root, extraSubmodules, spinner)
    }
  }

  // 2. 查找新增的 submodules
  const existingProjects = projects.filter(p => submoduleService.isSubmodule(p.path))
  const newProjects = projects.filter(p => !submoduleService.isSubmodule(p.path))

  if (newProjects.length === 0) {
    p.log.info('All submodules already initialized')
    return
  }

  // 3. 选择要添加的 submodules
  const selected = options.skipPrompt
    ? newProjects
    : await p.multiselect({
        message: 'Select projects to initialize',
        options: newProjects.map(project => ({
          value: project,
          label: `${project.name} (${project.type})`,
          hint: project.url,
        })),
        initialValues: newProjects,
      })

  if (p.isCancel(selected)) {
    p.cancel('Cancelled')
    return
  }

  // 4. 添加 submodules
  for (const project of selected as Project[]) {
    spinner.start(`Adding submodule: ${project.name}`)

    const parentDir = join(root, project.path, '..')
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true })
    }

    try {
      await submoduleService.addSubmodule(project.url, project.path)
      spinner.stop(`Added: ${project.name}`)
    }
    catch (error) {
      spinner.stop(`Failed to add ${project.name}: ${formatError(error)}`)
    }
  }

  p.log.success('Submodules initialized')
  if (existingProjects.length > 0) {
    p.log.info(`Already initialized: ${existingProjects.map(p => p.name).join(', ')}`)
  }
}

async function removeExtraSubmodules(
  submoduleService: SubmoduleService,
  root: string,
  paths: string[],
  spinner: any,
): Promise<void> {
  for (const path of paths) {
    spinner.start(`Removing submodule: ${path}`)
    try {
      await submoduleService.removeSubmoduleFully(path)

      const gitModulesPath = join(root, '.git', 'modules', path)
      if (existsSync(gitModulesPath)) {
        rmSync(gitModulesPath, { recursive: true })
      }

      spinner.stop(`Removed: ${path}`)
    }
    catch (error) {
      spinner.stop(`Failed to remove ${path}: ${formatError(error)}`)
    }
  }
}
```

---

### Task 7: 实现 sync 命令

**Files:**
- Create: `src/cli-commands/sync.command.ts`

**Step 1: 创建 sync 命令**

创建 `src/cli-commands/sync.command.ts`:

```typescript
import type { VendorConfig } from '../models/vendor-config'
import * as p from '@clack/prompts'
import { SyncService } from '../services/sync.service'
import { formatError } from '../utils/error'

export async function syncSubmodules(root: string, vendors: Record<string, VendorConfig>) {
  const syncService = new SyncService(root)
  const spinner = p.spinner()

  spinner.start('Updating submodules...')
  try {
    await syncService.syncVendorSkills(vendors)
    spinner.stop('Submodules updated')
  }
  catch (error) {
    spinner.stop(`Failed to update: ${formatError(error)}`)
    return
  }

  p.log.success('All skills synced')
}
```

---

### Task 8: 实现 check 命令

**Files:**
- Create: `src/cli-commands/check.command.ts`

**Step 1: 创建 check 命令**

创建 `src/cli-commands/check.command.ts`:

```typescript
import type { VendorConfig } from '../models/vendor-config'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { SubmoduleService } from '../services/submodule.service'

export async function checkUpdates(
  root: string,
  submodules: Record<string, string>,
  vendors: Record<string, VendorConfig>,
) {
  const submoduleService = new SubmoduleService(root)
  const spinner = p.spinner()

  spinner.start('Fetching remote changes...')
  try {
    await submoduleService.fetchAllSubmodules()
    spinner.stop('Fetched remote changes')
  }
  catch (error) {
    spinner.stop(`Failed to fetch: ${error instanceof Error ? error.message : String(error)}`)
    return
  }

  const updates: { name: string, type: string, behind: number }[] = []

  // 检查 sources
  for (const [name, url] of Object.entries(submodules)) {
    const path = join(root, 'sources', name)
    if (!existsSync(path))
      continue

    try {
      const behind = await submoduleService.checkSubmoduleUpdate(`sources/${name}`)
      if (behind > 0) {
        updates.push({ name, type: 'source', behind })
      }
    }
    catch {
      // 忽略错误
    }
  }

  // 检查 vendors
  for (const [name, config] of Object.entries(vendors)) {
    const vendorConfig = config as VendorConfig
    const path = join(root, 'vendor', name)
    if (!existsSync(path))
      continue

    try {
      const behind = await submoduleService.checkSubmoduleUpdate(`vendor/${name}`)
      if (behind > 0) {
        const skillNames = Object.values(vendorConfig.skills).join(', ')
        updates.push({ name: `${name} (${skillNames})`, type: 'vendor', behind })
      }
    }
    catch {
      // 忽略错误
    }
  }

  if (updates.length === 0) {
    p.log.success('All submodules are up to date')
  }
  else {
    p.log.info('Updates available:')
    updates.forEach((update) => {
      p.log.message(`  ${update.name} (${update.type}): ${update.behind} commits behind`)
    })
  }
}
```

---

### Task 9: 实现 cleanup 命令

**Files:**
- Create: `src/cli-commands/cleanup.command.ts`

**Step 1: 创建 cleanup 命令**

创建 `src/cli-commands/cleanup.command.ts`:

```typescript
import type { Project } from '../models/project'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { SubmoduleService } from '../services/submodule.service'
import { formatError } from '../utils/error'
import { getExistingSkillNames, getExpectedSkillNames } from '../utils/submodule'

export async function cleanup(root: string, projects: Project[], skipPrompt: boolean) {
  const submoduleService = new SubmoduleService(root)
  const spinner = p.spinner()
  let hasChanges = false

  // 1. 移除额外的 submodules
  const existingPaths = submoduleService.getSubmodulePaths()
  const expectedPaths = new Set(projects.map(p => p.path))
  const extraSubmodules = existingPaths.filter(path => !expectedPaths.has(path))

  if (extraSubmodules.length > 0) {
    p.log.warn(`Found ${extraSubmodules.length} submodule(s) not in meta.ts:`)
    extraSubmodules.forEach(path => p.log.message(`  - ${path}`))

    const shouldRemove = skipPrompt
      ? true
      : await p.confirm({ message: 'Remove these extra submodules?', initialValue: true })

    if (p.isCancel(shouldRemove)) {
      p.cancel('Cancelled')
      return
    }

    if (shouldRemove) {
      for (const path of extraSubmodules) {
        spinner.start(`Removing submodule: ${path}`)
        try {
          await submoduleService.removeSubmoduleFully(path)

          const gitModulesPath = join(root, '.git', 'modules', path)
          if (existsSync(gitModulesPath)) {
            rmSync(gitModulesPath, { recursive: true })
          }

          hasChanges = true
          spinner.stop(`Removed: ${path}`)
        }
        catch (error) {
          spinner.stop(`Failed to remove ${path}: ${formatError(error)}`)
        }
      }
    }
  }

  // 2. 移除额外的 skills
  const { manual, submodules, vendors } = await import('../meta.js')
  const existingSkills = getExistingSkillNames(root)
  const expectedSkills = getExpectedSkillNames(submodules, vendors, manual)
  const extraSkills = existingSkills.filter(name => !expectedSkills.has(name))

  if (extraSkills.length > 0) {
    p.log.warn(`Found ${extraSkills.length} skill(s) not in meta.ts:`)
    extraSkills.forEach(name => p.log.message(`  - skills/${name}`))

    const shouldRemove = skipPrompt
      ? true
      : await p.confirm({ message: 'Remove these extra skills?', initialValue: true })

    if (p.isCancel(shouldRemove)) {
      p.cancel('Cancelled')
      return
    }

    if (shouldRemove) {
      hasChanges = true
      for (const skillName of extraSkills) {
        spinner.start(`Removing skill: ${skillName}`)
        try {
          rmSync(join(root, 'skills', skillName), { recursive: true })
          spinner.stop(`Removed: skills/${skillName}`)
        }
        catch (error) {
          spinner.stop(`Failed to remove skills/${skillName}: ${formatError(error)}`)
        }
      }
    }
  }

  if (!hasChanges && extraSubmodules.length === 0 && extraSkills.length === 0) {
    p.log.success('Everything is clean')
  }
  else if (hasChanges) {
    p.log.success('Cleanup completed')
  }
}
```

---

## 阶段四：入口层重构

### Task 10: 重构 CLI 入口文件

**Files:**
- Modify: `scripts/cli.ts`
- Backup: `scripts/cli.ts.bak`

**Step 1: 备份原文件**

Run: `cp scripts/cli.ts scripts/cli.ts.bak`

Expected: 创建备份文件

**Step 2: 重写 scripts/cli.ts**

完全替换 `scripts/cli.ts` 内容：

```typescript
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { manual, submodules, vendors } from '../meta.js'
import { checkUpdates } from '../src/cli-commands/check.command.js'
import { cleanup } from '../src/cli-commands/cleanup.command.js'
import { initSubmodules } from '../src/cli-commands/init.command.js'
import { syncSubmodules } from '../src/cli-commands/sync.command.js'
import { buildProjects } from '../src/utils/project-builder.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

interface CLIArgs {
  command?: string
  skipPrompt: boolean
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2)
  const skipPrompt = args.includes('-y') || args.includes('--yes')
  const command = args.find(arg => !arg.startsWith('-'))
  return { command, skipPrompt }
}

async function main() {
  const { command, skipPrompt } = parseArgs()

  // 构建项目列表
  const projects = buildProjects(submodules, vendors)

  // 处理子命令
  if (command === 'init') {
    p.intro('Skills Manager - Init')
    await initSubmodules(root, projects, { skipPrompt })
    p.outro('Done')
    return
  }

  if (command === 'sync') {
    p.intro('Skills Manager - Sync')
    await syncSubmodules(root, vendors)
    p.outro('Done')
    return
  }

  if (command === 'check') {
    p.intro('Skills Manager - Check')
    await checkUpdates(root, submodules, vendors)
    p.outro('Done')
    return
  }

  if (command === 'cleanup') {
    p.intro('Skills Manager - Cleanup')
    await cleanup(root, projects, skipPrompt)
    p.outro('Done')
    return
  }

  // 无子命令：显示交互式菜单
  if (skipPrompt) {
    p.log.error('Command required when using -y flag')
    p.log.info('Available commands: init, sync, check, cleanup')
    process.exit(1)
  }

  p.intro('Skills Manager')

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      { value: 'sync', label: 'Sync submodules', hint: 'Pull latest and sync Type 2 skills' },
      { value: 'init', label: 'Init submodules', hint: 'Add new submodules' },
      { value: 'check', label: 'Check updates', hint: 'See available updates' },
      { value: 'cleanup', label: 'Cleanup', hint: 'Remove unused submodules and skills' },
    ],
  })

  if (p.isCancel(action)) {
    p.cancel('Cancelled')
    process.exit(0)
  }

  switch (action) {
    case 'init':
      await initSubmodules(root, projects, { skipPrompt })
      break
    case 'sync':
      await syncSubmodules(root, vendors)
      break
    case 'check':
      await checkUpdates(root, submodules, vendors)
      break
    case 'cleanup':
      await cleanup(root, projects, false)
      break
  }

  p.outro('Done')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

**Step 3: 验证语法**

Run: `node --check scripts/cli.ts`

Expected: 无语法错误

---

## 阶段五：测试和验证

### Task 11: 手动测试 CLI 功能

**Step 1: 测试 check 命令**

Run: `pnpm start check`

Expected:
- 显示 "Skills Manager - Check"
- Fetch 远程更改
- 显示更新状态
- 显示 "Skills Manager - Done"

**Step 2: 测试 sync 命令**

Run: `pnpm start sync`

Expected:
- 显示 "Skills Manager - Sync"
- 更新 submodules
- 同步技能
- 显示 "Skills Manager - Done"

**Step 3: 测试 init 命令（交互式）**

Run: `pnpm start init`

Expected:
- 显示 "Skills Manager - Init"
- 检查额外 submodules
- 提供选择界面
- 添加选中的 submodules
- 显示 "Skills Manager - Done"

**Step 4: 测试 cleanup 命令**

Run: `pnpm start cleanup`

Expected:
- 显示 "Skills Manager - Cleanup"
- 检查额外 submodules 和 skills
- 询问是否移除
- 显示 "Skills Manager - Done"

**Step 5: 测试 -y 标志**

Run: `pnpm start check -y`

Expected: 同 check 命令，但跳过所有交互式提示

---

### Task 12: 对比验证

**Step 1: 对比原实现和新实现**

Run: `node scripts/cli.ts.bak check` 和 `pnpm start check`

Expected: 两者输出结果一致

**Step 2: 验证所有命令**

对每个命令（init、sync、check、cleanup）执行对比测试

Expected: 所有命令行为与原实现一致

---

### Task 13: 清理和文档

**Step 1: 删除备份文件**

Run: `rm scripts/cli.ts.bak`

Expected: 备份文件已删除

**Step 2: 更新 README（如需要）**

如果存在 README.md，添加关于 simple-git 的说明

**Step 3: 提交更改**

Run: `git add -A && git commit -m "feat: refactor cli.ts to use simple-git`

Expected: 创建包含所有重构的提交

---

## 验收标准

✅ 所有命令（init、sync、check、cleanup）正常工作
✅ 输出与原实现一致
✅ 代码通过 TypeScript 类型检查
✅ 无 eslint 错误
✅ 所有服务层都有清晰的职责划分
✅ 错误处理统一且友好
✅ 备份文件已删除

## 注意事项

1. **保持串行执行**: 不要引入并发，保持原有行为
2. **错误处理**: 确保所有错误都被正确捕获和格式化
3. **向后兼容**: CLI 接口必须保持不变
4. **类型安全**: 确保所有新代码都有正确的类型定义
5. **逐步验证**: 每个任务完成后都应该验证功能
