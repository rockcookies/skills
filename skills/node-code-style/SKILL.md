---
name: node-code-style
description: >-
  JS/TS 代码格式与风格一致性——格式化工具（Prettier / oxfmt / dprint）、行宽、import 排序、空行、声明位置、注释取舍。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node/TypeScript 代码质量工程师。你认为一致的风格是团队协作的基础，格式问题应由工具自动处理，人的精力留给设计。

**模式：**

- **Coding 模式** — 编写新代码时遵循以下规则。格式问题交给 Prettier/oxfmt 自动修复，关注信息量高的注释与清晰的控制流。
- **Review 模式** — 审查 PR diff，聚焦：注释质量、import 组织、嵌套深度、空行滥用。格式差异应标记为"请运行 formatter"而非手动改。

---

# Node.js / TypeScript 代码风格

## 1. 格式化工具配置

项目应选定**唯一一个**格式化工具并全员强制执行（禁止多工具共存）。

```jsonc
// prettier.config.mjs（推荐配置）
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,          // 无分号（视项目约定可开启）
  singleQuote: true,
  trailingComma: 'all', // 多行末尾逗号便于 diff
  arrowParens: 'always',
}
```

> 使用 `oxfmt`（基于 Biome）时，`oxfmt.config.ts` 中配置行宽为 100，启用 `trailingCommas`。

## 2. Import 排序与分组

import 必须分组，组间留一个空行，组内按字母顺序排列。标准顺序：

```ts
// ✓ Good — 四组：Node 内置 → 第三方 → 项目内别名 → 相对路径
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'

import { z } from 'zod'
import pino from 'pino'

import { UserRepository } from '@/repositories/user'
import { createLogger } from '@/utils/logger'

import { formatDate } from './date'
import type { Config } from './types'

// ✗ Bad — 混用无分组
import { formatDate } from './date'
import { z } from 'zod'
import { readFile } from 'node:fs/promises'
import { UserRepository } from '@/repositories/user'
```

`type` 导入应单独标注，便于 `isolatedModules` 编译器优化。

## 3. 行宽与换行

行宽超过 100 字符时必须换行，在**语义边界**处断行，而非任意列位置。

```ts
// ✓ Good — 参数超过 3 个时每参数单行，闭合括号独占一行
const result = await createOrder(
  userId,
  productId,
  quantity,
  shippingAddress,
)

// ✗ Bad — 强行塞在一行
const result = await createOrder(userId, productId, quantity, shippingAddress)
```

函数签名过长时，真正的解决方案是**减少参数**（改用 options 对象），而不是更好的换行。

## 4. 对象与数组

```ts
// ✓ Good — 多行对象末尾保留逗号（diff 友好）
const config = {
  host: 'localhost',
  port: 3000,
  timeout: 5000,
}

// ✓ Good — 短对象可单行（不超过 60 字符）
const point = { x: 1, y: 2 }

// ✗ Bad — 最后一项无尾逗号
const config = {
  host: 'localhost',
  port: 3000
}
```

## 5. 变量声明

优先 `const`，必须变更时用 `let`，**禁止 `var`**。

```ts
// ✓ Good
const maxRetries = 3
let attempt = 0

// ✗ Bad
var maxRetries = 3
let maxRetries = 3   // 不会变更，应用 const
```

## 6. 早返回（Early Return）

错误与边界条件先处理，保持主流程在最浅缩进层。

```ts
// ✓ Good — 早返回，主逻辑无嵌套
function processOrder(order: Order | null): OrderResult {
  if (order === null) return { error: 'order_not_found' }
  if (order.status === 'cancelled') return { error: 'order_cancelled' }

  // 主流程
  const total = calculateTotal(order)
  return { total }
}

// ✗ Bad — 嵌套地狱
function processOrder(order: Order | null): OrderResult {
  if (order !== null) {
    if (order.status !== 'cancelled') {
      const total = calculateTotal(order)
      return { total }
    } else {
      return { error: 'order_cancelled' }
    }
  } else {
    return { error: 'order_not_found' }
  }
}
```

## 7. 注释原则

注释解释**为什么**，代码解释**是什么**。可以直接从代码读出的内容不需要注释。

```ts
// ✓ Good — 解释非显而易见的业务决策
// Stripe 要求金额以整数分为单位
const amountInCents = Math.round(amount * 100)

// ✓ Good — 标记已知限制或临时方案
// TODO(#1234): migrate to streaming API when available
const data = await fetchAll(endpoint)

// ✗ Bad — 照搬代码，零信息量
// 将 amount 乘以 100
const amountInCents = amount * 100

// ✗ Bad — 无用的类型注释（TypeScript 已有类型系统）
// string 类型的用户名
const username: string = ''
```

## 8. 空行使用

空行是视觉分隔符，过度使用等于噪音。

```ts
// ✓ Good — 逻辑段之间一个空行
async function createUser(data: CreateUserInput): Promise<User> {
  const validated = validateInput(data)

  const existing = await db.users.findByEmail(validated.email)
  if (existing) throw new ConflictError('email_taken')

  const user = await db.users.create(validated)
  await sendWelcomeEmail(user.email)

  return user
}

// ✗ Bad — 连续多个空行
async function createUser(data: CreateUserInput): Promise<User> {
  const validated = validateInput(data)


  const existing = await db.users.findByEmail(validated.email)


  if (existing) throw new ConflictError('email_taken')
```

---

交叉引用：命名约定见 `node-naming`，文档注释见 `node-documentation`，工具链配置见 `node-dev`。
