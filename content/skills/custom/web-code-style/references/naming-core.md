# 通用命名：需要判断的规则

本文件定义通用命名规则；`SKILL.md` 的速查表只是摘要。修改规则先改这里，再同步速查表。

## 布尔

布尔变量、参数、字段、prop 必须加前缀，读起来像是非题：`isLoggedIn`、`hasAdminRole`、`canWrite`、`shouldRetry`。

类型守卫按它检验的是“是不是”还是“有没有”选 `isX` / `hasX`。不要用裸动词（`checkX`、`validateX`）当类型守卫名，名字要让调用者一眼看出用完后类型会被收窄。只有检查确实能证明目标类型时才写 `value is T`；只查询真假的函数返回 `boolean`，不承诺收窄：

```ts
function isUser(value: unknown): value is User {}
function isAdminUser(user: User): user is AdminUser {}

// 查询，不是类型守卫：不收窄
function hasPermission(user: User, permission: Permission): boolean {}
```

## 名称描述含义，不描述类型

`users` 而非 `userArray`，`count` 而非 `countNumber`。

## 概念名在领域边界内一致

同一业务概念在同一领域边界内只用一个词：`createUser`、`updateUser`、`deleteUser`，不要一个叫 `updateAccount`、一个叫 `removePerson`。跨领域存在有意区别时（如两个上下文各自定义了 `user` 与 `account`），在边界处显式说明，不强行合并。仓内有术语表时以它为准。

## 缩写与 initialism：保留规范大小写

常见缩写按团队维护的规范拼写书写。不要因为转成 PascalCase 或 camelCase，就把 `URL`、`TTL`、`HTTP`、`ID` 拆成普通词形式的 `Url`、`Ttl`、`Http`、`Id`。

**PascalCase**：首段或后续段中的约定缩写保留完整大写：`URLParser`、`TTLCache`、`HTTPClient`、`UserID`。

**camelCase**：标识符首段按 camelCase 要求小写，后续的约定缩写保留完整大写：`urlParser`、`ttlCache`、`httpClient`、`parseURL`、`defaultTTL`、`userID`、`loadHTTPURL`。

**顶层常量**：仍遵守 `SCREAMING_SNAKE_CASE`，按角色命名：`DEFAULT_TTL_MS`、`MAX_URL_LENGTH`。

**文件名**：继续遵守既定文件命名规则，不因标识符保留大写缩写而改为大写文件名：`url.parser.ts`、`ttl-cache.ts`；React 组件文件遵守组件命名规则，如 `URLParser.tsx`。

**词典**：项目认可的缩写按规范拼写维护，例如 `API`、`CSS`、`DNS`、`HTTP`、`HTTPS`、`HTML`、`ID`、`IP`、`JSON`、`JWT`、`SDK`、`SQL`、`SSE`、`TCP`、`TTL`、`UDP`、`URI`、`URL`、`UUID`、`XML`。新增缩写先确认它在项目语境中的标准拼写，再更新词典。官方平台名称、框架名称及第三方 API 的拼写按其契约保留（`XMLHttpRequest`、`URLSearchParams`）。不要把任意短词自动视为缩写；词典外的词优先遵守普通命名规则，确有必要时再补入词典。

## 事件处理器按动作命名

处理器名描述**做什么**，而不是触发它的 DOM 事件。模板里一眼就能看出动作：

```tsx
<button onClick={saveUserData}>Save</button>   // ✓
<button onClick={handleClick}>Save</button>    // ✗
```

键盘等复杂场景可以先用 `handleKeydown` 接事件，再内部分发到 `activateBold()` 之类的具体函数。

## 函数：描述动作或意图，禁空动词

有副作用的函数用动词描述动作（`persistDraft`、`sendNotification`）；纯转换、计算或查询函数描述其意图（`formatDate`、`calculateTotal`、`parseURL`），不必强行命名成名词。布尔结果用 `is`、`has`、`can`、`should` 前缀（`isValidURL`、`hasPermission`）。不用 `handleIt`、`doThing` 这类无信息名称，改为 `processPayment`、`validateSchema`。

## 命名导出保持自描述

命名导入会丢掉模块名，调用点只剩函数名。所以 `import { parseURL } from './url'` 优于 `import { parse } from './url'`：前者在调用点仍能读出对象，也便于 grep。只有命名空间导入时才去掉重复：`import * as url from './url'` 后调用 `url.parse(raw)`。

## 常量按角色命名

名称表达角色，不表达字面值：`MAX_RETRY_COUNT`、`DEFAULT_TIMEOUT_MS`，不要 `THREE`、`TIMEOUT_30000`。

## 作用域与名称长度成正比

短作用域用短名（循环里的 `i`、事件对象 `e`、`setState(prev => …)`），模块级用描述性名称。`signal` 与 `error` 不缩成单字母。

## 离散状态：不要数字枚举

不要让数字 `0` 成为真实业务状态：未赋值变量会静默变成第一个成员。用 string union；必须用 `enum` 时用显式字符串成员。

```ts
type OrderStatus = 'pending' | 'paid' | 'cancelled'

// 需要运行时对象时
const OrderStatus = {
  Pending: 'pending',
  Paid: 'paid',
  Cancelled: 'cancelled',
} as const
type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]
```

## 判别联合与 branded type 的命名

只管命名，要不要用以 `typescript-best-practices/references/patterns.md` 为准。

判别字段统一叫 `kind`，仓内只用一种，值用小写短词，不要全大写：

```ts
type SaveState =
  | { kind: 'idle' }
  | { kind: 'error', message: string }
  | { kind: 'saved', at: Date }
```

Branded type：类型名与领域概念同名（`UserID`，不是 `UserIDType`）。brand 字段统一叫 `__brand`，`readonly`，不对外导出。转换只发生在一个**会校验**的 `parse` + 类型名函数里，不在调用点 `as` 强转：

```ts
type UserID = string & { readonly __brand: 'UserID' }

function parseUserID(raw: string): UserID {
  if (raw.length === 0) {
    throw new Error('empty user id')
  }
  return raw as UserID // 仅在校验之后转换，且只此一处
}
```

## 其他

- 不强制“对象形状必须用 `interface` 而不能用 `type`”，文件内保持一种即可。
- 类型名不加 `Struct`、`Object`、`Data`、`Type` 这类无信息后缀。
