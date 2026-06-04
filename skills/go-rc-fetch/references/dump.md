# HTTP 交换日志（dump 包）

`dump` 通过 `http.RoundTripper` 拦截 HTTP 交换，将 `DumpEntry` 交给 `DumpWriter`。使用 `dump.New` 构造 `*dump.Transport`，可安全并发用于 `http.Client`。

## 基础配置

```go
import (
    "log/slog"
    "net/http"

    fetch "github.com/rockcookies/go-fetch"
    "github.com/rockcookies/go-fetch/dump"
)

client := &http.Client{
    Transport: dump.New(
        http.DefaultTransport,
        dump.WithWriter(&dump.SlogWriter{
            Logger: slog.Default(),
            Level:  slog.LevelInfo,
        }),
        dump.WithOptions(dump.DumpOptions{
            RequestHeaders:  true,
            RequestBody:     true,
            ResponseHeaders: true,
            ResponseBody:    true,
        }),
    ),
}
dispatcher := fetch.NewDispatcher(client)
```

## DumpOptions

布尔字段选择捕获内容（`Method`、`URL`、`Status`、`Latency` 等元数据始终写入 `DumpMeta`）：

| 字段 | 说明 |
|------|------|
| `RequestHeaders` / `RequestBody` | 请求头、请求体 |
| `ResponseHeaders` / `ResponseBody` | 响应头、响应体（tee；**读完并 Close `resp.Body` 后**才写 dump） |
| `BodyMaxBytes` | 单段 body 上限；`0` → `DefaultBodyMaxBytes`（64 KiB）；`-1` → 不限 |
| `SkipBinaryBody` | 非 text-like `Content-Type` 时不捕获 body（下游仍收到完整 body） |
| `DumpOnError` | `RoundTrip` 返回 error 时也写一条 dump（`Meta.Err` 非 nil，`resp` 为 nil） |

```go
dump.WithOptions(dump.DumpOptions{
    RequestHeaders: true,
    ResponseBody:   true,
    BodyMaxBytes:   1024 * 1024,
    SkipBinaryBody: true,
    DumpOnError:    true,
})
```

## 响应体与 Close

开启 `ResponseBody` 时，`resp.Body` 被 tee 包装。调用方必须 **Read 并 Close**（建议 `defer resp.Body.Close()`）。未 Close 则 **不会** 写 dump（设计限制，非偶发丢失）。

`Meta.Latency` 统计到 dump 写入时刻：开启 `ResponseBody` 时包含读 body 时间；仅需 TTFB 时不要开 `ResponseBody` 或在业务侧单独计时。

## 流式请求体

请求体捕获走 `req.GetBody`（`BodyGetBytes` / `BodyGetReader` 会设置）。`GetBody == nil` 时（如 go-fetch `Multipart` 的 `io.Pipe`）**不读取** `req.Body`，避免死锁；`Meta.ReqBodySkipped` 为 true。

## 过滤器

`WithFilter` 在成功 `RoundTrip` 之后、读响应体之前评估（status、URL、请求头等）。返回 `false` 则跳过 dump。

`WithEntryFilter` 在捕获完成后、写入前评估，可访问 `DumpEntry.ReqBody` / `RespBody`（按 JSON 过滤、采样等）。

```go
dump.New(http.DefaultTransport,
    dump.WithWriter(&dump.SlogWriter{Logger: slog.Default()}),
    dump.WithOptions(dump.DumpOptions{RequestHeaders: true, ResponseHeaders: true}),
    dump.WithFilter(dump.StatusFilter([2]int{400, 599})),
    dump.WithEntryFilter(func(e dump.DumpEntry) bool {
        return !bytes.Contains(e.RespBody, []byte(`"error"`))
    }),
)
```

### 内置过滤器（WithFilter）

