---
name: node-safety
description: >-
  防御式 JS/TS 编码——预防运行时崩溃与静默数据错误。null/undefined 安全、可选链与空值合并、类型守卫、`structuredClone` 与引用别名、浮点比较、整数精度（`Number`/`BigInt`）、零值/默认值设计。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node 防御式编码工程师。你把每一个未经验证的 null/undefined 假设都视为潜在的生产崩溃。

**模式：**

- **Coding 模式** — 编写新代码时按以下实践检查；重点关注外部数据入口（HTTP body、数据库结果、环境变量）。
- **Review 模式** — 审查 PR diff 中的安全隐患：缺失的 null 检查、引用共享、浮点比较、精度丢失。
- **Audit 模式** — 全库审计。并行扫描：(1) 裸访问可能为 null 的属性，(2) 对象引用共享，(3) 数值精度问题。

---

# Node.js / TypeScript 防御式编码

## 最佳实践摘要

1. **开启 `strict` 模式**（`strictNullChecks`、`noImplicitAny`），让编译器帮你捕获 null 问题
2. **使用可选链 `?.`** 访问可能为 null/undefined 的嵌套属性
3. **使用空值合并 `??`** 设置默认值（区别于 `||`：不会意外覆盖 `0`/`false`/`""`）
4. **外部数据入口必须做类型守卫或运行时验证**（Zod/Valibot）
5. **传出的对象/数组使用 `structuredClone` 或展开运算符**，避免调用者污染内部状态
6. **浮点比较用 epsilon 或整数化**，不用 `===`
7. **大整数使用 `BigInt`**，避免 `Number.MAX_SAFE_INTEGER` 精度丢失
8. **为对象字段设计有意义的零值/默认值**，避免隐式 undefined 状态

## 1. null / undefined 安全

### 可选链与空值合并

```ts
// ✓ Good — 可选链安全访问嵌套属性
const city = user?.address?.city ?? 'Unknown'

// ✓ Good — ?? 不覆盖 0/false/""
const timeout = config.timeout ?? 5000  // config.timeout 为 0 时保留 0
const label = config.label ?? 'default' // config.label 为 "" 时保留 ""

// ✗ Bad — || 会意外覆盖合法的零值
const timeout = config.timeout || 5000  // config.timeout 为 0 时错误地变成 5000
const label = config.label || 'default' // config.label 为 "" 时错误地变成 'default'
```

### 非空断言谨慎使用

```ts
// ✗ Bad — ! 告诉编译器"相信我"，但运行时仍可能 null
const name = user!.name  // 如果 user 确实为 null 则运行时崩溃

// ✓ Good — 先守卫，再访问
if (user === null) throw new NotFoundError('user', id)
const name = user.name
```

## 2. 外部数据入口验证

永远不要信任外部来源（HTTP body、数据库行、环境变量、第三方 API）的类型。

```ts
import { z } from 'zod'

// ✓ Good — Zod 在边界验证并推断类型
const CreateUserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  role: z.enum(['admin', 'user']),
})

type CreateUserInput = z.infer<typeof CreateUserSchema>

async function handleCreateUser(rawBody: unknown) {
  const input = CreateUserSchema.parse(rawBody) // 失败时抛出 ZodError
  await createUser(input)
}

// ✗ Bad — 直接 as 断言，零运行时保护
async function handleCreateUser(rawBody: any) {
  const input = rawBody as CreateUserInput  // 危险：任何结构都通过
  await createUser(input)
}
```

## 3. 避免引用共享（防御性拷贝）

导出的对象或数组，外部修改会悄悄污染内部状态。

```ts
// ✓ Good — 返回深拷贝
class Config {
  #settings: Record<string, unknown> = {}

  getAll(): Record<string, unknown> {
    return structuredClone(this.#settings)  // 深拷贝
  }

  getList(): string[] {
    return [...this.#list]  // 浅拷贝数组
  }
}

// ✗ Bad — 暴露内部引用
class Config {
  #settings: Record<string, unknown> = {}

  getAll() {
    return this.#settings  // 调用者可以直接修改内部状态
  }
}
```

## 4. 浮点数比较

浮点运算存在精度误差，不能用 `===` 直接比较。

```ts
// ✗ Bad — 浮点精度陷阱
0.1 + 0.2 === 0.3  // false！

// ✓ Good — epsilon 比较
const EPSILON = 1e-10
function floatEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < EPSILON
}

// ✓ Good — 金融计算用整数分（避免浮点）
const priceInCents = Math.round(price * 100)  // 存储为整数分
const displayPrice = priceInCents / 100       // 仅展示时转换
```

## 5. 整数精度（Number vs BigInt）

```ts
// ✗ Bad — 超过 MAX_SAFE_INTEGER 的整数精度丢失
const id = 9007199254740993  // 9007199254740992（精度丢失！）
console.log(id === 9007199254740992)  // true（两个不同的值相等了）

// ✓ Good — 大整数用 BigInt 或 string
const id = 9007199254740993n  // BigInt 字面量
const idFromApi = BigInt(response.id)  // 从字符串转换

// ✓ Good — JSON 中大整数用字符串传输
// { "userId": "9007199254740993" }  而非数字
```

## 6. 零值与默认值设计

为类型字段设计有意义的零值，避免"未初始化"状态悄悄传播。

```ts
// ✓ Good — 明确的零值，初始化即可用
interface UserProfile {
  name: string           // "" 是合法零值
  tags: string[]         // [] 是合法零值，绝不用 undefined
  createdAt: Date        // 必填，构造时赋值
  role: 'user' | 'admin' // 枚举，有明确默认
}

function createProfile(name: string): UserProfile {
  return {
    name,
    tags: [],
    createdAt: new Date(),
    role: 'user',
  }
}

// ✗ Bad — 可选字段传播 undefined，调用方永远要守卫
interface UserProfile {
  name?: string
  tags?: string[]
  role?: 'user' | 'admin'
}
```

## 7. 安全的 JSON 解析

```ts
// ✓ Good — 包裹异常 + 运行时类型验证
function safeParseJSON<T>(text: string, schema: z.ZodType<T>): T {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  }
  catch (err) {
    throw new AppError('invalid json', 'PARSE_ERROR', { cause: err })
  }
  return schema.parse(raw)
}

// ✗ Bad — 双重风险：语法错误未处理 + 类型未验证
const data = JSON.parse(text) as MyType
```

## 常见反模式

| 反模式 | 替换方案 |
|--------|----------|
| `as SomeType` 跳过验证 | 用 Zod/Valibot 运行时解析 |
| `config.value \|\| default` | 用 `config.value ?? default` |
| `arr[0]` 不检查空数组 | 用 `arr.at(0)` 或先判断 `arr.length > 0` |
| 直接传出内部数组/对象 | `[...arr]` 或 `structuredClone(obj)` |
| `0.1 + 0.2 === 0.3` | epsilon 比较或整数化 |
| 大整数用 `Number` | `BigInt` 或字符串传输 |

---

交叉引用：外部威胁防护见 `node-security`，错误处理惯例见 `node-error-handling`，类型守卫与 `unknown` 类型见 `node-types`。
