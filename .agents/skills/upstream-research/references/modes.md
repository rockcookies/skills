# 模式与门禁

## 参数

| 参数 | 作用 |
|------|------|
| `--force` | 即使 HEAD 与 `last_synced_hash` 相同也强制重建 |
| `--no-git-check` | 跳过 git，按纯目录分析（`FULL_NO_GIT`） |

## 解析 hash

```bash
UPSTREAM_HASH=$(git -C upstream/<project> rev-parse HEAD 2>/dev/null || echo "NOT_GIT")
# 若存在 docs/upstream/<project>/sync.json，读取 last_synced_hash；否则为空
```

比较方向是 **upstream HEAD** 对 `sync.json.last_synced_hash`（不要反过来比）。

## 模式表

| 情况 | 模式 |
|------|------|
| `--no-git-check`，或 `NOT_GIT` | `FULL_NO_GIT` |
| 无 `sync.json` | `FULL` |
| hash 相同且无 `--force` | `SKIP` — 报告已是最新并终止 |
| hash 相同且有 `--force` | `FULL` |
| HEAD 与 synced 不同（upstream 有更新） | `DIFF` |

## 回滚警告

若 `last_synced_hash` 看起来比当前 HEAD「更新」（可能回滚或切了分支），提示：

```
检测到异常：
  docs 记录的 hash <synced[:8]> 比 upstream 当前 HEAD <upstream[:8]> 更新
  这可能意味着 upstream/<project> 被回滚或切换了分支
  是否继续？(y/N)
```

等待用户确认后再继续。

## 错误处理

| 情况 | 处理 |
|------|------|
| 不是 git 仓库 | `FULL_NO_GIT`；`sync.json` 中 hash 相关字段设为 `null` |
| 无 README | 继续用目录/配置分析；在 architecture 概述中注明 |
| diff 超过 200 个文件 | 只用 `--stat`；changelog 注明大规模变更 |
| 缺少 `docs/upstream/<project>/` | 写入前先创建 |
| `USER_RULES` 标记损坏 | 警告，不覆盖 extend.md |
