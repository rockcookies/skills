# Zustand Action 模式

## 乐观更新

### 更新

```ts
async internal_updateContent(id: string, content: string): Promise<void> {
  const { items } = this.#store.get().foo
  this.internal_dispatchFoo(
    {
      items: items.map(i => (i.id === id ? { ...i, content } : i)),
    },
    n('internal_updateContent/optimistic'),
  )

  await itemService.update(id, { content })
  await this.refresh()
}
```

### 创建（失败回滚）

```ts
async internal_createItem(params: CreateParams): Promise<string> {
  const tempId = Date.now().toString()

  this.internal_dispatchFoo(
    {
      items: [...this.#store.get().foo.items, { ...params, id: tempId }],
    },
    n('internal_createItem/optimistic'),
  )

  try {
    const id = await itemService.create(params)
    await this.refresh()
    return id
  }
  catch (error) {
    this.internal_dispatchFoo(
      {
        items: this.#store.get().foo.items.filter(i => i.id !== tempId),
      },
      n('internal_createItem/rollback'),
    )
    throw error
  }
}
```

### 删除（不乐观）

```ts
async deleteItem(id: string): Promise<void> {
  this.internal_setLoading(id, true)
  try {
    await itemService.delete(id)
    await this.refresh()
  }
  finally {
    this.internal_setLoading(id, false)
  }
}
```

## dispatch 守卫

每个 `internal_dispatch*` 必须带 `isEqual`，避免无效重渲染：

```ts
import { isEqual } from 'es-toolkit/predicate'
import { createZustandNamespace } from '../zustand-namespace' // 项目内工具路径

const n = createZustandNamespace('xxx/foo')

internal_dispatchFoo(partial: Partial<XxxFooState>, action?: string): void {
  const prev = this.#store.get().foo
  const next = { ...prev, ...partial }
  if (isEqual(prev, next)) return

  this.#store.set({ foo: next }, false, action ?? n('internal_dispatchFoo'))
}
```

devtools 第三个参数始终走 `n('动作名')`，乐观步骤用 `/optimistic`，回滚用 `/rollback`。

## Loading：`loadingIds`

用 `string[]` 管并发项，避免单个 boolean 互相覆盖：

```ts
internal_setLoading(id: string, loading: boolean): void {
  const { loadingIds } = this.#store.get().foo
  const next = loading
    ? (loadingIds.includes(id) ? loadingIds : [...loadingIds, id])
    : loadingIds.filter(i => i !== id)

  this.internal_dispatchFoo({ loadingIds: next }, n('internal_setLoading'))
}
```

## 跨 Store

直接导入另一 store 单例；读用 `get`，改用对方公开 slice 方法；需要时用 `subscribe(selector, listener)`：

```ts
import { globalStore } from '../global'

getCurrentPath(): string {
  return globalStore.get().history.current?.pathname ?? '/'
}

subscribeToHistory(): () => void {
  return globalStore.subscribe(
    s => s.history.current,
    (location) => {
      this.internal_dispatchBar(
        { currentPath: location?.pathname },
        n('subscribeToHistory'),
      )
    },
  )
}
```

跨 store 耦合要克制：能经公开 action 完成的，不要深入对方 `internal_*`。

## 生命周期（mount / unmount）

一次性初始化多个字段时，可直接 `set`（可 `replace: true`），不必强行走单字段 dispatch：

```ts
mount(params: MountParams): () => void {
  this.#store.set(
    {
      mounted: true,
      foo: { ...initialXxxState.foo, items: params.initialItems },
      bar: { ...initialXxxState.bar },
    },
    true,
    n('mount'),
  )

  const unsubscribe = globalStore.subscribe(
    s => s.history.current,
    location => this.#store.bar.onLocationChange(location),
  )

  return () => {
    unsubscribe()
    this.#store.set({ mounted: false }, false, n('unmount'))
  }
}
```
