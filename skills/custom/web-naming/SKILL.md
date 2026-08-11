---
name: web-naming
description: >-
  Web/React UI 命名约定：变量、函数、类、接口、类型、常量、文件名与 React 组件/Hook/props。
  涵盖 camelCase/PascalCase/SCREAMING_SNAKE、布尔前缀、双轨文件命名（组件 PascalCase /
  Hook use* / 其余 kebab-case）、无 IFoo 前缀、utils 反模式。Use when naming
  identifiers, choosing file names, debating UserProfile.tsx vs user-profile.ts,
  useAuth hooks, onSave props, Button.test.tsx, PascalCase components, or
  reviewing naming in UI PRs. Not for general code clarity or control flow
  (→ web-code-style). Not for Vue-specific SFC conventions (→ vue-* skills).
when_to_use: >-
  命名, 起名, 变量名, 函数名, 文件名, 组件名, Hook 命名, props 命名, camelCase,
  PascalCase, SCREAMING_SNAKE, useAuth, onSave, IFoo, utils 反模式, kebab-case,
  naming, identifier, file name, UserProfile.tsx, user-profile.ts, Button.test.tsx,
  rename, naming review
user-invocable: true
metadata:
  author: rockcookies
  version: 2.0.0
---

**Persona:** 你是 Web/React UI 代码可读性工程师。你相信好名字是最廉价的文档，坏名字是最隐蔽的 bug 源。

**范围：** 浏览器端 UI（React 组件、Hook、props、前端模块与相关测试文件名）。不覆盖纯后端 Node/Hono 库。Vue 专有约定见仓内 `vue-*` skills。

**模式：**

- **Coding 模式**：为新代码选名。按速查表与最佳实践依次检查；有疑义时，以最能表达意图的名字为准。
- **Review 模式**：审查 PR diff 中的命名。重点找缩写滥用、`IFoo` 前缀、`utils`/`helpers` 反模式、布尔裸名、组件文件用小写（除非该仓已统一 kebab 组件文件）。
- **Audit 模式**：全库命名审计。用子代理并行扫描：(1) 布尔裸名，(2) `I` 前缀接口，(3) `utils/helpers` 文件，(4) 文件命名风格与双轨一致性。

---

# Web / React 命名约定

> 拿不准时，优先保持**文件内 / 仓内**一致性，而非强行套用本指南。仓内 `AGENTS.md` 或本地约定可覆盖本 skill。

## 速查表

| 元素 | 约定 | 示例 |
|------|------|------|
| 变量、函数、方法 | `camelCase` | `fetchUser`, `userCount` |
| 类、接口、类型、枚举 | `PascalCase` | `UserService`, `HttpClient` |
| 常量（顶层不可变） | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS` |
| 私有字段（类内） | `#camelCase` 或 `_camelCase` | `#token`, `_cache` |
| 布尔变量/参数/字段 | `is`/`has`/`can`/`should` 前缀 | `isReady`, `hasPermission` |
| 非组件前端模块文件 | `kebab-case` | `user-api.ts`, `format-date.ts` |
| React 组件文件 | `PascalCase.tsx` | `UserProfile.tsx` |
| React Hook 文件 | `use` + `camelCase.ts` | `useAuth.ts` |
| React 事件 prop | `on` + 动作 | `onSave`, `onUserSelect` |
| 测试文件 | `<基名>.test.ts(x)`（或全仓统一的 `.spec`） | `UserProfile.test.tsx` |
| 枚举成员 | `PascalCase` 或 `SCREAMING_SNAKE`（保持一致） | `Status.Pending`, `HttpMethod.GET` |
| 泛型类型参数 | 单字母或 `TPascalCase` | `T`, `TValue`, `TKey` |
| 接口 | **无 `I` 前缀** | `Repository`（非 `IRepository`） |

## 双轨文件命名

组件与 Hook 是例外轨；其余前端模块默认 `kebab-case`：

```ts
// 非组件模块（kebab-case）
// user-api.ts
export async function fetchUser(id: string) {}
```

```tsx
// React 组件文件（PascalCase）
// features/checkout/PaymentForm.tsx
export function PaymentForm() {
  return <form>...</form>
}
```

**默认**不用 `user-profile.tsx` 命名组件文件，与组件标识符 `UserProfile` 对齐，减少小写导入习惯。区分组件与 HTML 标签靠的是**标识符**的首字母大小写，不是文件名本身。

**仓级覆盖：** 若仓库已统一使用 kebab-case 组件文件，保持该仓约定，不要在 Review 里逐文件「纠正」为 PascalCase。

## 避免 Stuttering

导入路径已携带模块名，标识符不要再重复：

```ts
// ✓ Good
import { parse } from './url.ts'
parse(rawUrl)

// ✗ Bad
import { parseUrl } from './url.ts'
parseUrl(rawUrl)
```

## 容易遗漏的约定

**双轨文件命名：** `user-api.ts`（非组件）与 `UserProfile.tsx`（组件）并存是刻意的。按文件角色选轨，不要混用，除非仓已统一 kebab 组件文件。

**React 组件文件默认 PascalCase：** `PaymentForm.tsx`。仓已统一 kebab 时除外。

**事件处理器按动作命名：** `saveUserData()` 优于 `handleClick()`；React 回调 prop 用 `onSave` 而非把 `onClick` 当业务语义。

**枚举零值哨兵：** 用 `Unknown`/`None` 作零值，避免未初始化被误当真实状态。

**工厂函数用 `create*`：** `createLogger()`，不用 `newLogger()`。

## 分类详解

完整规则、示例与理由见：

- **[变量、布尔、缩写与作用域](./references/identifiers.md)**：大小写、作用域长度、布尔前缀、缩写、概念名一致
- **[文件、目录与模块](./references/files-modules.md)**：kebab-case 默认、一概念一文件、utils 反模式、目录组织
- **[函数、方法与事件处理器](./references/functions-methods.md)**：动词/名词、工厂函数、事件处理器语义命名
- **[类型、接口、常量与枚举](./references/types-constants.md)**：无 `I` 前缀、常量角色命名、枚举零值、泛型
- **[测试文件命名](./references/testing.md)**：`.test` 示例、co-locate / `__tests__/`、集成测试后缀
- **[React 命名](./references/react.md)**：组件/Hook/props/事件、双轨细则、目录与 index 模式

## 常见反模式

| 反模式 | 替换方案 |
|--------|----------|
| `IRepository` 接口 | `Repository`（无前缀） |
| `utils.ts` / `helpers.ts` | 按职责拆分为 `date.ts`、`url.ts` 等 |
| `user-profile.tsx`（默认轨） | `UserProfile.tsx`（仓已统一 kebab 则保持） |
| `UseAuth.ts` / `use-auth.ts` Hook 文件 | `useAuth.ts` |
| `flag`、`temp`、`data` 裸名 | `isEnabled`、`cachedUser`、`responsePayload` |
| `handleClick`、`doThing` | `saveUserData`、`validateSchema` |
| 布尔裸字段 `active` | `isActive` |
| `any` 类型别名 `Data` | 具体类型或泛型参数 |
| 非组件文件 `UserService.ts` | `user-service.ts` |
| React prop `UserName` | `userName` |
| 测试集中到顶层无关 `tests/` | 与源码同目录或同级 `__tests__/` |

---

交叉引用：格式与清晰度见 `web-code-style`。
