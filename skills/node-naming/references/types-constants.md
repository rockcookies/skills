# 类型、接口、常量与枚举

## 接口：无 `I` 前缀

TypeScript 惯例不用匈牙利 `I` 前缀。接口名用 PascalCase 名词。

```ts
// ✓ Good
interface Repository<T> {
  findById(id: string): Promise<T | null>
}

// ✗ Bad
interface IRepository<T> {}
```

## 类与类型别名

```ts
class UserService {}
type HttpMethod = 'GET' | 'POST'
type UserId = string
```

不要用 `Struct`、`Object`、`Data` 等无信息后缀：

```ts
// ✗ Bad
type UserData = { name: string }
class ServerObject {}
```

## 常量

模块顶层不可变常量用 `SCREAMING_SNAKE_CASE`。名称表达**角色**，不表达**字面值**。

```ts
// ✓ Good
const MAX_RETRY_COUNT = 3
const DEFAULT_TIMEOUT_MS = 30_000

// ✗ Bad — 值变了名字就过时
const THREE = 3
const TIMEOUT_30000 = 30_000
```

局部 `const` 用 `camelCase`。

## 枚举

枚举成员在同一项目内统一用 `PascalCase` 或 `SCREAMING_SNAKE_CASE`（二选一，不要混用）。

**零值哨兵**：用 `Unknown`/`None` 作枚举零值，避免未初始化被误当真实状态。

```ts
// ✓ Good
enum OrderStatus {
  Unknown = 'UNKNOWN',
  Pending = 'PENDING',
  Paid = 'PAID',
  Cancelled = 'CANCELLED',
}

// ✗ Bad — Pending 是数字零值，未赋值变量静默成 Pending
enum OrderStatus {
  Pending,
  Paid,
  Cancelled,
}
```

字符串枚举优先显式赋值，便于序列化与日志。

## 泛型类型参数

单字母 `T`、`K`、`V` 用于简单场景；复杂场景用 `T` + PascalCase 后缀：

```ts
function identity<T>(value: T): T {}
function map<TKey, TValue>(entries: [TKey, TValue][]): Map<TKey, TValue> {}
```

## React Props 类型

组件 props 类型通常与组件同名加 `Props` 后缀：

```ts
type UserProfileProps = {
  userId: string
  isEditable: boolean
  onSave: (data: UserData) => void
}
```

详见 [react.md](./react.md)。
