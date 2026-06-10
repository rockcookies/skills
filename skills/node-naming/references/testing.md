# 测试文件命名与位置

测试文件命名与位置归 `node-naming`；`describe`/`it` 等行为命名见 `node-testing`。

## 后缀：`.test`

Node/Vitest/Jest 生态默认用 `.test` 后缀（非 Angular 的 `.spec`）。全项目统一一种后缀。

| 源文件 | 测试文件 |
|--------|----------|
| `user-service.ts` | `user-service.test.ts` |
| `UserProfile.tsx` | `UserProfile.test.tsx` |
| `useAuth.ts` | `useAuth.test.ts` |

## 与源文件同目录（co-locate）

测试文件放在被测代码同一目录，不要集中到顶层 `tests/` 目录（除非项目已有明确约定）。

```
order-processing/
├── order-processor.ts
└── order-processor.test.ts

features/checkout/
├── PaymentForm.tsx
├── PaymentForm.test.tsx
└── useCheckout.test.ts
```

## 集成测试后缀

集成测试用额外词段区分，常见模式：

```
user.integration.test.ts
api.e2e.test.ts
```

也可用 Vitest 的 `include`/`testNamePattern` 或 `describe` 标签区分，但文件名后缀最直观。

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

用例内行为命名细则见 `node-testing`。
