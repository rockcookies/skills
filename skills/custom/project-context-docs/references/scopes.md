# 作用域：显式清单与自动探测

> 何时读：第一次整理仓库、想改哪些目录有 AGENTS.md、识别结果不符合预期。

## 显式清单（推荐）

在 `.project-context-docs.json` 里列出 AGENTS.md 所在的目录，工具只维护这些：

```json
{
  "scopes": [
    ".",
    "apps/web",
    { "path": "packages/adapters", "desc": "适配器层：drizzle / redis / oss / http" },
    "backend",
    "backend/gosvc"
  ]
}
```

- 每项是目录路径（相对仓库根，`.` 是根），或带覆盖项的对象：`desc`（一句话职责，渲染进根 AGENTS.md 的清单表）、`docs`（该目录的文档子目录名，缺省 `docs`）、`maxLines`（该文件行数上限）。
- **加一行 = 纳入，删一行 = 不再维护**。没列的目录不会被要求有 AGENTS.md，也不用 `exclude`；它们若有清单文件，`audit` 只给一条 info（`SCOPE_UNLISTED`），可用 `reportUnlisted: false` 关掉。
- 列出的目录不需要清单文件：`tools/` 这类纯脚本目录也可以有 AGENTS.md。列出的目录里还有下级被列出，则它是"分组"。
- 即使目录位于被忽略的目录里（如 `unused/legacy`）或超过 `maxDepth`，列出了就会被扫描。
- 根永远是作用域，不用列也会维护；列它只是为了给根写 `desc` 之类的覆盖。
- 清单里的路径不存在 → `SCOPE_PATH_MISSING`（error），多半是目录改名或删除了，改清单即可。

首次生成清单：`node $S/ctx.mjs init` 预览，确认后 `--write`。默认只列根和单元（以及已有 AGENTS.md 的分组），`--groups` 把分组也列上。之后手改即可；再次 `init --force` 会按当前代码重生成，同路径项的覆盖项保留。

配置文件里允许整行 `//` 注释。

## 自动探测（init 的依据；没写 scopes 时也直接按它工作）

- **单元（unit）**：目录里有清单文件。内置：`package.json`(node)、`go.mod`(go)、`pom.xml`(maven)、`build.gradle[.kts]`/`settings.gradle[.kts]`(gradle)、`pyproject.toml`(python)、`Cargo.toml`(rust)、`composer.json`(php)、`*.csproj`(dotnet)；`extraManifests` 可加。
- **分组（group）**：自身无清单、但其下有单元的目录（如 `packages/`、`apps/`、`backend/services/`）。
- **根（root）**：仓库根，永远是一个作用域；根目录有清单时它同时是单元（技术栈可有多个，如 `go+node`）。
- 嵌套允许：Maven 父子模块、`backend/` 本身是单元且内含子单元，都按目录树建立 `parent`。
- `workspace` 字段记录该目录声明的 workspace 机制（pnpm、turbo、nx、lerna、go-work、gradle、npm-workspaces、maven-modules、cargo-workspace），仅作信息。

自动模式下识别不对时才需要 `exclude` / `include` / `ignore`（见 `config.md`）；用显式清单就不需要它们。

## 四种典型布局

**A. 经典 monorepo**
```
pnpm-workspace.yaml  packages/a/package.json  packages/b/package.json  apps/web/package.json
```
作用域：`.`、`packages`(分组)、`packages/a`、`packages/b`、`apps`(分组)、`apps/web`。

**B. 前后端分目录，后端 Java + Go**
```
backend/pom.xml  backend/svc/pom.xml  backend/gosvc/go.mod  frontend/package.json
```
作用域：`.`、`backend`(maven 单元，含 `maven-modules`)、`backend/svc`(parent=backend)、`backend/gosvc`(go)、`frontend`(node)。

**C. Go 项目，前端与 go.mod 同级**
```
go.mod  cmd/app/main.go  frontend/package.json
```
作用域：`.`(go 单元)、`frontend`(node)。`cmd/` 没有清单，不是作用域——Go 包内部结构不必拆作用域。

**D. 根目录混合技术栈**
```
go.mod  package.json  internal/…  web/…
```
作用域：`.`(stacks: go+node)。如果 `web/` 里没有自己的 package.json，它就不是单元；要独立作用域就在配置里 `include: ["web"]`。

`init` 会为上面每种布局给出对应的 scopes 建议；识别规则只看清单文件，与目录叫什么无关。
