# Upstream Gaps

References inside synced skills, agents and rules that do not resolve on disk. Every
entry below is written by the upstream repo — the same wording ships there — so it is
an upstream defect, not a defect of this collection.

Do not hand-edit the dest trees to fix these: `skills/`, `agents/` and `rules/` are
generated from `meta.ts` and overwritten on every sync. A fix belongs either upstream
or in a named transform in `meta.ts`.

| #   | Upstream                                                                | dest file                                                                                                                                                                                                            | Missing target                                                                                     | Upstream state                                                                                     |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | [jimliu/baoyu-design](https://github.com/jimliu/baoyu-design)           | `skills/baoyu-design/claude-dashboard/artifact-type/reference/sources.md`                                                                                                                                            | `artifact-type/reference/scheduled-refresh-routine.md`                                             | not shipped upstream either                                                                        |
| 2   | [jimliu/baoyu-design](https://github.com/jimliu/baoyu-design)           | `skills/baoyu-design/claude-slides/artifact-type/reference/fonts.md`, `.../images.md`                                                                                                                                | `scripts/make.ts`                                                                                  | not shipped upstream either (the skill ships `artifact.mjs`, `editor/`, `server.mjs`)              |
| 3   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `skills/vercel-agent/react-best-practices/README.md`                                                                                                                                                                 | `rules/area-description.md`                                                                        | not shipped upstream either                                                                        |
| 4   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `skills/vercel-agent/react-best-practices/AGENTS.md`                                                                                                                                                                 | `./async-defer-await.md`, `./async-cheap-condition-before-await.md`, `./server-hoist-static-io.md` | files exist upstream under `rules/`; the links omit the `rules/` prefix                            |
| 5   | [anthropics/skills](https://github.com/anthropics/skills)               | `skills/anthropics/skill-creator/SKILL.md`, `.../references/schemas.md`                                                                                                                                              | `evals/evals.json`                                                                                 | the skill package ships no `evals/` directory                                                      |
| 6   | [tw93/Kami](https://github.com/tw93/Kami)                               | `skills/tw93-kami/kami/references/production.md`                                                                                                                                                                     | `scripts/package-skill.sh`                                                                         | script exists upstream at the repo root (`upstream/tw93-kami/scripts/`), not inside `skills/kami/` |
| 7   | [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills)           | `skills/baoyu/baoyu-image-gen/SKILL.md`, `.../references/codex-image2-fallback.md`, `.../references/codex-oauth-vs-openai-api-key.md`, `skills/baoyu/baoyu-infographic/SKILL.md`, `.../references/codex-imagegen.md` | `packages/baoyu-codex-imagegen/src/main.ts`                                                        | the file exists upstream in the monorepo `packages/`, outside the skill package                    |

## Impact

All of them are prose links to files a user would only reach by opening the skill
folder. None of them breaks the skill entry point, and none of the mapped skills
depends on another for these paths — the skills that mention the targets are
self-contained.

## How they were found

`collection-connectivity` audit on 2026-11-02: every reference edge in the dest trees
was resolved against disk, then each unresolved edge was checked against the matching
`upstream/` checkout to tell an upstream gap from a dest missing a file that upstream
ships.
