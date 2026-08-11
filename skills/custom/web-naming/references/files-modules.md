# 文件、目录与模块命名

## 默认：kebab-case 文件名

非组件前端模块的文件名用连字符分词，文件名应反映文件内主要导出的标识符。

```ts
// user-api.ts
export async function fetchUser(id: string) {}

// format-date.ts
export function formatDate(value: Date): string {}
```

```ts
// ✗ Bad：非组件文件不用 PascalCase
// UserApi.ts

// ✗ Bad：snake_case 非 JS/TS 惯例
// user_api.ts
```

**例外**：React 组件与 Hook 文件遵循双轨规则，见 [react.md](./react.md)。

## 一概念一文件

每个源文件聚焦单一概念。一个文件通常只放一个主要可命名导出（一个组件、一组紧密相关的函数）。

```ts
// ✓ Good：order-validator.ts 只含订单校验逻辑
export function validateOrder(order: Order): ValidationResult {}

// ✗ Bad：多个不相关概念挤在一个文件
// misc.ts
export function validateOrder() {}
export function sendEmail() {}
export function hashPassword() {}
```

多个小组件可共文件，前提是它们属于同一概念且体量小。拿不准时，选更小的文件。

## 禁止 `utils` / `helpers` / `common` / `misc`

这些名字不传达职责，会随时间膨胀成无法维护的抽屉。

```ts
// ✗ Bad
// utils.ts
export function formatDate() {}
export function parseUrl() {}
export function hashPassword() {}

// ✓ Good：按职责拆分
// date.ts
export function formatDate() {}

// url.ts
export function parseUrl() {}

// crypto.ts
export function hashPassword() {}
```

## 目录组织

相关文件放在一起。全仓选一种布局并保持一致；不硬性禁止 `hooks/`、`components/` 等按类型划分的目录，但避免把无关文件堆进同一个大抽屉。

```
// 方案 A：feature 目录 + kebab 目录名
features/
└── user-profile/
    ├── UserProfile.tsx
    ├── useUserProfile.ts
    └── user-profile-api.ts

// 方案 B：组件目录 + 可选 index 重导出
components/
└── UserProfile/
    ├── UserProfile.tsx
    ├── UserProfile.test.tsx
    └── index.ts
```

目录名用 `kebab-case`；组件文件在目录内用 `PascalCase`（除非仓已统一 kebab 组件文件）。

## 避免 Stuttering

导入路径已携带模块名，标识符不要再重复。

```ts
// ✓ Good
import { parse } from './url.ts'
parse(rawUrl)

// ✗ Bad
import { parseUrl } from './url.ts'
parseUrl(rawUrl)
```

## 类型定义文件

类型密集模块可用基名 + `.types.ts` 后缀：

```
user.types.ts
api.types.ts
```
