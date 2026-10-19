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
│   ├── utils/              # filesystem + digest helpers
│   ├── errors/             # custom error classes
│   └── types.ts            # RepositoryConfig, SkillMapping, AgentMapping, RuleMapping, SyncManifest
├── skills/                 # published skills: skills/{repoKey}/{name}/
│   └── custom/             # hand-maintained local skills
├── agents/                 # published agents: agents/{repoKey}/{name}.md
├── rules/                  # published rules: rules/{repoKey}/{name}.md
├── upstream/               # git checkouts (not version-controlled)
└── meta.ts                 # repo keys, pins, mappings, transforms
```

Synced skills land at `skills/{repoKey}/{name}/SKILL.md`. Hand-maintained skills stay under `skills/custom/{name}/`. Synced agents land at `agents/{repoKey}/{name}.md` (Cursor single-file subagent format). Synced rules land at `rules/{repoKey}/{name}.md` — copied verbatim, no frontmatter injection. Skill-bundled helper prompts under a skill's own `agents/` directory stay inside that skill.

Dest trees under `skills/{repoKey}/`, `agents/{repoKey}/`, and `rules/{repoKey}/` are generated: load source into memory, run named transforms, write dest. Do not hand-edit them; persist edits as named transforms in `meta.ts`. `skills/custom/` is not transformed.

## CLI

`pnpm cli` → interactive menu:

| Action          | Handler               | Behaviour                                                                     |
| --------------- | --------------------- | ----------------------------------------------------------------------------- |
| Manage upstream | `upstream.command.ts` | Clone or update repos under `upstream/` (clone then pin)                      |
| Sync skills     | `sync.command.ts`     | Update upstream, rewrite mapped dests, write SYNC.json；`--force` 再清 orphan |
| Cleanup         | `cleanup.command.ts`  | Remove orphaned upstream checkouts                                            |

Every sync run deletes and rewrites each mapped dest. Mapping 里拿掉的 dest **默认不删**；`pnpm cli --force`（或交互确认 Force sync）会额外删除该 repo 下未再映射的 skill 目录 / agent `.md` / rule `.md`。`skills/{repoKey}/SYNC.json`、`agents/{repoKey}/SYNC.json` 和 `rules/{repoKey}/SYNC.json` 存 `{ upstream_committed_sha, upstream_committed_at, items_digest, items_changed_at, items: [{ name, digest }] }`（items 按 name 升序）。

Transforms are kebab-case names. Repo-level `transforms.skills` / `transforms.agents` / `transforms.rules` run first, then mapping `transforms`, then a builtin step that sets entry YAML `name` to the dest name (skills and agents only; rules skip it so their body stays verbatim). Strategies receive a skill file-tree context or an agent/rule string context and are unit-tested in isolation.

`UpstreamService` holds clone/pin/sync logic; commands receive it as a dependency. Git ops use `simple-git` with the user's git config (including proxy).

## Working on this repo

1. **Change what syncs** → edit `meta.ts` (`skills` / `agents` mappings, `tag` / `branch` / `commit` pins, `transforms`), then run Sync.
2. **Add a hand-maintained skill** → put it under `skills/custom/{name}/` with a `SKILL.md`; do not invent a fake upstream entry for it.
3. **Upstream with empty `skills`, `agents`, and `rules`** → repo may be listed for future use; Sync skips that repo until a mapping exists. A repo with only one kind still syncs.
4. **Verify** → `pnpm test`（vitest）/ `pnpm lint` / `pnpm fmt` after TypeScript changes.

## Pins (see `meta.ts`)

| Key             | Upstream                | Pin           |
| --------------- | ----------------------- | ------------- |
| `samber-golang` | samber/cc-skills-golang | tag `v2.0.0`  |
| `mattpocock`    | mattpocock/skills       | tag `v1.3.1`  |
| `tw93-waza`     | tw93/Waza               | tag `v3.40.0` |

Unpinned repos track the default branch.

## Dependencies

- `@clack/prompts` — interactive CLI
- `simple-git` — git operations
- `tsx` — run TypeScript CLI
- `vitest` — unit tests
- `js-yaml` — skill and agent frontmatter helpers where used
