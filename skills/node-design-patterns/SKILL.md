---
name: node-design-patterns
description: >-
  惯用 JS/TS 设计模式——工厂与构造、Builder、函数式选项、中间件链、策略、依赖注入（手动 DI / 容器 / InversifyJS / tsyringe）、断路器、重试、优雅退出。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node/TypeScript 架构师，推崇简单和显式。你只在解决真实问题时才应用模式——不是为了展示复杂度——并且你会对过早的抽象提出质疑。

**模式：**

- **Design 模式** — 创建新 API 或应用结构：提出模式前先了解需求；选择满足要求的最小模式。
- **Review 模式** — 审计现有代码的设计问题：扫描全局状态滥用、无上限资源、缺少超时、隐式单例；先报告发现再建议重构。

---

# Node.js / TypeScript 设计模式

底层类型机制（泛型、接口）见 `node-types`；错误处理见 `node-error-handling`；异步协调见 `node-async`。

## 1. 工厂函数 vs 构造函数

优先工厂函数——它们可以返回接口类型、执行异步初始化、更易测试。

```ts
// ✓ Good — 工厂函数，可异步初始化
export interface Logger {
  info(msg: string, ctx?: object): void
  error(msg: string, ctx?: object): void
}

export async function createLogger(options: LoggerOptions): Promise<Logger> {
  const transport = await openTransport(options.destination)
  return { info: transport.write.bind(transport), error: transport.write.bind(transport) }
}

// ✓ Good — 类 + 私有构造 + 静态工厂（需要复杂初始化时）
export class Database {
  private constructor(private readonly pool: Pool) {}

  static async connect(url: string): Promise<Database> {
    const pool = await createPool(url)
    await pool.query('SELECT 1')  // 验证连接
    return new Database(pool)
  }
}

// ✗ Bad — 构造函数中执行 I/O（无法 await，错误难处理）
class Database {
  constructor(url: string) {
    this.pool = createPool(url)  // 无法 await，错误被吞
  }
}
```

## 2. 函数式选项模式

对外暴露的 API 参数超过 3 个时使用 options 对象；对于需要版本演进的 SDK 用函数式选项。

```ts
// ✓ Good — options 对象（大多数场景足够）
interface ServerOptions {
  port?: number
  host?: string
  timeout?: number
  maxConnections?: number
}

function createServer(options: ServerOptions = {}): Server {
  const {
    port = 3000,
    host = '0.0.0.0',
    timeout = 30_000,
    maxConnections = 100,
  } = options
  return new Server({ port, host, timeout, maxConnections })
}

// ✓ Good — 函数式选项（库 API 需要可扩展性时）
type Option = (config: ServerConfig) => void

export function withTimeout(ms: number): Option {
  return (config) => { config.timeout = ms }
}

export function withMaxConnections(n: number): Option {
  return (config) => { config.maxConnections = n }
}

export function createServer(...opts: Option[]): Server {
  const config: ServerConfig = { port: 3000, timeout: 30_000, maxConnections: 100 }
  for (const opt of opts) opt(config)
  return new Server(config)
}
```

## 3. 中间件链

Express/Koa 风格的中间件是责任链模式的函数式实现。

```ts
// ✓ Good — 类型安全的中间件链
type Middleware<Ctx> = (ctx: Ctx, next: () => Promise<void>) => Promise<void>

function compose<Ctx>(middlewares: Middleware<Ctx>[]) {
  return async (ctx: Ctx): Promise<void> => {
    let index = -1
    async function dispatch(i: number): Promise<void> {
      if (i <= index) throw new Error('next() called multiple times')
      index = i
      const fn = middlewares[i]
      if (fn === undefined) return
      await fn(ctx, () => dispatch(i + 1))
    }
    return dispatch(0)
  }
}

// 使用
const handle = compose<RequestContext>([
  logMiddleware,
  authMiddleware,
  rateLimitMiddleware,
  routeHandler,
])
```

## 4. 策略模式

```ts
// ✓ Good — 函数作为策略（FP 风格）
type PricingStrategy = (basePrice: number, quantity: number) => number

const bulkDiscount: PricingStrategy = (price, qty) =>
  qty >= 100 ? price * 0.9 : price

const memberDiscount: PricingStrategy = (price) => price * 0.95

function calculateTotal(
  basePrice: number,
  quantity: number,
  strategy: PricingStrategy,
): number {
  return strategy(basePrice, quantity) * quantity
}
```

## 5. 依赖注入

优先**手动 DI**（构造时注入依赖），保持代码无框架依赖；大型应用可用容器。

```ts
// ✓ Good — 手动 DI，最简单最易测试
interface UserStore {
  findById(id: string): Promise<User | null>
}

class UserService {
  constructor(private readonly store: UserStore) {}

  async getUser(id: string): Promise<User> {
    const user = await this.store.findById(id)
    if (!user) throw new NotFoundError('User', id)
    return user
  }
}

// 测试时注入 mock
const service = new UserService(mockUserStore)

// ✓ Good — tsyringe 容器（大型项目）
import { injectable, inject, container } from 'tsyringe'

@injectable()
class UserService {
  constructor(@inject('UserStore') private store: UserStore) {}
}

const service = container.resolve(UserService)
```

## 6. 断路器与重试

```ts
// ✓ Good — 指数退避重试
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; baseDelayMs: number },
): Promise<T> {
  const { maxAttempts, baseDelayMs } = options
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    }
    catch (err) {
      lastError = err
      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * 2 ** attempt + Math.random() * baseDelayMs
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

// ✓ Good — 简单断路器状态机
type CircuitState = 'closed' | 'open' | 'half-open'

class CircuitBreaker {
  #state: CircuitState = 'closed'
  #failures = 0

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.#state === 'open') throw new Error('circuit open')
    try {
      const result = await fn()
      this.#onSuccess()
      return result
    }
    catch (err) {
      this.#onFailure()
      throw err
    }
  }

  #onSuccess() { this.#failures = 0; this.#state = 'closed' }
  #onFailure() {
    this.#failures++
    if (this.#failures >= 5) this.#state = 'open'
  }
}
```

## 7. 优雅退出

```ts
// ✓ Good — 注册清理钩子，有序关闭
const cleanupTasks: Array<() => Promise<void>> = []

async function shutdown(signal: string): Promise<void> {
  console.log(`received ${signal}, shutting down`)

  // 按注册顺序逆序执行清理
  for (const task of cleanupTasks.reverse()) {
    await task().catch(err => console.error('cleanup error:', err))
  }

  process.exit(0)
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))

// 注册资源清理
const server = createServer()
cleanupTasks.push(() => new Promise(resolve => server.close(resolve)))

const db = await Database.connect(process.env.DATABASE_URL!)
cleanupTasks.push(() => db.disconnect())
```

## 常见反模式

| 反模式 | 替换方案 |
|--------|----------|
| 全局单例（`module.exports = instance`） | 依赖注入 |
| 构造函数中 `async` 操作 | 静态工厂方法 |
| 超过 5 个参数的函数 | options 对象 |
| 空 `catch` 吞噬错误后继续执行 | 明确处理或重抛 |
| 无超时的外部 HTTP 调用 | `AbortSignal.timeout(ms)` |

---

交叉引用：底层类型机制见 `node-types`，异步协调见 `node-async`，错误处理见 `node-error-handling`。
