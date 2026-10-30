# 多工具入口：AGENTS.md / CLAUDE.md / .cursor

> 何时读：仓库里同时有多种 Agent 工具的配置，或在 Windows/WSL 下遇到入口文件不生效。

- **AGENTS.md 是唯一权威**。多数 Agent 工具直接读取它；具体支持情况以各工具文档为准。
- **CLAUDE.md 只做导入**：内容就是一行 `@AGENTS.md`。每个有 AGENTS.md 的作用域都放一份，因为 Claude Code 按目录就近读 CLAUDE.md。`sync --scaffold` 会生成；已有但内容不同的不会被覆盖，只报 `CLAUDE_ENTRY`。
- **不要用符号链接**。Windows 与 WSL2 之间、以及某些 git 配置下符号链接容易退化成普通文本文件；导入语法在所有平台行为一致。（审计仍认可指向 AGENTS.md 的符号链接，不会误报。）
- **`.cursor/rules` 等工具私有目录**：只放该工具特有的东西（如按 glob 触发的规则），不复制 AGENTS.md 的内容；需要引用时用链接。本技能不扫描、不修改这些目录。
- **各作用域的 AGENTS.md 不互相复制**：子目录靠"继承"一行指向上级，规则变更只需改一处。
