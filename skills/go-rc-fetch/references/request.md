# Dispatcher、Request 与 Response

## Dispatcher

持有 `*http.Client` 与全局中间件链；线程安全。所有 `Request` 经 `NewRequest()` 创建。

### 初始化

```go
import (
    "net/http"
    "time"

    fetch "github.com/rockcookies/go-fetch"
)

dispatcher := fetch.NewDispatcher(nil)                              // 默认 30s 超时
dispatcher := fetch.NewDispatcher(nil, authMiddleware, logMiddleware)
dispatcher := fetch.NewDispatcher(&http.Client{Timeout: 10 * time.Second})
dispatcher := fetch.NewDispatcherWithTransport(customTransport)     // 如 dump.New(...)
```

### Client 与 Clone

```go
client := dispatcher.Client()
dispatcher.SetClient(newClient) // nil 无操作
_ = dispatcher.Middlewares()

base := fetch.NewDispatcher(nil)
base.Use(authMiddleware)
svcA := base.Clone()
svcA.Use(serviceAMiddleware)
```

### 全局中间件与 Do

`Use` 追加；`compose` 按挂载顺序执行（先挂先跑）。

```go
dispatcher.Use(authMiddleware, logMiddleware)

httpReq, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
rawResp, err := dispatcher.Do(httpReq, extraMiddleware) // dispatcher 链 + 临时中间件
```

---

## Request

链式 API；HTTP 方法返回 `*Response`（永不为 nil）。详见 [middleware.md](middleware.md) 的挂载与 URL/Header 配置。

### RequestFunc 与 Middleware

| 类型 | 前置 | 追加 | 执行时机 |
|------|------|------|----------|
| `RequestFunc` | `PreFuncs` | `UseFuncs` | `Do` 内、中间件之前 |
| `Middleware` | `Pre` | `Use` | `dispatcher.Do` 链 |

`RequestFunc`：`func(req *http.Request) *http.Request`；`nil` 返回 = 原地修改。

### HTTP 方法

第一个参数均为 `context.Context`：`Get` `Post` `Put` `Patch` `Delete` `Head` `Options` `Trace`、通用 `Send(ctx, method, url)`。

```go
ctx := context.Background()
resp := req.JSON(payload).Post(ctx, url)
defer resp.Close()
```

### Clone 与 Request.Do

`Clone` 浅拷贝 `funcs` 与 `middlewares`。`Do(httpReq)` 先 `applyFuncs` 再 `dispatcher.Do`。

```go
baseReq := dispatcher.NewRequest()
baseReq.UseFuncs(func(r *http.Request) *http.Request {
    r.Header.Set("Authorization", "Bearer "+token)
    return nil
})
usersResp := baseReq.Clone().Get(ctx, "/users")
defer usersResp.Close()
```

---

## Response

### Close 与错误

始终 `defer resp.Close()`（`resp.Error != nil` 时也安全）。`Close` drain 并关闭 body。

- `resp.Error`：网络/构造错误；`errors.As` 可识别 `*url.Error` 超时
- HTTP 4xx/5xx：**不**自动填入 `resp.Error`，需检查 `resp.RawResponse.StatusCode`
- `InvalidRequestError`：URL 等构造错误，支持 `Unwrap()`

### 元数据

`RawResponse`、`Header`、`Cookies`、`RawRequest`（可能 nil）。

### 读取 body

| 方法 | 说明 |
|------|------|
| `String()` / `Bytes()` | 读入内部 buffer，可多次调用 |
| `JSON` / `XML` | 解码；先 `String`/`Bytes` 再 `JSON` 仍可用 |
| `Read` | 实现 `io.Reader`，适合大文件流式 |
| `SaveToFile` | 写入文件 |
| `ClearInternalBuffer` | 释放 buffer |

```go
if resp.Error != nil {
    return resp.Error
}
if resp.RawResponse.StatusCode >= 400 {
    return fmt.Errorf("HTTP %d", resp.RawResponse.StatusCode)
}
var out MyStruct
if err := resp.JSON(&out); err != nil {
    return err
}
```
