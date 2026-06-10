# Node.js / TypeScript 技能——按分类的完整目录

13 个技能（编排器 `node-how-to` + 12 个领域技能），外加仓库已有的 JS/TS 生态技能。标注 ⭐️ 的技能推荐用于所有 Node/TS 项目。

---

## 代码质量

### `node-code-style` ⭐️

JS/TS 代码格式与风格一致性——格式化工具（Prettier / oxfmt / dprint）、行宽、import 排序、空行、声明位置、注释取舍。

Use when：用户询问格式规则、风格审查或项目编码规范。不负责命名约定（→ `node-naming`）或文档注释（→ `node-documentation`）。

---

### `node-documentation` ⭐️

JS/TS 文档标准——TSDoc / JSDoc 注释、导出符号文档、README 结构、CHANGELOG、API 参考生成（TypeDoc）、`llms.txt`。

Use when：编写或审查文档注释、README、API 参考。不负责解释逻辑的行内注释（→ `node-code-style`）。

---

### `node-error-handling` ⭐️

惯用 JS/TS 错误处理——`Error` 子类化、`cause` 链、`try/catch/finally`、Promise rejection、`AggregateError`、哨兵错误、类型守卫判别错误、结构化日志、单一处理规则。

Use when：编写或审查错误的创建、传播、包装、日志或恢复。预防错误发生（null/undefined）→ `node-safety`。

---

### `node-naming` ⭐️

JS/TS 命名约定——变量、函数、类、接口、类型、常量、文件名。涵盖 camelCase/PascalCase/SCREAMING_SNAKE、布尔前缀、避免匈牙利命名与 `IFoo` 前缀、`utils`/`helpers` 反模式。

Use when：为新的类型、函数、模块或常量命名。不负责更宽泛的格式（→ `node-code-style`）。

---

### `node-safety` ⭐️

防御式 JS/TS 编码——预防运行时崩溃与静默数据错误。null/undefined 安全、可选链与空值合并、类型守卫、`structuredClone` 与引用别名、浮点比较、整数精度（`Number`/`BigInt`）、零值/默认值设计。

Use when：编写或审查可能静默产出错误结果或抛异常的代码。外部威胁 → `node-security`；错误处理惯例 → `node-error-handling`。

---

### `node-security` ⭐️

JS/TS 安全最佳实践——注入防护（SQL、命令、XSS）、原型污染、弱随机（`Math.random` vs `crypto`）、密钥管理、依赖审计（`npm audit`/`osv`）、ReDoS、路径穿越、SSRF、安全 Cookie。审计与审查模式。

Use when：审计漏洞、编写安全敏感代码、审查认证/加密/密钥处理。运行时正确性 bug → `node-safety`。

---

### `node-types` ⭐️

TypeScript 类型与接口设计——`interface` vs `type`、组合优于继承、泛型、条件类型、映射类型、可辨识联合、`unknown`/`never`、类型守卫与断言、`as const`、严格模式。

Use when：设计类型、接口、泛型，或处理类型层次。把类型组合成架构模式 → `node-design-patterns`。

---

## 架构与设计

### `node-async` ⭐️

JS/TS 异步与并发——Promise、`async/await`、并发上限（`Promise.all`/`allSettled`/`p-limit`）、错误传播、取消（`AbortController`/`AbortSignal`）、超时、背压、`worker_threads`、事件循环模型。

Use when：编写异步代码、协调并发、实现取消与超时，或审查竞态。异步中的错误处理 → `node-error-handling`。

---

### `node-design-patterns` ⭐️

惯用 JS/TS 设计模式——工厂与构造、Builder、函数式选项、中间件链、策略、依赖注入（手动 DI / 容器 / InversifyJS / tsyringe）、断路器、重试、优雅退出。

Use when：选择架构模式、设计 API、实现弹性模式或接线多个组件。底层类型机制（泛型、接口）→ `node-types`。

---

## QA 与性能

### `node-observability` ⭐️

Node 生产可观测性——结构化日志（pino/winston）、指标（prom-client）、OpenTelemetry 追踪、健康检查、告警、关联 ID。

Use when：为服务接入生产监控。临时深入排查 → `node-performance`、`node-safety`。

---

### `node-performance`

Node 性能优化——事件循环阻塞、内存与 GC、流式处理、缓存、热路径优化、`--prof`/clinic/0x 分析、避免不必要分配。

Use when：分析后应用优化模式。生产常驻信号 → `node-observability`；崩溃排查 → `node-safety`。

---

### `node-testing` ⭐️

生产级 JS/TS 测试（Vitest）——`describe`/`it` 结构、mock 与 spy、fixture、快照、覆盖率、异步与计时器测试、并行、集成测试。

Use when：编写或审查测试。Vue 组件测试 → `vue-testing-best-practices`；端到端 → `playwright-cli`。

---

## 工程搭建

工程搭建、工具链（@antfu/ni）、pnpm/monorepo、tsconfig、库发布由仓库已有的 `node-dev` 承接，本技能集不重复。
