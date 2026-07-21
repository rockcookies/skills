# Agent Guide

Curated [Agent Skills](https://agentskills.io/home) collection plus a CLI that syncs skills from upstream git repos into `skills/{repoKey}/{target}/`.

User-facing install catalog and bundles live in [README.md](README.md). Repository sources and skill mappings live in [meta.ts](meta.ts) — that file is the single source of truth for what syncs.

## Layout

```
.
├── src/
│   ├── cli.ts              # CLI entry (thin orchestrator)
│   ├── commands/           # upstream / sync / cleanup handlers
│   ├── services/           # GitService, UpstreamService, SyncService
│   ├── utils/              # filesystem + error helpers
│   ├── errors/             # custom error classes
│   └── types.ts            # RepositoryConfig, SkillMapping
├── skills/                 # published skills: skills/{repoKey}/{target}/
│   └── custom/             # hand-maintained local skills
├── upstream/               # git checkouts (not version-controlled)
├── meta.ts                 # repo keys, pins (tag/branch/commit), skill mappings
└── docs/                   # project ledgers / misc docs (not architecture)
```

Synced skills land at `skills/{repoKey}/{target}/SKILL.md`. Hand-maintained skills stay under `skills/custom/{name}/`.

## CLI

`pnpm cli` → interactive menu:

| Action | Handler | Behaviour |
| --- | --- | --- |
| Manage upstream | `upstream.command.ts` | Clone or update repos under `upstream/` |
| Sync skills | `sync.command.ts` | Update upstream, then copy mapped skills into `skills/` |
| Cleanup | `cleanup.command.ts` | Remove orphaned upstream checkouts |

Services hold the logic; commands receive them as dependencies. `GitService` wraps `simple-git` and uses the user's git config (including proxy).

## Working on this repo

1. **Change what syncs** → edit `meta.ts` (`skills` mappings, `tag` / `branch` / `commit` pins), then run Sync.
2. **Add a hand-maintained skill** → put it under `skills/custom/{name}/` with a `SKILL.md`; do not invent a fake upstream entry for it.
3. **Upstream with empty `skills`** → repo may be listed for future use; Sync skips it until mappings exist.
4. **Verify** → `pnpm lint` / `pnpm fmt` after TypeScript changes.

## Pins (see `meta.ts`)

| Key | Upstream | Pin |
| --- | --- | --- |
| `samber-golang` | samber/cc-skills-golang | tag `v1.9.0` |
| `mattpocock` | mattpocock/skills | tag `v1.1.0` |
| `tw93-waza` | tw93/Waza | tag `v3.32.0` |

Unpinned repos track the default branch.

## Dependencies

- `@clack/prompts` — interactive CLI
- `simple-git` — git operations
- `tsx` — run TypeScript CLI
- `js-yaml` — SYNC / skill frontmatter helpers where used
