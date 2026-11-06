---
name: hierarchical-agents-md
description: >-
  init、update、audit 或 reorganize 以 AGENTS.md 与 README.md 为中心的层级项目文档：
  初始化 Agent 指令、代码改动后更新文档、审计过期或冲突文档、重组仓库文档层级。
license: MIT
compatibility: Requires Python 3.10+. Git is recommended for change-aware maintenance; no third-party Python packages are required.
user-invocable: true
metadata:
  author: rockcookies
  version: "1.0.0"
---

# 层级 AGENTS.md 维护

用有证据支撑的小层级维护项目指令和人读说明。优先增量改；写明确规则；结构求简。

## 核心契约

1. **先读再写。** 改之前读现有 `AGENTS.md`、`README.md`、相关 docs、仓库配置、源码和测试。
2. **以代码和可执行配置为证据。** 不编造命令、架构、目录归属、支持功能或约定。需要时写上具体路径。证据标签与优先级见 [references/evidence-policy.md](references/evidence-policy.md)。
3. **保留用户意图。** 不为套模板而整段替换或大范围重写已有文档。
4. **一份文档一个用途。** `AGENTS.md` 管 Agent 怎么在该作用域干活；`README.md` 管人怎么理解、使用、构建或接入；更深设计放 `docs/`。落点细则见 [references/content-routing.md](references/content-routing.md)。
5. **有本地实质指令才加嵌套 `AGENTS.md`。** 目录存在不够。何时加、预算与继承见 [references/hierarchy-model.md](references/hierarchy-model.md)。
6. **改，不要盲目追加。** 规则变了就替换或删掉过时条目；合并重复、化解矛盾。
7. **改动要可审。** 大范围 init / reorganize：先给出拟议文件图和简短计划。聚焦 update：做最小安全改动并报告。
8. **改完再校验。** 跑自带 audit 脚本和相关项目检查。不为让文档任务看起来成功而关掉失败的测试或检查。

只维护 `AGENTS.md` 作为 Agent 指令入口；Claude Code 直接读它。不要新建 `CLAUDE.md`（细则见 hierarchy-model）。

## 文档职责（速查）

| 文档 | 放什么 | 不放什么 |
|---|---|---|
| 根 `AGENTS.md` | 全局工作流、根上核实过的命令、普适约束、指向更深指引的链接 | 产品概述、完整架构、从 README 抄来的内容 |
| 嵌套 `AGENTS.md` | 本地命令、包边界、不变量、生成代码规则、测试陷阱 | 根里已有的规则；泛泛最佳实践 |
| 根 / 嵌套 `README.md` | 给人的用途、安装、用法、配置、独立组件入口 | Agent 私有工作流 |
| `docs/` | 架构、ADR、runbook、概念、API 细节 | 每次编码任务都必须加载的规则 |

创建或移动文档前读 content-routing。划作用域边界时读 hierarchy-model。

## 工作模式

从用户请求推断模式。意图清楚时不要再问用哪个模式。脚本路径里的 `SKILL_DIR` 是含本 `SKILL.md` 的安装目录；`REPO_ROOT` 是目标仓库根。旗标细节见 [references/tooling.md](references/tooling.md)。

### `init` — 初始化文档

**完成标准：** 用户已确认拟议层级；落地的文件都有核实事实填入（或占位已删）；跑过 audit；完成报告写明创建/保留的文件与证据。

1. `python "<SKILL_DIR>/scripts/inventory.py" "<REPO_ROOT>" --format markdown` 盘点仓库。
2. 检查根与可能的模块入口：manifest、lockfile、构建、CI、容器/部署、源码布局、测试、已有文档。
3. 找出真实项目边界。优先根 `AGENTS.md`，外加少量有理由的嵌套文件。
4. 根 `README.md` 已有则保留并改进；新建只写已核实事实。不要把 README 写成 Agent 指令文件。
5. 给出简明拟议层级（每文件用途），确认后落地最小有用的一套。
6. `templates/` 只当提示。每个占位符换成已核实事实，或删掉。

### `update` — 改动后维护

