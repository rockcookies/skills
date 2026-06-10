---
name: node-testing
description: >-
  生产级 JS/TS 测试（Vitest）——`describe`/`it` 结构、mock 与 spy、fixture、快照、覆盖率、异步与计时器测试、并行、集成测试。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node/TypeScript 测试工程师。你把测试当作可执行的行为规格——测试约束对外行为，而非实现细节或覆盖率数字。

**模式：**

- **Coding 模式** — 为新代码编写测试。先列行为清单，再写 `describe`/`it`；每个用例独立可运行。
- **Review 模式** — 审查 PR 测试变更。聚焦 diff：断言质量、mock 过度、顺序依赖、缺失边界用例。
- **Audit 模式** — 全库测试审计。用 3 个并行子代理分别检查：(1) 单元测试质量与覆盖率缺口，(2) 异步/计时器脆弱性，(3) 集成测试隔离。

---

# Node.js / TypeScript 测试最佳实践（Vitest）

## 最佳实践摘要

1. **测试可观察行为**，不测私有实现或内部调用顺序
2. **每个用例独立**——不依赖执行顺序，不共享可变全局状态
3. **表驱动测试**用 `it.each` 或参数化数组，每个 case 有描述名
4. **Mock 接口而非具体类**——注入依赖，测试时替换
5. **异步测试必须 `await` 或返回 Promise**——否则 Vitest 不会等待
6. **计时器用 `vi.useFakeTimers()`**，测试结束 `vi.useRealTimers()`
7. **集成测试与单元测试分离**——用文件名或 `describe` 标签区分

## 1. 结构与命名

测试文件命名与位置见 `node-naming`。

```ts
import { describe, it, expect } from 'vitest'
import { calculateDiscount } from './pricing'

// ✓ Good — 描述行为，表驱动
describe('calculateDiscount', () => {
  it.each([
    { qty: 1, expected: 0 },
    { qty: 100, expected: 0.1 },
    { qty: 500, expected: 0.2 },
  ])('returns $expected for quantity $qty', ({ qty, expected }) => {
    expect(calculateDiscount(qty)).toBe(expected)
  })

  it('throws for negative quantity', () => {
    expect(() => calculateDiscount(-1)).toThrow(RangeError)
  })
})

// ✗ Bad — 测试实现细节
it('calls internal _compute', () => {
  const spy = vi.spyOn(service as any, '_compute')
  service.getPrice(10)
  expect(spy).toHaveBeenCalled()
})
```

## 2. Mock 与 Spy

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

interface UserStore {
  findById(id: string): Promise<User | null>
}

// ✓ Good — mock 接口，验证交互与返回值
describe('UserService', () => {
  const store: UserStore = {
    findById: vi.fn(),
  }

  beforeEach(() => vi.clearAllMocks())

  it('returns user when found', async () => {
    vi.mocked(store.findById).mockResolvedValue({ id: '1', name: 'Alice' })
    const service = new UserService(store)
    await expect(service.getUser('1')).resolves.toMatchObject({ name: 'Alice' })
    expect(store.findById).toHaveBeenCalledWith('1')
  })
})

// ✗ Bad — mock 整个模块导致测试与实现强耦合
vi.mock('./db', () => ({ query: vi.fn().mockReturnValue([1, 2, 3]) }))
```

## 3. 异步与计时器

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'

describe('retryWithBackoff', () => {
  afterEach(() => vi.useRealTimers())

  it('retries until success', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok')

    const promise = retryWithBackoff(fn, { maxAttempts: 3, baseDelayMs: 100 })
    await vi.advanceTimersByTimeAsync(100)
    await expect(promise).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})

// ✓ Good — 异步测试返回 Promise 或 await
it('fetches user', async () => {
  const user = await fetchUser('1')
  expect(user.id).toBe('1')
})

// ✗ Bad — 忘记 await，测试虚假通过
it('fetches user', () => {
  fetchUser('1').then(user => expect(user.id).toBe('1'))
})
```

## 4. Fixture 与快照

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// ✓ Good — fixture 文件存放稳定输入
const fixture = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/order.json'), 'utf8'),
)

it('renders order summary', () => {
  expect(renderSummary(fixture)).toMatchSnapshot()
})

// ✗ Bad — 巨型内联对象，难以维护
it('renders order', () => {
  expect(renderSummary({ id: '...', items: [/* 200 lines */] })).toBe('...')
})
```

## 5. 集成测试

```ts
// user.integration.test.ts — 文件名或 vitest.config 的 include 模式区分
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestServer } from './test-helpers'

describe('POST /users', () => {
  let server: TestServer

  beforeAll(async () => { server = await createTestServer() })
  afterAll(async () => { await server.close() })

  it('creates user and returns 201', async () => {
    const res = await server.post('/users', { name: 'Bob' })
    expect(res.status).toBe(201)
  })
})
```

## 常见反模式

| 反模式 | 解决方案 |
|--------|----------|
| 测试间共享可变状态 | `beforeEach` 重置或独立 fixture |
| 过度 mock 导致测试无意义 | 只 mock 边界（DB、HTTP、时钟） |
| 硬编码 `setTimeout` 等待 | `vi.waitFor` 或 fake timers |
| 快照从不审查就批量更新 | 审查每次 snapshot 变更 |
| 无错误路径测试 | 每个抛错分支至少一个用例 |

---

交叉引用：测试文件命名与位置见 `node-naming`；异步测试模式见 `node-async`，错误断言见 `node-error-handling`；Vue 组件测试见 `vue-testing-best-practices`，端到端见 `playwright-cli`。

