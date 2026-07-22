# extend.md 模板与更新规则

**路径：** `docs/upstream/<project>/extend.md`

- 文件不存在 → 按下方完整模板创建。
- 文件已存在 → **只**替换 `<!-- AI_SUGGESTIONS_START -->` 与 `<!-- AI_SUGGESTIONS_END -->` 之间的内容；绝不改动 `USER_RULES` 区块。
- `USER_RULES` 标记缺失或损坏 → 警告并中止对 extend.md 的写入。

## 完整模板（首次创建）

```markdown
# <project> 扩展规则

此文件控制 upstream-research 生成文档时的行为。
- **用户区**（USER_RULES）：手动维护，research 时只读不写
- **AI 建议区**（AI_SUGGESTIONS）：每次 research 自动覆盖

---

## 用户自定义规则

<!-- USER_RULES_START -->
在此区域添加你的自定义规则，例如：

- 重点关注 `hooks/` 和 `commands/` 目录
- 忽略 `examples/` 和 `tests/` 目录
- 文档输出语言：中文
- architecture.md 中需要包含：数据库 Schema 说明
<!-- USER_RULES_END -->

---

## AI 分析建议（自动生成，每次 research 覆盖）

<!-- AI_SUGGESTIONS_START -->
### 建议关注点
- <建议 1>
- <建议 2>

### 潜在风险点
- <风险>

### 推荐的文档关注深度
- `<path>`：高（接口频繁变化）
- `<path>`：低（稳定工具）
<!-- AI_SUGGESTIONS_END -->
```
