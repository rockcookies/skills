---
name: web-code-style
description: >-
  Web/React UI 代码风格：行宽与语义断行、early return、复杂条件、函数长度与参数对象、
  文件内声明顺序、组件只管展示、readonly、对象字面量具名字段、JSX 复杂度、注释边界。
  Use when writing or reviewing React/TS UI code for clarity, nesting, line
  breaks, or project style standards. Not for naming conventions (→ web-naming).
  Not for React performance or hooks rules (→ react-best-practices). Not for
  Vue-specific SFC style. Not for type-level correctness (→ typescript-best-practices,
  if present in the repo).
when_to_use: >-
  嵌套太深, 墙式条件, 可读性, 风格审查, 参数过多, 函数太长, 过深嵌套,
  模板堆逻辑, 控制流, 清晰度
metadata:
  author: rockcookies
  version: 1.3.0
---

**范围：** 浏览器端 UI 的 TypeScript / TSX。格式化器管缩进与引号；本 skill 管需要判断的可读性。命名见 `web-naming`。性能与 hooks 规则见 `react-best-practices`。仓内若有 `typescript-best-practices`：类型建模正确性（判别联合、`any`/`unknown`、类型守卫、穷尽匹配）和 Object args（默认对象参数、热路径例外）以它为准，本 skill 不重复。未部署时不对类型建模作要求；参数对象用本 skill 的门槛（约 ≥4）。

**模式：**

- **Coding 模式**：写新代码时按下列规则组织控制流与 JSX。
- **Review 模式**：在 diff 中找过深嵌套、墙式条件、过长参数列表、模板里堆业务逻辑、组件里塞非 UI 逻辑、可改写的 props、复述代码的注释。
- **Audit 模式**：大库审查时用子代理并行覆盖独立关注点（控制流、函数设计、JSX 复杂度、文件组织、注释），再合并结论。

---

# Web / React 代码风格

> 拿不准时，优先保持**文件内 / 仓内**一致性。忽略某条规则时，在代码旁加简短注释说明原因。

## 行宽与断行

无硬性列数上限，但明显过长的行（约超过 120 字符，或已超过仓内格式化配置）必须在**语义边界**断开，不要为凑列数随便折行。参数达到 4 个及以上时，调用处一行一个参数，闭括号单独一行：

```tsx
submitOrder(
  orderId,
  payload,
  { signal },
  onProgress,
)
```

签名过长时，优先减少参数（改为 options 对象），而不是只靠折行。多行签名时每个参数独占一行。

## 控制流

### 先处理错误与边界（early return）

错误与边缘情况先返回，主路径保持最浅缩进：

```ts
function parseProfile(raw: unknown): Profile | null {
  if (raw == null || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  if (typeof record.id !== 'string') {
    return null
  }

  return mapProfile(record)
}
```

### 去掉多余的 `else`

`if` 分支以 `return` / `throw` / `continue` 结束时，不要再写 `else`。简单赋值用「默认值再覆盖」：

```ts
let density: 'low' | 'high' = 'low'
if (isCompact) {
  density = 'high'
}
```

### 复杂条件抽命名布尔

条件含 3 个及以上操作数时，抽成命名布尔，表达业务意图；昂贵检查可留在 `if` 里以保留短路。详见 [details.md](./references/details.md)。

```ts
const isOwner = resource.ownerId === user.id
const isPublicVerified = resource.isPublic && user.isVerified
if (isOwner || isPublicVerified || permissions.includes('override')) {
  allow()
}
```

同一变量多次比较时，优先 `switch`。

## 函数设计

- 函数宜短、宜单一职责。
- 参数超过约 4 个时，改为 options 对象（或把相关字段收成一个结构）。
- 参数顺序：输入在前，回调 / 目的地在后（与项目现有 API 保持一致）。

```ts
type FetchUserOptions = {
  signal?: AbortSignal
  includePosts?: boolean
}

function fetchUser(id: string, options: FetchUserOptions = {}) {}
```

## 对象字面量：具名字段

对象字面量用字段名，不要靠位置参数或无名字段顺序传递一组相关值。详见 [details.md](./references/details.md)。

```ts
openDialog({ title, body, onConfirm })
```

## 组件只管展示

组件与 Hook 里的代码应服务当前 UI。校验规则、数据变换、与界面无关的业务过程，抽到同目录的普通函数或模块再调用。长示例见 [details.md](./references/details.md)。

## 文件内组织

相关声明放在一起。组件 / Hook 文件常见顺序：

1. imports
2. 类型 / 常量
3. 主组件或主 Hook：公开 props、事件处理器、hooks
4. 仅本文件使用的 helpers

公开 API 与 hooks 放在内部 helpers 前面，读文件时先看到模板在用什么。一个文件一个主组件（或一个主 Hook）；小组件可共文件，前提是同一概念且体量小。

## `readonly`

不应被改写的 props 字段、以及初始化后不再赋值的派生值，标 `readonly`，避免把输入当可变草稿。

```ts
type UserProfileProps = {
  readonly userId: string
  readonly onSave: () => void
}
```

## JSX：避免过复杂逻辑

模板适合放简短表达式。条件嵌套、多步变换、非显然派生值，抽到组件体（普通函数、派生变量或项目惯用的 memo / 选择器）再绑定到 JSX：

```tsx
// ✓ Good：派生值在组件体
const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ')
return <p>{displayName}</p>

// ✗ Bad：模板里堆变换
return (
  <p>
    {[user.firstName, user.lastName].filter(Boolean).join(' ')}
  </p>
)
```

没有唯一的「复杂」阈值；以阅读模板时是否还要在脑子里求值作为标准。

## 注释

注释解释 **why**（约束、权衡、非显然意图），不要复述代码 **what**。删除大段注释掉的死代码，交给版本控制。

```ts
// ✓ Good：说明约束
// 支付回调要原始 body；勿先 JSON.parse
const rawBody = await request.text()

// ✗ Bad：复述下一行
// 设置 count 为 0
const count = 0
```

## 并行审查（大库）

跨大库做风格审查时，最多用 5 个子代理，分别覆盖独立关注点（控制流、函数设计、JSX 复杂度、文件组织、注释），再合并去重。

## 交叉引用

- → `web-naming`：标识符、文件名、组件 / Hook / props 命名
- → `react-best-practices`：渲染性能、hooks 依赖与订阅
- → [details.md](./references/details.md)：复杂条件、options 对象、展示外提、`readonly`、具名字段
