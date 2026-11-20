# Agent Guide

Curated [Agent Skills](https://agentskills.io/home) collection plus a CLI that syncs skills, Cursor plugin agents, and rules from upstream git repos into `skills/{repoKey}/{name}/`, `agents/{repoKey}/{name}.md`, and `rules/{repoKey}/{name}.md`.

User-facing install catalog and bundles live in [README.md](README.md). Repository sources and mappings live in [meta.ts](meta.ts) — that file is the single source of truth for what syncs.

## Layout

```
.
├── src/
│   ├── cli.ts              # CLI entry (thin orchestrator)
│   ├── commands/           # upstream / sync / cleanup handlers
│   ├── services/           # UpstreamService (clone, pin, sync, SYNC.json)
│   ├── transforms/         # skill/agent/rule ctx pipeline + kebab-case named strategies
│   ├── lib/                # pure shared helpers (install command generation)
│   ├── audit/              # deterministic audit behind pnpm audit:skills (exit code gates CI)
│   ├── release/            # catalog + release artifact build (build:catalog, build:release)
│   ├── utils/              # filesystem + digest helpers
│   ├── errors/             # custom error classes
│   └── types.ts            # RepositoryConfig, SkillMapping, AgentMapping, RuleMapping, SyncManifest
├── scripts/                # release smoke test + dry-run + site prepare entry points (tsx)
├── release/                # release inputs: README.template.md; main-github/ backs up main's manual .github/
├── site/                   # GitHub Pages install-command generator (pnpm workspace package)
├── skills/                 # published skills: skills/{repoKey}/{name}/
│   └── custom/             # hand-maintained local skills
├── agents/                 # published agents: agents/{repoKey}/{name}.md
├── rules/                  # published rules: rules/{repoKey}/{name}.md
├── upstream/               # git checkouts (not version-controlled)
├── dependencies.ts         # dependency declarations (skills/agents/rules/commands partitions)
├── packs.ts                # curated skill packs: named groups of skills for install commands
├── release.config.ts       # what ships to the release branch: include dirs, root files, guards
└── meta.ts                 # repo keys, pins, mappings, transforms
```

Synced skills land at `skills/{repoKey}/{name}/SKILL.md`. Hand-maintained skills stay under `skills/custom/{name}/`. Synced agents land at `agents/{repoKey}/{name}.md` (Cursor single-file subagent format). Synced rules land at `rules/{repoKey}/{name}.md` — copied verbatim, no frontmatter injection. Skill-bundled helper prompts under a skill's own `agents/` directory stay inside that skill.

Dest trees under `skills/{repoKey}/`, `agents/{repoKey}/`, and `rules/{repoKey}/` are generated: load source into memory, run named transforms, write dest. Do not hand-edit them; persist edits as named transforms in `meta.ts`. `skills/custom/` is not transformed.

## CLI

`pnpm cli` → interactive menu:

| Action                   | Handler               | Behaviour                                                                                                |
| ------------------------ | --------------------- | -------------------------------------------------------------------------------------------------------- |
| Manage upstream          | `upstream.command.ts` | Clone or update repos under `upstream/` (clone then pin)                                                 |
| Sync skills              | `sync.command.ts`     | Update upstream, rewrite mapped dests, write SYNC.json；`--force` 再清 orphan                            |
| Cleanup                  | `cleanup.command.ts`  | Remove orphaned upstream checkouts                                                                       |
| Generate install command | `pack.command.ts`     | Multi-select packs from `packs.ts`, pick a shell, print the combined multi-line `npx skills add` command |

非交互入口：`pnpm cli sync --ci [--repo <repoKey>] [--report <file>]`（`sync-ci.command.ts`）直接调 `UpstreamService`，无 clack 提示、不做 git commit/push，退出码 2 = 同步失败或未知 repoKey；CI 的 sync workflow 用它。

Every sync run deletes and rewrites each mapped dest. Mapping 里拿掉的 dest **默认不删**；`pnpm cli --force`（或交互确认 Force sync）会额外删除该 repo 下未再映射的 skill 目录 / agent `.md` / rule `.md`。`skills/{repoKey}/SYNC.json`、`agents/{repoKey}/SYNC.json` 和 `rules/{repoKey}/SYNC.json` 存 `{ upstream_committed_sha, upstream_committed_at, items_digest, items_changed_at, items: [{ name, digest }] }`（items 按 name 升序）。

Transforms are kebab-case names. Repo-level `transforms.skills` / `transforms.agents` / `transforms.rules` run first, then mapping `transforms`, then a builtin step that sets entry YAML `name` to the dest name (skills and agents only; rules skip it so their body stays verbatim). Strategies receive a skill file-tree context or an agent/rule string context and are unit-tested in isolation.

`UpstreamService` holds clone/pin/sync logic; commands receive it as a dependency. Git ops use `simple-git` with the user's git config (including proxy).

## Dependency declarations

[dependencies.ts](dependencies.ts) sits next to `meta.ts` and declares what each entry reads or invokes at runtime. Top level partitions by kind — `skills` / `agents` / `rules` / `commands` (commands reserved; the kind has no sync pipeline yet) — each a `Record<destName, Dependency>` whose `Dependency` holds per-kind ref arrays (`{ skills: [...], agents: [...] }`). Keys and refs must resolve to mapped skills/agents/rules or hand-maintained custom skills (`skills/custom/`); names only need to be unique within their own kind. Routing-only cross-references (e.g. `grill-and-think` → `hunt`) are not dependencies. The `collection-connectivity` skill audits the whole record as a repo-level check.

[packs.ts](packs.ts) sits next to `meta.ts` and curates install-oriented skill packs (skills only, explicit members, overlap between packs allowed, closures not expanded). The pack CLI command validates every member resolves to a mapped skill or custom skill before generating, and reports direct skill refs that fall outside the pack (`Referenced but not in pack`).

## Working on this repo

1. **Change what syncs** → edit `meta.ts` (`skills` / `agents` mappings, `tag` / `branch` / `commit` pins, `transforms`), then run Sync.
2. **Add a hand-maintained skill** → put it under `skills/custom/{name}/` with a `SKILL.md`; do not invent a fake upstream entry for it.
3. **Declare runtime dependencies** → add an entry to `dependencies.ts`; the `collection-connectivity` skill audits the whole record.
4. **Add or adjust a skill pack** → edit `packs.ts` (named groups, skills only); the pack CLI command validates members on next run.
5. **Upstream with empty `skills`, `agents`, and `rules`** → repo may be listed for future use; Sync skips that repo until a mapping exists. A repo with only one kind still syncs.
6. **Verify** → `pnpm test`（vitest）/ `pnpm lint` / `pnpm fmt` after TypeScript changes.
7. **Broken reference in upstream text** → do not edit the generated dest; fix it upstream or with a named transform in `meta.ts`.

## Upstream checkouts

Upstream clones live under `upstream/` by default. Set `SKILLS_UPSTREAM_DIR` to point at a shared directory and all worktrees reuse one copy of the checkouts (sync, upstream management, and cleanup all honor it), e.g. `export SKILLS_UPSTREAM_DIR=~/.cache/rockcookies-skills/upstream`.

## Branch model & release

`dev` 是源分支（source of truth）：全部源码、技能、workflows 都在这里改。`main` 是发布分支，**只有 CI 写**——`release.yml` 在 dev push 时跑门禁（lint / test / audit:skills / build:release / smoke:release / build:site），把 `dist-release/` 追加成普通 commit 推到 main，并部署 GitHub Pages 站点。不要向 main 提 PR 或直推；绝不 force-push main（skills CLI lockfile 按安装时的 commit SHA 拉取）。`sync-cron`（main 上的存根，源备份在 `release/main-github/`）每天 UTC 21:17 调 dev 的 `sync.yml`，用 `pnpm cli sync --ci` 同步上游并开 bot PR 到 dev。

发布管线命令：`pnpm audit:skills` → `pnpm build:release`（自落 `.build/catalog.json`）→ `pnpm smoke:release` → `pnpm release:dry`（同步到 `../skills-release` worktree 只看 diff）；站点：`pnpm build:site`。本地验证发布 diff 用 worktree，不要在 `skills-release` 里手改内容。

## Pins (see `meta.ts`)

| Key             | Upstream                | Pin           |
| --------------- | ----------------------- | ------------- |
| `samber-golang` | samber/cc-skills-golang | tag `v2.0.0`  |
| `mattpocock`    | mattpocock/skills       | tag `v1.3.2`  |
| `tw93-kami`     | tw93/Kami               | tag `V1.20.0` |
| `tw93-waza`     | tw93/Waza               | tag `v3.42.0` |

Unpinned repos track the default branch.

## Dependencies

- `@clack/prompts` — interactive CLI
- `simple-git` — git operations
- `tsx` — run TypeScript CLI
- `vitest` — unit tests
- `js-yaml` — skill and agent frontmatter helpers where used
