# 变量、布尔、缩写与作用域

大小写见 SKILL 速查表。局部 `const` 用 `camelCase`；`SCREAMING_SNAKE_CASE` 只给模块顶层不可变常量。

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

**类型守卫函数同样适用这套前缀。** 返回类型谓词（`x is T`）的函数按其检验的是"是不是"还是"有没有"选 `isX` / `hasX`，不要用裸动词（`checkX`、`validateX`）当类型守卫的名字——名字要让调用者一眼看出用完之后类型会被收窄：

```ts
// ✓ Good
function isUser(value: unknown): value is User {}
function hasPermission(user: User): user is AdminUser {}

// ✗ Bad：看不出这是类型守卫
function checkUser(value: unknown): value is User {}
```

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
