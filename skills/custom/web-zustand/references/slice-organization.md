# Zustand Slice 组织与 Selector

> 默认路径：`src/stores/{domain}/`。若仓内 `AGENTS.md` 另有约定，以仓为准。

## 顶层文件

| 文件 | 职责 |
|------|------|
| `{domain}.state.ts` | 子状态接口 + `initialXxxState`（无 action） |
| `{domain}.store.ts` | `XxxStoreImpl`，挂载各 slice |
| `slices/{name}.slice.ts` | slice 工厂 + 实现类 |
| `selectors/{name}.selectors.ts` | 该 slice 的纯函数 selector |
| `selectors/index.ts` | 聚合为 `xxxStateSelectors` |
| `index.ts` | 导出 state / store / selectors |

逻辑复杂时，单个 slice 可升为目录（`slices/foo/index.ts` + `core.ts` 等），对外仍只暴露 `createFooSlice`。

## 类型示意（项目内自备）

不必依赖特定 monorepo 包名。`set` 需支持可选的第三参 action 字符串（devtools）：

```ts
type ZustandSetter<T> = {
  (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: false,
    action?: string,
  ): void
  (state: T | ((state: T) => T), replace: true, action?: string): void
}
type ZustandGetter<T> = () => T
// subscribe 与 zustand subscribeWithSelector 签名对齐即可
```

## 可复制：`createZustandNamespace`

将下列实现放入项目工具模块（例如 `src/stores/zustand-namespace.ts`），slice 内 `import` 使用：

```ts
export function createZustandNamespace(namespace: string) {
  return <P = undefined>(type: string, payload?: P) => {
    const name = [namespace, type].filter(Boolean).join('/')
    return (
      payload !== undefined
        ? { payload, type: name }
        : name
    ) as P extends undefined ? string : { payload: P, type: string }
  }
}
```

```ts
const n = createZustandNamespace('admin/layout')
// n('toggleAside') → 'admin/layout/toggleAside'
```

## StoreImpl 骨架

中间件行为（项目自备 `createDevtools` / `expose`）：

- **devtools**：仅开发态；action 名来自 `set` 第三参；展示名建议带稳定前缀（如 `spa_${name}`）
- **expose**：仅开发态把 `use` 挂到调试全局（如 `window.__SPA_STORES`），生产构建剔除

```ts
// admin.store.ts
import type { StateCreator } from 'zustand/vanilla'
import type { AdminState } from './admin.state'
import { subscribeWithSelector } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'
import { createDevtools } from '../middleware/createDevtools'
import { expose } from '../middleware/expose'
import { createLayoutSlice } from './slices/layout.slice'
import { createMenuSlice } from './slices/menu.slice'
import { initialAdminState } from './admin.state'

import type { ZustandGetter, ZustandSetter, ZustandSubscriber } from '../zustand-types'

const createStore: StateCreator<AdminState, [['zustand/devtools', never]]> = () => ({
  ...initialAdminState,
})

const devtools = createDevtools('admin')

class AdminStoreImpl {
  #state = createWithEqualityFn<AdminState>()(
    // @ts-expect-error zustand middleware composition types
    subscribeWithSelector(devtools(createStore)),
    shallow,
  )

  readonly api = () => this.#state
  readonly use = this.#state
  readonly set: ZustandSetter<AdminState> = this.#state.setState
  readonly get: ZustandGetter<AdminState> = this.#state.getState
  readonly subscribe: ZustandSubscriber<AdminState> = this.#state.subscribe

  readonly layout = createLayoutSlice(this)
  readonly menu = createMenuSlice(this)
}

export type AdminStore = typeof adminStore
export const adminStore = new AdminStoreImpl()

expose('admin', adminStore.use)
```

要点：

- `#state` 私有；外部只经 `use` / `get` / `set` / `subscribe`
- React：`adminStore.use(selector)`
- slice 经命名属性挂载，类型由 `typeof adminStore` 推断

## 嵌套 State

**嵌套唯一正统**；每个 slice 一块子对象：

```ts
// admin.state.ts
export interface AdminLayoutState {
  asideCollapsed: boolean
}

export interface AdminMenuState {
  activeId?: string
  items: MenuItem[]
  itemsInit: boolean
  loadingIds: string[]
}

export interface AdminState {
  mounted: boolean
  layout: AdminLayoutState
  menu: AdminMenuState
}

export const initialAdminState: AdminState = {
  mounted: false,
  layout: { asideCollapsed: false },
  menu: {
    activeId: undefined,
    items: [],
    itemsInit: false,
    loadingIds: [],
  },
}
```

## Slice 骨架

```ts
// slices/layout.slice.ts
import type { AdminLayoutState } from '../admin.state'
import type { AdminStore } from '../admin.store'
import { isEqual } from 'es-toolkit/predicate'
import { createZustandNamespace } from '../../zustand-namespace'

const n = createZustandNamespace('admin/layout')

export function createLayoutSlice(store: AdminStore) {
  return new AdminLayoutSliceImpl(store)
}

class AdminLayoutSliceImpl {
  #store: AdminStore

  constructor(store: AdminStore) {
    this.#store = store
  }

  internal_dispatchLayout(partial: Partial<AdminLayoutState>, action?: string) {
    const prev = this.#store.get().layout
    const next = { ...prev, ...partial }
    if (isEqual(prev, next)) return

    this.#store.set({ layout: next }, false, action ?? n('internal_dispatchLayout'))
  }

  toggleAside(): void {
    const { asideCollapsed } = this.#store.get().layout
    this.internal_dispatchLayout(
      { asideCollapsed: !asideCollapsed },
      n('toggleAside'),
    )
  }
}
```

扩展新 slice：写 `*.slice.ts` → 在 `*.state.ts` 加嵌套键与初始值 → StoreImpl 加一行挂载 → 补 selectors。

## Selectors

纯函数，按 slice 分文件，再聚合：

```ts
// selectors/layout.selectors.ts
import type { AdminState } from '../admin.state'

const asideCollapsed = (s: AdminState): boolean => s.layout.asideCollapsed

export const layoutSelectors = {
  asideCollapsed,
}
```

```ts
// selectors/index.ts
import type { AdminState } from '../admin.state'
import { layoutSelectors } from './layout.selectors'
import { menuSelectors } from './menu.selectors'

export const adminStateSelectors = {
  isMounted: (s: AdminState) => s.mounted,
  ...layoutSelectors,
  ...menuSelectors,
}
```

### 订阅要点

- 组件用 `xxxStore.use(selector)`，selector 尽量返回原子值或稳定引用
- 需要多字段时，用聚合 selector + store 默认的 `shallow` equality（家规中间件栈已带）
- 按 id 查找可做成工厂：`getById: (id: string) => (s: XxxState) => ...`
- 禁止无 selector 的整树订阅；派生数据优先 selector，勿为图省事写入 state

## 统一导出

```ts
// index.ts
export * from './selectors'
export * from './admin.state'
export * from './admin.store'
```
