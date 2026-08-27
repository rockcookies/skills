# 变量、布尔、缩写与作用域

## 大小写规则

| 元素 | 约定 | 示例 |
|------|------|------|
| 变量、函数、方法 | `camelCase` | `fetchUser`, `userCount` |
| 类、接口、类型、枚举 | `PascalCase` | `UserService`, `HttpClient` |
| 常量（模块顶层不可变） | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS` |
| 私有字段（类内） | `#camelCase`（原生私有）或 `_camelCase`（约定私有） | `#token`, `_cache` |

```ts
// ✓ Good
const maxRetryCount = 3
const MAX_RETRY_COUNT = 3
function fetchUser(id: string) {}
class UserRepository {}
interface Repository<T> {}

// ✗ Bad
const MaxRetryCount = 3
const max_retry_count = 3
class IUserRepository {}
```

局部 `const` 用 `camelCase`。`SCREAMING_SNAKE_CASE` 只给模块顶层不可变常量。

## 作用域与长度

名称长度应与作用域成正比：短作用域用短名，模块级用描述性名称。

```ts
// 小作用域（循环 3-7 行）
for (let i = 0; i < items.length; i++) { /* ... */ }

// 中等作用域
const userCount = users.length

// 大作用域 / 模块级
const DEFAULT_HTTP_TIMEOUT_MS = 30_000
```

常见单字母约定：

| 字母 | 含义 |
|------|------|
| `i`, `j`, `k` | 循环索引 |
| `n` | 计数或长度 |
| `e` | DOM / React 事件 |
| `prev` | 更新前回值（如 `setState(prev => ...)`） |

AbortSignal 用 `signal`，Error 用 `error`，不要缩成单字母。

## 布尔命名

布尔变量、参数、字段**必须**加前缀，读起来像是非题。

```ts
// ✓ Good
const isLoggedIn = true
const hasAdminRole = user.roles.includes('admin')
const canWrite = permission === 'write' || permission === 'admin'
const shouldRetry = attempt < maxAttempts

// ✗ Bad
const loggedIn = true
const adminRole = true
const write = true
```

React boolean props 同样适用：`isDisabled`、`hasError`、`canSubmit`。详见 [react.md](./react.md)。

## 避免类型入名

名称描述**含义**，不描述**类型**。

```ts
// ✓ Good
const users = getUsers()
const count = items.length

// ✗ Bad
const userArray = getUsers()
const countNumber = items.length
```

## 概念名一致

同一业务概念在全库使用同一名称。`user` 不要时而叫 `account`、时而叫 `person`。

```ts
// ✓ Good
function createUser(user: User) {}
function updateUser(user: User) {}
function deleteUser(userId: string) {}

// ✗ Bad
function createUser(user: User) {}
function updateAccount(acct: User) {}
function removePerson(id: string) {}
```

## 缩写当词

把 HTTP / URL / ID 等缩写当作普通词：PascalCase 里只大写首字母，camelCase 里不大写整段。平台强制名（如 `XMLHttpRequest`）除外。

```ts
// ✓ Good
class HttpClient {}
const httpClient = new HttpClient()
function parseUrl() {}
const userId = ''
function loadHttpUrl() {}

// ✗ Bad
class HTTPClient {}
function parseURL() {}
const userID = ''
function loadHTTPURL() {}
```
