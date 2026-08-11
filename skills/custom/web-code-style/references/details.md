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

新增可选字段时改 options 类型，避免继续拉长位置参数列表。

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
