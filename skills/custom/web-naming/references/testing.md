# 测试文件命名与位置

测试文件命名与位置归 `web-naming`。`describe` / `it` 等行为描述不在本 skill 范围。

## 后缀：全仓统一

示例与 Vitest/Jest 常见文档对齐，使用 `.test`。`.spec` 等价：全项目只选一种，不要混用。

| 源文件 | 测试文件（示例） |
|--------|------------------|
| `user-api.ts` | `user-api.test.ts` |
| `UserProfile.tsx` | `UserProfile.test.tsx` |
| `useAuth.ts` | `useAuth.test.ts` |

## 位置：同目录或 `__tests__/`

二选一，全仓统一：

1. **与源码同目录** co-locate
2. **同级 `__tests__/`** 子目录

不要把无关测试集中到顶层大杂烩 `tests/`（除非项目已有明确约定且测试与源码分区清晰）。

```
// 同目录
features/checkout/
├── PaymentForm.tsx
├── PaymentForm.test.tsx
└── useCheckout.test.ts

// 或 __tests__/
features/checkout/
├── PaymentForm.tsx
└── __tests__/
    └── PaymentForm.test.tsx
```

## 集成测试后缀

集成测试用额外词段区分，常见模式：

```
user.integration.test.ts
api.e2e.test.ts
```

也可用 Vitest 的 `include` / `testNamePattern` 或 `describe` 标签区分，但文件名后缀最直观。

## 测试辅助文件

测试专用 helper/fixture 用 `test-` 前缀或放在 `__tests__/`、`fixtures/` 子目录：

```
fixtures/
└── order.json

test-helpers.ts
create-test-server.ts
```

## 表驱动用例名

`it.each` / `describe` 内的 case 名用全小写描述性短语（含缩略词）：

```ts
it.each([
  { name: 'empty input', input: '', expected: 0 },
  { name: 'valid id', input: 'abc', expected: 1 },
])('$name', ({ input, expected }) => { /* ... */ })

// ✗ Bad
{ name: 'Valid ID', ... }
{ name: 'Empty Input', ... }
```
