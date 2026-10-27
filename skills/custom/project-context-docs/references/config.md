# 配置 `.project-context-docs.json`

> 何时读：改作用域清单、调整识别结果、改变审计严格度。文件放在仓库根，可选；它是纯数据，改它不需要改技能。允许整行 `//` 注释。
> 用显式 `scopes` 时，`exclude` / `include` / `requireAgents` 基本用不上；它们只服务自动模式。
> 用 JSON 而非 YAML，是为了脚本零依赖、解析结果确定。

```json
{
  "scopes": [".", "apps/web", { "path": "packages/adapters", "desc": "适配器层" }],
  "reportUnlisted": true,
  "docFrontmatter": "type",
  "ignore": ["unused"],
  "exclude": ["examples/**"],
  "include": ["web"],
  "extraManifests": { "BUILD.bazel": "bazel" },
  "maxDepth": 6,
  "rootDocs": "docs",
  "docsDirs": ["docs"],
  "requireAgents": "units",
  "agentsMaxLines": 120,
  "rootAgentsMaxLines": 160,
  "routeCollapse": ["decisions", "adr", "adrs"],
  "claudeEntry": true,
  "staleCheck": true,
  "standards": ["docs/governance/documentation.md"]
}
```

| 键 | 默认 | 含义 |
|---|---|---|
| `scopes` | 无（自动模式） | **AGENTS.md 所在目录清单**；给出即进入显式模式，详见 `scopes.md`。项可为路径字符串，或 `{path, desc, docs, maxLines}` |
| `reportUnlisted` | true | 显式模式下，提示有清单文件却没列入 scopes 的目录（info） |
| `docFrontmatter` | `type` | `type`：docs 下概念文档须有 frontmatter `type`（OKF）；`off`：不检查 |
| `ignore` | `[]` | 追加到内置忽略（`node_modules dist build target .turbo vendor …`）的**目录名** |
| `exclude` | `[]` | 按仓库相对路径的 glob，命中的目录整棵不扫描 |
| `include` | `[]` | 强制视为单元的目录 glob |
| `extraManifests` | `{}` | 文件名 → 技术栈名 |
| `maxDepth` | 6 | 扫描深度 |
| `rootDocs` | `docs` | 根级文档目录 |
| `docsDirs` | `["docs"]` | 单元下被当作模块文档的子目录名，取第一个存在的 |
| `requireAgents` | `units` | `root`：只要求根；`units`：根+每个单元；`all`：连分组也要求 |
| `agentsMaxLines` / `rootAgentsMaxLines` | 120 / 160 | 超出报 `AGENTS_TOO_LONG` |
| `routeCollapse` | `decisions adr adrs` | 这些目录在路由表里折叠成一行 |
| `claudeEntry` | true | 要求有 AGENTS.md 的作用域同时有导入它的 CLAUDE.md |
| `staleCheck` | true | 用 git 提交时间判断文档是否落后于 `covers` |
| `standards` | 自动探测 | 仓库自己的文档规范；空则在 `rootDocs` 下找 `documentation*.md` 等 |
