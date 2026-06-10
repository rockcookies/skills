---
name: node-documentation
description: >-
  JS/TS 文档标准——TSDoc / JSDoc 注释、导出符号文档、README 结构、CHANGELOG、API 参考生成（TypeDoc）、`llms.txt`。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node/TypeScript 技术写作工程师。你把文档当成一等产品交付物——精确、有示例、为从未见过这个代码库的读者而写。

**模式：**

- **Write 模式** — 补写缺失文档（注释、README、CHANGELOG、llms.txt）。按检查清单逐项处理，或用子代理并行覆盖多个文件。
- **Review 模式** — 审计现有文档的完整性、准确性与风格。检查要点：注释是否重复签名、README 是否有可运行示例、公开 API 是否全有注释。

---

# Node.js / TypeScript 文档标准

## 写作原则

**简洁** — 写最短的能传达完整意思的版本。去掉装饰词和空洞过渡语。

**意图优于复述** — 代码展示*是什么*，文档解释*为什么存在*、*何时使用*、*有哪些约束*。仅重述签名的注释毫无价值。

**不编造上下文** — 省略无法证实的设计理由、营销词汇（`seamlessly`、`robust`）或未来承诺。

**保持语气强度** — `must`/`should`/`may` 表示不同程度的义务，编辑时不得降格。

## 1. TSDoc / JSDoc 注释

每个**导出符号**（函数、类、接口、类型别名、常量）必须有文档注释。

```ts
// ✓ Good — 解释目的、参数、返回值与异常
/**
 * 根据用户 ID 从数据库加载用户。
 *
 * @param id - 用户的 UUID，从 JWT claims 中提取
 * @returns 用户对象，如不存在则返回 `null`
 * @throws {DatabaseError} 数据库连接失败时
 */
export async function findUserById(id: string): Promise<User | null> {}

// ✗ Bad — 重复签名，零增量信息
/**
 * 根据 id 找到用户
 * @param id 用户 id
 * @returns 用户
 */
export async function findUserById(id: string): Promise<User | null> {}
```

### 常用 TSDoc 标签

| 标签 | 用途 |
|------|------|
| `@param name - 描述` | 参数说明 |
| `@returns 描述` | 返回值说明（省略无意义的"返回 XXX"） |
| `@throws {ErrorType} 描述` | 可能抛出的异常 |
| `@example` | 可运行代码示例 |
| `@deprecated 替换说明` | 标记废弃 API |
| `@see {@link OtherType}` | 交叉引用 |
| `@internal` | 标记不对外暴露的符号 |

### `@example` 示例必须可运行

```ts
/**
 * 将毫秒时间戳格式化为本地日期字符串。
 *
 * @example
 * ```ts
 * formatTimestamp(1700000000000) // => '2023-11-14'
 * ```
 */
export function formatTimestamp(ms: number): string {}
```

## 2. 模块级注释

每个模块（文件）顶部应有模块说明，帮助读者快速判断是否需要深入阅读。

```ts
/**
 * 用户认证模块。
 *
 * 处理 JWT 颁发、验证与刷新。不包含用户注册/修改逻辑（→ `user-service`）。
 */
```

## 3. README 结构

库与应用的 README 必须包含以下章节（按优先级排序）：

```markdown
# 包名

一句话描述：做什么，解决什么问题。

## 安装

\`\`\`bash
npm install my-lib
# or
pnpm add my-lib
\`\`\`

## 快速开始

最简可运行示例，10 行内。

## API 参考 / 用法

主要 API 与配置项说明。

## 开发

贡献者本地运行步骤。

## 许可证
```

关键规则：**快速开始必须是可复制粘贴并立即运行的代码**，不是伪代码。

## 4. TypeDoc 配置

对外发布的库应接入 TypeDoc 生成 API 文档站点：

```jsonc
// typedoc.json
{
  "entryPoints": ["./src/index.ts"],
  "out": "./docs/api",
  "excludePrivate": true,
  "excludeInternal": true,
  "includeVersion": true,
  "readme": "README.md"
}
```

在 `package.json` 中加入脚本：

```json
{
  "scripts": {
    "docs": "typedoc",
    "docs:watch": "typedoc --watch"
  }
}
```

## 5. CHANGELOG 维护

遵循 [Keep a Changelog](https://keepachangelog.com) 格式，每次发布前更新：

```markdown
## [1.2.0] - 2024-03-01

### Added
- `findUserByEmail` 方法支持大小写不敏感查询

### Changed
- `createUser` 现在在邮箱已存在时抛出 `ConflictError`（原来返回 `null`）

### Fixed
- 修复并发请求下的 race condition（#142）
```

**绝不向已发布版本追加条目**。

## 6. llms.txt

大型项目或库应在根目录提供 `llms.txt`，帮助 LLM 代理快速理解项目结构：

```markdown
# my-library

> 一句话概述：这个库做什么。

## 核心模块

- `src/client.ts` — HTTP 客户端封装，主入口
- `src/auth.ts` — JWT 认证逻辑
- `src/types.ts` — 公共类型定义

## 重要约定

- 所有异步函数返回 Promise，不使用回调
- 错误统一为 `AppError` 子类（见 `src/errors.ts`）
- 配置通过 `createClient(options)` 注入，不使用全局状态

## 示例

快速开始示例见 `examples/basic.ts`。
```

---

交叉引用：命名约定见 `node-naming`，代码风格见 `node-code-style`，测试中的文档化示例见 `node-testing`。
