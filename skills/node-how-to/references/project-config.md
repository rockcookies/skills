# Configure 模式——在项目中强制触发 Node 技能

本工作流在项目的 agent 配置文件中追加 `## Required Node skills` 区块，使指定技能始终加载，而不受触发启发式影响。

## 何时使用

- 项目对某技能有硬性要求（例如 `node-security` 必须始终生效，而不仅在用户提到"安全"时）。
- 团队约定了一组固定的 Node/TS 标准，需在每次 AI 交互时强制执行。

## 步骤 1——探测项目配置文件

按以下优先级检查：

```
1. CLAUDE.md                          (Claude Code)
2. AGENTS.md                          (OpenAI Codex、OpenCode、多 agent)
3. .cursor/rules                      (Cursor)
4. .github/copilot-instructions.md    (GitHub Copilot)
```

用 `Glob` 探测项目根目录存在哪些文件。若存在多个，全部更新（不同工具读不同文件）。若都不存在，用 `AskUserQuestion` 询问用户要创建哪个。

## 步骤 2——幂等性检查

写入前，grep 每个文件是否已有 `## Required Node skills` 区块：

```bash
grep -n "## Required Node skills" CLAUDE.md
```

若已存在，读取并与用户确认是原地更新（替换列表）还是跳过。

## 步骤 3——与用户确认技能集

用 `AskUserQuestion` 确认要始终加载哪些技能。把 ⭐️ 推荐技能作为默认选择。提醒用户 token 预算（每个常驻技能会把其描述 token 加到每次会话）。

适合多数项目的 ⭐️ 推荐集：

```
node-code-style
node-design-patterns
node-documentation
node-error-handling
node-naming
node-safety
node-security
node-testing
node-types
```

按代码库上下文追加建议：

- 检测到大量异步/并发代码 → 追加 `node-async`
- 检测到生产服务（HTTP/RPC server）→ 追加 `node-observability`
- 检测到性能敏感场景 → 追加 `node-performance`
- 检测到 Vue → 追加对应 `vue-*` 技能
- 检测到工程搭建需求 → 追加 `node-dev`

## 步骤 4——写入区块

### 模板

```markdown
## Required Node skills

以下 Node/TS 技能在本项目工作时 MUST 始终应用。在每个 Node/TS 相关任务开始时加载它们，无论用户是否显式提及。

- `node-error-handling`
- `node-security`
- `node-testing`
```

把技能列表替换为步骤 3 确认的集合。每个技能用完整 `<name>` 标识。

### 插入位置

- 文件为空：写在顶部。
- 文件已有内容：追加到最后一节之后，用空行分隔。
- 已存在 `## Required Node skills` 区块：只替换其中的列表，保留周围内容。

### 编辑文件

用 `Edit` 工具（优于脚本）应用更改。写入后再读一遍文件，验证区块恰好出现一次。

## 步骤 5——向用户确认

写入后总结：

- 更新了哪些文件
- 向常驻列表加入了哪些技能
- 大致启动 token 成本（技能数 × 每个描述约 100 tokens）
