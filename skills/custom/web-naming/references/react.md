# React 命名约定

React 没有官方 style guide；以下与前端非组件模块形成**双轨文件命名**。测试文件名见 [testing.md](./testing.md)；`.types.ts` 见 [files-modules.md](./files-modules.md)。

## 双轨文件命名

| 文件角色 | 文件名 | 导出名 |
|----------|--------|--------|
| React 组件 | `PascalCase.tsx`（默认） | `PascalCase` 同名 |
| React Hook | `use` + `camelCase.ts` | 同名 |
| 非组件逻辑（api/store/formatters） | `kebab-case.ts` | `camelCase` / `PascalCase` |

**默认**组件文件用 `PascalCase.tsx`，与组件标识符对齐。JSX 靠**标识符**首字母区分组件与 HTML 标签（`<UserProfile />` vs `<div />`）；文件名本身不是运行时硬性要求。

```tsx
// ✓ Good：UserProfile.tsx
export function UserProfile() {
  return <div>...</div>
}
```

**仓级覆盖：** 若仓库已统一 kebab-case 组件文件（如 `user-profile.tsx` 导出 `UserProfile`），保持该仓约定。导入时仍须使用 PascalCase 标识符。

## 组件

- 文件名（默认）与组件函数/类名均为 `PascalCase`
- 用组件引用名命名，不用 `displayName` 替代
- 一个文件一个主组件；小组件可共文件，前提是同一概念

```tsx
// PaymentForm.tsx
export function PaymentForm({ onSubmit }: PaymentFormProps) {
  return <form>...</form>
}
```

## Props

- 普通 prop：`camelCase`（`userName`、`phoneNumber`）
- 值为 React 组件的 prop：`PascalCase`（`Component={Sidebar}`）
- 布尔 prop：`is`/`has`/`can` 前缀（`isDisabled`、`hasError`、`canSubmit`）
- Props 类型：`ComponentNameProps`（`PaymentFormProps`）

```tsx
// ✓ Good
<Dialog
  userName="alice"
  isOpen={true}
  onClose={closeDialog}
  HeaderComponent={DialogHeader}
/>

// ✗ Bad
<Dialog UserName="alice" is_open={true} />
```

## 事件 Props 与处理器

- 回调 prop：`on` + 动作，如 `onSave`、`onUserSelect`、`onClose`
- 组件内处理器：优先动作名（`saveUserData`），复杂键盘场景可用 `handleKeydown` 再分发

```tsx
type FormProps = {
  onSave: (data: FormData) => void
}

function OrderForm({ onSave }: FormProps) {
  function submitOrder() {
    onSave(collectData())
  }

  return <button onClick={submitOrder}>Save</button>
}
```

## Hooks

- 文件名与函数名均以 `use` 开头：`useAuth.ts` → `function useAuth()`
- 禁止 `UseAuth.ts` 或 `use-auth.ts`

```ts
// useLocalStorage.ts
export function useLocalStorage<T>(key: string, initial: T) { /* ... */ }
```

## 非组件模块

Service、store、formatter 等不含 JSX 的前端文件用 `kebab-case`：

```
user-api.ts
auth-store.ts
format-date.ts
```

Zustand 的 `*.store.ts` 等后缀由 `web-zustand` 规定；本文件只要求非组件模块走 kebab 轨。

## 目录与 `index.ts`

全项目选一种风格并保持一致：

```
// 方案 A
features/user-profile/UserProfile.tsx

// 方案 B
components/UserProfile/UserProfile.tsx
components/UserProfile/index.ts   // export { UserProfile } from './UserProfile'
```

`index.ts` 仅作 barrel 重导出；主实现文件仍应有具名文件名，避免目录内全是 `index.tsx` 难以导航。
