---
name: hierarchical-agents-md
description: >-
  层级 AGENTS.md / README.md：init、update、audit、reorganize、trim。
  初始化 Agent 指令、代码改动后同步文档、检查文档漂移、重组仓库文档层级、精简规则与 Skills。
  Not for 写业务代码或生成文档站点。
when_to_use: >-
  init / update / audit / reorganize / trim；初始化 Agent 指令、代码改动后同步文档、检查文档漂移或冲突、
  整理 docs 层级、精简规则、瘦身上下文、清理 Skills、模型升级后复查上下文。
license: MIT
compatibility: Requires Python 3.10+. Git is recommended for change-aware maintenance; no third-party Python packages are required.
user-invocable: true
metadata:
  author: rockcookies
  version: "1.2.0"
---

# 层级 AGENTS.md 维护

目标：项目指令和人读说明有证据、有层级、不重复，Agent 每轮加载的内容尽量少。

## 约束

1. **证据先行。** 命令、路径、架构、支持功能只写仓库里核实过的；推断和未知不写成事实。证据优先级与标签见 [references/evidence-policy.md](references/evidence-policy.md)。
2. **保留用户意图。** 不为套模板整段替换；不因模板里没有就删内容，先判断它是否承载项目特有的不变量或决策。
3. **一份文档一个用途。** `AGENTS.md` 管 Agent 怎么干活；`README.md` 管人怎么理解和使用；深层设计放 `docs/`。落点细则见 [references/content-routing.md](references/content-routing.md)。
4. **有本地独有规则才加嵌套 `AGENTS.md`。** 门槛、预算、继承见 [references/hierarchy-model.md](references/hierarchy-model.md)。
5. **规则变了就替换，不追加第二版。** 合并重复，化解矛盾。
6. **只维护 `AGENTS.md`，不新建 `CLAUDE.md`。** 根目录有 `CLAUDE.md` 会让 Claude Code 不再读 `AGENTS.md`。已有的客户端专用文件不当第二份正文维护。细则见 [hierarchy-model](references/hierarchy-model.md)。
7. **结果要可审。** 大范围 init / reorganize / trim 先出清单，用户确认后再改；聚焦 update 做最小改动并报告。
8. **验证要真跑。** 没跑成功的检查不报通过；只查了仓库一部分，不称全面 audit；不为让任务看起来成功而关掉失败的检查。

## 模式

从请求推断模式，意图清楚时不再询问。`SKILL_DIR` 是含本文件的目录，`REPO_ROOT` 是目标仓库根；不要假定技能装在目标仓库里。

| 模式 | 完成标准 | 细则 |
|---|---|---|
| `init` | 用户确认过拟议层级；落地文件的事实都核实过，占位符已替换或删除；audit 已跑 | 先读 [maintenance-workflow](references/maintenance-workflow.md) 再执行 |
| `update` | 每个改动路径都对照过归属文档；有意不改的候选写明原因；audit 已跑 | 先读 [maintenance-workflow](references/maintenance-workflow.md) 再执行 |
| `audit` | 每份相关文档对照源码/配置/测试做过语义核对；发现按 P0–P3 列出；未要求修复则未改文件 | 先读 [maintenance-workflow](references/maintenance-workflow.md) 再执行 |
| `reorganize` | 逐文件拟议地图已出示；重复/冲突/错放已处理；移动后的入站链接已更新并校验；audit 已跑 | 先读 [maintenance-workflow](references/maintenance-workflow.md) 再执行 |
| `trim` | 清单经用户确认后才动文件；每条消失行都对得上已确认的删除；移走的内容经 canary 验证会被加载 | 先读 [context-trim](references/context-trim.md) 再执行 |

## 工具

只用 Python 标准库，只读。参数与限制见 [references/tooling.md](references/tooling.md)。

```bash
python "<SKILL_DIR>/scripts/inventory.py" "<REPO_ROOT>" --format markdown   # 含 Agent 上下文加载量
python "<SKILL_DIR>/scripts/changed_files.py" "<REPO_ROOT>" [--base origin/main]
python "<SKILL_DIR>/scripts/audit.py" "<REPO_ROOT>"                         # 含 paths: glob 检查
python "<SKILL_DIR>/scripts/lost_lines.py" "<REPO_ROOT>" --base <ref>       # trim 后的消失行
python "<SKILL_DIR>/scripts/lost_lines.py" <OLD_DIR> <NEW_DIR>
```

## 完成报告

模式；创建/修改/移动/有意未改的文件；看过的证据；跑过的检查及结果；仍需人工复核的项。格式见 maintenance-workflow。
