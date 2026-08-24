# 提取

会说话的文件：`.md` `.json` `.yml` `.yaml` `.py` `.ts` `.tsx` `.js` `.jsx` `.mjs` `.cjs` `.go` `.sh` `.bash` `.txt` `.toml`。清单里其余文件是节点（0 出边）；扩展名未列的记入杂项。

边的一端是引用文件，另一端是解析后的目标。同一文件内重复同一目标记一条。

## 路径解析顺序

1. 相对引用文件所在目录（`./` `../` 或无前缀的相对段）。
2. 相对集合根 `skills/<repoKey>/`。
3. 仍不落盘 → **悬空**。

`http(s):`、`mailto:`、纯 `#anchor` → 不抽。带锚的路径（`foo.md#x`）只解析 `#` 前的文件。

## Markdown

抽：

- `[text](path)` 中的 `path`
- 反引号字符串：以 `references/`、`reference/`、`evals/`、`assets/`、`scripts/`、`agents/` 开头，或带已知扩展名（上表 + `.md`）

## JSON / YAML

抽字符串值：含 `/`，或带已知扩展名，且不是 URL。

典型：`evals.json` 里的 fixture 路径、`expected-findings` 里的源文件路径。

## Python

抽 `import x`、`from x import y`、`from .x import y`。

- 相对（`.` / `..`）或能在引用文件所在包内解析到 `.py` / 包目录 → 集合内边
- 出现在该技能 `requirements.txt` / `pyproject.toml`，或 Python 标准库 → **外部**
- 其余像第三方的 → **外部**；像本树模块却落不到文件 → **悬空**

## TypeScript / JavaScript

抽 `from '...'`、`from "..."`、`require('...')`、`import('...')`。

- `./` 或 `../` → 按路径解析顺序（补 `.ts` `.tsx` `.js` `.jsx` `.mjs` 与 `index`）
- 出现在该技能 `package.json` 的 `dependencies` / `devDependencies` → **外部**
- 裸包名其余 → **外部**

## Go

抽 `import "..."`。

- 相对本技能目录能解析到 `.go` → 集合内边
- 出现在该技能 `go.mod` 的 module / require，或 Go 标准库 → **外部**

## Shell

抽引号中以 `./` 开头、或带已知扩展名的路径。

## 不抽

evals 提示词、示例代码里的虚构仓库路径（`github.com/acme/...`、占位项目名）。判定：目标不落在本集合目录树内，且不是相对路径。

## 覆盖

清单中每个会说话的文件都要过一遍对应规则。抽不出边是合法结果（记 0 出边），与跳过该文件不是同一回事。
