---
name: node-naming
description: >-
  JS/TS 命名约定——变量、函数、类、接口、类型、常量、文件名。涵盖 camelCase/PascalCase/SCREAMING_SNAKE、布尔前缀、避免匈牙利命名与 `IFoo` 前缀、`utils`/`helpers` 反模式。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node/TypeScript 代码可读性工程师。你相信好名字是最廉价的文档，坏名字是最隐蔽的 bug 源。

**模式：**

- **Coding 模式** — 为新代码选名。按下面的速查表与最佳实践依次检查；有疑义时，以最能表达意图的名字为准。
- **Review 模式** — 审查 PR diff 中的命名。重点找缩写滥用、`IFoo` 前缀、`utils`/`helpers` 反模式、布尔裸名。
- **Audit 模式** — 全库命名审计。用子代理并行扫描：(1) 布尔裸名，(2) `I` 前缀接口，(3) `utils/helpers` 文件，(4) 文件命名风格。

---

# Node.js / TypeScript 命名约定

## 速查表

| 元素 | 约定 | 示例 |
|------|------|------|
| 变量、函数、方法 | `camelCase` | `fetchUser`, `userCount` |
| 类、接口、类型、枚举 | `PascalCase` | `UserService`, `HttpClient` |
| 常量（顶层不可变） | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS` |
| 私有字段（类内） | `#camelCase`（原生私有）或 `_camelCase`（约定私有） | `#token`, `_cache` |
| 布尔变量/参数/字段 | `is`/`has`/`can`/`should` 前缀 | `isReady`, `hasPermission` |
| 文件名 | `kebab-case` | `user-service.ts`, `http-client.ts` |
| 测试文件 | `<name>.test.ts` | `user-service.test.ts` |
| 枚举成员 | `PascalCase` 或 `SCREAMING_SNAKE_CASE`（保持一致） | `Status.NotFound`, `HttpMethod.GET` |
| 泛型类型参数 | 单大写字母或 `TPascalCase` | `T`, `TValue`, `TKey` |
| 接口 | **无 `I` 前缀** | `Repository`（非 `IRepository`） |

## 1. 大小写规则

```ts
// ✓ Good
const maxRetryCount = 3          // 局部变量 camelCase
const MAX_RETRY_COUNT = 3        // 模块顶层常量 SCREAMING_SNAKE
function fetchUser(id: string) {}
class UserRepository {}
interface Repository<T> {}       // 无 I 前缀
type HttpMethod = 'GET' | 'POST'

// ✗ Bad
const MaxRetryCount = 3          // 常量不用 PascalCase
const max_retry_count = 3        // snake_case 非 JS 惯例
class IUserRepository {}         // I 前缀是 C#/Java 遗留风格
```

## 2. 布尔命名必须加前缀

裸名无法区分布尔与其他类型，阅读时需要跳回声明处确认类型。

```ts
// ✓ Good
const isLoggedIn = true
const hasAdminRole = user.roles.includes('admin')
const canWrite = permission === 'write' || permission === 'admin'
const shouldRetry = attempt < maxAttempts

// ✗ Bad
const loggedIn = true            // 无前缀
const adminRole = true           // 读作名词，非布尔
const write = true               // 与动词同名
```

## 3. 避免 `utils`/`helpers`/`misc` 反模式

`utils.ts` 是"我不知道这个放哪里"的信号，它会随时间膨胀成无法维护的垃圾桶。

```ts
// ✗ Bad — 无意义的抽屉文件
// utils.ts
export function formatDate() {}
export function parseUrl() {}
export function hashPassword() {}
export function sendEmail() {}

// ✓ Good — 按职责分组
// date.ts
export function formatDate() {}

// url.ts
export function parseUrl() {}

// crypto.ts
export function hashPassword() {}
```

## 4. 避免重复上下文（Stuttering）

导入后调用已经携带模块名，不要在标识符里重复。

```ts
// ✓ Good
import { parse } from './url.ts'
parse(rawUrl)

// ✗ Bad
import { parseUrl } from './url.ts'
parseUrl(rawUrl)   // "url" 出现两次
```

## 5. 缩写规则

标准的 HTTP/URL/ID 等首字母缩写在 PascalCase 中保持全大写；在 camelCase 开头时全小写。

```ts
// ✓ Good
class HTTPClient {}        // PascalCase 中全大写
const httpClient = new HTTPClient()  // camelCase 开头时全小写
function parseURL() {}
const userId = ''          // id 不大写（惯例例外）

// ✗ Bad
class HttpClient {}        // 工具性类名，首选 HTTP
const userID = ''          // D 大写与 JS 社区不符
```

## 6. 工厂函数与构造函数命名

```ts
// ✓ Good — 模块只导出单一主要类型时，工厂函数用 create
export function createLogger(options: LoggerOptions): Logger {}

// ✓ Good — 模块有多种可构建类型时，加名词后缀
export function createFileTransport(): Transport {}
export function createConsoleTransport(): Transport {}

// ✗ Bad
export function newLogger() {}   // new 前缀是 Go 风格
```

## 7. 枚举零值设计

用 `Unknown`/`None` 作枚举的零值哨兵，避免默认值被误当真实状态处理。

```ts
// ✓ Good
enum OrderStatus {
  Unknown = 'UNKNOWN',  // 零值哨兵
  Pending = 'PENDING',
  Paid = 'PAID',
  Cancelled = 'CANCELLED',
}

// ✗ Bad — Pending 是零值，未赋值变量会静默成 Pending
enum OrderStatus {
  Pending,
  Paid,
  Cancelled,
}
```

## 常见反模式

| 反模式 | 替换方案 |
|--------|----------|
| `IRepository` 接口 | `Repository`（无前缀） |
| `utils.ts` / `helpers.ts` | 按职责拆分为 `date.ts`、`url.ts` 等 |
| `flag`、`temp`、`data` 等裸名 | 表达意图的具体名 `isEnabled`、`cachedUser`、`responsePayload` |
| `handleIt`、`doThing` | 精确描述行为 `processPayment`、`validateSchema` |
| `boolean` 裸字段 `active` | `isActive` |
| `any` 类型别名 `Data` | 具体类型或泛型参数 |

---

交叉引用：格式约定见 `node-code-style`，文档注释见 `node-documentation`，类型设计见 `node-types`。