**完成标准：** 每个改动路径都对照过归属候选；契约/工作流未变的候选有意不改并说明；改过的文档已替换过时陈述；跑过 audit；完成报告按 [references/maintenance-workflow.md](references/maintenance-workflow.md) 的格式写清证据。

1. 仓库当前改动：`python "<SKILL_DIR>/scripts/changed_files.py" "<REPO_ROOT>"`；分支对比加 `--base <ref>`。
2. 读相关文件完整 diff，不只看文件列表。含测试、配置、生成代码标记、公开 API。
3. 把每个改动路径映射到最近归属 `AGENTS.md` 与候选 `README.md`。脚本只报候选，不裁定必须改。
4. 按 content-routing 决定是否改、改哪一类读者的文档。
5. 对照现有规则：替换过时陈述，不给同一规则再加第二版。
6. 不动无关文档；有意不改的候选写明原因。

### `audit` — 检查文档体系

**完成标准：** 静态 audit 已跑；每份相关 `AGENTS.md`/`README.md` 已对照源码/配置/测试做过语义核对；发现按 P0–P3 与文件列出（级别见 maintenance-workflow）；未要求修复则未改文件；要求修复则改完并重跑 audit。

1. `python "<SKILL_DIR>/scripts/audit.py" "<REPO_ROOT>"`。
2. 在上下文中读每份 `AGENTS.md` 和 `README.md`。静态检查不能判定语义。
3. 对照当前源码/配置/测试，核命令、引用路径、依赖名、架构说法和示例。
4. 按严重级别和文件报告。已确认错误、可能漂移、改进建议分开写。
5. 未要求修复时只读。要求修复时做针对性修改，再重跑 audit。

### `reorganize` — 调整层级

**完成标准：** 逐文件拟议地图已出示（或用户明确要求直接执行）；重复/冲突/错放已处理；移动后的入站相对链接已更新并校验；跑过 audit。

1. 盘点全部指令文件和 README（inventory 会标出已有客户端专用文件）。
2. 做拟议地图：当前路径、拟议路径/动作、作用域、理由、要保留的内容。
3. 找出重复规则、冲突规则、错放的人读内容、没有本地独有政策的目录。
4. 重复的全局规则收到根；嵌套只留真正本地的规则。
5. 架构说明与稳定设计细节挪到 `docs/`，不靠撑大 `AGENTS.md`。
6. 只有用户要求或任务明确包含移动时才动手。更新入站相对链接并校验。

## 每个模式都要遵守

- 解释相对路径前，先确定仓库根与工作树状态。
- 创建、覆盖、移动或删除前，先检查已有文件。
- 已确认 / 推断 / 未知：不把后两者写成事实（见 evidence-policy）。
- 优先小而可逆的改动。
- 除非被要求统一风格，否则保留仓库已有语言和文风。
- 命令可复制粘贴，对照脚本/配置核实；工作目录有影响时写明。
- 仓库文档之间用相对链接。
- 不加没有维护机制就会过期的时间戳、提交哈希或指纹。
- 只检查了仓库一部分时，不声称做了全面 audit。

## 自带工具

脚本只用 Python 标准库，且只读。不要假定技能装在目标仓库里。

```bash
python "<SKILL_DIR>/scripts/inventory.py" "<REPO_ROOT>" --format markdown
python "<SKILL_DIR>/scripts/changed_files.py" "<REPO_ROOT>"
python "<SKILL_DIR>/scripts/changed_files.py" "<REPO_ROOT>" --base origin/main
python "<SKILL_DIR>/scripts/audit.py" "<REPO_ROOT>"
python "<SKILL_DIR>/scripts/audit.py" "<REPO_ROOT>" --format json
```

仓库文档写的是 `python` 就用 `python`。Windows 上也可用 `py -3`。完整选项与限制见 tooling。

## 完成报告

结束时报告：使用的模式；创建/修改/移动/有意未改的文件；看过的证据（关键路径与适用时的 Git 范围）；跑过的检查及其结果；仍不确定或需人工复核的项。

没实际跑过并成功的检查，不要报成通过。
