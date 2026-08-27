# 类型、接口、常量与枚举

## 接口：无 `I` 前缀

TypeScript 惯例不用匈牙利 `I` 前缀。接口名用 PascalCase 名词。不强制「对象形状必须用 `interface` 而不能用 `type`」；文件内保持一种即可。

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

## 可辨状态：union 优先

离散状态优先 string union 或 `as const` 对象，不要用数字枚举把 `0` 当成真实业务状态。

```ts
// ✓ Good
type OrderStatus = 'pending' | 'paid' | 'cancelled'

const OrderStatus = {
  Pending: 'pending',
  Paid: 'paid',
  Cancelled: 'cancelled',
} as const
type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
```

需要 `enum` 时，用显式字符串成员，便于序列化与日志：

```ts
enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Cancelled = 'cancelled',
}
```

```ts
// ✗ Bad：Pending 是数字 0，未赋值变量静默成 Pending
enum OrderStatus {
  Pending,
  Paid,
  Cancelled,
}
```

## 常量

只有**模块顶层**不可变常量用 `SCREAMING_SNAKE_CASE`。名称表达**角色**，不表达**字面值**。局部 `const` 用 `camelCase`。

```ts
// ✓ Good
const MAX_RETRY_COUNT = 3
const DEFAULT_TIMEOUT_MS = 30_000

function retry() {
  const maxRetryCount = 3
}

// ✗ Bad：值变了名字就过时
const THREE = 3
const TIMEOUT_30000 = 30_000
```

## 泛型类型参数

单字母 `T`、`K`、`V` 用于简单场景；复杂场景用 `T` + PascalCase 后缀：

```ts
function identity<T>(value: T): T {}
function map<TKey, TValue>(entries: [TKey, TValue][]): Map<TKey, TValue> {}
```

## React Props 类型

组件 props 类型通常与组件同名加 `Props` 后缀。详见 [react.md](./react.md)。
