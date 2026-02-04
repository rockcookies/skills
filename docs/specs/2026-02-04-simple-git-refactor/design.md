# Simple-Git 重构设计文档

## 概述

将 `scripts/cli.ts` 中的 git 操作从 `execSync` 方式迁移到 `simple-git` 库，提升代码质量、类型安全性和可维护性。

**设计日期**: 2026-02-04
**核心目标**: 代码质量提升（类型安全、Promise 异步、更好的错误处理）

## 目录结构

```
D:\Workspaces\private\skills\
├── src/
│   ├── services/
│   │   ├── git.service.ts          # 基础 Git 操作服务
│   │   ├── submodule.service.ts    # Submodule 专用服务
│   │   └── sync.service.ts         # 技能同步服务
│   ├── models/
│   │   ├── project.ts              # Project 接口定义
│   │   └── vendor-config.ts        # VendorConfig 接口定义
│   ├── errors/
│   │   └── git.error.ts            # 自定义 GitError 类
│   ├── utils/
│   │   ├── fs.ts                   # 文件系统工具
│   │   ├── error.ts                # 错误格式化工具
│   │   ├── project-builder.ts      # 项目列表构建工具
│   │   └── submodule.ts            # Submodule 工具函数
│   └── cli-commands/
│       ├── init.command.ts         # init 命令实现
│       ├── sync.command.ts         # sync 命令实现
│       ├── check.command.ts        # check 命令实现
│       └── cleanup.command.ts      # cleanup 命令实现
├── scripts/
│   └── cli.ts                      # CLI 入口（仅解析参数和路由）
└── meta.ts                         # 保持在根目录
```

## 架构分层

### 入口层 (scripts/cli.ts)
- 最小化入口，仅负责参数解析和命令路由
- 不包含业务逻辑
- 使用 `@clack/prompts` 处理交互式菜单

### 命令层 (src/cli-commands/)
- 每个 CLI 命令对应一个文件
- 负责用户交互和业务流程编排
- 调用服务层完成实际操作
- 处理错误并向用户提供友好的反馈

### 服务层 (src/services/)
- **GitService**: 封装 simple-git，提供类型安全的 git 原语
- **SubmoduleService**: 高层次 submodule 操作（add、remove、update）
- **SyncService**: 技能同步业务逻辑

### 模型层 (src/models/)
- 定义 TypeScript 接口和类型

### 错误层 (src/errors/)
- GitError: 统一错误处理，包含上下文信息

## 核心服务设计

### GitService

封装 simple-git，提供类型安全的 git 原语操作：

```typescript
export class GitService {
  private git: SimpleGit

  constructor(cwd: string = process.cwd()) {
    this.git = simpleGit(cwd)
  }

  async getSha(): Promise<string>
  async getBehindCount(): Promise<number>
  async fetch(): Promise<void>
  async updateSubmodules(options: { remote: boolean, merge: boolean }): Promise<void>
  async addSubmodule(url: string, path: string): Promise<void>
  async removeSubmodule(path: string): Promise<void>
}
```

**设计要点**:
- 实例化时绑定工作目录
- 所有方法返回 Promise
- 错误直接抛出，由上层处理

### SubmoduleService

基于 GitService 提供高层次 submodule 操作：

```typescript
export class SubmoduleService {
  private rootGit: GitService
  private root: string

  getSubmodulePaths(): string[]
  isSubmodule(path: string): boolean
  async getSubmoduleSha(submodulePath: string): Promise<string | null>
  async checkSubmoduleUpdate(submodulePath: string): Promise<number>
  async addSubmodule(url: string, path: string): Promise<void>
  async removeSubmoduleFully(submodulePath: string): Promise<void>
  async updateAllSubmodules(): Promise<void>
  async fetchAllSubmodules(): Promise<void>
}
```

**设计要点**:
- 组合 GitService，而非继承
- 混合同步/异步：读取 .gitmodules 是同步，git 操作是异步
- 查询操作失败返回 null

### SyncService

处理技能同步的业务逻辑：

```typescript
export class SyncService {
  private submoduleService: SubmoduleService
  private root: string

  async syncVendorSkills(vendors: Record<string, VendorConfig>): Promise<void>
  private async syncVendor(vendorName: string, config: VendorConfig): Promise<void>
  private async syncSkill(...): Promise<void>
  private copyDirectory(source: string, target: string): void
  private copyLicense(vendorName: string, outputPath: string): void
  private writeSyncMd(...): void
}
```

**设计要点**:
- 保持原有的文件同步逻辑
- 错误抛出标准 Error
- 私有方法隐藏实现细节

## 错误处理系统

### 错误类型定义

```typescript
export class GitError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly cwd?: string,
    public readonly originalError?: unknown,
  )
}

export class SubmoduleNotFoundError extends GitError
export class GitOperationFailedError extends GitError
```

### 错误处理策略

**服务层**: 直接抛出 simple-git 的错误

**命令层**: 捕获并转换为 GitError，添加上下文

**CLI 入口层**: 顶层捕获，友好展示，设置退出码

### 错误格式化

```typescript
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

## 命令层设计

每个命令文件导出一个异步函数：
- 使用 `@clack/prompts` 处理用户交互
- 调用服务层完成 git 操作
- 使用 spinner 提供进度反馈
- 捕获并格式化错误

### 示例：init.command.ts

```typescript
export async function initSubmodules(
  root: string,
  projects: Project[],
  options: InitOptions
) {
  const submoduleService = new SubmoduleService(root)
  const spinner = p.spinner()

  // 1. 检查并移除额外的 submodules
  // 2. 查找新增的 submodules
  // 3. 选择要添加的 submodules
  // 4. 添加 submodules
}
```

## 模型定义

```typescript
// src/models/project.ts
export interface Project {
  name: string
  url: string
  type: 'source' | 'vendor'
  path: string
}

// src/models/vendor-config.ts
export interface VendorConfig {
  source: string
  skills: Record<string, string>
}
```

## 入口层重构

入口文件仅保留：
- 参数解析 (`parseArgs`)
- 命令路由
- 交互式菜单
- 顶层错误处理

所有业务逻辑委托给命令层。

## 实现约束

1. **串行执行**: 保持当前的串行行为，不引入并发
2. **向后兼容**: CLI 接口和行为保持不变
3. **显式错误**: 采用 B 方案，抛出结构化错误
4. **全面重构**: 所有 git 操作都迁移到 simple-git

## 配置更新

### package.json

```json
{
  "devDependencies": {
    "simple-git": "^3.27.0"
  }
}
```

## 测试策略

1. 单元测试：为服务层编写测试
2. 集成测试：测试命令流程
3. 手动测试：验证 CLI 功能

## 核心改进总结

1. ✅ **类型安全**: 所有 git 操作都有明确的类型定义
2. ✅ **Promise 化**: 完全异步，支持 await/async
3. ✅ **错误处理**: 统一的错误处理和格式化
4. ✅ **职责分离**: 清晰的服务层和命令层
5. ✅ **可测试性**: 每个模块都可以独立测试
6. ✅ **可维护性**: 代码按功能组织，易于定位和修改
