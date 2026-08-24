---
name: skill-connectivity
description: 审查 skills/<repoKey> 集合内文件引用连通性（路径、import、评测链路、仓库目录），只出意见不改文件。
disable-model-invocation: true
metadata:
  internal: true
---

# 引用连通性

审查一个 `skills/<repoKey>/` 集合的文件引用**连通性**：抽出的每条引用都能在磁盘上解析。输出中文审查意见。完整性看边是否解析完，不看是否通读每个文件。

始终精读全部 `SKILL.md`。其余文件深读引用边两端，以及入度为 0 的孤立节点。

## 1. 解析

从请求取出 `<repoKey>`。用户只点了技能名时，父目录仍是审查单元（跨技能边算进该集合）。

未点名：列出 `skills/` 一把手目录并停等。

`skills/<repoKey>/` 不存在：列出 `skills/` 后终止。

**完成标准：** `skills/<repoKey>/` 存在，审查单元已定。

## 2. 清单

递归列出集合内文件，排除 `node_modules`、`.git`、`vendor`、`dist`、`build`、`__pycache__`。

统计 `SKILL.md` 个数与文件总数。每个含 `SKILL.md` 的目录是一个技能。

**完成标准：** 有完整清单，并能说出「N 个技能、M 个文件」。

## 3. 提取

读 [references/extract.md](references/extract.md)，对清单里每个会说话的文件抽边。纯资源或空文件记 0 出边。未列入提取表的扩展名只记入杂项。

**完成标准：** 边表覆盖清单中每个会说话的文件。

## 4. 落盘

每条抽出的边标成 **命中** / **悬空** / **外部**：

- 相对路径：先相对引用文件所在目录，再试集合根 `skills/<repoKey>/`。
- 代码 import：集合内相对模块是边；该技能 `requirements.txt` / `package.json` / `go.mod` 或语言标准库是 **外部**。

建两张图：技能内、集合内（跨技能）。清单中每个文件都是节点，含 0 度节点。

**完成标准：** 每条抽出的边都有且仅有一个标记。

## 5. 仓库级

三项能做的都做；缺产物就跳过并记下原因：

- **meta.ts**：该 key 的 `skills[].target` 与磁盘上含 `SKILL.md` 的目录 1:1。`custom` 无 meta 条目 → 只核 README 的 Hand-maintained Skills 表。
- **SYNC.json**：有则核 `sha` + `synced` 两键，格式对照其他集合。没有（如 `custom`）→ 跳过。
- **README.md**：按 AGENTS.md，这是用户面向安装目录。用集合 key 与各技能名搜索；零命中记为仓库级缺口。

**完成标准：** 三项（或适用项）均有结论。

## 6. 语义

存在 `evals/`、或 SKILL.md 出现 `Rule N` 衔接到另一文件、或清单含代码文件时，读 [references/semantic.md](references/semantic.md) 并做其中适用的检查。

**完成标准：** 该走的检查都走了，或已写明跳过原因。

## 7. 标识符

反引号或代码字体中、**不像路径** 的技能名 / 子代理类型，逐个归入一类：

| 类 | 判定 |
|---|---|
| 集合内技能 | 本集合某技能目录名或 SKILL.md frontmatter `name` |
| 本仓库其他集合 | `skills/<otherKey>/<target>/` 的目录名或 `name` |
| 运行时类型 | 本集合某 SKILL.md 已把它写成子代理 / 运行时类型 |
| 未知 | 以上皆未命中 → 悬空标识符 |

路径形态的反引号字符串走第 3–4 步，不走本步。

**完成标准：** 每个候选都有类；未知项列出。

## 8. 汇报

读 [references/report.md](references/report.md)。先 3–6 句旁白，再交审查意见。本技能的产物是这段回复。

**完成标准：** 范围、方法、悬空数、图谱、问题与可选建议都在回复里，用户无需追问。
