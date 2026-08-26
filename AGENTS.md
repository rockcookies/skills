# Agent Guide

Curated [Agent Skills](https://agentskills.io/home) collection plus a CLI that syncs skills and Cursor plugin agents from upstream git repos into `skills/{repoKey}/{target}/` and `agents/{repoKey}/{target}.md`.

User-facing install catalog and bundles live in [README.md](README.md). Repository sources and mappings live in [meta.ts](meta.ts) — that file is the single source of truth for what syncs.

## Layout

```
.
├── src/
│   ├── cli.ts              # CLI entry (thin orchestrator)
│   ├── commands/           # upstream / sync / cleanup handlers
│   ├── services/           # GitService, UpstreamService, SyncService
│   ├── utils/              # filesystem + error helpers
│   ├── errors/             # custom error classes
│   └── types.ts            # RepositoryConfig, SkillMapping, AgentMapping
├── skills/                 # published skills: skills/{repoKey}/{target}/
│   └── custom/             # hand-maintained local skills
├── agents/                 # published agents: agents/{repoKey}/{target}.md
├── upstream/               # git checkouts (not version-controlled)
└── meta.ts                 # repo keys, pins (tag/branch/commit), skill and agent mappings
```

Synced skills land at `skills/{repoKey}/{target}/SKILL.md`. Hand-maintained skills stay under `skills/custom/{name}/`. Synced agents land at `agents/{repoKey}/{target}.md` (Cursor single-file subagent format). Skill-bundled helper prompts under a skill's own `agents/` directory stay inside that skill.

## CLI

`pnpm cli` → interactive menu:

| Action          | Handler               | Behaviour                                                           |
| --------------- | --------------------- | ------------------------------------------------------------------- |
| Manage upstream | `upstream.command.ts` | Clone or update repos under `upstream/`                             |
| Sync skills     | `sync.command.ts`     | Update upstream, then copy mapped skills and agents into dest trees |
| Cleanup         | `cleanup.command.ts`  | Remove orphaned upstream checkouts                                  |

Services hold the logic; commands receive them as dependencies. `GitService` wraps `simple-git` and uses the user's git config (including proxy).

## Working on this repo

1. **Change what syncs** → edit `meta.ts` (`skills` / `agents` mappings, `tag` / `branch` / `commit` pins), then run Sync.
2. **Add a hand-maintained skill** → put it under `skills/custom/{name}/` with a `SKILL.md`; do not invent a fake upstream entry for it.
3. **Upstream with empty `skills` and empty `agents`** → repo may be listed for future use; Sync skips that repo until a mapping exists. A repo with only agents still syncs (and vice versa).
4. **Verify** → `pnpm lint` / `pnpm fmt` after TypeScript changes.

## Pins (see `meta.ts`)

| Key             | Upstream                | Pin           |
| --------------- | ----------------------- | ------------- |
| `samber-golang` | samber/cc-skills-golang | tag `v1.9.1`  |
| `mattpocock`    | mattpocock/skills       | tag `v1.2.0`  |
| `tw93-waza`     | tw93/Waza               | tag `v3.33.0` |

Unpinned repos track the default branch.

## Dependencies

- `@clack/prompts` — interactive CLI
- `simple-git` — git operations
- `tsx` — run TypeScript CLI
- `js-yaml` — SYNC / skill and agent frontmatter helpers where used
