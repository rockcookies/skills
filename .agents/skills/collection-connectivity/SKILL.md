---
name: collection-connectivity
description: 审查 <repoKey> 集合（skills/agents/rules dest，commands 预留）的引用连通性（路径、import、评测链路、仓库目录、dependencies.ts 依赖声明），只出意见不改文件。
disable-model-invocation: true
metadata:
  internal: true
---

# 集合连通性

审查一个 `<repoKey>` 集合的文件引用**连通性**：`skills/<repoKey>/`、`agents/<repoKey>/`、`rules/<repoKey>/`（`commands/<repoKey>/` 出现时一并纳入）里抽出的每条引用都能在磁盘上解析，[dependencies.ts](../../../dependencies.ts) 的每条声明都能落地。输出中文审查意见。完整性看边是否解析完，不看是否通读每个文件。

始终精读全部 `SKILL.md` 与 agent / rule 的 `.md`。其余文件深读引用边两端，以及入度为 0 的孤立节点。

## 1. 解析

从请求取出 `<repoKey>`。用户只点了技能名时，父目录仍是审查单元（跨技能边算进该集合）；只点 agent 或 rule 名同理。

未点名：列出 `skills/` 一把手目录并停等。

三棵 dest 树（`skills/`、`agents/`、`rules/` 下同名 `<repoKey>/`）全不存在：列出 `skills/` 后终止。部分存在：存在的纳入，缺的记下原因。

**完成标准：** 至少一棵 `<repoKey>` dest 树存在，审查单元已定。

## 2. 清单

递归列出各棵 dest 树内文件，排除 `node_modules`、`.git`、`vendor`、`dist`、`build`、`__pycache__`。

按类统计：每个含 `SKILL.md` 的目录是一个技能；`agents/<repoKey>/*.md` 是 agent；`rules/<repoKey>/*.md` 是 rule。给出 N 个技能、A agents、R rules、M 个文件。

**完成标准：** 有完整清单，并能说出四类计数。

## 3. 提取

读 [references/extract.md](references/extract.md)，对清单里每个会说话的文件抽边。纯资源或空文件记 0 出边。未列入提取表的扩展名只记入杂项。

**完成标准：** 边表覆盖清单中每个会说话的文件。

## 4. 落盘

每条抽出的边标成 **命中** / **悬空** / **外部**：

- 相对路径：先相对引用文件所在目录，再试所属 dest 树根，最后试仓库根（跨树边，如 agent 引用 `../skills/<repoKey>/…`）。
- 代码 import：集合内相对模块是边；该技能 `requirements.txt` / `package.json` / `go.mod` 或语言标准库是 **外部**。

建图：条目内、集合内（跨条目）、跨树（skills ↔ agents ↔ rules）。清单中每个文件都是节点，含 0 度节点。

**完成标准：** 每条抽出的边都有且仅有一个标记。

## 5. 仓库级

四项能做的都做；缺产物就跳过并记下原因：

- **meta.ts**：该 key 的 `skills[]` / `agents[]` / `rules[]` mapping 的 `name` 与磁盘上对应产物 1:1（技能目录含 `SKILL.md`，agent / rule 的 `.md` 存在）。`custom` 无 meta 条目 → 只核 README 的 Hand-maintained Skills 表。
- **dependencies.ts**：与 meta.ts 平级。`skills` / `agents` / `rules` / `commands` 四个分区里，每个声明 key 与各复数键数组引用都按类别解析到映射产物或 custom 技能；`commands` 引用记悬空（该类尚无同步产物）；悬空记仓库级缺口。
- **SYNC.json**：各棵 dest 树有则核 `upstream_committed_sha` + `items_digest` 两键，格式对照其他集合。没有（如 `custom`）→ 跳过。
- **README.md**：按 AGENTS.md，这是用户面向安装目录。Skills / Agents / Rules 表分别用集合 key 与各条目名搜索；零命中记为仓库级缺口。

**完成标准：** 四项（或适用项）均有结论。

## 6. 语义

存在 `evals/`、或 SKILL.md 出现 `Rule N` 衔接到另一文件、或清单含代码文件时，读 [references/semantic.md](references/semantic.md) 并做其中适用的检查。

**完成标准：** 该走的检查都走了，或已写明跳过原因。

## 7. 标识符

反引号或代码字体中、**不像路径** 的技能名 / 子代理类型 / 规则名，逐个归入一类：

| 类 | 判定 |
|---|---|
| 集合内技能 | 本集合某技能目录名或 SKILL.md frontmatter `name` |
| 集合内 agent / rule | `agents/<repoKey>/`、`rules/<repoKey>/` 下的条目名 |
| 本仓库其他集合 | `skills/<otherKey>/…`、`agents/<otherKey>/…`、`rules/<otherKey>/…` 的条目名 |
| 运行时类型 | 本集合某 SKILL.md 已把它写成子代理 / 运行时类型 |
| 未知 | 以上皆未命中 → 悬空标识符 |

路径形态的反引号字符串走第 3–4 步，不走本步。

**完成标准：** 每个候选都有类；未知项列出。

## 8. 汇报

读 [references/report.md](references/report.md)。先 3–6 句旁白，再交审查意见。本技能的产物是这段回复。

**完成标准：** 范围、方法、悬空数、图谱、问题与可选建议都在回复里，用户无需追问。
