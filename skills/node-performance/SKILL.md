---
name: node-performance
description: >-
  Node 性能优化——事件循环阻塞、内存与 GC、流式处理、缓存、热路径优化、`--prof`/clinic/0x 分析、避免不必要分配。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node 性能工程师。你从不凭直觉优化——先度量、假设、改一处、再度量；没有 profile 数据就不动热路径。

**模式：**

- **Review 模式（架构）** — 扫描包级反模式：无连接池、无界并发、同步阻塞、全量读入内存。
- **Review 模式（热路径）** — 聚焦单个函数或循环，一次只改一处并对比基准。
- **Optimize 模式** — 已有 profile 证据的瓶颈。遵循「定义指标 → 基线 → 诊断 → 改进 → 对比」循环。

---

# Node.js 性能优化最佳实践

## 核心原则

1. **先 profile 再优化**——`node --prof`、`clinic doctor`、`0x` 或生产 APM 定位真实热点
2. **先排除外部瓶颈**——若 90% 延迟在 DB 或上游 API，减分配无济于事
3. **事件循环阻塞是 Node 第一敌人**——同步 CPU/IO 会拖垮所有并发请求
4. **减少分配往往比微优化 CPU 更有效**——GC 压力在高 QPS 下不可忽视
5. **记录优化理由**——注释说明为何采用某模式，附 before/after 数据

## 1. 事件循环阻塞

```ts
// ✓ Good — 拆批 + setImmediate 让出事件循环
async function hashAll(passwords: string[]): Promise<string[]> {
  const results: string[] = []
  for (let i = 0; i < passwords.length; i++) {
    results.push(await bcrypt.hash(passwords[i], 10))
    if (i % 50 === 0) await new Promise(r => setImmediate(r))
  }
  return results
}

// ✓ Good — CPU 密集 offload 到 worker_threads（见 node-async）

// ✗ Bad — 同步 bcrypt 在请求处理器中
app.post('/register', (req, res) => {
  const hash = bcrypt.hashSync(req.body.password, 10) // 阻塞数十毫秒
  res.json({ hash })
})
```

## 2. 内存与分配

```ts
// ✓ Good — 复用 Buffer，避免热路径重复分配
const scratch = Buffer.allocUnsafe(1024)

// ✓ Good — 大对象用流，不全量读入
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

async function countLines(path: string): Promise<number> {
  let count = 0
  const rl = createInterface({ input: createReadStream(path) })
  for await (const _line of rl) count++
  return count
}

// ✗ Bad — 每次请求 new 大数组/对象池外无必要
function handleRequest() {
  return new Array(10_000).fill(0).map(process) // 热路径大量分配
}
```

## 3. 缓存与去重

```ts
// ✓ Good — 带 TTL 的内存缓存，键有界
const cache = new Map<string, { value: User; expiresAt: number }>()

async function getUser(id: string): Promise<User> {
  const hit = cache.get(id)
  if (hit && hit.expiresAt > Date.now()) return hit.value

  const user = await db.users.findById(id)
  cache.set(id, { value: user, expiresAt: Date.now() + 60_000 })
  return user
}

// ✓ Good — 飞行中请求去重（singleflight 模式）
const inflight = new Map<string, Promise<User>>()

function fetchUserOnce(id: string): Promise<User> {
  const existing = inflight.get(id)
  if (existing) return existing

  const promise = db.users.findById(id).finally(() => inflight.delete(id))
  inflight.set(id, promise)
  return promise
}

// ✗ Bad — 无界 Map 缓存，无驱逐策略
const forever = new Map<string, unknown>()
```

## 4. I/O 与 HTTP 客户端

```ts
import { Agent, request } from 'node:http'

// ✓ Good — 复用 Agent，匹配并发级别
const agent = new Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
})

// ✗ Bad — 每次请求新建连接（fetch 默认 Agent 的 maxSockets 较低）

// ✓ Good — 热路径避免 JSON.parse/stringify 大对象，考虑流式或列投影
```

## 5. 诊断工具

| 场景 | 工具 | 说明 |
|------|------|------|
| 事件循环延迟 | `clinic doctor` | 检测阻塞与 I/O 问题 |
| CPU 火焰图 | `0x`、`node --prof` + 处理 | 定位热函数 |
| 内存泄漏 | `node --inspect` + Heap snapshot | 对比前后快照 |
| 生产采样 | APM / `node-observability` 指标 | P99、GC 时间、堆使用 |

```bash
# 本地快速诊断
npx clinic doctor -- node server.js
npx 0x node server.js
node --prof server.js && node --prof-process isolate-*.log > processed.txt
```

## 常见反模式

| 反模式 | 解决方案 |
|--------|----------|
| 无 profile 就微优化 | 先度量，一次改一处 |
| `JSON.parse` 巨型文件 | 流式 `readline` 或 `stream-json` |
| 热路径 `console.log` | 结构化 logger + 采样 |
| 无界 `Promise.all` | `p-limit`（见 `node-async`） |
| 忽略 `NODE_OPTIONS=--max-old-space-size` 仅当确有证据 | 先查泄漏与缓存无界 |

---

交叉引用：常驻生产信号见 `node-observability`，异步与背压见 `node-async`，防御性编码见 `node-safety`。

