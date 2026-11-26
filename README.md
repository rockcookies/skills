# RockCookies' Skills

A curated collection of [Agent Skills](https://agentskills.io/home) and Cursor plugin agents for full-stack development, synced from upstream repositories by a script suite.

Synced skills live at `content/{repoKey}/skills/{name}/`. Hand-maintained skills live under `content/custom/skills/`. Synced agents live at `content/{repoKey}/agents/{name}.md`. Synced rules live at `content/{repoKey}/rules/{name}.md` — sync products copied verbatim from upstream; `npx skills add` does not install them. Repository sources and mappings are configured in [meta.ts](meta.ts). After sync, each repo writes a single `content/{repoKey}/SYNC.json` with upstream commit identity and per-item content digests.

## Installation

Skills live under `content/{repoKey}/skills/{target}/`, declared to the skills CLI as a discovery container via [skills.sh.json](skills.sh.json) (`paths: ["./content"]`), so the default scan finds every nested `SKILL.md` without extra flags.

```bash
npx skills add rockcookies/skills --skill '*' -g
```

Or a single skill:

```bash
npx skills add rockcookies/skills --skill vue-best-practices -g
```

Learn more about the CLI at [skills](https://github.com/vercel-labs/skills).

Curated bundles ("packs") live in [packs.ts](packs.ts). Run `pnpm packs [id…] [--shell bash|powershell|cmd|all]` to print the combined multi-line command; it flags skills that the packs' members reference but don't include.

`npx skills add` installs skills only. Copy agent `.md` files (not `SYNC.json`) into Cursor's user agents directory:

```bash
cp content/cursor-plugins/agents/*.md ~/.cursor/agents/
```

Thermos skills launch those subagents by `name`. Install the skills **and** copy the matching agent files, or the orchestrator has nothing to delegate to.

Rules are skipped too — they are copied verbatim from upstream and live at `content/{repoKey}/rules/{name}.md`; copy them into your runtime's rules directory (e.g. `~/.cursor/rules/`). This repo currently ships the six Waza rules under `content/tw93-waza/rules/`.

### Go skills ([samber/cc-skills-golang](https://github.com/samber/cc-skills-golang), tag `v2.0.0`)

Atomic and cross-referencing — prefer the ⭐ set (or all), then add category / library skills as needed. Installing a skill does **not** pull linked skills automatically.

```bash
# All Go skills
npx skills add rockcookies/skills --skill 'golang-*' -g
```

#### ⭐ Recommended

Upstream general-purpose set for every Go project. Includes `golang-how-to` (orchestrator).

```bash
npx skills add rockcookies/skills
  --skill golang-how-to \
  --skill golang-code-style \
  --skill golang-data-structures \
  --skill golang-database \
  --skill golang-design-patterns \
  --skill golang-documentation \
  --skill golang-error-handling \
  --skill golang-modernize \
  --skill golang-naming \
  --skill golang-refactoring \
  --skill golang-safety \
  --skill golang-security \
  --skill golang-testing \
  --skill golang-troubleshooting \
  -g
```

#### Code Quality

```bash
npx skills add rockcookies/skills
  --skill golang-code-style \
  --skill golang-documentation \
  --skill golang-error-handling \
  --skill golang-lint \
  --skill golang-naming \
  --skill golang-safety \
  --skill golang-security \
  --skill golang-structs-interfaces \
  -g
```

#### Architecture & Design

```bash
npx skills add rockcookies/skills
  --skill golang-concurrency \
  --skill golang-context \
  --skill golang-data-structures \
  --skill golang-database \
  --skill golang-dependency-injection \
  --skill golang-design-patterns \
  --skill golang-modernize \
  --skill golang-refactoring \
  -g
```

#### QA & Performance

```bash
npx skills add rockcookies/skills
  --skill golang-benchmark \
  --skill golang-observability \
  --skill golang-performance \
  --skill golang-testing \
  --skill golang-troubleshooting \
  -g
```

#### Project Setup

```bash
npx skills add rockcookies/skills
  --skill golang-cli \
  --skill golang-continuous-integration \
  --skill golang-dependency-management \
  --skill golang-gopls \
  --skill golang-pkg-go-dev \
  --skill golang-popular-libraries \
  --skill golang-project-layout \
  --skill golang-stay-updated \
  -g
```

#### APIs

```bash
npx skills add rockcookies/skills
  --skill golang-graphql \
  --skill golang-grpc \
  --skill golang-swagger \
  -g
```

#### Dependency Injection

```bash
npx skills add rockcookies/skills
  --skill golang-google-wire \
  --skill golang-uber-dig \
  --skill golang-uber-fx \
  --skill golang-samber-do \
  -g
```

#### Frameworks

```bash
npx skills add rockcookies/skills
  --skill golang-spf13-cobra \
  --skill golang-spf13-viper \
  -g
```

#### samber/*

```bash
npx skills add rockcookies/skills
  --skill golang-samber-do \
  --skill golang-samber-hot \
  --skill golang-samber-lo \
  --skill golang-samber-mo \
  --skill golang-samber-oops \
  --skill golang-samber-ro \
  --skill golang-samber-slog \
  -g
```

#### Testing (library)

```bash
npx skills add rockcookies/skills
  --skill golang-stretchr-testify \
  -g
```

#### Pin skills in the project agent config

After installing, add a `## Required Go skills` block to `CLAUDE.md` or `AGENTS.md`. Use `/golang-how-to configure` or copy from [golang-how-to/references/project-config.md](content/samber-golang/skills/golang-how-to/references/project-config.md).

```markdown
## Required Go skills

The following Go skills MUST always load for Go-related work on this project:

- `golang-how-to`
- `golang-code-style`
- `golang-data-structures`
- `golang-database`
- `golang-design-patterns`
- `golang-documentation`
- `golang-error-handling`
- `golang-modernize`
- `golang-naming`
- `golang-refactoring`
- `golang-safety`
- `golang-security`
- `golang-testing`
- `golang-troubleshooting`
```

### JS / TypeScript skills

Hand-maintained web style skills live under `content/custom/skills/` (`web-code-style`, `web-css-guidelines`). Install by stack:

#### Tooling (antfu)

```bash
npx skills add rockcookies/skills
  --skill antfu \
  --skill vite \
  --skill vitest \
  --skill unocss \
  -g
```

#### Vue

```bash
npx skills add rockcookies/skills
  --skill vue-best-practices \
  --skill vue-debug-guides \
  --skill vue-jsx-best-practices \
  --skill vue-options-api-best-practices \
  --skill vue-pinia-best-practices \
  --skill vue-router-best-practices \
  --skill vue-testing-best-practices \
  --skill vueuse-functions \
  -g
```

#### TanStack

```bash
npx skills add rockcookies/skills
  --skill tanstack-integration \
  --skill tanstack-query \
  --skill tanstack-router \
  --skill tanstack-start \
  -g
```

#### React / Next.js & web guidelines

```bash
npx skills add rockcookies/skills
  --skill react-best-practices \
  --skill web-design-guidelines \
  -g
```

#### TypeScript principles (cursor/plugins)

```bash
npx skills add rockcookies/skills
  --skill typescript-best-practices \
  --skill principle-type-system-discipline \
  --skill principle-boundary-discipline \
  --skill principle-encode-lessons-in-structure \
  -g
```

#### how & why (cursor/plugins)

Companions driving parallel `generalPurpose` Task subagents: `how` explains how a subsystem works; `why` investigates the forces that shaped it through available MCPs.

```bash
npx skills add rockcookies/skills
  --skill how \
  --skill why \
  -g
```

#### pstack set (cursor/plugins)

All twenty-four engineering principles plus the workflow skills built on them: `benchmark-checklist`, `pstack-tdd` (aliased — `tdd` is taken) and `show-me-your-work`.

```bash
npx skills add rockcookies/skills
  --skill benchmark-checklist \
  --skill principle-attack-the-premise \
  --skill principle-boundary-discipline \
  --skill principle-build-the-lever \
  --skill principle-encode-lessons-in-structure \
  --skill principle-exhaust-the-design-space \
  --skill principle-experience-first \
  --skill principle-explain-the-number \
  --skill principle-fix-root-causes \
  --skill principle-foundational-thinking \
  --skill principle-guard-the-context-window \
  --skill principle-laziness-protocol \
  --skill principle-make-operations-idempotent \
  --skill principle-migrate-callers-then-delete-legacy-apis \
  --skill principle-minimize-reader-load \
  --skill principle-model-the-domain \
  --skill principle-never-block-on-the-human \
  --skill principle-outcome-oriented-execution \
  --skill principle-prove-it-works \
  --skill principle-redesign-from-first-principles \
  --skill principle-sequence-verifiable-units \
  --skill principle-separate-before-serializing-shared-state \
  --skill principle-subtract-before-you-add \
  --skill principle-test-behavior-not-implementation \
  --skill principle-type-system-discipline \
  --skill pstack-tdd \
  --skill show-me-your-work \
  -g
```

#### Writing (unslop & technical-writing)

`technical-writing` applies `unslop` on every doc it touches; `technical-writing-zh` (custom) orchestrates both for Chinese output. Install those three together. `skill-evolution` hard-depends on `writing-for-agents` (runtime stop if missing); install both when you want Skill audit / feedback-loop maintenance.

```bash
npx skills add rockcookies/skills
  --skill unslop \
  --skill technical-writing \
  --skill technical-writing-zh \
  --skill writing-for-agents \
  --skill skill-evolution \
  -g
```

#### Hono / Playwright / web style

```bash
npx skills add rockcookies/skills
  --skill hono \
  --skill hono-jsx \
  --skill playwright-cli \
  --skill web-code-style \
  --skill web-css-guidelines \
  -g
```

#### UI / design / image gen

```bash
npx skills add rockcookies/skills
  --skill frontend-design \
  --skill ui \
  --skill baoyu-image-gen \
  --skill impeccable \
  -g
```

#### Thermos (branch review)

Skills plus matching agents. After installing the skills, copy the agent files as in [Installation](#installation).

```bash
npx skills add rockcookies/skills
  --skill thermos \
  --skill thermo-nuclear-review \
  --skill thermo-nuclear-code-quality-review \
  -g
```

## Skills

### Hand-maintained Skills

> Opinionated workflows and conventions maintained by RockCookies under `content/custom/skills/`.

| Skill                                                                  | Description                                                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [technical-writing-zh](content/custom/skills/technical-writing-zh)     | 中文写作补充（编排 unslop + technical-writing）                                          |
| [cursor-plan-pipeline](content/custom/skills/cursor-plan-pipeline)     | Cursor Plan Mode 流水线（拷问 → 计划闸口 → 实现 → 审查）                                 |
| [git-atomic-commit](content/custom/skills/git-atomic-commit)           | Atomic commits 3.0 — one revertable commit; index isolation                              |
| [git-rebase-surgeon](content/custom/skills/git-rebase-surgeon)         | Safe rebase 3.0 — SEQUENCE_EDITOR, backup, explicit lease                                |
| [git-semantic-search](content/custom/skills/git-semantic-search)       | Git archaeology 3.0 — Pickaxe/Blame/Bisect with clean-worktree                           |
| [grill-and-think](content/custom/skills/grill-and-think)               | 跨运行时设计流水线（拷问 → 深思 → 实现 → 审查）                                          |
| [hierarchical-agents-md](content/custom/skills/hierarchical-agents-md) | 层级 AGENTS.md / README.md — init / update / audit / reorganize / trim；只读 Python 脚本 |
| [skill-evolution](content/custom/skills/skill-evolution)               | 审计/改造现有 Skill — 工作地图、验收契约、工具化、有证据验证、反馈闭环                   |
| [steelman](content/custom/skills/steelman)                             | 双向钢人论证 — 重述真问题，强化正反双方，锁定关键变量，硬裁决                            |
| [web-code-style](content/custom/skills/web-code-style)                 | Web fullstack naming + clarity — identifiers, files, Hooks/props, control flow, JSX      |
| [web-css-guidelines](content/custom/skills/web-css-guidelines)         | CSS / Tailwind v4 规则手册 — 去 IE、布局层叠显隐、变量主题、响应式性能、现代化替换       |
| [week-retro](content/custom/skills/week-retro)                         | 周回顾 workflow learning loop                                                            |

### Upstream Skills

Synced from external repositories into `content/{repoKey}/skills/{target}/`.

#### [antfu/skills](https://github.com/antfu/skills)

| Skill                                 | Description                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| [antfu](content/antfu/skills/antfu)   | Anthony Fu's opinionated JS/TS tooling — eslint config, pnpm, monorepo, library publishing |
| [unocss](content/antfu/skills/unocss) | UnoCSS instant atomic CSS engine, Tailwind superset                                        |
| [vite](content/antfu/skills/vite)     | Vite build tool — config, plugin API, SSR, Vite 8 Rolldown migration                       |
| [vitest](content/antfu/skills/vitest) | Vitest fast unit testing, Jest-compatible API                                              |

#### [anthropics/skills](https://github.com/anthropics/skills)

| Skill                                                        | Description                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| [frontend-design](content/anthropics/skills/frontend-design) | Distinctive, intentional visual design for new or reshaped UI |
| [skill-creator](content/anthropics/skills/skill-creator)     | Create, edit, and benchmark agent skills                      |

#### [cursor/plugins](https://github.com/cursor/plugins)

| Skill                                                                                                                                  | Description                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [benchmark-checklist](content/cursor-plugins/skills/benchmark-checklist)                                                               | Vet a perf measurement before reporting it - limiter, tuning, errors, repeatability |
| [how](content/cursor-plugins/skills/how)                                                                                               | Subsystem walkthroughs - "how does X work", placement, ownership                    |
| [principle-attack-the-premise](content/cursor-plugins/skills/principle-attack-the-premise)                                             | Test the premise two failed fixes shared before writing a third fix                 |
| [principle-boundary-discipline](content/cursor-plugins/skills/principle-boundary-discipline)                                           | Validation and error handling at system boundaries; trust internal types            |
| [principle-build-the-lever](content/cursor-plugins/skills/principle-build-the-lever)                                                   | Build the tool that does or proves the work instead of hand-running it              |
| [principle-encode-lessons-in-structure](content/cursor-plugins/skills/principle-encode-lessons-in-structure)                           | Encode recurring fixes as lint rules, flags, checks, or scripts                     |
| [principle-exhaust-the-design-space](content/cursor-plugins/skills/principle-exhaust-the-design-space)                                 | Build 2-3 competing prototypes and compare side by side before committing           |
| [principle-experience-first](content/cursor-plugins/skills/principle-experience-first)                                                 | Choose user delight over implementation convenience on scope tradeoffs              |
| [principle-explain-the-number](content/cursor-plugins/skills/principle-explain-the-number)                                             | Name what limits a measured number; rule out that it measured something else        |
| [principle-fix-root-causes](content/cursor-plugins/skills/principle-fix-root-causes)                                                   | Trace each symptom to its root cause; reproduce first, no symptom guards            |
| [principle-foundational-thinking](content/cursor-plugins/skills/principle-foundational-thinking)                                       | Pick core types and data structures before logic; get structures right              |
| [principle-guard-the-context-window](content/cursor-plugins/skills/principle-guard-the-context-window)                                 | Route bulk reading to subagents; keep summaries in the main thread                  |
| [principle-laziness-protocol](content/cursor-plugins/skills/principle-laziness-protocol)                                               | Bias toward deletion and the smallest change that solves the problem                |
| [principle-make-operations-idempotent](content/cursor-plugins/skills/principle-make-operations-idempotent)                             | Converge retries on the same end state after crashes and restarts                   |
| [principle-migrate-callers-then-delete-legacy-apis](content/cursor-plugins/skills/principle-migrate-callers-then-delete-legacy-apis)   | Migrate callers and delete the old API in one wave; no shim layers                  |
| [principle-minimize-reader-load](content/cursor-plugins/skills/principle-minimize-reader-load)                                         | Collapse one-caller layers and shrink the state a reader must hold                  |
| [principle-model-the-domain](content/cursor-plugins/skills/principle-model-the-domain)                                                 | Encode repeated rules in one structure, not scattered conditionals                  |
| [principle-never-block-on-the-human](content/cursor-plugins/skills/principle-never-block-on-the-human)                                 | Proceed on reversible work and present the result                                   |
| [principle-outcome-oriented-execution](content/cursor-plugins/skills/principle-outcome-oriented-execution)                             | Converge on the target architecture; no throwaway compatibility states              |
| [principle-prove-it-works](content/cursor-plugins/skills/principle-prove-it-works)                                                     | Verify against the real artifact - run, read values, inspect diff                   |
| [principle-redesign-from-first-principles](content/cursor-plugins/skills/principle-redesign-from-first-principles)                     | Redesign as if the new requirement had been foundational from day one               |
| [principle-separate-before-serializing-shared-state](content/cursor-plugins/skills/principle-separate-before-serializing-shared-state) | Eliminate sharing first; serialize structurally only with one real writer           |
| [principle-sequence-verifiable-units](content/cursor-plugins/skills/principle-sequence-verifiable-units)                               | End each small unit in a check before starting the next                             |
| [principle-subtract-before-you-add](content/cursor-plugins/skills/principle-subtract-before-you-add)                                   | Remove dead weight, redundant guards, stub refs; build on simpler base              |
| [principle-test-behavior-not-implementation](content/cursor-plugins/skills/principle-test-behavior-not-implementation)                 | Assert what users observe; keep passing through internal refactors                  |
| [principle-type-system-discipline](content/cursor-plugins/skills/principle-type-system-discipline)                                     | Make illegal states unrepresentable - sum types, brands, boundary parse             |
| [pstack-tdd](content/cursor-plugins/skills/pstack-tdd)                                                                                 | Red-green-refactor TDD; on explicit TDD requests or obvious regression tests        |
| [show-me-your-work](content/cursor-plugins/skills/show-me-your-work)                                                                   | TSV decision log (what, why, evidence, result) for unattended work                  |
| [technical-writing](content/cursor-plugins/skills/technical-writing)                                                                   | Layered writing standard - Diataxis, Google style, STE, Global English              |
| [thermo-nuclear-code-quality-review](content/cursor-plugins/skills/thermo-nuclear-code-quality-review)                                 | Strict maintainability audit (structure, file-size growth, spaghetti)               |
| [thermo-nuclear-review](content/cursor-plugins/skills/thermo-nuclear-review)                                                           | Deep branch audit (bugs, breakages, security, devex, feature-flag leaks)            |
| [thermos](content/cursor-plugins/skills/thermos)                                                                                       | Run both review subagents in parallel and synthesize findings                       |
| [typescript-best-practices](content/cursor-plugins/skills/typescript-best-practices)                                                   | TypeScript rules grounding the type-system principles in .ts/.tsx                   |
| [unslop](content/cursor-plugins/skills/unslop)                                                                                         | Cut AI tells from writing - puffery, chatbot phrases, hedging, jargon               |
| [why](content/cursor-plugins/skills/why)                                                                                               | Design rationale - parallel MCP evidence investigators, cited synthesis             |

#### [deckardger/tanstack-agent-skills](https://github.com/deckardger/tanstack-agent-skills)

| Skill                                                                      | Description                                                          |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [tanstack-integration](content/tanstack-agent/skills/tanstack-integration) | TanStack Query + Router + Start full-stack data flow, SSR, caching   |
| [tanstack-query](content/tanstack-agent/skills/tanstack-query)             | TanStack Query — data fetching, caching, mutations, server state     |
| [tanstack-router](content/tanstack-agent/skills/tanstack-router)           | TanStack Router — type-safe routing, data loading, search params     |
| [tanstack-start](content/tanstack-agent/skills/tanstack-start)             | TanStack Start — server functions, middleware, SSR, auth, deployment |

#### [humanlayer/skills](https://github.com/humanlayer/skills)

| Skill                                        | Description                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| [show-me](content/humanlayer/skills/show-me) | Visual explanations — diagrams, call trees, Mermaid diffs, and focused HTML artifacts |

#### [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills)

| Skill                                                       | Description                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [baoyu-image-gen](content/baoyu/skills/baoyu-image-gen)     | AI image generation across OpenAI, Google, DashScope, Z.AI, Replicate, and more |
| [baoyu-infographic](content/baoyu/skills/baoyu-infographic) | Publication-ready infographics — 21 layout types × 22 visual styles             |

#### [larashero3-dotcom/lieflat-less-ai-tone](https://github.com/larashero3-dotcom/lieflat-less-ai-tone)

| Skill                                                                            | Description                                                                                                                |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [lieflat-less-ai-tone](content/lieflat-less-ai-tone/skills/lieflat-less-ai-tone) | De-AI-ify finished prose — scripted metrics + semantic judgment, report findings first, rewrite on approval, re-test after |

#### [majiayu000/spellbook](https://github.com/majiayu000/spellbook)

| Skill                                                             | Description                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [clash-doctor](content/majiayu-spellbook/skills/clash-doctor)     | Clash Verge diagnostics and config management — proxy rules, subscriptions   |
| [clash-routes](content/majiayu-spellbook/skills/clash-routes)     | Inspect per-process proxy routes via the Mihomo API                          |
| [codebase-audit](content/majiayu-spellbook/skills/codebase-audit) | Adaptive parallel codebase audit — findings, adversarial validation, roadmap |
| [figma-to-react](content/majiayu-spellbook/skills/figma-to-react) | Extract Figma designs into production-ready React/Next.js components         |
| [ip-check](content/majiayu-spellbook/skills/ip-check)             | IP / socks5 proxy quality — registry, geo consensus, reputation, AI unlocks  |

#### [mattpocock/skills](https://github.com/mattpocock/skills) (tag `v1.3.2`)

| Skill                                                                                    | Description                                                             |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [ask-matt](content/mattpocock/skills/ask-matt)                                           | Router over the engineering/productivity skills in this set             |
| [code-review](content/mattpocock/skills/code-review)                                     | Review changes since a fixed point along Standards and Spec axes        |
| [codebase-design](content/mattpocock/skills/codebase-design)                             | Shared vocabulary for designing deep modules                            |
| [diagnosing-bugs](content/mattpocock/skills/diagnosing-bugs)                             | Diagnosis loop for hard bugs and performance regressions                |
| [domain-modeling](content/mattpocock/skills/domain-modeling)                             | Build domain terminology, ubiquitous language, and ADRs                 |
| [grill-me](content/mattpocock/skills/grill-me)                                           | Relentless interview to sharpen a plan or design                        |
| [grill-with-docs](content/mattpocock/skills/grill-with-docs)                             | Grill a plan while creating ADRs and glossary as you go                 |
| [grilling](content/mattpocock/skills/grilling)                                           | Grill a plan, decision, or idea to stress-test your thinking            |
| [handoff](content/mattpocock/skills/handoff)                                             | Compact the conversation into a handoff document for another agent      |
| [implement](content/mattpocock/skills/implement)                                         | Implement work from a spec or set of tickets                            |
| [implement-spec](content/mattpocock/skills/implement-spec)                               | Implement /to-spec and /to-tickets results — parallel implementers      |
| [improve-codebase-architecture](content/mattpocock/skills/improve-codebase-architecture) | Scan for deepening opportunities, report in HTML, then grill            |
| [pr](content/mattpocock/skills/pr)                                                       | Write a fast-to-review PR body — summary visual, evidence, merge danger |
| [prototype](content/mattpocock/skills/prototype)                                         | Throwaway prototype to answer a design question                         |
| [research](content/mattpocock/skills/research)                                           | Investigate against high-trust sources; capture findings as Markdown    |
| [retro](content/mattpocock/skills/retro)                                                 | Retrospective on a session — improve the environment, not the code      |
| [setup-matt-pocock-skills](content/mattpocock/skills/setup-matt-pocock-skills)           | One-time setup — issue tracker, triage labels, domain doc layout        |
| [tdd](content/mattpocock/skills/tdd)                                                     | Test-driven development — red-green-refactor and integration tests      |
| [teach](content/mattpocock/skills/teach)                                                 | Teach a new skill or concept within the workspace                       |
| [to-questionnaire](content/mattpocock/skills/to-questionnaire)                           | Turn a decision into a questionnaire for someone else to fill in        |
| [to-spec](content/mattpocock/skills/to-spec)                                             | Turn the current conversation into a published spec                     |
| [to-tickets](content/mattpocock/skills/to-tickets)                                       | Break a plan into tracer-bullet tickets with blocking edges             |
| [triage](content/mattpocock/skills/triage)                                               | Move issues and external PRs through triage roles                       |
| [wait-what](content/mattpocock/skills/wait-what)                                         | Re-pitch a message that didn't land in ASD-STE100 + ubiquitous language |
| [wayfinder](content/mattpocock/skills/wayfinder)                                         | Plan multi-session work as decision tickets on the tracker              |
| [wizard](content/mattpocock/skills/wizard)                                               | Generate an interactive bash wizard for human-only manual steps         |
| [writing-for-agents](content/mattpocock/skills/writing-for-agents)                       | Writing documents (skills, AGENTS.md, CLAUDE.md) that agents consume    |

#### [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)

| Skill                                                          | Description                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [playwright-cli](content/playwright-cli/skills/playwright-cli) | Automate browser interactions, test web pages, and work with Playwright tests |

#### [pbakaus/impeccable](https://github.com/pbakaus/impeccable)

| Skill                                              | Description                                                                                                          |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [impeccable](content/impeccable/skills/impeccable) | Design, critique, and polish frontend UI — UX audit, visual hierarchy, typography, color, motion, and design systems |

#### [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang) (tag `v2.0.0`)

| Skill                                                                                       | Description                                                                    |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [golang-benchmark](content/samber-golang/skills/golang-benchmark)                           | Benchmarking, profiling, and pprof/benchstat performance measurement           |
| [golang-cli](content/samber-golang/skills/golang-cli)                                       | CLI app development — command structure, flags, config, signals, completion    |
| [golang-code-style](content/samber-golang/skills/golang-code-style)                         | Code style, formatting, and clarity conventions                                |
| [golang-concurrency](content/samber-golang/skills/golang-concurrency)                       | Concurrency patterns — goroutines, channels, sync primitives, errgroup         |
| [golang-context](content/samber-golang/skills/golang-context)                               | Idiomatic context.Context — propagation, cancellation, timeouts, values        |
| [golang-continuous-integration](content/samber-golang/skills/golang-continuous-integration) | CI/CD pipelines with GitHub Actions for Go projects                            |
| [golang-data-structures](content/samber-golang/skills/golang-data-structures)               | Slices, maps, arrays, container packages, and generic collections              |
| [golang-database](content/samber-golang/skills/golang-database)                             | Database access — parameterized queries, transactions, connection pool         |
| [golang-dependency-injection](content/samber-golang/skills/golang-dependency-injection)     | DI patterns — manual DI and library comparison (wire, dig, fx, samber/do)      |
| [golang-dependency-management](content/samber-golang/skills/golang-dependency-management)   | go.mod, versioning, vulnerability scanning, and automated updates              |
| [golang-design-patterns](content/samber-golang/skills/golang-design-patterns)               | Idiomatic patterns — functional options, graceful shutdown, resilience         |
| [golang-documentation](content/samber-golang/skills/golang-documentation)                   | godoc, README, CHANGELOG, Example tests, and API docs                          |
| [golang-error-handling](content/samber-golang/skills/golang-error-handling)                 | Idiomatic error handling — wrapping, errors.Is/As, custom types, slog          |
| [golang-google-wire](content/samber-golang/skills/golang-google-wire)                       | Compile-time dependency injection with google/wire                             |
| [golang-gopls](content/samber-golang/skills/golang-gopls)                                   | Semantic code intelligence via gopls — navigate, rename, extract, diagnostics  |
| [golang-graphql](content/samber-golang/skills/golang-graphql)                               | GraphQL APIs with gqlgen or graphql-go                                         |
| [golang-grpc](content/samber-golang/skills/golang-grpc)                                     | gRPC servers/clients, protobuf, interceptors, and streaming RPCs               |
| [golang-how-to](content/samber-golang/skills/golang-how-to)                                 | Go skills orchestrator — task routing, cluster disambiguation, project config  |
| [golang-lint](content/samber-golang/skills/golang-lint)                                     | Linting best practices and golangci-lint configuration                         |
| [golang-modernize](content/samber-golang/skills/golang-modernize)                           | Modernize code to use the latest Go language features and idioms               |
| [golang-naming](content/samber-golang/skills/golang-naming)                                 | Naming — packages, constructors, interfaces, errors, enums                     |
| [golang-observability](content/samber-golang/skills/golang-observability)                   | slog logging, Prometheus metrics, and OpenTelemetry tracing                    |
| [golang-performance](content/samber-golang/skills/golang-performance)                       | Performance optimization — allocations, memory layout, GC tuning               |
| [golang-pkg-go-dev](content/samber-golang/skills/golang-pkg-go-dev)                         | Package docs via godig (pkg.go.dev API) — versions, importers, CVEs            |
| [golang-popular-libraries](content/samber-golang/skills/golang-popular-libraries)           | Recommends production-ready Go libraries and frameworks                        |
| [golang-project-layout](content/samber-golang/skills/golang-project-layout)                 | Project layout, directory structure, and workspace setup                       |
| [golang-refactoring](content/samber-golang/skills/golang-refactoring)                       | Safe at-scale restructuring — coverage-adaptive transforms, stacked PRs        |
| [golang-safety](content/samber-golang/skills/golang-safety)                                 | Defensive coding to prevent panics, nil crashes, and data races                |
| [golang-samber-do](content/samber-golang/skills/golang-samber-do)                           | Dependency injection with samber/do                                            |
| [golang-samber-hot](content/samber-golang/skills/golang-samber-hot)                         | In-memory caching with samber/hot — LRU, LFU, TTL, sharding                    |
| [golang-samber-lo](content/samber-golang/skills/golang-samber-lo)                           | Functional programming helpers with samber/lo                                  |
| [golang-samber-mo](content/samber-golang/skills/golang-samber-mo)                           | Monadic types with samber/mo — Option, Result, Either, Future                  |
| [golang-samber-oops](content/samber-golang/skills/golang-samber-oops)                       | Structured error handling with samber/oops                                     |
| [golang-samber-ro](content/samber-golang/skills/golang-samber-ro)                           | Reactive streams and event-driven programming with samber/ro                   |
| [golang-samber-slog](content/samber-golang/skills/golang-samber-slog)                       | Structured logging extensions with samber/slog-* packages                      |
| [golang-security](content/samber-golang/skills/golang-security)                             | Security best practices — injection prevention, crypto, secrets management     |
| [golang-spf13-cobra](content/samber-golang/skills/golang-spf13-cobra)                       | CLI command tree with spf13/cobra                                              |
| [golang-spf13-viper](content/samber-golang/skills/golang-spf13-viper)                       | Configuration management with spf13/viper                                      |
| [golang-stay-updated](content/samber-golang/skills/golang-stay-updated)                     | Resources to stay updated with Go news, communities, and releases              |
| [golang-stretchr-testify](content/samber-golang/skills/golang-stretchr-testify)             | Testing with stretchr/testify — assert, require, mock, and suite               |
| [golang-structs-interfaces](content/samber-golang/skills/golang-structs-interfaces)         | Struct and interface design — composition, embedding, type assertions          |
| [golang-swagger](content/samber-golang/skills/golang-swagger)                               | OpenAPI/Swagger documentation with swaggo/swag                                 |
| [golang-testing](content/samber-golang/skills/golang-testing)                               | Production-ready tests — table-driven, mocks, integration, benchmarks, fuzzing |
| [golang-troubleshooting](content/samber-golang/skills/golang-troubleshooting)               | Systematic troubleshooting — debugging, race detection, pprof, Delve           |
| [golang-uber-dig](content/samber-golang/skills/golang-uber-dig)                             | Dependency injection with uber-go/dig                                          |
| [golang-uber-fx](content/samber-golang/skills/golang-uber-fx)                               | Application framework with uber-go/fx — lifecycle, modules, signals            |

#### [shadcn/improve](https://github.com/shadcn/improve)

| Skill                                            | Description                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| [improve](content/shadcn-improve/skills/improve) | Read-only senior-advisor survey — prioritized plans for other agents |

#### [tw93/Kami](https://github.com/tw93/Kami) (tag `V1.20.0`)

| Skill                                 | Description                                                                                    |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [kami](content/tw93-kami/skills/kami) | Typeset resumes, one-pagers, white papers, letters, portfolios, slide decks, and landing pages |

#### [tw93/Waza](https://github.com/tw93/Waza) (tag `v3.42.0`)

| Skill                                     | Description                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| [check](content/tw93-waza/skills/check)   | Review diffs, PRs, issue queues, release readiness, and project audits        |
| [health](content/tw93-waza/skills/health) | Budget-aware audit of agent instructions, hooks/MCP, and AI maintainability   |
| [hunt](content/tw93-waza/skills/hunt)     | Find root cause before fixing errors, crashes, regressions, and failing tests |
| [learn](content/tw93-waza/skills/learn)   | Six-phase research workflow from raw material to publish-ready output         |
| [read](content/tw93-waza/skills/read)     | Fetch and summarize URLs/PDFs (or convert to Markdown)                        |
| [think](content/tw93-waza/skills/think)   | Turn rough ideas into approved, decision-complete plans before coding         |
| [ui](content/tw93-waza/skills/ui)         | Production-grade UI — pages, components, typography, screenshot polish        |
| [write](content/tw93-waza/skills/write)   | Polish Chinese/English prose — drafts, docs, release notes, localization      |

#### [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)

| Skill                                                              | Description                                                                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [agent-browser](content/vercel-agent-browser/skills/agent-browser) | Browser automation CLI for AI agents — navigate, fill forms, click, screenshot, scrape, and test web apps; also drives Electron apps and cloud browsers |

#### [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill                                                                      | Description                                                          |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [react-best-practices](content/vercel-agent/skills/react-best-practices)   | React and Next.js performance optimization guidelines from Vercel    |
| [web-design-guidelines](content/vercel-agent/skills/web-design-guidelines) | Review UI code for Web Interface Guidelines compliance and UX audits |

#### [vercel-labs/skills](https://github.com/vercel-labs/skills)

| Skill                                            | Description                       |
| ------------------------------------------------ | --------------------------------- |
| [find-skills](content/vercel/skills/find-skills) | Discover and install agent skills |

#### [vuejs-ai/skills](https://github.com/vuejs-ai/skills)

| Skill                                                                                    | Description                                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [vue-best-practices](content/vuejs-ai/skills/vue-best-practices)                         | Vue 3 best practices — Composition API with `<script setup>` and TypeScript     |
| [vue-debug-guides](content/vuejs-ai/skills/vue-debug-guides)                             | Vue 3 debugging and error handling for runtime errors, warnings, and SSR issues |
| [vue-jsx-best-practices](content/vuejs-ai/skills/vue-jsx-best-practices)                 | JSX syntax in Vue (class vs className, JSX plugin config)                       |
| [vue-options-api-best-practices](content/vuejs-ai/skills/vue-options-api-best-practices) | Vue 3 Options API style (data(), methods, this context)                         |
| [vue-pinia-best-practices](content/vuejs-ai/skills/vue-pinia-best-practices)             | Pinia stores, state management patterns, and reactivity                         |
| [vue-router-best-practices](content/vuejs-ai/skills/vue-router-best-practices)           | Vue Router 4 patterns, navigation guards, and route-component lifecycle         |
| [vue-testing-best-practices](content/vuejs-ai/skills/vue-testing-best-practices)         | Vue testing with Vitest, Vue Test Utils, and Playwright for E2E                 |

#### [vueuse/skills](https://github.com/vueuse/skills)

| Skill                                                      | Description                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [vueuse-functions](content/vueuse/skills/vueuse-functions) | Apply VueUse composables to build concise, maintainable Vue.js / Nuxt features |

#### [honojs/skills](https://github.com/honojs/skills)

| Skill                                    | Description                                                                             |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| [hono](content/hono/skills/hono)         | Build Hono web applications — routing, middleware, JSX, validation, testing, streaming  |
| [hono-jsx](content/hono/skills/hono-jsx) | Build Hono UI with hono/jsx — jsxRenderer layouts, Vite setup, forms, client components |

## Agents

Synced Cursor plugin subagents at `content/{repoKey}/agents/{target}.md`. These are not installed by `npx skills add`. Copy the `.md` files into `~/.cursor/agents/` (see [Installation](#installation)).

#### [cursor/plugins](https://github.com/cursor/plugins) (thermos)

Paired with the thermos skills above. The skill `thermos` invokes these by `name`.

| Agent                                                                                                                       | Description                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [thermo-nuclear-code-quality-review-subagent](content/cursor-plugins/agents/thermo-nuclear-code-quality-review-subagent.md) | Task subagent for the code-quality rubric (diff-scoped) |
| [thermo-nuclear-review-subagent](content/cursor-plugins/agents/thermo-nuclear-review-subagent.md)                           | Task subagent for the deep-review rubric (diff-scoped)  |

#### [pbakaus/impeccable](https://github.com/pbakaus/impeccable)

Paired with the `impeccable` skill. The skill's build flow spawns these by `name` for finish review, design-system documentation, asset production, live manual edits, and motion review.

| Agent                                                                                         | Description                                                                                   |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [impeccable-asset-producer](content/impeccable/agents/impeccable-asset-producer.md)           | Produces clean reusable raster assets from approved mock references without redesigning       |
| [impeccable-documenter](content/impeccable/agents/impeccable-documenter.md)                   | Records DESIGN.md and its sidecar from the shipped build artifact                             |
| [impeccable-finish-reviewer](content/impeccable/agents/impeccable-finish-reviewer.md)         | Reviews a finished build against its direction contract and returns ordered material fixes    |
| [impeccable-manual-edit-applier](content/impeccable/agents/impeccable-manual-edit-applier.md) | Applies leased live manual copy-edit batches to source files                                  |
| [impeccable-motion-reviewer](content/impeccable/agents/impeccable-motion-reviewer.md)         | Reviews captured motion filmstrips for continuity, timing, craft, and reduced-motion behavior |

## How It Works

Direct scripts manage upstream skill repositories (see `scripts/`):

1. **`pnpm upstream`** — Clone or update external git repositories into `upstream/`
2. **`pnpm sync`** — Update upstream repos, then rewrite the mapped dests under `content/{repoKey}/{skills,agents,rules}/{name}` and the per-repo `content/{repoKey}/SYNC.json`; prints a Markdown change report
3. **`pnpm cleanup`** — List (or with `--force` remove) orphaned upstream repositories

Repository sources and mappings live in [meta.ts](meta.ts). Pins:

| Key             | Upstream                | Pin           |
| --------------- | ----------------------- | ------------- |
| `samber-golang` | samber/cc-skills-golang | tag `v2.0.0`  |
| `mattpocock`    | mattpocock/skills       | tag `v1.3.2`  |
| `tw93-kami`     | tw93/Kami               | tag `V1.20.0` |
| `tw93-waza`     | tw93/Waza               | tag `v3.42.0` |

Unpinned repos track the default branch. Upstreams listed in `meta.ts` with empty `skills` and empty `agents` are reserved for future use and are skipped by Sync.

## Development

```bash
# Install dependencies
pnpm install

# Sync / audit / preview loop
pnpm sync [--repo <repoKey>] [--force]
pnpm check
pnpm site:preview

# Lint, format, tests
pnpm lint
pnpm fmt
pnpm test
```

By default upstream checkouts live in `upstream/`. Set `SKILLS_UPSTREAM_DIR` to share one copy of the checkouts across git worktrees:

```bash
export SKILLS_UPSTREAM_DIR=~/.cache/rockcookies-skills/upstream
```

### Branch model

Single branch `main`: the source tree and the published install surface are the same tree. The discovery contract is declared in [skills.sh.json](skills.sh.json) (`./content` container); never force-push `main` (the skills CLI lockfile pulls by the install-time commit SHA). `deploy.yml` runs the gates on every push (lint / test / check / site:build / smoke) and deploys the [installer site](https://rockcookies.github.io/skills/) to GitHub Pages as a build artifact — CI never writes any branch. The Pages artifact also carries the flattened publish surface (`skills/` `agents/` `rules/` + `catalog.json` + `sync.json` + generated `README.md`) so individual files are downloadable without cloning. Upstream syncs are manual: run `pnpm sync`, review, commit.

## Credits

Project structure and workflow inspired by [antfu/skills](https://github.com/antfu/skills).

## License

MIT
