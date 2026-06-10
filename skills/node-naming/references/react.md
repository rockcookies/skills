# React 命名约定

React 没有官方 style guide；以下提炼自 [Airbnb React Style Guide](https://github.com/airbnb/javascript/blob/master/react/README.md) 与 [React 文档](https://react.dev/learn/importing-and-exporting-components)，并与 Node 通用规则形成**双轨文件命名**。

## 双轨文件命名

| 文件角色 | 文件名 | 导出名 |
|----------|--------|--------|
| React 组件 | `PascalCase.tsx` | `PascalCase` 同名 |
| React Hook | `use` + `camelCase.ts` | 同名 |
| 非组件逻辑（service/util） | `camelCase.ts` | `camelCase` |
| Node/后端模块 | `kebab-case.ts` | `camelCase` / `PascalCase` |

**关键**：不要用 `kebab-case` 命名组件文件（`user-profile.tsx`）。JSX 靠首字母大小写区分组件与 HTML 标签；小写文件名会诱导小写导入，导致 React 把它当原生元素。

```tsx
// ✓ Good — UserProfile.tsx
export function UserProfile() {
  return <div>...</div>
}

// ✗ Bad — user-profile.tsx，导入时易写成 <user-profile />
```

## 组件

- 文件名与组件函数/类名均为 `PascalCase`
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

- 回调 prop：`on` + 动作 — `onSave`、`onUserSelect`、`onClose`
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

Service、util、store 等不含 JSX 的文件用 `camelCase`：

```
userService.ts
authStore.ts
formatDate.ts
apiClient.ts
```

## 类型文件

```
user.types.ts
api.types.ts
```

Props 类型：`ComponentNameProps`（`PaymentFormProps`）。

## 测试文件

与组件同目录、同基名：

```
UserProfile.tsx
UserProfile.test.tsx
useAuth.test.ts
```

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

## 与 ESLint 对齐

Airbnb 配置中的 `react/jsx-pascal-case`、`react/boolean-prop-naming` 可自动校验组件名与布尔 prop。项目级规则见 `node-dev`。
