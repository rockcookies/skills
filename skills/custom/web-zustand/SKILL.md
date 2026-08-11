---
name: web-zustand
description: >-
  Web/React Zustand 家规：StoreImpl 单例、嵌套 slice、三层 action（public /
  internal_* / internal_dispatch*）、isEqual 守卫、devtools namespace、selector
  聚合与乐观更新。Use when writing or reviewing Zustand stores, slices,
  public/internal/dispatch actions, nested state, selectors, or optimistic
  updates in React/TS apps. Not for identifier/file naming (→ web-naming).
  Not for UI clarity or JSX structure (→ web-code-style). Not for Vitest store
  tests, SWR/fetch pipelines, or List-Detail data-shape design.
when_to_use: >-
  zustand, store, slice, StoreImpl, internal_dispatch, internal_*, 乐观更新,
  selector, isEqual, createZustandNamespace, nested state, 状态管理, setState,
  optimistic update, store review
user-invocable: true
metadata:
  author: rockcookies
  version: 1.0.0
---

**Persona:** 你是 Web/React 客户端状态工程师。默认产出可维护的 StoreImpl + 嵌套 slice，而不是散落的 `create()` 钩子。

**范围：** 浏览器端 Zustand store 的结构、action 分层、嵌套状态与 selector。通用标识符/文件命名见 `web-naming`；UI 清晰度见 `web-code-style`。

**模式：**

- **Coding 模式**：新建或扩展 store 时按下列家规写 StoreImpl、slice、selector。
- **Review 模式**：在 diff 中找平铺状态、UI 直调 `internal_*`、无 `isEqual` 的 dispatch、组件内随意 `set`、整 store 订阅。
- **Audit 模式**：大库审查时用子代理并行覆盖：(1) store/slice 文件布局，(2) action 三层与乐观更新，(3) selector 与订阅，再合并结论。

---

# Web / React Zustand

> 拿不准时，优先保持**仓内**已有 store 一致。仓内 `AGENTS.md`（或等价说明）与本 skill 冲突时，**以仓为准**。

默认目录（无仓内约定时使用）：

```plaintext
src/stores/{domain}/
  {domain}.state.ts
  {domain}.store.ts
  index.ts
  slices/{slice}.slice.ts
  selectors/{slice}.selectors.ts
  selectors/index.ts
```

中间件辅助（命名 devtools、开发态 `expose`）由项目自备；本 skill 只规定行为，不提供可复制脚手架。

## Action 三层体系

### 1. 公开 Action

UI 调用的主接口：

- 命名：动词（`createItem`、`deleteTab`、`toggleAside`）
- 职责：参数校验、流程编排、调用 `internal_*`

### 2. 内部 Action（`internal_*`）

核心业务：

- 命名：`internal_` 前缀
- 职责：乐观更新、服务调用、错误处理
- UI **不得**直接调用

### 3. 状态分发（`internal_dispatch*`）

嵌套子状态的统一写入入口：

- 命名：`internal_dispatch` + 子状态名（`internal_dispatchLayout`）
- 职责：`isEqual` 守卫、`set`、附带 devtools action 名

```ts
internal_dispatchLayout(partial: Partial<LayoutState>, action?: string) {
  const prev = this.#store.get().layout
  const next = { ...prev, ...partial }
  if (isEqual(prev, next)) return

  this.#store.set({ layout: next }, false, action ?? n('internal_dispatchLayout'))
}
```

## dispatch 守卫 vs 直接 `set`

**用 `internal_dispatch*`（含 `isEqual`）：**

- 嵌套子状态（`menu`、`layout`、`auth`）
- 乐观更新
- 复杂状态转换

**可直接 `this.#store.set`：**

- 挂载/卸载标志（`mounted: true`）
- 一次性初始化多个字段
- `mount` / 生命周期场景

## 乐观更新（摘要）

创建/更新：先 `internal_dispatch*` 写入 → 调服务 → `refresh` 对齐；失败时回滚临时项。

**删除：不做乐观更新**（破坏性、回滚贵）。用 `loadingIds` 标进行中项，成功后再刷新。

细节与跨 store 模式 → [action-patterns.md](./references/action-patterns.md)。

## 状态命名（嵌套唯一正统）

每个 slice 对应**一个嵌套对象**，不把领域字段平铺在根上：

- 子状态键：`menu`、`layout`、`auth`
- loading：`loadingIds: string[]`（或 `xxxLoadingIds`）
- 初始化：`xxxInit: boolean`
- 活跃项：`activeXxxId`

Action 名：公开动词 / `internal_*` / `internal_dispatch*`。

## StoreImpl 要点

- 单例：`XxxStoreImpl` → `export const xxxStore = new XxxStoreImpl()`
- `#state` 私有；公开 `use` / `get` / `set` / `subscribe`（及可选 `api`）
- 中间件栈（家规默认）：`createWithEqualityFn` + `shallow` + `subscribeWithSelector` + 命名 devtools
- slice 以**命名属性**挂载：`readonly layout = createLayoutSlice(this)`
- UI 读：`xxxStore.use(selector)`；改：`xxxStore.layout.toggleAside()`，组件内不直接 `set`

完整骨架、可复制 `createZustandNamespace`、selector 聚合 → [slice-organization.md](./references/slice-organization.md)。

## 反模式

| 反模式 | 改为 |
|--------|------|
| 根上平铺领域字段 / 以 flat `*Map` 为正统 | 嵌套子状态对象 |
| UI 调用 `internal_*` 或组件内 `set` | 公开 action / slice 方法 |
| `internal_dispatch*` 无 `isEqual` | 先比再 `set` |
| `xxxStore.use()` 无 selector（整树订阅） | 细粒度 selector 或聚合 selectors |
| 删除走乐观更新 | loading → 服务 → refresh |
| 跨 store 直调对方 `internal_*` | 只调对方公开 action / slice 方法 |

## 详细参考

- Action 模式：[references/action-patterns.md](./references/action-patterns.md)
- Slice 与 selector：[references/slice-organization.md](./references/slice-organization.md)
