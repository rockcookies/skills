# Upstream Gaps

References inside synced skills, agents and rules that do not resolve on disk. Every
entry below is written by the upstream repo — the same wording ships there — so it is
an upstream defect, not a defect of this collection.

Do not hand-edit the dest trees to fix these: `skills/`, `agents/` and `rules/` are
generated from `meta.ts` and overwritten on every sync. A fix belongs either upstream
or in a named transform in `meta.ts`.

| #   | Upstream                                                                | dest file                                                                                                                                                                                                            | Missing target                                                                                     | Upstream state                                                                                     |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `skills/vercel-agent/react-best-practices/README.md`                                                                                                                                                                 | `rules/area-description.md`                                                                        | not shipped upstream either                                                                        |
| 2   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `skills/vercel-agent/react-best-practices/AGENTS.md`                                                                                                                                                                 | `./async-defer-await.md`, `./async-cheap-condition-before-await.md`, `./server-hoist-static-io.md` | files exist upstream under `rules/`; the links omit the `rules/` prefix                            |
| 3   | [anthropics/skills](https://github.com/anthropics/skills)               | `skills/anthropics/skill-creator/SKILL.md`, `.../references/schemas.md`                                                                                                                                              | `evals/evals.json`                                                                                 | the skill package ships no `evals/` directory                                                      |
| 4   | [tw93/Kami](https://github.com/tw93/Kami)                               | `skills/tw93-kami/kami/references/production.md`                                                                                                                                                                     | `scripts/package-skill.sh`                                                                         | script exists upstream at the repo root (`upstream/tw93-kami/scripts/`), not inside `skills/kami/` |
| 5   | [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills)           | `skills/baoyu/baoyu-image-gen/SKILL.md`, `.../references/codex-image2-fallback.md`, `.../references/codex-oauth-vs-openai-api-key.md`, `skills/baoyu/baoyu-infographic/SKILL.md`, `.../references/codex-imagegen.md` | `packages/baoyu-codex-imagegen/src/main.ts`                                                        | the file exists upstream in the monorepo `packages/`, outside the skill package                    |
| 6   | [pbakaus/impeccable](https://github.com/pbakaus/impeccable)             | `agents/impeccable/impeccable-asset-producer.md`                                                                                                                                                                     | `../skills/impeccable/reference/component-review.md`                                               | the link omits the skill-dir segment; the target exists at `skills/impeccable/impeccable/reference/component-review.md`, and the link resolves in upstream's own `.claude/agents/` layout |

## Minor prose-level mentions

Text-level name drops that do not resolve as paths. They are prose, not links, and
none of them breaks a skill entry point; recorded so future audits do not re-triage.

- `skills/cursor-plugins/typescript-best-practices/references/patterns.md` — bare `SKILL.md` means `../SKILL.md`
- `skills/impeccable/impeccable/reference/adapt.md` — backticked `responsive-design.md`; the content was inlined long ago
- `skills/anthropics/skill-creator/SKILL.md` — bare `package_skill.py` / `run_loop.py` / `run_eval.py`; the scripts live under `scripts/` (other lines call them correctly via `python -m scripts.X`)
- `skills/antfu/vite/references/core-features.md` — one empty markdown link `]()`

## Impact

All of them are prose links to files a user would only reach by opening the skill
folder. None of them breaks the skill entry point, and none of the mapped skills
depends on another for these paths — the skills that mention the targets are
self-contained.

## How they were found

`collection-connectivity` audit on 2026-11-02: every reference edge in the dest trees
was resolved against disk, then each unresolved edge was checked against the matching
`upstream/` checkout to tell an upstream gap from a dest missing a file that upstream
ships. Re-audited on 2026-11-17 for the cursor-plugins, antfu, impeccable, anthropics,
tw93-waza, and lieflat-less-ai-tone collections after an upstream sync; row 6 and the
minor-mentions list come from that pass.
