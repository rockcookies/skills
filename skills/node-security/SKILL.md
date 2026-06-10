---
name: node-security
description: >-
  JS/TS 安全最佳实践——注入防护（SQL、命令、XSS）、原型污染、弱随机（`Math.random` vs `crypto`）、密钥管理、依赖审计（`npm audit`/`osv`）、ReDoS、路径穿越、SSRF、安全 Cookie。审计与审查模式。
user-invocable: true
metadata:
  author: skills-repo
  version: 1.0.0
---

**Persona:** 你是 Node.js 安全工程师。你在编写代码和审计代码时都保持攻击者视角——漏洞预防永远比事后修复便宜。

**模式：**

- **Review 模式** — 审查 PR 中的安全问题。从变更文件出发，追溯数据流入相邻代码——漏洞可能在 diff 之外但被 diff 触发。
- **Audit 模式** — 全库安全扫描。启动最多 5 个并行子代理，分别覆盖：(1) 注入模式，(2) 加密与密钥，(3) Web 安全与 Header，(4) 认证与授权，(5) 依赖漏洞。按严重性汇总报告。
- **Coding 模式** — 编写安全敏感代码或修复已知漏洞时，按本技能顺序执行。

---

# Node.js / TypeScript 安全最佳实践

## 安全思维模型

编写或审查代码前先问三个问题：
1. **信任边界在哪里？** — 不可信数据从何处进入系统？（HTTP body、上传文件、环境变量、其他服务写的数据库行）
2. **攻击者能控制什么？** — 哪些输入流入了敏感操作？（SQL 查询、Shell 命令、HTML 输出、文件路径、加密操作）
3. **爆炸半径是多大？** — 如果这层防御失败，最坏结果是什么？（数据泄露、RCE、权限提升、拒绝服务）

## 1. 注入防护

### SQL 注入

```ts
// ✓ Good — 参数化查询将数据与代码分离
const user = await db.query(
  'SELECT * FROM users WHERE id = $1 AND status = $2',
  [userId, 'active'],
)

// ✓ Good — ORM 自动参数化
const user = await prisma.user.findFirst({
  where: { id: userId, status: 'active' },
})

// ✗ Bad — 字符串拼接直接导致 SQL 注入
const user = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`,  // 危险！
)
```

### 命令注入

```ts
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// ✓ Good — 参数作为独立数组，不经过 shell 解析
const { stdout } = await execFileAsync('ffmpeg', [
  '-i', inputFile,
  '-codec', 'copy',
  outputFile,
])

// ✗ Bad — exec/shell 解析整个字符串，攻击者可注入 ;rm -rf
import { exec } from 'node:child_process'
exec(`ffmpeg -i ${inputFile} output.mp4`)  // 危险！
```

### XSS 防护

```ts
// ✓ Good — 框架自动转义（React JSX、Vue template）
function UserCard({ name }: { name: string }) {
  return <div>{name}</div>  // React 自动 HTML 转义
}

// ✓ Good — 服务端渲染必须手动转义
import escapeHtml from 'escape-html'
const safeHtml = `<span>${escapeHtml(userInput)}</span>`

// ✗ Bad — dangerouslySetInnerHTML 接受用户输入
<div dangerouslySetInnerHTML={{ __html: userInput }} />  // 危险！

// ✗ Bad — innerHTML 直接赋值
element.innerHTML = userComment  // 危险！
```

## 2. 原型污染

```ts
// ✗ Bad — 合并用户控制的对象可能污染 Object.prototype
function merge(target: object, source: unknown) {
  for (const key in (source as any)) {
    (target as any)[key] = (source as any)[key]  // __proto__ 污染
  }
}

// ✓ Good — 使用安全的合并方式
const merged = Object.assign(Object.create(null), target, source)
// 或者用 structuredClone + 明确的类型验证

// ✓ Good — 拒绝危险键名
function safeMerge(target: Record<string, unknown>, source: unknown) {
  if (typeof source !== 'object' || source === null) return target
  const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
  for (const [k, v] of Object.entries(source)) {
    if (!DANGEROUS_KEYS.has(k)) target[k] = v
  }
  return target
}
```

## 3. 密码学：`Math.random` vs `crypto`

```ts
// ✗ Bad — Math.random 是伪随机，不适用于安全场景
const token = Math.random().toString(36).slice(2)  // 可预测！
const sessionId = Math.floor(Math.random() * 1e15).toString()

