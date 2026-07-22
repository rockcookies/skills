# sync.json 结构

**路径：** `docs/upstream/<project>/sync.json`  
**模式：** 每次 research 成功后全量覆盖

```json
{
  "project": "<project>",
  "last_synced_hash": "<new_hash 或 null>",
  "previous_hash": "<old_hash 或 null>",
  "synced_at": "<ISO 8601 datetime>",
  "upstream_remote": "<origin URL 或 null>",
  "doc_version": "1"
}
```

## 字段规则

| 字段 | FULL / DIFF | FULL_NO_GIT |
|------|-------------|-------------|
| `last_synced_hash` | 当前 HEAD | `null` |
| `previous_hash` | 上次的 `last_synced_hash`；首次为 `null` | `null` |
| `upstream_remote` | `git -C upstream/<project> remote get-url origin`（失败则 `null`） | `null` |

```bash
git -C upstream/<project> remote get-url origin 2>/dev/null || echo "null"
```
