# 请求体编码

所有 Body 方法返回 `*Request`，支持链式调用。`context.Context` 与链式方法表见 [request.md](request.md)、[middleware.md](middleware.md)。

## JSON

自动 `Content-Type: application/json`。接受 `string`、`[]byte` 或可 JSON marshal 的类型：

```go
ctx := context.Background()

type CreateUserReq struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

resp := dispatcher.NewRequest().
    JSON(CreateUserReq{Name: "John", Email: "john@example.com"}).
    Post(ctx, "https://api.example.com/users")
defer resp.Close()
```

```go
resp := req.JSON(map[string]any{"name": "John"}).Post(ctx, url)
defer resp.Close()
```

## XML

自动 `Content-Type: application/xml`：

```go
type User struct {
    XMLName xml.Name `xml:"user"`
    Name    string   `xml:"name"`
}

resp := req.XML(User{Name: "John"}).Post(ctx, url)
defer resp.Close()
```

## URL 编码表单

自动 `Content-Type: application/x-www-form-urlencoded`：

```go
form := url.Values{}
form.Set("username", "john")
form.Set("password", "secret123")

resp := req.Form(form).Post(ctx, "https://auth.example.com/login")
defer resp.Close()
```

## 原始 io.Reader

```go
reader := strings.NewReader(`{"raw":"data"}`)
resp := req.Body(reader).Post(ctx, url)
defer resp.Close()
```

可选 `BodyOptions`：`ContentType`、`AutoSetContentLength`（对实现 `Len() int` 的 reader 自动设 Content-Length）。

## BodyGet — 延迟求值（支持重试）

设置 `req.GetBody`，每次重试可重新打开 body：

```go
resp := req.BodyGet(func() (io.Reader, error) {
    return os.Open("payload.json")
}).Post(ctx, url)
defer resp.Close()
```

## Multipart

`Multipart` 通过 pipe 流式写入，避免整包载入内存；支持 per-field 进度回调。

### MultipartField 字段

| 字段 | 说明 |
|------|------|
| `Name` | 字段名（必填） |
| `Values` | 普通文本字段（多值写多个 `WriteField`） |
| `FileName` | 文件名（文件 part） |
| `ContentType` | MIME（空则 sniff 前 512 字节） |
| `GetReader` | `func() (io.ReadCloser, error)` 文件内容工厂（文件 part 必填） |
| `FileSize` | 用于进度计算 |
| `ExtraContentDisposition` | 额外 `Content-Disposition` 参数 |
| `ProgressCallback` | `func(MultipartFieldProgress)` |
| `ProgressInterval` | 回调最小间隔；`<= 0` 时默认 **1s** |

### 文本 + 文件

```go
fields := []*fetch.MultipartField{
    {Name: "description", Values: []string{"My uploaded file"}},
    {
        Name:     "file",
        FileName: "document.pdf",
        FileSize: 1024000,
        GetReader: func() (io.ReadCloser, error) {
            return os.Open("document.pdf")
        },
    },
}

ctx := context.Background()
resp := dispatcher.NewRequest().Multipart(fields).Post(ctx, "https://api.example.com/upload")
defer resp.Close()
```

### 进度回调

```go
fields := []*fetch.MultipartField{
    {
        Name:     "video",
        FileName: "recording.mp4",
        ContentType: "video/mp4",
        FileSize: 50 * 1024 * 1024,
        GetReader: func() (io.ReadCloser, error) {
            return os.Open("recording.mp4")
        },
        ProgressCallback: func(p fetch.MultipartFieldProgress) {
            pct := float64(p.Written) / float64(p.FileSize) * 100
            fmt.Printf("\rUploading %.1f%%", pct)
        },
        ProgressInterval: 200 * time.Millisecond,
    },
}

resp := dispatcher.NewRequest().Multipart(fields).Post(ctx, uploadURL)
defer resp.Close()
```

`MultipartOptions` 可选自定义 `Boundary`。
