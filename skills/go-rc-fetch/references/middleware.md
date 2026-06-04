# 中间件

`RequestFunc` 在 `Do` 中先于中间件执行（见 [request.md](request.md)）。请求体链式方法见 [body.md](body.md)。

## 类型与挂载

```go
type Middleware func(Handler) Handler

type Handler interface {
    Handle(client *http.Client, req *http.Request) (*http.Response, error)
}
```

| 挂载 | 作用范围 |
|------|----------|
| `dispatcher.Use` | 全局 |
| `req.Pre` / `req.Use` | 该 Request |
| `dispatcher.Do(req, mw...)` | 单次调用 |

`compose`：`Use(A)` 再 `Use(B)` → **A → B → handler → B → A**。`Request.Do`：先全部 `RequestFunc`，再 `dispatcher` 链 + `req` 中间件。

`Skip()` 为透传空操作。

## 自定义模式

**日志** — 在 `next.Handle` 前后记 status/latency。

**认证** — Handler 内 `req.Header.Set("Authorization", "Bearer "+token())` 或 `SetHeaderOptions` + `ApplyHeader`。

**重试** — 失败时 `resp.Body.Close()` 后重试；流式 body 须用 `req.BodyGet`，见 [body.md](body.md)。

**请求 ID** — `UseFuncs` 或 Handler 中间件设置 `X-Request-ID`。

## URL（PrepareURLMiddleware）

`SetURLOptions` 写入 Context；`PrepareURLMiddleware` 应用。挂载：`PrepareURLMiddleware` → `SetURLOptions` → handler。

| URLOptions 字段 | 说明 |
|----------------|------|
| `BaseURL` | scheme/host（可带 path）；无 scheme 补 `http://` |
| `PathParams` | 替换 `{key}` |
| `QueryParams` | 追加 query（已有则用 `&`） |

```go
dispatcher.Use(fetch.PrepareURLMiddleware())
dispatcher.Use(fetch.SetURLOptions(func(o *fetch.URLOptions) {
    o.BaseURL = "https://api.example.com/v2"
}))

req := dispatcher.NewRequest()
req.Use(fetch.SetURLOptions(func(o *fetch.URLOptions) {
    o.PathParams = map[string]string{"orgID": "100"}
    o.QueryParams = url.Values{"include": []string{"members"}}
}))
// → .../v2/orgs/100/teams?include=members
resp := req.Get(ctx, "/orgs/{orgID}/teams")
```

Context：`ctx := fetch.WithURLOptions(ctx, fn)` + `req.PreFuncs(func(r *http.Request) *http.Request { return r.WithContext(ctx) })`。

## Header 与 Cookie

对称模式：`Set*Options` 存 Context → `Apply*` 应用。测试约定顺序：`SetHeaderOptions` → `ApplyHeader` → handler。

| 场景 | 做法 |
|------|------|
| 简单 | `UseFuncs` 直接 `Header.Set` / `AddCookie` |
| 全局/可组合 | `ApplyHeader` + `SetHeaderOptions`；`ApplyCookie` + `SetCookieOptions` |
| 单次 | `WithHeaderOptions` / `WithCookieOptions` + `PreFuncs` 注入 ctx |

`ApplyCookie` 先 `Del("Cookie")` 再 `AddCookie`。Header：`Set` 覆盖，`Add` 追加。

## 内置 Body 中间件

| Request 方法 | 底层 |
|-------------|------|
| `Body` | `BodyReader` |
| `BodyGet` | `BodyGetReader`（`GetBody`，可重试） |
| `JSON` / `XML` / `Form` | `BodyJSON` / `BodyXML` / `BodyForm` |
| `Multipart` | `Multipart` |

`BodyOptions`：`ContentType`、`AutoSetContentLength`。