// ✓ Good — crypto.randomBytes 用于 token/nonce/session ID
import { randomBytes } from 'node:crypto'
const token = randomBytes(32).toString('hex')   // 64 字符 hex token
const nonce = randomBytes(16).toString('base64url')

// ✓ Good — 密码哈希用 bcrypt/argon2，不用 SHA
import { hash, verify } from '@node-rs/argon2'
const hashed = await hash(password)
const isValid = await verify(hashed, password)

// ✗ Bad — 用 SHA 哈希密码（可暴力破解）
import { createHash } from 'node:crypto'
const hashed = createHash('sha256').update(password).digest('hex')  // 危险！
```

## 4. 密钥管理

```ts
// ✓ Good — 从环境变量读取，永不硬编码
const dbPassword = process.env.DB_PASSWORD
if (!dbPassword) throw new Error('DB_PASSWORD env var required')

// ✓ Good — 生产环境用密钥管理服务
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

// ✗ Bad — 硬编码密钥
const apiKey = 'sk-prod-abc123xyz'  // 会进代码库！
const jwtSecret = 'my-secret-key'  // 危险！

// ✗ Bad — 密钥写入日志
logger.info({ apiKey: process.env.API_KEY }, 'starting server')  // 危险！
```

## 5. 路径穿越

```ts
import { resolve, join } from 'node:path'
import { readFile } from 'node:fs/promises'

const UPLOAD_DIR = '/var/uploads'

// ✓ Good — 验证解析后的路径在允许目录内
async function readUploadedFile(filename: string): Promise<Buffer> {
  const safePath = resolve(UPLOAD_DIR, filename)
  if (!safePath.startsWith(UPLOAD_DIR + '/')) {
    throw new ForbiddenError('path traversal detected')
  }
  return readFile(safePath)
}

// ✗ Bad — 直接拼接用户输入
async function readUploadedFile(filename: string) {
  return readFile(join(UPLOAD_DIR, filename))  // ../../../etc/passwd 可穿越
}
```

## 6. SSRF 防护

```ts
import { URL } from 'node:url'

const ALLOWED_HOSTS = new Set(['api.example.com', 'cdn.example.com'])

// ✓ Good — 严格白名单验证 URL
function validateWebhookUrl(rawUrl: string): URL {
  const url = new URL(rawUrl)  // 格式验证（无效 URL 抛异常）

  if (url.protocol !== 'https:') {
    throw new ValidationError('url', 'only https allowed')
  }
  if (!ALLOWED_HOSTS.has(url.hostname)) {
    throw new ValidationError('url', 'hostname not allowed')
  }
  return url
}

// ✗ Bad — 直接使用用户提供的 URL
await fetch(req.body.webhookUrl)  // 攻击者可访问内网服务
```

## 7. ReDoS（正则拒绝服务）

```ts
// ✗ Bad — 回溯爆炸：大输入时 O(2^n)
const emailRegex = /^([a-zA-Z0-9]+\.)*[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/

// ✓ Good — 线性正则，无嵌套量词
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ✓ Good — 对用户提供的正则设置超时（Node 22+ 支持 timeout 选项）
// 或使用 safe-regex 库检测危险正则
```

## 8. 安全 Cookie

```ts
// ✓ Good — 完整的安全 Cookie 属性
res.cookie('session', token, {
  httpOnly: true,    // 禁止 JS 访问，防 XSS 窃取
  secure: true,      // 仅 HTTPS 传输
  sameSite: 'strict', // 防 CSRF
  maxAge: 3600000,   // 1 小时过期
  path: '/',
})

// ✗ Bad — 不安全的 Cookie
res.cookie('session', token)  // 无任何保护属性
```

## 9. 依赖审计

```bash
# 定期运行，CI 中集成
npm audit --audit-level=high
# 或使用 OSV Scanner（更全面）
osv-scanner --lockfile pnpm-lock.yaml
```

## 严重性速查

| 严重性 | 漏洞类型 | 修复时限 |
|--------|----------|----------|
| 严重 | SQL/命令注入、RCE、凭据泄露 | 立即修复 |
| 高危 | XSS、认证绕过、路径穿越、SSRF | 当前迭代内 |
| 中危 | 原型污染、弱随机、ReDoS | 下一迭代 |
| 低危 | 信息泄露、不安全 Cookie 属性 | 择期修复 |

---

交叉引用：运行时正确性 bug 见 `node-safety`，结构化日志与告警见 `node-observability`，认证错误处理见 `node-error-handling`。
