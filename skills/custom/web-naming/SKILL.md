---
name: web-naming
description: >-
  Web/React UI 命名约定：变量、函数、类、接口、类型、常量、文件名与 React 组件/Hook/props。
  涵盖 camelCase/PascalCase/SCREAMING_SNAKE、缩写当词（HttpClient 而非 HTTPClient、
  userId 而非 userID）、布尔前缀、双轨文件命名（组件 PascalCase / Hook use* / 其余 kebab-case）、
  string union 优先于数字枚举、无 IFoo 前缀、utils 反模式。Use when naming identifiers,
  choosing file names, debating UserProfile.tsx vs user-profile.ts, HttpClient vs
  HTTPClient, userId vs userID, string unions vs numeric enums, useAuth hooks,
  onSave props, Button.test.tsx, PascalCase components, or reviewing naming in UI
  PRs. Not for general code clarity or control flow (→ web-code-style). Not for
  Vue-specific SFC conventions (→ vue-* skills).
when_to_use: >-
  命名，起名，变量名，函数名，文件名，组件名，Hook 命名，props 命名，camelCase,
  PascalCase, SCREAMING_SNAKE, HttpClient, HTTPClient, userId, userID,
  string union，数字枚举，useAuth, onSave, IFoo, utils 反模式，kebab-case,
  naming, identifier, file name, UserProfile.tsx, user-profile.ts, Button.test.tsx,
  rename, naming review
user-invocable: true
metadata:
  author: rockcookies
  version: 2.1.0
---

**Persona:** 你是 Web/React UI 代码可读性工程师。你相信好名字是最廉价的文档，坏名字是最隐蔽的 bug 源。

**范围：** 浏览器端 UI（React 组件、Hook、props、前端模块与相关测试文件名）。不覆盖纯后端 Node/Hono 库。Vue 专有约定见仓内 `vue-*` skills。

**模式：**

- **Coding 模式**：为新代码选名。按速查表与容易遗漏项依次检查；有疑义时，以最能表达意图的名字为准。
- **Review 模式**：审查 PR diff 中的命名。重点找全大写缩写（`HTTPClient`）、`userID`、数字枚举当真实零值、`IFoo` 前缀、`utils`/`helpers`、布尔裸名、组件文件用小写（除非该仓已统一 kebab 组件文件）。
- **Audit 模式**：全库命名审计。用子代理并行扫描：(1) 布尔裸名与缩写大小写，(2) `I` 前缀接口与数字枚举，(3) `utils/helpers` 文件，(4) 文件命名风格与双轨一致性。

---

# Web / React 命名约定

> 拿不准时，优先保持**文件内 / 仓内**一致性，而非强行套用本指南。仓内 `AGENTS.md` 或本地约定可覆盖本 skill。若仓把全大写缩写写进 ESLint，跟仓，不跟本 skill。

## 速查表

| 元素 | 约定 | 示例 |
|------|------|------|
| 变量、函数、方法 | `camelCase` | `fetchUser`, `userCount` |
| 类、接口、类型 | `PascalCase` | `UserService`, `HttpClient` |
| 常量（模块顶层不可变） | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS` |
| 私有字段（类内） | `#camelCase` 或 `_camelCase` | `#token`, `_cache` |
| 布尔变量/参数/字段 | `is`/`has`/`can`/`should` 前缀 | `isReady`, `hasPermission` |
| 缩写 | 当普通词，不大写整段 | `HttpClient`, `parseUrl`, `userId` |
| 非组件前端模块文件 | `kebab-case` | `user-api.ts`, `format-date.ts` |
| React 组件文件 | `PascalCase.tsx` | `UserProfile.tsx` |
| React Hook 文件 | `use` + `camelCase.ts` | `useAuth.ts` |
| React 事件 prop | `on` + 动作 | `onSave`, `onUserSelect` |
| 测试文件 | `<基名>.test.ts(x)`（或全仓统一的 `.spec`） | `UserProfile.test.tsx` |
| 可辨状态 | 优先 string union / `as const` | `type Status = 'pending' \| 'paid'` |
| 泛型类型参数 | 单字母或 `TPascalCase` | `T`, `TValue`, `TKey` |
| 接口 | **无 `I` 前缀** | `Repository`（非 `IRepository`） |

## 双轨文件命名

组件与 Hook 是例外轨；其余前端模块默认 `kebab-case`。细则见 [react.md](./references/react.md)。

**默认**组件文件用 `UserProfile.tsx`，与组件标识符对齐。区分组件与 HTML 标签靠的是**标识符**的首字母大小写，不是文件名本身。

**仓级覆盖：** 若仓库已统一使用 kebab-case 组件文件，保持该仓约定，不要在 Review 里逐文件「纠正」为 PascalCase。

## 容易遗漏的约定

这些约定正确但不显眼，是最常见的命名失误源：

**缩写当词：** `HttpClient`、`parseUrl`、`userId`。不要写 `HTTPClient`、`parseURL`、`userID`。平台强制名（如 `XMLHttpRequest`）除外。

**双轨文件命名：** `user-api.ts`（非组件）与 `UserProfile.tsx`（组件）并存是刻意的。按文件角色选轨，不要混用，除非仓已统一 kebab 组件文件。

**事件处理器按动作命名：** `saveUserData()` 优于 `handleClick()`；React 回调 prop 用 `onSave`，不要把 `onClick` 当业务语义。

**可辨状态用 union：** `type OrderStatus = 'pending' | 'paid'`，不要用数字枚举把 `0` 当成真实业务状态。

**工厂函数用 `create*`：** `createLogger()`，不用 `newLogger()`。

**导入路径不要 stuttering：** 模块名已在路径里时，导出名不要再重复。见 [files-modules.md](./references/files-modules.md)。

## 分类详解

完整规则、示例与理由见：

- **[变量、布尔、缩写与作用域](./references/identifiers.md)**：大小写、作用域长度、布尔前缀、缩写当词、概念名一致
- **[文件、目录与模块](./references/files-modules.md)**：kebab-case 默认、一概念一文件、utils 反模式、stuttering、目录组织
- **[函数、方法与事件处理器](./references/functions-methods.md)**：动词/名词、工厂函数、事件处理器语义命名
- **[类型、接口、常量与枚举](./references/types-constants.md)**：无 `I` 前缀、常量角色命名、union 优先、泛型
- **[测试文件命名](./references/testing.md)**：`.test` 示例、co-locate / `__tests__/`、集成测试后缀
- **[React 命名](./references/react.md)**：组件/Hook/props/事件、双轨细则、目录与 index 模式

## 常见反模式

| 反模式 | 替换方案 |
|--------|----------|
| `HTTPClient`、`parseURL` | `HttpClient`、`parseUrl`（缩写当词） |
| `userID` | `userId` |
| `IRepository` 接口 | `Repository`（无前缀） |
| `enum Status { Pending, Paid }`（数字零值当真实状态） | `type Status = 'pending' \| 'paid'`，或显式字符串枚举 |
| `const THREE = 3` | `const MAX_RETRY_COUNT = 3`（按角色命名） |
| `const userArray = getUsers()` | `const users = getUsers()`（名称描述含义，不描述类型） |
| `import { parseUrl } from './url.ts'` | `import { parse } from './url.ts'` |
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

## 能 lint 的交给 ESLint

大小写、布尔 prop、组件 PascalCase 等能被规则抓住的，交给仓内 ESLint；本 skill 管需要判断的命名（意图、双轨、仓级覆盖）。

## 交叉引用

- → `web-code-style`：行宽、控制流、JSX 复杂度、注释
