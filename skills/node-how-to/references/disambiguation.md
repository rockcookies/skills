# 竞争簇——深度消歧

几个技能边界重叠的簇。每个簇包含边界表、具体路由示例，以及尚未在各技能描述中写明的缝隙情形说明。

---

## 1. 性能簇

三个技能围绕"性能"协作。`node-observability` 是常驻对照，其余两个按需启用。

| 技能 | 专属领地 | 不负责 |
| --- | --- | --- |
| `node-performance` | 优化模式——"事件循环被阻塞 → 拆分/`setImmediate`/worker"、"内存增长 → 流式处理、避免缓冲整文件" | 常驻监控、根因排查 |
| `node-observability` | 常驻生产信号：结构化日志、prom-client 指标、OTel 追踪、告警 | 临时调查、一次性 profile |
| `node-safety` | 调试崩溃/泄漏的根因：复现、二分、类型守卫、防御式断言 | 优化模式、profile 解读 |

**路由示例：**

- "生产里某个 HTTP handler 很慢" → 先 `node-observability`（看指标/追踪），再 `node-performance`（capture profile + 优化）。
- "进程跑十分钟后内存爆了" → `node-safety`（定位泄漏来源）+ `node-performance`（GC/内存布局）。
- "我要减少热路径上的分配" → `node-performance`。

---

## 2. 错误处理簇

| 技能 | 专属领地 |
| --- | --- |
| `node-error-handling` | 惯用错误流：`Error` 子类、`cause` 链、`errors.Is/As` 等价的类型守卫判别、哨兵错误、单一处理规则、Promise rejection |
| `node-safety` | 让错误根本不发生：null/undefined 检查、可选链、零值/默认值设计、整数精度守卫、引用别名 |

**路由示例：**

- "我该如何包装错误，让调用方能匹配它？" → `node-error-handling`（`cause` 链 + 类型守卫）。
- "我的服务因读取 undefined 的属性而崩溃" → `node-safety`（防御式编码）。
- "异步函数里抛出的错误没被捕获" → `node-error-handling`（unhandledRejection、`try/await/catch`）。

---

## 3. 风格 / 命名 / 文档簇

三个技能各占"代码质量"的一块。

| 技能 | 专属领地 |
| --- | --- |
| `node-code-style` | 行格式、空行、import 排序、Prettier/oxfmt 配置、注释位置 |
| `node-naming` | 所有标识符命名：camelCase/PascalCase、布尔前缀、无 `IFoo` 前缀、文件命名、无 `utils` 反模式；React 组件 `PascalCase.tsx`、Hook `use*`、props `on*`/`is*` → `node-naming` `references/react.md` |
| `node-documentation` | 导出符号的 TSDoc、模块级文档、README 章节、TypeDoc、`llms.txt` |

**路由示例：**

- "我该如何命名工厂函数？" → `node-naming`。
- "React 组件文件该用 PascalCase 还是 kebab-case？" → `node-naming`（`references/react.md`）。
- "import 应该怎么排序？" → `node-code-style`。
- "我该如何为导出的函数写 TSDoc 注释？" → `node-documentation`。

---

## 4. 测试簇

| 技能 | 专属领地 |
| --- | --- |
| `node-testing` | 测试策略、`describe`/`it`、mock/spy、fixture、覆盖率、异步与计时器测试、集成测试（Vitest） |
| `vue-testing-best-practices` | Vue 组件测试：`@vue/test-utils`、组合式 API 测试、组件挂载 |
| `playwright-cli` | 浏览器端到端测试、跨浏览器自动化 |

**路由示例：**

- "如何在 Vitest 里写表驱动测试？" → `node-testing`（`it.each`）。
- "如何断言 mock 被以特定参数调用？" → `node-testing`（`vi.fn`/`expect().toHaveBeenCalledWith`）。
- "如何测试一个 Vue 组件的渲染？" → `vue-testing-best-practices`。

---

## 5. design-patterns vs types

两者都涉及"如何设计 JS/TS 类型"。分界：类型级设计 vs. 类型的架构级使用。

| 技能 | 专属领地 | 不负责 |
| --- | --- | --- |
| `node-types` | 组合优于继承、泛型、可辨识联合、`unknown`/`never`、类型守卫、`interface` vs `type` | 类型如何组合成架构模式 |
| `node-design-patterns` | 函数式选项、中间件链、断路器、优雅退出、依赖注入接线 | 底层类型机制 |

**重叠区：** "用接口做 DI"——定义小接口属于 `node-types`；把多个组件通过这些接口接线属于 `node-design-patterns`。

**路由示例：**

- "我该用 `interface` 还是 `type`？" → `node-types`。
- "如何为 HTTP handler 实现中间件链？" → `node-design-patterns`。
- "如何实现函数式选项模式？" → `node-design-patterns`。

---

## 6. 异步内部：并发 vs 取消

不同于 Go 把 goroutine 与 context 拆成两个技能，Node 的 `node-async` 同时覆盖两面。

| 关注点 | 在 `node-async` 中的归属 |
| --- | --- |
| 并发协调 | `Promise.all`/`allSettled`、并发上限（`p-limit`）、背压、`worker_threads` |
| 取消与超时 | `AbortController`/`AbortSignal`、`signal` 传播、`AbortSignal.timeout` |

**路由示例：**

- "如何从外部取消一个正在进行的请求？" → `node-async`（`AbortController`）。
- "如何并发跑 N 个任务并限制并发数？" → `node-async`（`p-limit`/分批）。
- "异步里的错误怎么处理？" → 同时加载 `node-async` + `node-error-handling`。

---

## 7. safety vs security

两者都防 bug，但威胁模型不同。

| 技能 | 专属领地 | 不负责 |
| --- | --- | --- |
| `node-safety` | null/undefined 崩溃、整数精度、引用别名、浮点相等、零值设计 | 外部攻击者、加密、密钥 |
| `node-security` | SQL/命令/XSS 注入、原型污染、弱随机（`Math.random`）、硬编码密钥、ReDoS、SSRF、路径穿越 | 内部运行时正确性 |

**路由示例：**

- "我的服务因 undefined 属性访问而崩溃" → `node-safety`。
- "这条 SQL 查询能防注入吗？" → `node-security`。
- "我用 `Math.random()` 生成 token" → `node-security`（可预测；改用 `crypto.randomUUID`/`randomBytes`）。
- "append/push 后数组意外变长" → `node-safety`（共享引用别名）。
