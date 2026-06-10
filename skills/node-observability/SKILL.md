---
name: node-observability
description: >-
  Node 生产可观测性——结构化日志（pino/winston）、指标（prom-client）、OpenTelemetry 追踪、健康检查、告警、关联 ID。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node 可观测性工程师。未 instrument 的生产系统在你眼中是负债——主动埋点、关联信号、功能未完成前不算交付。

**模式：**

- **Coding 模式** — 为新功能添加日志、指标、追踪。每个 HTTP 端点至少有时延与错误率指标。
- **Review 模式** — 审查 PR 的 instrumentation 变更。检查结构化字段一致性、标签基数、span 是否正确关闭。
- **Audit 模式** — 全库可观测性审计。用 3 个并行子代理分别检查：(1) 日志与关联 ID，(2) Prometheus 指标与基数，(3) OpenTelemetry 追踪覆盖。

---

# Node.js 生产可观测性最佳实践

## 最佳实践摘要

1. **结构化日志**——生产环境输出 JSON，不用自由格式字符串拼接
2. **选对日志级别**——Debug 开发、Info 正常、Warn 降级、Error 需关注
3. **关联 ID 贯穿日志与追踪**——`requestId` / `traceId` 注入每条记录
4. **Prometheus 用 Histogram 测延迟**，不用高基数标签（用户 ID、完整 URL）
5. **每个有意义操作加 span**——服务方法、DB 查询、外部 API
6. **功能完成定义：可观测**——指标已声明、日志有结构、追踪可串联

## 1. 结构化日志（pino）

```ts
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // 生产 JSON；开发可用 pino-pretty
})

// ✓ Good — 结构化字段 + 关联 ID
function logRequest(req: Request, requestId: string) {
  logger.info({
    requestId,
    method: req.method,
    path: req.url,
    userId: req.user?.id,
  }, 'request received')
}

// ✓ Good — 错误只记录一次（遵循 node-error-handling 单一处理规则）
logger.error({ err, orderId }, 'order creation failed')

// ✗ Bad — 字符串拼接，无法检索
console.log(`User ${userId} did ${action} at ${new Date()}`)
```

## 2. Prometheus 指标（prom-client）

```ts
import { Counter, Histogram, register } from 'prom-client'

// ✓ Good — 在指标声明上方写 PromQL 注释，便于发现
// rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
})

const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route'] as const,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
})

// ✓ Good — 有界标签：路由模式，非原始 path
httpRequests.inc({ method: 'GET', route: '/users/:id', status: '200' })

// ✗ Bad — 用户 ID 作为标签，基数爆炸
httpRequests.inc({ method: 'GET', route: req.url, status: '200', userId })
```

## 3. OpenTelemetry 追踪

```ts
import { trace, SpanStatusCode } from '@opentelemetry/api'

const tracer = trace.getTracer('my-service')

// ✓ Good — 关键操作包裹 span，错误记入 span
async function createOrder(order: Order): Promise<void> {
  return tracer.startActiveSpan('createOrder', async (span) => {
    span.setAttribute('order.id', order.id)
    try {
      await db.orders.insert(order)
      span.setStatus({ code: SpanStatusCode.OK })
    }
    catch (err) {
      span.recordException(err as Error)
      span.setStatus({ code: SpanStatusCode.ERROR })
      throw err
    }
    finally {
      span.end()
    }
  })
}

// ✓ Good — HTTP 中间件自动传播 trace context（@opentelemetry/instrumentation-http）
```

## 4. 关联 ID 与健康检查

```ts
import { randomUUID } from 'node:crypto'

// ✓ Good — 中间件注入 requestId，写入 AsyncLocalStorage
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] ?? randomUUID()
  res.setHeader('x-request-id', requestId)
  asyncLocalStorage.run({ requestId }, next)
})

// ✓ Good — 健康检查区分 liveness 与 readiness
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }))
app.get('/health/ready', async (_req, res) => {
  const dbOk = await db.ping()
  res.status(dbOk ? 200 : 503).json({ status: dbOk ? 'ok' : 'degraded', db: dbOk })
})
```

## 5. 日志 + 追踪关联

```ts
// ✓ Good — 从 active span 提取 traceId 写入日志
import { trace } from '@opentelemetry/api'

function enrichLog(fields: object) {
  const span = trace.getActiveSpan()
  const spanCtx = span?.spanContext()
  return {
    ...fields,
    traceId: spanCtx?.traceId,
    spanId: spanCtx?.spanId,
  }
}

logger.info(enrichLog({ orderId }), 'order created')
```

## 完成定义检查清单

- [ ] 操作与错误有 Counter，延迟有 Histogram
- [ ] 日志为结构化 JSON，含 `requestId` / `traceId`
- [ ] 服务方法、DB、外部调用有 span，`recordException` 记录错误
- [ ] 告警规则覆盖错误率、P99 延迟、依赖健康
- [ ] 日志中无 PII（见 `node-security`）

## 常见反模式

| 反模式 | 解决方案 |
|--------|----------|
| log-and-throw 重复记录 | 单一处理规则（`node-error-handling`） |
| 高基数 Prometheus 标签 | 路由模式、状态码等有限集合 |
| span 未 `end()` | `try/finally` 或 `startActiveSpan` 自动管理 |
| `console.log` 上生产 | pino / winston JSON |
| 无 readiness 探针 | 检查 DB、队列、缓存连通性 |

---

交叉引用：错误单一处理见 `node-error-handling`，性能瓶颈优化见 `node-performance`，安全日志见 `node-security`。

