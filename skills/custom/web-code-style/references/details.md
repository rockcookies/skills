# 细节与长示例

## 复杂条件：命名布尔 vs 内联

把「业务谓词」抽成名字；把「便宜的短路守卫」留在 `if` 里：

```ts
function canEditPost(user: User, post: Post, flags: FeatureFlags): boolean {
  if (!flags.editingEnabled) {
    return false
  }

  const isAuthor = post.authorId === user.id
  const isModerator = user.roles.includes('moderator')
  const isUnlocked = !post.isLocked || isModerator

  return isAuthor || (isModerator && isUnlocked)
}
```

不要为每一个原子比较都建变量：只有合成后的意图需要名字时才抽。

## 参数过多：options 对象

```ts
// ✗ Bad：位置参数难读、难扩展
function openDialog(
  title: string,
  body: ReactNode,
  isModal: boolean,
  onConfirm: () => void,
  onCancel: () => void,
  confirmLabel: string,
) {}

// ✓ Good
type OpenDialogOptions = {
  title: string
  body: ReactNode
  isModal?: boolean
  confirmLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

function openDialog(options: OpenDialogOptions) {}
```

新增可选字段时改 options 类型，避免继续拉长位置参数列表。调用处同样用具名字段，不要把一组相关值拆成位置参数。

## 默认值再覆盖

互斥覆盖用顺序赋值或 `switch`，避免深层 `else if` 掩盖默认分支：

```ts
type Tone = 'neutral' | 'danger' | 'success'

function resolveTone(isError: boolean, isSuccess: boolean): Tone {
  let tone: Tone = 'neutral'
  switch (true) {
    case isError:
      tone = 'danger'
      break
    case isSuccess:
      tone = 'success'
      break
  }
  return tone
}
```

## 组件只管展示：外提校验与变换

```ts
// order-validator.ts
export function validateOrder(order: Order): string[] {
  const errors: string[] = []
  if (order.items.length === 0) {
    errors.push('empty items')
  }
  return errors
}

export function formatLineTotal(item: LineItem): string {
  return (item.unitPrice * item.quantity).toFixed(2)
}
```

```tsx
// OrderForm.tsx：组件只绑数据与反馈
function OrderForm({ order, onSave }: OrderFormProps) {
  function submitOrder() {
    const errors = validateOrder(order)
    if (errors.length > 0) {
      return
    }
    onSave(order)
  }

  return <button onClick={submitOrder}>Save</button>
}
```

## `readonly` props 与派生

```ts
type UserProfileProps = {
  readonly userId: string
  readonly isEditable: boolean
  readonly onSave: () => void
}

function UserProfile({ userId, isEditable, onSave }: UserProfileProps) {
  const displayId: string = userId
  return (
    <section>
      <p>{displayId}</p>
      {isEditable ? <button onClick={onSave}>Save</button> : null}
    </section>
  )
}
```

不要把传入的 props 对象当可变草稿（`props.userId = next`）。要改的是本地 state 或回传的事件载荷。

## JSX 上提的边界示例

仍可留在 JSX 中的：单次可选链、简单三元、一个 `&&` 守卫。

应上提的：多步数组变换、嵌套三元、在 map 回调里再写业务分支。

```tsx
// 可留在 JSX
{isReady && <Spinner />}
{label ?? 'Untitled'}

// 应上提
const rows = items
  .filter((item) => item.isVisible)
  .map((item) => ({ ...item, label: formatLabel(item) }))

return <List rows={rows} />
```
