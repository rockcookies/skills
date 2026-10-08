# 文件、目录、模块与测试文件命名

React 组件/Hook 文件名的双轨规则见 `naming-react.md`。这里是其余所有模块（含服务端）的规则。

## 默认：`<concept>[.<role>].<ext>`

非组件模块的文件名 = kebab-case 概念 + 可选角色点后缀。`-` 只分隔概念内部的单词，`.` 把角色挂在概念之后：

```text
user.api.ts             // user 的 API 调用
order.validator.ts      // 导出 validateOrder
create-user.command.ts  // 创建用户的命令处理器
date.ts                 // formatDate，概念已自描述，不需要角色
```

角色表达调用者需要知道的模块职责，常见如 `.api`、`.repository`、`.service`、`.validator`、`.mapper`、`.parser`、`.factory`、`.command`、`.query`、`.schema`、`.types`、`.constants`、`.config`。示例清单不是白名单。`.store` 由 `web-zustand/references/slice-organization.md` 规定，以其为准。

不要把角色编码成 kebab 词段，也不给自描述的文件强加角色：

```text
user-api.ts             // ✗ api 是角色，走 `.api`
order-repository.ts     // ✗
create-user-command.ts  // ✗
user.util.ts            // ✗ util 不传达职责
```

概念段仍与主导出围绕同一概念，但不要求存在同名标识符：`order.validator.ts` 导出 `validateOrder`，不是 `OrderValidator`。不用 `UserApi.ts`（PascalCase 留给 React 组件文件）或 `user_api.ts`。

## 禁止 `utils` / `helpers` / `common` / `misc`

这些名字不传达职责，裸用或做角色后缀（`utils.ts`、`order.utils.ts`）都一样，会随时间膨胀成抽屉。按职责拆：

```
date.ts      // formatDate
url.ts       // parseUrl
```

## 一概念一文件

每个文件聚焦单一概念，通常只放一个主要可命名导出（一个组件，或一组紧密相关的函数）。拿不准时选更小的文件。`order.validator.ts` 只含订单校验，不要把校验、发邮件、哈希密码放进同一个 `misc.ts`。

## `index.ts` 只作 barrel

`index.ts` 只做重导出，主实现文件仍要有具名文件名，避免目录里全是 `index.ts` 难以导航。

## 目录

目录名用 `kebab-case`，表达 feature / context；概念与角色由文件名表达。相关文件放在一起，全仓选一种布局并保持一致。不硬性禁止 `hooks/`、`components/` 这类按类型划分的目录，但不要把无关文件堆进同一个大抽屉。

```
features/
└── user-profile/
    ├── user.api.ts
    ├── user.types.ts
    └── …（组件与 Hook 文件名见 naming-react.md）
```

## 测试文件

- **后缀默认 `.test`，全仓只用一种**；仓已统一用 `.spec` 的，跟仓。
- **位置默认与源码同目录**。仓已统一用同级 `__tests__/` 的，跟仓。不要把无关测试集中到顶层杂烩 `tests/`，除非项目已有明确约定且测试与源码分区清晰。
- 文件名 = 源文件全名 + 测试后缀，角色段保持在中间：`user.api.ts` → `user.api.test.ts`，`UserProfile.tsx` → `UserProfile.test.tsx`，`useAuth.ts` → `useAuth.test.ts`。不要写成 `user-api.test.ts` 或 `user.test.api.ts`。
- 集成测试加一个角色段：`user.integration.test.ts`、`api.e2e.test.ts`。
- 测试专用 helper/fixture 放 `fixtures/` 或 `__tests__/`，或用 `test-` 前缀：`test-helpers.ts`、`create-test-server.ts`。

`describe` / `it` 的行为描述不在本 skill 范围。