| 函数 | 说明 |
|------|------|
| `URLFilter(prefixes...)` | 路径以任一前缀开头 |
| `MethodFilter(methods...)` | HTTP 方法 |
| `StatusFilter(ranges...)` | 状态码落在 `[lo, hi]` |
| `HeaderFilter(keys...)` | 请求含全部指定头且值非空 |
| `AllFilters` / `AnyFilter` / `NotFilter` | 组合 |

采样示例（EntryFilter）：

```go
dump.WithEntryFilter(func(e dump.DumpEntry) bool {
    return rand.Float64() < 0.01 // 1% 采样
})
```

## 脱敏

`WithRequestRedactor` / `WithResponseRedactor` + `DefaultRedactor`（生产环境**建议必配**）。

```go
reqRedact := dump.DefaultRedactor{
    Headers: map[string]struct{}{
        "authorization": {},
        "x-api-key":     {},
        "cookie":        {},
    },
}
respRedact := dump.DefaultRedactor{
    Headers: map[string]struct{}{"set-cookie": {}},
}
```

## SlogWriter 与其它 Writer

`SlogWriter` 的 `req_body` / `resp_body` 属性最长 **2 KiB**（与 `BodyMaxBytes` 捕获上限独立）。

| 类型 | 说明 |
|------|------|
| `SlogWriter` | 结构化 slog |
| `IOWriter` | 可读文本 |
| `MultiWriter` | 扇出 |
| `NoopWriter` | 丢弃 |

### 慢 sink（异步）

`DumpWriter.Write` 在 RoundTrip 协程上**同步**调用。sink 慢（ES、Loki、Kafka）时请自定义 `DumpWriter`，用有界 channel + 后台 goroutine 投递；队列满可丢弃，避免拖慢 HTTP 客户端。

```go
type asyncDumpWriter struct {
    ch chan dump.DumpEntry
}

func newAsyncDumpWriter(inner dump.DumpWriter, size int) *asyncDumpWriter {
    w := &asyncDumpWriter{ch: make(chan dump.DumpEntry, size)}
    go func() {
        for e := range w.ch {
            _ = inner.Write(context.Background(), e)
        }
    }()
    return w
}

func (w *asyncDumpWriter) Write(ctx context.Context, e dump.DumpEntry) error {
    select {
    case w.ch <- e:
    default:
        // drop when full
    }
    return nil
}
```

## MetaExtractor

```go
dump.WithMetaExtractor(func(ctx context.Context) (traceID, reqID string) {
    return getTrace(ctx), getReqID(ctx)
}),
```

## DumpEntry / DumpMeta

```go
type DumpMeta struct {
    Method, URL     string
    Status          int
    Latency         time.Duration // 写到 dump 为止；ResponseBody 时含 Close 前读 body
    ReqBodySkipped  bool          // GetBody 为 nil 时跳过请求体捕获
    ReqBodyTruncated, RespBodyTruncated bool
    TraceID, ReqID  string
    Err             error
}
```

## 生产配置示例

```go
client := &http.Client{
    Transport: dump.New(
        http.DefaultTransport,
        dump.WithWriter(&dump.SlogWriter{Logger: slog.Default(), Level: slog.LevelInfo}),
        dump.WithOptions(dump.DumpOptions{
            RequestHeaders:  true,
            ResponseHeaders: true,
            ResponseBody:    true,
            BodyMaxBytes:    512 * 1024,
            SkipBinaryBody:  true,
            DumpOnError:     true,
        }),
        dump.WithFilter(dump.NotFilter(dump.URLFilter("/healthz", "/readyz"))),
        dump.WithRequestRedactor(dump.DefaultRedactor{
            Headers: map[string]struct{}{
                "authorization": {},
                "x-api-key":     {},
                "cookie":        {},
            },
        }),
        dump.WithResponseRedactor(dump.DefaultRedactor{
            Headers: map[string]struct{}{"set-cookie": {}},
        }),
    ),
}
dispatcher := fetch.NewDispatcher(client)
```
