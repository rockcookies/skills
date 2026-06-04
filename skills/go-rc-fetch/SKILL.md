---
name: go-rc-fetch
description: 轻量级 Go HTTP 客户端库，基于 github.com/rockcookies/go-fetch（零外部依赖）。涵盖 Dispatcher 初始化与中间件、Request 链式构建（RequestFunc 与 Middleware 分层）、Response 解码（JSON/XML/流）、请求体编码（JSON/XML/Form/Multipart/BodyGet）、URL 参数（PrepareURLMiddleware/URLOptions）、Header/Cookie 管理（ApplyHeader/ApplyCookie 与 Context）、中间件组合（Dispatcher/Request/Do 三层）、HTTP 交换日志（dump.New/dump.Transport/过滤器/WithRequestRedactor/WithResponseRedactor/SlogWriter）。使用时机：需要发起 HTTP 请求（GET/POST/PUT/PATCH/DELETE，均需 context.Context）、上传文件（Multipart/GetReader）、配置全局认证头（dispatcher.Use）、记录 HTTP 交换日志（dump.New、WithFilter、DefaultRedactor）、构建可复用的请求基础（Request.Clone）时使用本技能。当用户消息中包含以下任一关键词（go-fetch、NewDispatcher、NewDispatcherWithTransport、RequestFunc、PreFuncs、UseFuncs、BodyGet、MultipartField、dump.New、WithFilter、WithRequestRedactor、WithResponseRedactor、DefaultRedactor、DumpOptions、SlogWriter、URLOptions、PrepareURLMiddleware、PathParams、SetURLOptions、WithURLOptions、ApplyHeader、SetHeaderOptions、WithHeaderOptions、ApplyCookie、SetCookieOptions、WithCookieOptions、HandlerFunc、fetch.Handler、fetch.Middleware、dispatcher.Use、resp.Close、resp.JSON、resp.XML），或用户明确请求 go-fetch HTTP 客户端用法时触发本技能。
---

# go-fetch

基于 [rockcookies/go-fetch](https://github.com/rockcookies/go-fetch) — 零外部依赖的 Go HTTP 客户端库，生产代码仅依赖标准库 `net/http`。

## 安装

```sh
go get github.com/rockcookies/go-fetch
```

## 快速入门

### GET 请求

```go
import (
    "context"
    "log"

    fetch "github.com/rockcookies/go-fetch"
)

dispatcher := fetch.NewDispatcher(nil) // nil → 30s 超时默认客户端

ctx := context.Background()
resp := dispatcher.NewRequest().Get(ctx, "https://api.example.com/users/1")
defer resp.Close()

if resp.Error != nil {
    log.Fatal(resp.Error)
}

var user struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}
if err := resp.JSON(&user); err != nil {
    log.Fatal(err)
}
```

### POST JSON 请求

```go
ctx := context.Background()
payload := map[string]string{"name": "John", "email": "john@example.com"}

resp := dispatcher.NewRequest().JSON(payload).Post(ctx, "https://api.example.com/users")
defer resp.Close()

if resp.Error != nil {
    log.Fatal(resp.Error)
}
```

### 全局认证中间件

```go
dispatcher := fetch.NewDispatcher(nil)
dispatcher.Use(func(next fetch.Handler) fetch.Handler {
    return fetch.HandlerFunc(func(client *http.Client, req *http.Request) (*http.Response, error) {
        req.Header.Set("Authorization", "Bearer "+token)
        return next.Handle(client, req)
    })
})

ctx := context.Background()
resp := dispatcher.NewRequest().Get(ctx, "https://api.example.com/profile")
defer resp.Close()
```

## 核心概念速览

| 概念 | 说明 |
|------|------|
| `Dispatcher` | 持有 `*http.Client` 与全局中间件，线程安全 |
| `Request` | 累积 `RequestFunc`（`PreFuncs`/`UseFuncs`）与 `Middleware`（`Pre`/`Use`），在 `Do` 时先跑 formatter 再跑中间件 |
| HTTP 方法 | `Get`/`Post`/… 第一个参数均为 `context.Context` |
| `Response` | 永不为 nil；`resp.Error` 为传输/构造错误；4xx/5xx 需查状态码；**始终** `defer resp.Close()`（详见 [request.md](references/request.md)） |

## References

按需加载 references：仅当用户问题涉及该子主题时读取对应文件。

| 文件 | 内容 |
|------|------|
| [request.md](references/request.md) | Dispatcher、Request（RequestFunc/HTTP 方法/Clone/Do）、Response |
| [middleware.md](references/middleware.md) | 中间件挂载与 compose、URL/Header/Cookie、自定义模式 |
| [body.md](references/body.md) | 请求体编码（JSON/XML/Form/Multipart/BodyGet） |
| [dump.md](references/dump.md) | HTTP 交换日志（dump.New）、过滤器、分侧脱敏、SlogWriter |
