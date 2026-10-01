---
name: web-code-style
description: >-
  Web 全栈（React 前端与 Node 服务端）的命名约定与代码风格：变量/函数/类型/常量/文件名命名，
  React 组件/Hook/props/事件命名，以及 early return、复杂条件、参数对象、间接层与状态范围、
  组件只管展示、JSX 复杂度、注释边界。在起名、选文件名、纠结 UserProfile.tsx 还是 user-profile.ts、
  handleClick 还是 saveUserData、userID 还是 userId，或编写、审查 Web 代码的可读性
  （嵌套过深、墙式条件、参数过多、JSX 里堆逻辑、注释复述代码）时使用，即使用户没有明说「命名」或「风格」。
  不管渲染性能与 hooks 规则（→ react-best-practices）、类型建模（→ typescript-best-practices）、
  Vue SFC（→ vue-* skills）、formatter/linter 已覆盖的机械规则。
metadata:
  author: rockcookies
  version: 3.0.0
  replaces: web-naming@2.3.0
---

**范围：** Web 全栈的 TypeScript：React（TSX）前端与 Node 服务端。命名与代码风格的通用规则适用任何层；React 专属规则（组件/Hook 文件名、props、JSX）只用于前端。本 skill 建在仓内技能之上：类型建模、`any`/`unknown`、判别联合、穷尽匹配、Object args 的热路径例外，以 `typescript-best-practices` 为准（建模原则见 `type-system-discipline`）；渲染性能与 hooks 规则见 `react-best-practices`。这里只规定它们怎么命名、怎么写得易读。

## 按任务读对应 references

| 任务 | 读哪些 references |
|------|-------------------|
| 命名（任何层） | `naming-core.md`、`naming-files.md` |
| React 前端的组件/Hook/props/文件名 | `naming-react.md` |
| 写/审控制流、函数、注释（任何层） | `style-core.md` |
| 写/审组件、JSX、文件内组织 | `style-ui.md` |
| 需要长示例 | `examples.md` |

只读与当前任务相关的文件，不要一次全读。monorepo 里按**目标文件所在包**选路由：前端包用 React 双轨文件命名，服务端包一律走 `naming-files.md` 的 kebab-case 默认轨。Vue SFC 见仓内 `vue-*` skills。

## 优先级与工具边界

仓内 `AGENTS.md`、本地约定、相邻文件的现状，优先于本 skill。拿不准时保持文件内、仓内一致，不要为了套规则而重命名整个模块。

仓内 formatter / linter（Biome、`@antfu/eslint-config`、oxlint 等，以仓内实际配置为准）已强制的规则，以工具为准，审查时不重复提，本 skill 也不写死规则名。行宽、引号、分号、缩进、`else` after `return` 这类机械规则归工具。某类问题反复出现而工具没管，先在仓内工具里补规则，不要往本 skill 里加文字。若仓的工具强制全大写缩写（`HTTPClient`），跟仓。示例代码的格式不代表规定。

## 模式

- **Coding**：写新代码时按速查表与对应 references 组织。
- **Review**：只找工具抓不到的问题：布尔裸名、`handleClick`、`utils`、数字枚举当真实零值、概念名不一致、文件命名与仓约定不符，以及过深嵌套、墙式条件、单调用者包装、JSX 里求值、复述型注释。按「审查输出」汇报。
- **Audit**：全库审查按关注点分组（命名、控制流与函数、UI 与 JSX、文件组织、注释）。有 pstack 时用 `/swarm` 并行，否则顺序扫描，最后合并去重。

## 速查表（命名的唯一规则来源）

| 元素 | 约定 | ✓ | ✗ |
|------|------|---|---|
| 变量、函数、方法 | `camelCase` | `fetchUser` | `FetchUser` |
| 类、接口、类型 | `PascalCase`；接口无 `I` 前缀 | `Repository` | `IRepository` |
| 顶层不可变常量 | `SCREAMING_SNAKE_CASE`，按**角色**命名；局部 `const` 用 `camelCase` | `MAX_RETRY_COUNT` | `THREE` |
| 类内私有字段 | `#camelCase`；仓已用 `private` 关键字则跟仓 | `#token` | `_token` |
| 布尔变量/参数/字段/prop | `is`/`has`/`can`/`should` 前缀 | `isReady` | `active` |
| 类型守卫（`x is T`） | `isX` / `hasX` | `isUser` | `checkUser` |
| 缩写 | 当普通词 | `HttpClient`、`parseUrl`、`userId` | `HTTPClient`、`parseURL`、`userID` |
| 工厂函数 | `create*` | `createLogger` | `newLogger` |
| 泛型参数 | 简单用 `T`，复杂用 `TPascalCase` | `T`、`TKey` | |
| 判别联合的判别字段 | `kind`，值为小写短词 | `{ kind: 'saving' }` | `{ type: 'SAVING' }` |
| 离散状态 | string union 或 `as const` 对象 | `'pending' \| 'paid'` | 数字 `enum` |
| 事件处理器 | 按**动作**命名 | `saveUserData` | `handleClick` |
| 非组件模块文件 | `kebab-case`，名字反映主导出 | `user-api.ts` | `UserApi.ts`、`utils.ts` |
| 业务概念 | 全库一个词 | `user` | `user`/`account`/`person` 混用 |

React 专属的文件名、props、测试后缀等见对应 references，这里不重复。

## 审查输出

每条发现给：`文件:行`、问题（对应哪条规则）、最小修改。按这个顺序排：

1. 可以删除的东西（死代码、单调用者包装、冗余守卫、复述型注释）。
2. 读者负荷问题（过深嵌套、墙式条件、JSX 里求值）。
3. 命名问题。

不顺手做无关重构。改完运行仓内的 typecheck / lint / test 再汇报。

## 交叉引用

- → `react-best-practices`：渲染性能、hooks 依赖与订阅
- → `typescript-best-practices`：判别联合/branded type 是否该用、`as` 与类型守卫的正确性（建模原则见 `type-system-discipline`）
- → `web-zustand`：`*.store.ts` 等 Zustand 文件后缀
