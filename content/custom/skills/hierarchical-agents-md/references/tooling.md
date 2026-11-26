# 工具参考

自带脚本刻意保守，只读辅助。它们不生成也不修改项目文档。

## `inventory.py`

```bash
python scripts/inventory.py [ROOT] [--format markdown|json] [--max-depth N] [--max-files-per-dir N]
```

报告：

- 检测到的项目标记（例如 `go.mod`、`package.json`、`pyproject.toml`、`Cargo.toml`、`Makefile`、CI 工作流）；
- Markdown 文档文件，并突出 `AGENTS.md`、`README.md` 和 `CLAUDE.md`；
- **Agent 上下文**：根/嵌套 `AGENTS.md`、`.claude/rules`、`.cursor/rules`、每个 skill 的 description 与正文，按 every-turn / conditional / on-subtree / on-demand 分类并给字符数（不是 token）。这是风险分类，各客户端实际加载机制不同，最终以 canary 验证为准；
- 按目录与扩展名估算的源码文件数。

盘点是导航辅助，不是完整的语义架构图。默认跳过生成、vendored、构建、依赖和缓存目录。

## `changed_files.py`

```bash
python scripts/changed_files.py [ROOT] [--base REF] [--staged] [--include-untracked|--no-include-untracked] [--format text|json]
```

- 默认：把工作树（已暂存与未暂存的已跟踪改动）与 `HEAD` 比较，并包含未忽略的未跟踪文件。
- `--staged`：只把索引与 `HEAD` 比较。
- `--base REF`：比较 `REF...HEAD`（merge-base 到当前 HEAD）；适合功能分支评审。默认仍含未跟踪文件；只要已提交分支视图时传 `--no-include-untracked`。
- `--no-include-untracked`：省略未跟踪文件。

对每个改动路径，脚本报告最近的祖先 `AGENTS.md`（若有）以及祖先 `README.md` 候选。也会把根 README 报成面向公开变更的候选，但不裁定是否必须编辑。

脚本需要 Git 和有效仓库。浅克隆可能不含所请求 `--base` 比较的 merge base。

## `audit.py`

```bash
python scripts/audit.py [ROOT] [--format text|json] [--max-agents-lines N] [--max-readme-lines N]
```

检查 `.claude/rules`、`.cursor/rules` 里 `paths:`/`globs:` 是否至少匹配一个真实文件（`paths-no-match`，警告），以及常见行内 Markdown 链接与图片链接是否缺本地目标、每份 `AGENTS.md` 内是否有重复标题，以及可配置的行数阈值。嵌套 `AGENTS.md` 存在但没有根 `AGENTS.md` 时也会警告。

- 断掉的本地链接是错误，退出码 `1`。
- 结构与长度发现是警告，默认不让审计失败。
- 不拉取、不校验外部 URL。
- 引用式 Markdown 链接、嵌入 HTML 导航和语义真假不在脚本范围内。

用 `--format json` 接入其他评审工具。不要把干净的静态审计当成所有文档说法都仍新的证明。

## `lost_lines.py`

```bash
python scripts/lost_lines.py OLD_DIR NEW_DIR
python scripts/lost_lines.py REPO --base REF
```

列出旧文档里有、新文档任何地方都没有的行（空白归一化后整行比较）；只是搬走的行只计数。trim 后用它对账：每一行都要对上用户确认过的删除。改写过的行也会出现，恢复前先按意思判断，不按字面。

## 测试

脚本无依赖，用下列命令测：

```bash
python -m unittest discover -s tests -v
```
