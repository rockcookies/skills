---
name: node-types
description: >-
  TypeScript 类型与接口设计——`interface` vs `type`、组合优于继承、泛型、条件类型、映射类型、可辨识联合、`unknown`/`never`、类型守卫与断言、`as const`、严格模式。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 TypeScript 类型系统设计师。你偏爱小而可组合的接口与精确的类型——为可测试性和可读性而设计，而非为了抽象而抽象。

**模式：**

- **Coding 模式** — 设计新类型时，遵循下面的规则顺序检查；优先 `strict: true`，让编译器代替运行时检查。
- **Review 模式** — 审查 PR diff 中的类型问题：过于宽泛的 `any`、不安全断言、缺失的类型守卫、滥用继承。

---

# TypeScript 类型设计最佳实践

## 1. `interface` vs `type`：选择原则

```ts
// ✓ Good — interface：对象形状（可被 implements，可声明合并）
interface Repository<T> {
  findById(id: string): Promise<T | null>
  save(entity: T): Promise<T>
  delete(id: string): Promise<void>
}

// ✓ Good — type：联合、交叉、映射、条件类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type Nullable<T> = T | null
type DeepReadonly<T> = { readonly [K in keyof T]: DeepReadonly<T[K]> }

// 实践规则：
// - 能用 interface 的对象形状优先用 interface（声明合并友好）
// - 联合/映射/条件等高阶操作用 type
// - 二者混用无需统一，清晰即可
```

## 2. 组合优于继承

```ts
// ✓ Good — 组合：通过交叉类型或接口组合
interface Timestamps {
  createdAt: Date
  updatedAt: Date
}

interface SoftDeletable {
  deletedAt: Date | null
}

interface User extends Timestamps, SoftDeletable {
  id: string
  email: string
}

// ✓ Good — 函数组合优于类继承
function withTimestamps<T extends object>(base: T): T & Timestamps {
  return { ...base, createdAt: new Date(), updatedAt: new Date() }
}

// ✗ Bad — 深层类继承链
class BaseEntity {}
class AuditableEntity extends BaseEntity {}
class UserEntity extends AuditableEntity {}  // 耦合深，难测试
```

## 3. 泛型

```ts
// ✓ Good — 泛型约束使类型安全
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(item => item[key])
}

// ✓ Good — 泛型默认值（常见配置模式）
interface ApiResponse<T = unknown> {
  data: T
  status: number
  message: string
}

// ✓ Good — 条件类型实现类型级分支
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T

// ✗ Bad — 过度泛化，泛型参数无实际约束
function process<T>(value: T): T { return value }  // 等价于 any，无意义
```

## 4. 可辨识联合（Discriminated Union）

可辨识联合是 TypeScript 中最强大的模式——用单个字面量字段区分联合成员，让 `switch/if` 完全类型安全。

```ts
// ✓ Good — 用 kind/type/status 等字段作判别符
type Result<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
  | { status: 'loading' }

function renderResult<T>(result: Result<T>): string {
  switch (result.status) {
    case 'success': return JSON.stringify(result.data)
    case 'error': return `Error: ${result.error.message}`
    case 'loading': return 'Loading...'
    // TypeScript 编译器保证穷举，无需 default
  }
}

// ✗ Bad — 可选字段联合，需要 if 链和 undefined 检查
type Result<T> = {
  data?: T
  error?: Error
  loading?: boolean
}
```

## 5. `unknown` vs `any` vs `never`

```ts
// unknown — 类型安全的 any，使用前必须先缩窄
function processInput(value: unknown): string {
  if (typeof value === 'string') return value.toUpperCase()
  if (typeof value === 'number') return value.toFixed(2)
  throw new TypeError(`unsupported type: ${typeof value}`)
}

// never — 不可能到达的分支，用于穷举检查
function assertNever(value: never): never {
  throw new Error(`unexpected value: ${JSON.stringify(value)}`)
}

// any — 仅在与遗留 JS 代码交互时使用，必须注释说明原因
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacyData = require('./legacy') as any  // TODO: 迁移后移除

// ✗ Bad — 用 any 绕过类型系统
function parse(data: any): any { return data }  // 等于放弃类型检查
```

## 6. 类型守卫

```ts
// ✓ Good — 自定义类型守卫
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'email' in value
    && typeof (value as any).id === 'string'
    && typeof (value as any).email === 'string'
  )
}

// ✓ Good — 类型断言函数（抛异常版守卫）
function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) throw new TypeError('expected User')
}

// ✗ Bad — as 断言绕过守卫
const user = response.data as User  // 无运行时保护
```

## 7. `as const` 与字面量类型

```ts
// ✓ Good — as const 保留字面量类型（不被拓宽为 string/number）
const HttpStatus = {
  OK: 200,
  NotFound: 404,
  InternalError: 500,
} as const

type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus]
// => 200 | 404 | 500

// ✓ Good — const enum 替代方案（生成更小的代码）
const DIRECTIONS = ['north', 'south', 'east', 'west'] as const
type Direction = typeof DIRECTIONS[number]
// => 'north' | 'south' | 'east' | 'west'
```

## 8. 严格模式配置

```jsonc
// tsconfig.json — 必须开启
{
  "compilerOptions": {
    "strict": true,                    // 启用所有严格检查
    "noUncheckedIndexedAccess": true,  // 数组/对象索引返回 T | undefined
    "exactOptionalPropertyTypes": true // 区分 undefined 属性和缺失属性
  }
}
```

## 映射类型速查

```ts
type Partial<T> = { [K in keyof T]?: T[K] }           // 所有字段可选
type Required<T> = { [K in keyof T]-?: T[K] }          // 所有字段必填
type Readonly<T> = { readonly [K in keyof T]: T[K] }   // 所有字段只读
type Pick<T, K extends keyof T> = { [P in K]: T[P] }  // 选取字段
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>  // 排除字段
type Record<K extends string, V> = { [P in K]: V }    // 键值映射
```

---

交叉引用：类型组合成架构模式见 `node-design-patterns`，运行时类型验证见 `node-safety`，类型命名见 `node-naming`。
