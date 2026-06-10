---
name: node-error-handling
description: >-
  惯用 JS/TS 错误处理——`Error` 子类化、`cause` 链、`try/catch/finally`、Promise rejection、`AggregateError`、哨兵错误、类型守卫判别错误、结构化日志、单一处理规则。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node 可靠性工程师。你把每个错误都视为必须被处理或带上下文向上传播的事件——静默吞噬和重复日志同样不可接受。

**模式：**

- **Coding 模式** — 编写新的错误处理代码。按最佳实践逐条执行；可启动后台子代理扫描相邻代码中的违规（被吞噬的错误、log-and-throw 对）。
- **Review 模式** — 审查 PR 的错误处理变更。聚焦 diff：检查吞噬错误、缺少 cause 链、log-and-throw 对、裸字符串 catch。
- **Audit 模式** — 全库审计。用 3 个并行子代理分别检查：(1) 错误创建与自定义类，(2) catch 块质量，(3) Promise rejection 与 unhandledRejection。

---

# Node.js / TypeScript 错误处理最佳实践

## 最佳实践摘要

1. **捕获到的错误必须处理或重抛**，不得静默吞噬（空 catch 块）
2. **向上抛出时必须携带上下文**，用 `cause` 链保留原始错误
3. **错误消息用小写，无末尾标点**（与英文社区惯例一致；中文场景可保留句号）
4. **错误必须被处理或抛出，绝不同时做两件事**（单一处理规则）
5. **使用 `instanceof` + 自定义类或 `cause` 检查，而非裸字符串比较**
6. **使用 `AggregateError`** 合并多个独立错误
7. **绝不对用户暴露技术错误**——内部错误单独记录，向外返回友好消息

## 1. 自定义 Error 子类

```ts
// ✓ Good — 携带结构化数据，支持 instanceof 判别
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = this.constructor.name
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string, options?: ErrorOptions) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', options)
  }
}

export class ValidationError extends AppError {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message, 'VALIDATION_ERROR')
  }
}

// ✗ Bad — 裸字符串无法可靠判别
throw new Error('not found')
throw 'something went wrong'   // 禁止抛出非 Error 对象
```

## 2. cause 链——保留根因

```ts
// ✓ Good — cause 链保留完整上下文
async function fetchUser(id: string): Promise<User> {
  try {
    return await db.users.findById(id)
  }
  catch (err) {
    throw new AppError(
      `failed to fetch user ${id}`,
      'DB_ERROR',
      { cause: err },  // ES2022 标准链
    )
  }
}

// 检查 cause 链
function getRootCause(err: unknown): unknown {
  if (err instanceof Error && err.cause) return getRootCause(err.cause)
  return err
}

// ✗ Bad — 丢失原始错误信息
try {
  await db.users.findById(id)
}
catch {
  throw new Error('database error') // cause 丢失
}
```

## 3. 单一处理规则

**错误要么被记录日志，要么被向上抛出，绝不同时做两件事。** 双重处理会导致日志聚合中出现重复条目。

```ts
// ✓ Good — 只抛出，让调用层决定如何处理
async function saveOrder(order: Order): Promise<void> {
  try {
    await db.orders.insert(order)
  }
  catch (err) {
    throw new AppError('failed to save order', 'DB_ERROR', { cause: err })
  }
}

// ✓ Good — 调用层处理（记录并转换为 HTTP 响应）
async function handleCreateOrder(req: Request, res: Response) {
  try {
    await saveOrder(req.body)
    res.status(201).json({ ok: true })
  }
  catch (err) {
    logger.error({ err }, 'create order failed')
    res.status(500).json({ error: 'internal_error' })
  }
}

// ✗ Bad — log-and-throw：日志出现两次
async function saveOrder(order: Order): Promise<void> {
  try {
    await db.orders.insert(order)
  }
  catch (err) {
    logger.error({ err }, 'db insert failed') // 记录后…
    throw err                                  // …又抛出
  }
}
```

## 4. Promise 错误处理

```ts
// ✓ Good — async/await 配合 try/catch
async function run() {
  try {
    const result = await riskyOperation()
    return result
  }
  catch (err) {
    logger.error({ err }, 'operation failed')
    throw err
  }
}

// ✓ Good — 并发时用 Promise.allSettled 单独处理各错误
const results = await Promise.allSettled([task1(), task2(), task3()])
for (const result of results) {
  if (result.status === 'rejected') {
    logger.warn({ err: result.reason }, 'task failed')
  }
}

// ✗ Bad — 未处理的 Promise rejection
riskyOperation() // 没有 .catch() 或 await
```

## 5. AggregateError 合并多个错误

```ts
// ✓ Good — 批量操作中收集所有失败
async function processBatch(items: Item[]): Promise<void> {
  const errors: Error[] = []

  await Promise.allSettled(
    items.map(async (item) => {
      try {
        await processItem(item)
      }
      catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)))
      }
    }),
  )

  if (errors.length > 0) {
    throw new AggregateError(errors, `batch failed: ${errors.length} items`)
  }
}
```

## 6. 类型守卫判别错误

```ts
// ✓ Good — 类型守卫安全访问错误属性
function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

function handleError(err: unknown): Response {
  if (isAppError(err)) {
    if (err.code === 'NOT_FOUND') return { status: 404, body: err.message }
    if (err.code === 'VALIDATION_ERROR') return { status: 400, body: err.message }
  }
  // 未知错误不暴露技术细节
  logger.error({ err }, 'unhandled error')
  return { status: 500, body: 'internal error' }
}

// ✗ Bad — 用字符串匹配
if (err.message.includes('not found')) { ... }
```

## 7. 全局兜底

```ts
// Node.js 进程级兜底（最后防线，不替代局部处理）
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception — shutting down')
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection — shutting down')
  process.exit(1)
})
```

## 常见反模式

| 反模式 | 解决方案 |
|--------|----------|
| 空 catch 块 | 至少记录或重抛 |
| `catch (err: any)` 后直接访问属性 | 先用 `err instanceof Error` 守卫 |
| `throw 'error string'` | 始终抛出 `Error` 实例 |
| log-and-throw | 只选其一 |
| 裸 `.catch(console.log)` | 用结构化 logger，附上 context |
| `try/catch` 包裹整个函数 | 细粒度包裹，明确知道哪里会抛 |

---

交叉引用：预防 null 崩溃见 `node-safety`，结构化日志见 `node-observability`，错误命名见 `node-naming`。
