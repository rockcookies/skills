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

## 判别联合的判别字段命名

变体各自带不同关联数据（而不只是一个标签）时，判别字段命名如下：

- 判别字段统一叫 `kind` 或 `type`，二选一，仓内只用一种，不要一个文件 `kind` 另一个文件 `type`。没有仓级约定时默认 `kind`（`type` 与 TS 关键字 `type` 读起来容易混淆）。
- 字面量值用 kebab-case 或 camelCase 短词，与该联合本身的语义保持一致，不要用全大写：

```ts
// ✓ Good
type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'error', message: string }
  | { kind: 'saved', at: Date }

// ✗ Bad：判别字段名不统一、字面量大小写不一致
type SaveState =
  | { type: 'Idle' }
  | { kind: 'SAVING' }
```

## Branded types 命名

`UserId`、`OrderId` 这类语义化基础类型（底层是 string/number、但不能互换）的命名：

- 类型名用 PascalCase 名词，与它所代表的领域概念同名（`UserId`，不是 `UserIdType` 或 `BrandedUserId`）。
- brand 标记字段统一叫 `__brand`，用 `readonly`，不对外导出这个内部字段名：

```ts
// ✓ Good
type UserId = string & { readonly __brand: 'UserId' }
type OrderId = string & { readonly __brand: 'OrderId' }

function toUserId(raw: string): UserId {
  return raw as UserId // 仅在校验函数内部做一次
}
```

- 构造/校验函数用 `to` + 类型名（`toUserId`）或 `parse` + 类型名（`parseUserId`），不要用裸 `as` 在调用点强转——转换只应发生在这一个函数里，见 [functions-methods.md](./functions-methods.md)。

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
