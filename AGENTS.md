# Agent Guide

Curated [Agent Skills](https://agentskills.io/home) collection plus a script suite that syncs skills, Cursor plugin agents, and rules from upstream git repos into `content/{repoKey}/skills/{name}/`, `content/{repoKey}/agents/{name}.md`, and `content/{repoKey}/rules/{name}.md`.

User-facing install catalog and bundles live in [README.md](README.md). Repository sources and mappings live in [meta.ts](meta.ts) — that file is the single source of truth for what syncs.

## Layout

```
.
├── src/
│   ├── commands/           # 全部可执行入口（tsx src/commands/xxx.command.ts）：sync/upstream/cleanup/packs/check/catalog/smoke/prepare-site/publish-tree/release
│   ├── services/           # upstream (clone, pin, sync, SYNC.json) + check + flatten-content + publish-tree（发布面物化）+ deps/packs/install-commands
│   ├── transforms/         # skill/agent/rule ctx pipeline + kebab-case named strategies
│   ├── catalog.ts          # catalog 构建（建立在零 error 的 check 之上）
│   ├── utils/              # filesystem + digest/eol helpers
│   ├── errors/             # custom error classes + error formatting
│   └── types.ts            # RepositoryConfig, SkillMapping, AgentMapping, RuleMapping, CommandMapping, SyncManifest, PublishManifest
├── content/                # 收敛后的内容树（对外安装面经 skills.sh.json 声明，repoKey 优先）
│   ├── {repoKey}/skills/{name}/   # 上游映射产物
│   ├── {repoKey}/agents/{name}.md
│   ├── {repoKey}/rules/{name}.md
│   ├── {repoKey}/commands/{name}.md
│   ├── {repoKey}/SYNC.json        # 每 repo 一份跨类合并清单
│   └── custom/skills/{name}/      # hand-maintained（不做变换、无 SYNC.json）
├── site/                   # GitHub Pages install-command generator (pnpm workspace package)
├── upstream/               # git checkouts (not version-controlled)
├── skills.sh.json          # skills CLI 自定义发现容器声明：{"paths":["./content"]}，深度 3 扫描直达 {repoKey}/{kind}/{name}（dev 专用，不进发布面）
├── dependencies.ts         # dependency declarations (skills/agents/rules/commands partitions)
├── packs.ts                # curated skill packs: named groups of skills for site 展示与安装命令
└── meta.ts                 # repo keys, pins, mappings, transforms
```

Synced skills land at `content/{repoKey}/skills/{name}/SKILL.md`. Hand-maintained skills stay under `content/custom/skills/{name}/`. Synced agents land at `content/{repoKey}/agents/{name}.md` (Cursor single-file subagent format). Synced rules and commands land at `content/{repoKey}/{rules,commands}/{name}.md` — copied verbatim, no frontmatter injection. Skill-bundled helper prompts under a skill's own `agents/` directory stay inside that skill.

**发布面**（main）：release 把 content/ 扁平为 `skills/{name}/`、`agents/{name}.md`、`commands/{name}.md`、`rules/{name}.md` + 根级 `manifest.json`（`{ schema, sources: { <repoKey>+custom: 四类内容清单 + 上游同步信息 } }`；custom 无同步字段），再拼 README/LICENSE/deploy.yml。根级 `skills/` 是 skills CLI 原生发现位置，main 不带 skills.sh.json。同一物化管线由 `publish-tree.service.ts` 提供，release、prepare-site（Pages 面）与 `pnpm release:tree`（本地/CI 复核）三处共用。

Dest trees under `content/{repoKey}/` are generated: load source into memory, run named transforms, write dest. Do not hand-edit them; persist edits as named transforms in `meta.ts`. `content/custom/skills/` is not transformed.

## Commands

| Command                                                    | Behaviour                                                                                                                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm sync [--repo <repoKey>] [--report <file>] [--force]` | Update upstream, rewrite mapped dests, write the per-repo SYNC.json, print Markdown report. 退出码 2 = 同步失败或未知 repoKey；`--force` 再清该 repo 下未映射的 dest     |
| `pnpm upstream [--force]`                                  | Clone or update repos under `upstream/` (clone then pin)；force 删掉 checkout 再 clone                                                                                   |
| `pnpm cleanup [--force]`                                   | List orphaned upstream checkouts；默认只列清单，`--force` 才删除                                                                                                         |
| `pnpm packs [id…] [--shell bash\|powershell\|cmd\|all]`    | Print the combined multi-line `npx skills add` command；无 id = 全部 pack 合并                                                                                           |
| `pnpm check [--report <file>]`                             | 合集完整性检查（frontmatter/重名/跨类重名/依赖/packs/SYNC 摘要/orphan）；error 级发现退出码 1                                                                            |
| `pnpm build:catalog`                                       | 产出 `.build/catalog.json`（建立在零 error 的 check 之上）                                                                                                               |
| `pnpm smoke`                                               | `skills add ./ --list` 必须包含 catalog 全部非内部技能（仓库根发现面 = 用户安装面）                                                                                      |
| `pnpm site:build`                                          | build:catalog → prepare-site（content/ 扁平化 → site/public，含守卫）→ vite build                                                                                        |
| `pnpm site:preview`                                        | site:build + vite preview（http://localhost:4173/skills/，读工作区，未提交的同步结果直接生效）                                                                           |
| `pnpm readme`                                              | 由 catalog 渲染 README 生成区块（skills/agents/rules/commands 各分 Custom 与 Synced-from-upstream 两张表）                                                               |
| `pnpm readme:check`                                        | 校验 README 生成区块是否最新；过期退出码 1                                                                                                                               |
| `pnpm release:tree --out <dir>`                            | 物化发布面到指定目录（扁平 {kind}/{name} + manifest.json）；deploy.yml 一致性校验与本地复核共用                                                                          |
| `pnpm release [--dry-run] [--source=<dev sha>]`            | dev→main 发布：门禁（lint/test/check/build:catalog/smoke/readme:check）→ 物化发布面 → 快照提交（带 Source-Commit trailer）→ 打 `vYYYY.MM.DD` tag → push；`--source` 回滚 |
| `pnpm release:dry`                                         | release 的 dry-run：只打印将发布的 diff，不推送                                                                                                                          |

Every sync run deletes and rewrites each mapped dest. Mapping 里拿掉的 dest **默认不删**；`pnpm sync --force` 会额外删除该 repo 下未再映射的 skill 目录 / agent `.md` / rule `.md` / command `.md`。`content/{repoKey}/SYNC.json` 每 repo 一份、跨类合并，存 `{ upstream_committed_sha, upstream_committed_at, items_digest, items_changed_at, items: [{ kind, name, digest }] }`（items 按 name 升序；`kind` ∈ skill/agent/rule/command）。digest 对文本先做 CRLF→LF 与首尾换行 trim 归一再计算（含 NUL 的二进制原样保留），sync 写盘与 check 校验共用同一原语（`src/utils/digest.ts`）。

Transforms are kebab-case names. Repo-level `transforms.skills` / `transforms.agents` / `transforms.rules` run first, then mapping `transforms`, then a builtin step that sets entry YAML `name` to the dest name (skills and agents only; rules and commands skip it so their body stays verbatim). Strategies receive a skill file-tree context or an agent/rule string context and are unit-tested in isolation.

`UpstreamService` holds clone/pin/sync logic; commands receive it as a dependency. Git ops use `simple-git` with the user's git config (including proxy).

## Naming rules

`pnpm check` 的 A3/A4 强制：同类内 name 全仓唯一（skills/agents/rules/commands 各自跨 repoKey 唯一），且 skills/agents/rules/commands 四类互不重叠（含 custom 与 dependencies.ts commands 分区占位名）。这是扁平发布面（`{kind}/{name}` 直接摆放、skills CLI 按 name 平铺安装）不冲突的前提；新增映射撞名时 check 直接 error。

## Dependency declarations

[dependencies.ts](dependencies.ts) sits next to `meta.ts` and declares what each entry reads or invokes at runtime. Top level partitions by kind — `skills` / `agents` / `rules` / `commands` — each a `Record<destName, Dependency>` whose `Dependency` holds per-kind ref arrays (`{ skills: [...], agents: [...] }`). Keys and refs must resolve to mapped skills/agents/rules/commands or hand-maintained custom skills (`content/custom/skills/`); names only need to be unique within their own kind. Routing-only cross-references (e.g. `grill-and-think` → `hunt`) are not dependencies. The `collection-connectivity` skill audits the whole record as a repo-level check.

[packs.ts](packs.ts) sits next to `meta.ts` and curates install-oriented skill packs (skills only, explicit members, overlap between packs allowed, closures not expanded). `pnpm packs` validates every member resolves to a mapped skill or custom skill before generating, and reports direct skill refs that fall outside the pack (`Referenced but not in pack`).

## Working on this repo

1. **Change what syncs** → edit `meta.ts` (`skills` / `agents` / `rules` / `commands` mappings, `tag` / `branch` / `commit` pins, `transforms`), then run `pnpm sync`.
2. **Add a hand-maintained skill** → put it under `content/custom/skills/{name}/` with a `SKILL.md`; do not invent a fake upstream entry for it.
3. **Declare runtime dependencies** → add an entry to `dependencies.ts`; the `collection-connectivity` skill audits the whole record.
4. **Add or adjust a skill pack** → edit `packs.ts` (named groups, skills only); `pnpm packs` validates members on next run.
5. **Upstream with empty `skills`, `agents`, `rules`, and `commands`** → repo may be listed for future use; Sync skips that repo until a mapping exists. A repo with only one kind still syncs.
6. **Verify** → `pnpm test`（vitest）/ `pnpm lint` / `pnpm fmt` after TypeScript changes.
7. **Add or move tests** → first-party tests live beside their source as `src/**/__tests__/<source-name>.test.ts`（`src/utils/digest.ts` → `src/utils/__tests__/digest.test.ts`）；multi-file fixtures under `__tests__/fixtures/<case>/`, small samples inline. Scope is first-party `src/` only — `content/`、`upstream/`、`site/` 是安装面、vendored 源或构建产物，不适用本规范。
8. **Broken reference in upstream text** → do not edit the generated dest; fix it upstream or with a named transform in `meta.ts`.
9. **Change packs, deps or any skill content** → run `pnpm readme` to refresh the README generated blocks, then `pnpm readme:check`.
10. **Publish** → on `dev`: `git push` → `pnpm release:dry`（审查 diff）→ `pnpm release`. `main` 只由 release 写入；禁止在 main 上提交，禁止把开发文件加进 `PUBLISH_PATHS`。

## Upstream checkouts

Upstream clones live under `upstream/` by default. Set `SKILLS_UPSTREAM_DIR` to point at a shared directory and all worktrees reuse one copy of the checkouts (sync, upstream management, and cleanup all honor it), e.g. `export SKILLS_UPSTREAM_DIR=~/.cache/rockcookies-skills/upstream`.

## Branch model & deploy

双分支：`dev` 是完整开发树（src/、site/、工具链都在这里），`main` 是扁平安装面，由 `pnpm release` 从 dev 变换生成——`content/` 物化为 `skills/{name}/` + `agents/` + `commands/` + `rules/` + 根级 `manifest.json`，再拼 `README.md` + `LICENSE` + `.github/workflows/deploy.yml`（`release.command.ts` 的 `PUBLISH_PATHS`；`skills.sh.json` 是 dev 专用发现容器，不进发布面——根级 `skills/` 是 skills CLI 原生发现位置）。快照提交 parent 恒为 `origin/main`，push 永远 fast-forward；提交信息带 `Source-Commit: <dev sha>` trailer。绝不 force-push main（skills CLI lockfile 按安装时的 commit SHA 拉取）；内容回滚用 `pnpm release --source=<旧 dev sha>`（新快照提交，历史线性）。

发布闭环：dev 上 `git push` → `pnpm release:dry` 审查 diff → `pnpm release`。`deploy.yml` 在 main push 时读 trailer 检出对应 dev 源码，用 `pnpm release:tree` 重新物化发布面并与发布树 diff 校验一致后跑门禁并部署 GitHub Pages；`ci.yml` 在 dev push / PR 上跑同套门禁。dev 的发现契约由根目录 `skills.sh.json` 声明（`./content` 容器，深度 3 扫描直达 `{repoKey}/{kind}/{name}`）；dev 仓库根不得出现 `SKILL.md`（会短路 skills CLI 的全部发现）。Pages 产物除站点应用外还带扁平发布面：`site/public/{skills,agents,rules,commands}/{name}` + `catalog.json` + `manifest.json` + 生成的 `README.md`（`prepare-site.command.ts` 产出，`publish-tree.service.ts` 提供物化管线）。上游同步全手动：`pnpm sync` 本地跑，审完自查后提交。

本地闭环：`pnpm sync` → `pnpm check` → `pnpm readme` → `pnpm site:preview`（预览未提交的同步结果）。

## Pins (see `meta.ts`)

| Key             | Upstream                | Pin           |
| --------------- | ----------------------- | ------------- |
| `samber-golang` | samber/cc-skills-golang | tag `v2.0.0`  |
| `mattpocock`    | mattpocock/skills       | tag `v1.3.2`  |
| `tw93-kami`     | tw93/Kami               | tag `V1.20.0` |
| `tw93-waza`     | tw93/Waza               | tag `v3.42.0` |

Unpinned repos track the default branch.

## Dependencies

- `simple-git` — git operations
- `tsx` — run TypeScript command entries
- `vitest` — unit tests
- `js-yaml` — skill and agent frontmatter helpers where used
