# 函数、方法与事件处理器

## 动词 vs 名词

返回值的函数用**名词**（返回什么）；执行副作用的函数用**动词**（做什么）。

```ts
// 名词 — 返回某物
function defaultConfig(): Config {}
function userName(): string {}

// 动词 — 执行动作
function writeFile(name: string, data: Buffer): Promise<void> {}
function sendNotification(user: User): Promise<void> {}
```

## 工厂函数

模块只导出单一主要类型时，工厂函数用 `create`：

```ts
export function createLogger(options: LoggerOptions): Logger {}
```

模块有多种可构建类型时，加名词后缀：

```ts
export function createFileTransport(): Transport {}
export function createConsoleTransport(): Transport {}
```

不要用 `new` 前缀（Go 风格）：

```ts
// ✗ Bad
export function newLogger() {}
```

## 事件处理器：按动作命名

处理器名称应描述**执行的动作**，而非触发的 DOM 事件。

```tsx
// ✓ Good — 模板里一眼看出动作
<button onClick={saveUserData}>Save</button>

// ✗ Bad — 看不出点击后做什么
<button onClick={handleClick}>Save</button>
```

键盘等复杂场景可先写 `handleKeydown`，再内部分发到 `activateBold()` 等具体方法：

```ts
function handleKeydown(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === 'B') {
    activateBold()
  }
}
```

React 事件 prop 用 `on` + 动作（`onSave`、`onUserSelect`）；内部处理器优先动作名，其次 `handle` + 事件。详见 [react.md](./react.md)。

## 生命周期与初始化方法

生命周期钩子（`ngOnInit`、`useEffect` 回调体）里不要塞长逻辑。把逻辑提取为有语义的私有/模块级函数，在钩子里调用：

```ts
// ✓ Good
function init() {
  startLogging()
  runBackgroundTask()
}

// ✗ Bad — 钩子名只描述时机，不描述行为
function init() {
  logger.setMode('info')
  logger.monitorErrors()
  // ... 数十行
}
```

## 避免无意义动词

```ts
// ✗ Bad
function handleIt() {}
function doThing() {}

// ✓ Good
function processPayment() {}
function validateSchema() {}
```
