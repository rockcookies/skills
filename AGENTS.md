# Agent Guide

Curated [Agent Skills](https://agentskills.io/home) collection plus a script suite that syncs skills, Cursor plugin agents, and rules from upstream git repos into `content/skills/{repoKey}/{name}/`, `content/agents/{repoKey}/{name}.md`, and `content/rules/{repoKey}/{name}.md`.

User-facing install catalog and bundles live in [README.md](README.md). Repository sources and mappings live in [meta.ts](meta.ts) — that file is the single source of truth for what syncs.

## Layout

```
.
├── scripts/                # 全部可执行入口（thin tsx wrappers）：sync/upstream/cleanup/packs/check/build:catalog/smoke/prepare-site
├── src/
│   ├── commands/           # sync / upstream / cleanup / pack 纯逻辑 handlers
│   ├── services/           # UpstreamService (clone, pin, sync, SYNC.json) + deps/packs services
│   ├── check/              # 合集完整性检查（pnpm check，error 级发现退出码 1）
│   ├── transforms/         # skill/agent/rule ctx pipeline + kebab-case named strategies
│   ├── lib/                # pure shared helpers (install command generation)
│   ├── catalog.ts          # catalog 构建（建立在零 error 的 check 之上）
│   ├── utils/              # filesystem + digest helpers
│   ├── errors/             # custom error classes
│   └── types.ts            # RepositoryConfig, SkillMapping, AgentMapping, RuleMapping, SyncManifest
├── content/                # 收敛后的内容树（对外安装面经 skills.sh.json 声明）
│   ├── skills/{repoKey}/{name}/   # 含 custom/（hand-maintained）
│   ├── agents/{repoKey}/{name}.md
│   └── rules/{repoKey}/{name}.md
├── site/                   # GitHub Pages install-command generator (pnpm workspace package)
├── upstream/               # git checkouts (not version-controlled)
├── skills.sh.json          # skills CLI 自定义发现容器声明：{"paths":["./content/skills"]}
├── dependencies.ts         # dependency declarations (skills/agents/rules/commands partitions)
├── packs.ts                # curated skill packs: named groups of skills for install commands
└── meta.ts                 # repo keys, pins, mappings, transforms
```

Synced skills land at `content/skills/{repoKey}/{name}/SKILL.md`. Hand-maintained skills stay under `content/skills/custom/{name}/`. Synced agents land at `content/agents/{repoKey}/{name}.md` (Cursor single-file subagent format). Synced rules land at `content/rules/{repoKey}/{name}.md` — copied verbatim, no frontmatter injection. Skill-bundled helper prompts under a skill's own `agents/` directory stay inside that skill.

Dest trees under `content/skills/{repoKey}/`, `content/agents/{repoKey}/`, and `content/rules/{repoKey}/` are generated: load source into memory, run named transforms, write dest. Do not hand-edit them; persist edits as named transforms in `meta.ts`. `content/skills/custom/` is not transformed.

## Commands

| Command | Behaviour |
| --- | --- |
| `pnpm sync [--repo <repoKey>] [--report <file>] [--force]` | Update upstream, rewrite mapped dests, write SYNC.json, print Markdown report. 退出码 2 = 同步失败或未知 repoKey；`--force` 再清该 repo 下未映射的 dest |
| `pnpm upstream [--force]` | Clone or update repos under `upstream/` (clone then pin)；force 删掉 checkout 再 clone |
| `pnpm cleanup [--force]` | List orphaned upstream checkouts；默认只列清单，`--force` 才删除 |
| `pnpm packs [id…] [--shell bash\|powershell\|cmd\|all]` | Print the combined multi-line `npx skills add` command；无 id = 全部 pack 合并 |
| `pnpm check [--report <file>]` | 合集完整性检查（frontmatter/重名/依赖/packs/SYNC 摘要/orphan）；error 级发现退出码 1 |
| `pnpm build:catalog` | 产出 `.build/catalog.json`（建立在零 error 的 check 之上） |
| `pnpm smoke` | `skills add ./ --list` 必须包含 catalog 全部非内部技能（仓库根发现面 = 用户安装面） |
| `pnpm site:build` | build:catalog → prepare-site（content/ → site/public，含守卫）→ vite build |
| `pnpm site:preview` | site:build + vite preview（http://localhost:4173/skills/，读工作区，未提交的同步结果直接生效） |

Every sync run deletes and rewrites each mapped dest. Mapping 里拿掉的 dest **默认不删**；`pnpm sync --force` 会额外删除该 repo 下未再映射的 skill 目录 / agent `.md` / rule `.md`。`content/{skills,agents,rules}/{repoKey}/SYNC.json` 存 `{ upstream_committed_sha, upstream_committed_at, items_digest, items_changed_at, items: [{ name, digest }] }`（items 按 name 升序）。

Transforms are kebab-case names. Repo-level `transforms.skills` / `transforms.agents` / `transforms.rules` run first, then mapping `transforms`, then a builtin step that sets entry YAML `name` to the dest name (skills and agents only; rules skip it so their body stays verbatim). Strategies receive a skill file-tree context or an agent/rule string context and are unit-tested in isolation.

`UpstreamService` holds clone/pin/sync logic; commands receive it as a dependency. Git ops use `simple-git` with the user's git config (including proxy).

## Dependency declarations

[dependencies.ts](dependencies.ts) sits next to `meta.ts` and declares what each entry reads or invokes at runtime. Top level partitions by kind — `skills` / `agents` / `rules` / `commands` (commands reserved; the kind has no sync pipeline yet) — each a `Record<destName, Dependency>` whose `Dependency` holds per-kind ref arrays (`{ skills: [...], agents: [...] }`). Keys and refs must resolve to mapped skills/agents/rules or hand-maintained custom skills (`content/skills/custom/`); names only need to be unique within their own kind. Routing-only cross-references (e.g. `grill-and-think` → `hunt`) are not dependencies. The `collection-connectivity` skill audits the whole record as a repo-level check.

[packs.ts](packs.ts) sits next to `meta.ts` and curates install-oriented skill packs (skills only, explicit members, overlap between packs allowed, closures not expanded). `pnpm packs` validates every member resolves to a mapped skill or custom skill before generating, and reports direct skill refs that fall outside the pack (`Referenced but not in pack`).

## Working on this repo

1. **Change what syncs** → edit `meta.ts` (`skills` / `agents` mappings, `tag` / `branch` / `commit` pins, `transforms`), then run `pnpm sync`.
2. **Add a hand-maintained skill** → put it under `content/skills/custom/{name}/` with a `SKILL.md`; do not invent a fake upstream entry for it.
3. **Declare runtime dependencies** → add an entry to `dependencies.ts`; the `collection-connectivity` skill audits the whole record.
4. **Add or adjust a skill pack** → edit `packs.ts` (named groups, skills only); `pnpm packs` validates members on next run.
5. **Upstream with empty `skills`, `agents`, and `rules`** → repo may be listed for future use; Sync skips that repo until a mapping exists. A repo with only one kind still syncs.
6. **Verify** → `pnpm test`（vitest）/ `pnpm lint` / `pnpm fmt` after TypeScript changes.
7. **Broken reference in upstream text** → do not edit the generated dest; fix it upstream or with a named transform in `meta.ts`.

## Upstream checkouts

Upstream clones live under `upstream/` by default. Set `SKILLS_UPSTREAM_DIR` to point at a shared directory and all worktrees reuse one copy of the checkouts (sync, upstream management, and cleanup all honor it), e.g. `export SKILLS_UPSTREAM_DIR=~/.cache/rockcookies-skills/upstream`.

## Branch model & deploy

单分支 `main`：源码与对外安装面是同一棵树。发现契约由根目录 `skills.sh.json` 声明（`content/skills` 容器）；仓库根不得出现 `SKILL.md`（会短路 skills CLI 的全部发现）。绝不 force-push main（skills CLI lockfile 按安装时的 commit SHA 拉取）。

`deploy.yml` 在 main push 时跑门禁（lint / test / check / site:build / smoke）并直部 GitHub Pages artifact，不写任何分支；`ci.yml` 在 PR 上跑同样门禁。上游同步全手动：`pnpm sync` 本地跑，审完自查后提交。

本地闭环：`pnpm sync` → `pnpm check` → `pnpm site:preview`（预览未提交的同步结果）。

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
- `tsx` — run TypeScript scripts
- `vitest` — unit tests
- `js-yaml` — skill and agent frontmatter helpers where used
