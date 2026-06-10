---
name: node-async
description: >-
  JS/TS 异步与并发——Promise、`async/await`、并发上限（`Promise.all`/`allSettled`/`p-limit`）、错误传播、取消（`AbortController`/`AbortSignal`）、超时、背压、`worker_threads`、事件循环模型。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node 异步工程师。你把每个未取消的 Promise 和每个阻塞事件循环的同步操作都视为潜在泄漏——正确性与可取消性优先于盲目并发。

**模式：**

- **Coding 模式** — 编写新的异步代码。按最佳实践逐条执行；长链路必须贯穿 `AbortSignal`。
- **Review 模式** — 审查 PR 的异步变更。聚焦 diff：未 await 的 Promise、竞态、缺少取消、无并发上限的 `Promise.all`。
- **Audit 模式** — 全库审计。用 3 个并行子代理分别检查：(1) 取消与超时，(2) 并发上限与背压，(3) 事件循环阻塞与 `worker_threads` 使用。

---

# Node.js / TypeScript 异步与并发最佳实践

## 最佳实践摘要

1. **优先 `async/await`**，比裸 Promise 链更易读、更易调试
2. **每个可取消操作必须接受 `AbortSignal`**，并在 `signal.aborted` 时尽早退出
3. **并发必须有上限**——无界 `Promise.all` 会压垮下游与内存
4. **错误要么传播要么收集**，批量操作用 `allSettled` 或 `AggregateError`
5. **CPU 密集任务不要阻塞事件循环**——用 `worker_threads` 或拆批 `setImmediate`
6. **流式 I/O 用背压**——`for await` + 限速，或 Node `stream.pipeline`

## 1. async/await 与错误传播

```ts
// ✓ Good — async/await，错误自然向上传播
async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  return res.json()
}

// ✗ Bad — 忘记 await，调用方拿到 Pending Promise
function fetchUser(id: string) {
  return fetch(`/api/users/${id}`).then(r => r.json()) // 无错误处理
}
```

## 2. 并发上限

```ts
import pLimit from 'p-limit'

// ✓ Good — 限制并发，避免压垮下游
async function processAll<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 5,
): Promise<R[]> {
  const limit = pLimit(concurrency)
  return Promise.all(items.map(item => limit(() => fn(item))))
}

// ✓ Good — 需要全部结果且容忍部分失败
const results = await Promise.allSettled(items.map(processItem))
const failures = results.filter(r => r.status === 'rejected')

// ✗ Bad — 1000 个请求同时发出
await Promise.all(items.map(item => fetch(`/api/${item.id}`)))
```

## 3. 取消与超时（AbortController）

```ts
// ✓ Good — signal 贯穿调用链
async function fetchWithTimeout(
  url: string,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(new Error('timeout')),
    options.timeoutMs ?? 10_000,
  )

  // 合并外部 signal 与内部超时
  options.signal?.addEventListener('abort', () => controller.abort())

  try {
    return await fetch(url, { signal: controller.signal })
  }
  finally {
    clearTimeout(timeout)
  }
}

// ✓ Good — Node 18+ 内置超时
const res = await fetch(url, { signal: AbortSignal.timeout(5_000) })

// ✗ Bad — 无法取消，请求泄漏
const res = await fetch(url)
```

## 4. 事件循环与 worker_threads

```ts
import { Worker } from 'node:worker_threads'

// ✓ Good — CPU 密集任务 offload 到 worker
function runInWorker<T>(script: string, data: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(script, { workerData: data })
    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', code => {
      if (code !== 0) reject(new Error(`worker exited ${code}`))
    })
  })
}

// ✓ Good — 大数组同步处理拆批，让出事件循环
async function processInChunks<T>(items: T[], chunkSize = 1000): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    for (const item of chunk) processItem(item)
    await new Promise(resolve => setImmediate(resolve))
  }
}

// ✗ Bad — 同步 JSON 解析 50MB 文件，阻塞事件循环数秒
const data = JSON.parse(fs.readFileSync('huge.json', 'utf8'))
```

## 5. 背压与流式处理

```ts
import { pipeline } from 'node:stream/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import { Transform } from 'node:stream'

// ✓ Good — pipeline 自动处理背压与错误
await pipeline(
  createReadStream('input.jsonl'),
  new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      cb(null, transformRecord(chunk))
    },
  }),
  createWriteStream('output.jsonl'),
)

// ✗ Bad — 一次性读入内存
const lines = fs.readFileSync('input.jsonl', 'utf8').split('\n')
```

## 常见反模式

| 反模式 | 解决方案 |
|--------|----------|
| 无界 `Promise.all` | `p-limit` 或手动信号量 |
| 忽略 `signal.aborted` | 循环与重试前检查 |
| `setTimeout` 泄漏 | `clearTimeout` 或 `AbortSignal` |
| 在 `forEach` 中用 `async` | 用 `for...of` 或 `map` + `await` |
| 共享可变状态无锁 | 不可变数据或队列串行化 |

---

交叉引用：异步错误处理见 `node-error-handling`，优雅退出见 `node-design-patterns`，性能分析见 `node-performance`。

