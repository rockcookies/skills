# RockCookies' Skills

A curated collection of [Agent Skills](https://agentskills.io/home) and Cursor plugin agents for full-stack development, synced from upstream repositories by a script suite.

Synced skills live at `content/skills/{repoKey}/{name}/`. Hand-maintained skills live under `content/skills/custom/`. Synced agents live at `content/agents/{repoKey}/{name}.md`. Synced rules live at `content/rules/{repoKey}/{name}.md` — sync products copied verbatim from upstream; `npx skills add` does not install them. Repository sources and mappings are configured in [meta.ts](meta.ts). After sync, each repo writes `SYNC.json` with upstream commit identity and per-item content digests.

## Installation

Skills live under `content/skills/{repoKey}/{target}/`, declared to the skills CLI as a discovery container via [skills.sh.json](skills.sh.json) (`paths`), so the default scan finds every nested `SKILL.md` without extra flags.

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
cp content/agents/cursor-plugins/*.md ~/.cursor/agents/
```

Thermos skills launch those subagents by `name`. Install the skills **and** copy the matching agent files, or the orchestrator has nothing to delegate to.

Rules are skipped too — they are copied verbatim from upstream and live at `content/rules/{repoKey}/{name}.md`; copy them into your runtime's rules directory (e.g. `~/.cursor/rules/`). This repo currently ships the six Waza rules under `content/rules/tw93-waza/`.

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

After installing, add a `## Required Go skills` block to `CLAUDE.md` or `AGENTS.md`. Use `/golang-how-to configure` or copy from [golang-how-to/references/project-config.md](content/skills/samber-golang/golang-how-to/references/project-config.md).

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

Hand-maintained web style skills live under `content/skills/custom/` (`web-code-style`, `web-css-guidelines`). Install by stack:

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

> Opinionated workflows and conventions maintained by RockCookies under `content/skills/custom/`.

| Skill                                                          | Description                                                                              |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [technical-writing-zh](content/skills/custom/technical-writing-zh)     | 中文写作补充（编排 unslop + technical-writing）                                          |
| [cursor-plan-pipeline](content/skills/custom/cursor-plan-pipeline)     | Cursor Plan Mode 流水线（拷问 → 计划闸口 → 实现 → 审查）                                 |
| [git-atomic-commit](content/skills/custom/git-atomic-commit)           | Atomic commits 3.0 — one revertable commit; index isolation                              |
| [git-rebase-surgeon](content/skills/custom/git-rebase-surgeon)         | Safe rebase 3.0 — SEQUENCE_EDITOR, backup, explicit lease                                |
| [git-semantic-search](content/skills/custom/git-semantic-search)       | Git archaeology 3.0 — Pickaxe/Blame/Bisect with clean-worktree                           |
| [grill-and-think](content/skills/custom/grill-and-think)               | 跨运行时设计流水线（拷问 → 深思 → 实现 → 审查）                                          |
| [hierarchical-agents-md](content/skills/custom/hierarchical-agents-md) | 层级 AGENTS.md / README.md — init / update / audit / reorganize / trim；只读 Python 脚本 |
| [skill-evolution](content/skills/custom/skill-evolution)               | 审计/改造现有 Skill — 工作地图、验收契约、工具化、有证据验证、反馈闭环                   |
| [steelman](content/skills/custom/steelman)                             | 双向钢人论证 — 重述真问题，强化正反双方，锁定关键变量，硬裁决                            |
| [web-code-style](content/skills/custom/web-code-style)                 | Web fullstack naming + clarity — identifiers, files, Hooks/props, control flow, JSX      |
| [web-css-guidelines](content/skills/custom/web-css-guidelines)         | CSS / Tailwind v4 规则手册 — 去 IE、布局层叠显隐、变量主题、响应式性能、现代化替换       |
| [week-retro](content/skills/custom/week-retro)                         | 周回顾 workflow learning loop                                                            |

### Upstream Skills

Synced from external repositories into `content/skills/{repoKey}/{target}/`.

#### [antfu/skills](https://github.com/antfu/skills)

| Skill                         | Description                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| [antfu](content/skills/antfu/antfu)   | Anthony Fu's opinionated JS/TS tooling — eslint config, pnpm, monorepo, library publishing |
| [unocss](content/skills/antfu/unocss) | UnoCSS instant atomic CSS engine, Tailwind superset                                        |
| [vite](content/skills/antfu/vite)     | Vite build tool — config, plugin API, SSR, Vite 8 Rolldown migration                       |
| [vitest](content/skills/antfu/vitest) | Vitest fast unit testing, Jest-compatible API                                              |

#### [anthropics/skills](https://github.com/anthropics/skills)

| Skill                                                | Description                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| [frontend-design](content/skills/anthropics/frontend-design) | Distinctive, intentional visual design for new or reshaped UI |
| [skill-creator](content/skills/anthropics/skill-creator)     | Create, edit, and benchmark agent skills                      |

#### [cursor/plugins](https://github.com/cursor/plugins)

| Skill                                                                                                                          | Description                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| [benchmark-checklist](content/skills/cursor-plugins/benchmark-checklist)                                                               | Vet a perf measurement before reporting it - limiter, tuning, errors, repeatability |
| [how](content/skills/cursor-plugins/how)                                                                                               | Subsystem walkthroughs - "how does X work", placement, ownership                    |
| [principle-attack-the-premise](content/skills/cursor-plugins/principle-attack-the-premise)                                             | Test the premise two failed fixes shared before writing a third fix                 |
| [principle-boundary-discipline](content/skills/cursor-plugins/principle-boundary-discipline)                                           | Validation and error handling at system boundaries; trust internal types            |
| [principle-build-the-lever](content/skills/cursor-plugins/principle-build-the-lever)                                                   | Build the tool that does or proves the work instead of hand-running it              |
| [principle-encode-lessons-in-structure](content/skills/cursor-plugins/principle-encode-lessons-in-structure)                           | Encode recurring fixes as lint rules, flags, checks, or scripts                     |
| [principle-exhaust-the-design-space](content/skills/cursor-plugins/principle-exhaust-the-design-space)                                 | Build 2-3 competing prototypes and compare side by side before committing           |
| [principle-experience-first](content/skills/cursor-plugins/principle-experience-first)                                                 | Choose user delight over implementation convenience on scope tradeoffs              |
| [principle-explain-the-number](content/skills/cursor-plugins/principle-explain-the-number)                                             | Name what limits a measured number; rule out that it measured something else        |
| [principle-fix-root-causes](content/skills/cursor-plugins/principle-fix-root-causes)                                                   | Trace each symptom to its root cause; reproduce first, no symptom guards            |
| [principle-foundational-thinking](content/skills/cursor-plugins/principle-foundational-thinking)                                       | Pick core types and data structures before logic; get structures right              |
| [principle-guard-the-context-window](content/skills/cursor-plugins/principle-guard-the-context-window)                                 | Route bulk reading to subagents; keep summaries in the main thread                  |
| [principle-laziness-protocol](content/skills/cursor-plugins/principle-laziness-protocol)                                               | Bias toward deletion and the smallest change that solves the problem                |
| [principle-make-operations-idempotent](content/skills/cursor-plugins/principle-make-operations-idempotent)                             | Converge retries on the same end state after crashes and restarts                   |
| [principle-migrate-callers-then-delete-legacy-apis](content/skills/cursor-plugins/principle-migrate-callers-then-delete-legacy-apis)   | Migrate callers and delete the old API in one wave; no shim layers                  |
| [principle-minimize-reader-load](content/skills/cursor-plugins/principle-minimize-reader-load)                                         | Collapse one-caller layers and shrink the state a reader must hold                  |
| [principle-model-the-domain](content/skills/cursor-plugins/principle-model-the-domain)                                                 | Encode repeated rules in one structure, not scattered conditionals                  |
| [principle-never-block-on-the-human](content/skills/cursor-plugins/principle-never-block-on-the-human)                                 | Proceed on reversible work and present the result                                   |
| [principle-outcome-oriented-execution](content/skills/cursor-plugins/principle-outcome-oriented-execution)                             | Converge on the target architecture; no throwaway compatibility states              |
| [principle-prove-it-works](content/skills/cursor-plugins/principle-prove-it-works)                                                     | Verify against the real artifact - run, read values, inspect diff                   |
| [principle-redesign-from-first-principles](content/skills/cursor-plugins/principle-redesign-from-first-principles)                     | Redesign as if the new requirement had been foundational from day one               |
| [principle-separate-before-serializing-shared-state](content/skills/cursor-plugins/principle-separate-before-serializing-shared-state) | Eliminate sharing first; serialize structurally only with one real writer           |
| [principle-sequence-verifiable-units](content/skills/cursor-plugins/principle-sequence-verifiable-units)                               | End each small unit in a check before starting the next                             |
| [principle-subtract-before-you-add](content/skills/cursor-plugins/principle-subtract-before-you-add)                                   | Remove dead weight, redundant guards, stub refs; build on simpler base              |
| [principle-test-behavior-not-implementation](content/skills/cursor-plugins/principle-test-behavior-not-implementation)                 | Assert what users observe; keep passing through internal refactors                  |
| [principle-type-system-discipline](content/skills/cursor-plugins/principle-type-system-discipline)                                     | Make illegal states unrepresentable - sum types, brands, boundary parse             |
| [pstack-tdd](content/skills/cursor-plugins/pstack-tdd)                                                                                 | Red-green-refactor TDD; on explicit TDD requests or obvious regression tests        |
| [show-me-your-work](content/skills/cursor-plugins/show-me-your-work)                                                                   | TSV decision log (what, why, evidence, result) for unattended work                  |
| [technical-writing](content/skills/cursor-plugins/technical-writing)                                                                   | Layered writing standard - Diataxis, Google style, STE, Global English              |
| [thermo-nuclear-code-quality-review](content/skills/cursor-plugins/thermo-nuclear-code-quality-review)                                 | Strict maintainability audit (structure, file-size growth, spaghetti)               |
| [thermo-nuclear-review](content/skills/cursor-plugins/thermo-nuclear-review)                                                           | Deep branch audit (bugs, breakages, security, devex, feature-flag leaks)            |
| [thermos](content/skills/cursor-plugins/thermos)                                                                                       | Run both review subagents in parallel and synthesize findings                       |
| [typescript-best-practices](content/skills/cursor-plugins/typescript-best-practices)                                                   | TypeScript rules grounding the type-system principles in .ts/.tsx                   |
| [unslop](content/skills/cursor-plugins/unslop)                                                                                         | Cut AI tells from writing - puffery, chatbot phrases, hedging, jargon               |
| [why](content/skills/cursor-plugins/why)                                                                                               | Design rationale - parallel MCP evidence investigators, cited synthesis             |

#### [deckardger/tanstack-agent-skills](https://github.com/deckardger/tanstack-agent-skills)

| Skill                                                              | Description                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [tanstack-integration](content/skills/tanstack-agent/tanstack-integration) | TanStack Query + Router + Start full-stack data flow, SSR, caching   |
| [tanstack-query](content/skills/tanstack-agent/tanstack-query)             | TanStack Query — data fetching, caching, mutations, server state     |
| [tanstack-router](content/skills/tanstack-agent/tanstack-router)           | TanStack Router — type-safe routing, data loading, search params     |
| [tanstack-start](content/skills/tanstack-agent/tanstack-start)             | TanStack Start — server functions, middleware, SSR, auth, deployment |

#### [humanlayer/skills](https://github.com/humanlayer/skills)

| Skill                                | Description                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| [show-me](content/skills/humanlayer/show-me) | Visual explanations — diagrams, call trees, Mermaid diffs, and focused HTML artifacts |

#### [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills)

| Skill                                               | Description                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| [baoyu-image-gen](content/skills/baoyu/baoyu-image-gen)     | AI image generation across OpenAI, Google, DashScope, Z.AI, Replicate, and more |
| [baoyu-infographic](content/skills/baoyu/baoyu-infographic) | Publication-ready infographics — 21 layout types × 22 visual styles             |

#### [larashero3-dotcom/lieflat-less-ai-tone](https://github.com/larashero3-dotcom/lieflat-less-ai-tone)

| Skill                                                                    | Description                                                                                                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| [lieflat-less-ai-tone](content/skills/lieflat-less-ai-tone/lieflat-less-ai-tone) | De-AI-ify finished prose — scripted metrics + semantic judgment, report findings first, rewrite on approval, re-test after |

#### [majiayu000/spellbook](https://github.com/majiayu000/spellbook)

| Skill                                                     | Description                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [clash-doctor](content/skills/majiayu-spellbook/clash-doctor)     | Clash Verge diagnostics and config management — proxy rules, subscriptions   |
| [clash-routes](content/skills/majiayu-spellbook/clash-routes)     | Inspect per-process proxy routes via the Mihomo API                          |
| [codebase-audit](content/skills/majiayu-spellbook/codebase-audit) | Adaptive parallel codebase audit — findings, adversarial validation, roadmap |
| [figma-to-react](content/skills/majiayu-spellbook/figma-to-react) | Extract Figma designs into production-ready React/Next.js components         |
| [ip-check](content/skills/majiayu-spellbook/ip-check)             | IP / socks5 proxy quality — registry, geo consensus, reputation, AI unlocks  |

#### [mattpocock/skills](https://github.com/mattpocock/skills) (tag `v1.3.2`)

| Skill                                                                            | Description                                                             |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [ask-matt](content/skills/mattpocock/ask-matt)                                           | Router over the engineering/productivity skills in this set             |
| [code-review](content/skills/mattpocock/code-review)                                     | Review changes since a fixed point along Standards and Spec axes        |
| [codebase-design](content/skills/mattpocock/codebase-design)                             | Shared vocabulary for designing deep modules                            |
| [diagnosing-bugs](content/skills/mattpocock/diagnosing-bugs)                             | Diagnosis loop for hard bugs and performance regressions                |
| [domain-modeling](content/skills/mattpocock/domain-modeling)                             | Build domain terminology, ubiquitous language, and ADRs                 |
| [grill-me](content/skills/mattpocock/grill-me)                                           | Relentless interview to sharpen a plan or design                        |
| [grill-with-docs](content/skills/mattpocock/grill-with-docs)                             | Grill a plan while creating ADRs and glossary as you go                 |
| [grilling](content/skills/mattpocock/grilling)                                           | Grill a plan, decision, or idea to stress-test your thinking            |
| [handoff](content/skills/mattpocock/handoff)                                             | Compact the conversation into a handoff document for another agent      |
| [implement](content/skills/mattpocock/implement)                                         | Implement work from a spec or set of tickets                            |
| [implement-spec](content/skills/mattpocock/implement-spec)                               | Implement /to-spec and /to-tickets results — parallel implementers      |
| [improve-codebase-architecture](content/skills/mattpocock/improve-codebase-architecture) | Scan for deepening opportunities, report in HTML, then grill            |
| [pr](content/skills/mattpocock/pr)                                                       | Write a fast-to-review PR body — summary visual, evidence, merge danger |
| [prototype](content/skills/mattpocock/prototype)                                         | Throwaway prototype to answer a design question                         |
| [research](content/skills/mattpocock/research)                                           | Investigate against high-trust sources; capture findings as Markdown    |
| [retro](content/skills/mattpocock/retro)                                                 | Retrospective on a session — improve the environment, not the code      |
| [setup-matt-pocock-skills](content/skills/mattpocock/setup-matt-pocock-skills)           | One-time setup — issue tracker, triage labels, domain doc layout        |
| [tdd](content/skills/mattpocock/tdd)                                                     | Test-driven development — red-green-refactor and integration tests      |
| [teach](content/skills/mattpocock/teach)                                                 | Teach a new skill or concept within the workspace                       |
| [to-questionnaire](content/skills/mattpocock/to-questionnaire)                           | Turn a decision into a questionnaire for someone else to fill in        |
| [to-spec](content/skills/mattpocock/to-spec)                                             | Turn the current conversation into a published spec                     |
| [to-tickets](content/skills/mattpocock/to-tickets)                                       | Break a plan into tracer-bullet tickets with blocking edges             |
| [triage](content/skills/mattpocock/triage)                                               | Move issues and external PRs through triage roles                       |
| [wait-what](content/skills/mattpocock/wait-what)                                         | Re-pitch a message that didn't land in ASD-STE100 + ubiquitous language |
| [wayfinder](content/skills/mattpocock/wayfinder)                                         | Plan multi-session work as decision tickets on the tracker              |
| [wizard](content/skills/mattpocock/wizard)                                               | Generate an interactive bash wizard for human-only manual steps         |
| [writing-for-agents](content/skills/mattpocock/writing-for-agents)                       | Writing documents (skills, AGENTS.md, CLAUDE.md) that agents consume    |

#### [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)

| Skill                                                  | Description                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [playwright-cli](content/skills/playwright-cli/playwright-cli) | Automate browser interactions, test web pages, and work with Playwright tests |

#### [pbakaus/impeccable](https://github.com/pbakaus/impeccable)

| Skill                                      | Description                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| [impeccable](content/skills/impeccable/impeccable) | Design, critique, and polish frontend UI — UX audit, visual hierarchy, typography, color, motion, and design systems |

#### [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang) (tag `v2.0.0`)

| Skill                                                                               | Description                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [golang-benchmark](content/skills/samber-golang/golang-benchmark)                           | Benchmarking, profiling, and pprof/benchstat performance measurement           |
| [golang-cli](content/skills/samber-golang/golang-cli)                                       | CLI app development — command structure, flags, config, signals, completion    |
| [golang-code-style](content/skills/samber-golang/golang-code-style)                         | Code style, formatting, and clarity conventions                                |
| [golang-concurrency](content/skills/samber-golang/golang-concurrency)                       | Concurrency patterns — goroutines, channels, sync primitives, errgroup         |
| [golang-context](content/skills/samber-golang/golang-context)                               | Idiomatic context.Context — propagation, cancellation, timeouts, values        |
| [golang-continuous-integration](content/skills/samber-golang/golang-continuous-integration) | CI/CD pipelines with GitHub Actions for Go projects                            |
| [golang-data-structures](content/skills/samber-golang/golang-data-structures)               | Slices, maps, arrays, container packages, and generic collections              |
| [golang-database](content/skills/samber-golang/golang-database)                             | Database access — parameterized queries, transactions, connection pool         |
| [golang-dependency-injection](content/skills/samber-golang/golang-dependency-injection)     | DI patterns — manual DI and library comparison (wire, dig, fx, samber/do)      |
| [golang-dependency-management](content/skills/samber-golang/golang-dependency-management)   | go.mod, versioning, vulnerability scanning, and automated updates              |
| [golang-design-patterns](content/skills/samber-golang/golang-design-patterns)               | Idiomatic patterns — functional options, graceful shutdown, resilience         |
| [golang-documentation](content/skills/samber-golang/golang-documentation)                   | godoc, README, CHANGELOG, Example tests, and API docs                          |
| [golang-error-handling](content/skills/samber-golang/golang-error-handling)                 | Idiomatic error handling — wrapping, errors.Is/As, custom types, slog          |
| [golang-google-wire](content/skills/samber-golang/golang-google-wire)                       | Compile-time dependency injection with google/wire                             |
| [golang-gopls](content/skills/samber-golang/golang-gopls)                                   | Semantic code intelligence via gopls — navigate, rename, extract, diagnostics  |
| [golang-graphql](content/skills/samber-golang/golang-graphql)                               | GraphQL APIs with gqlgen or graphql-go                                         |
| [golang-grpc](content/skills/samber-golang/golang-grpc)                                     | gRPC servers/clients, protobuf, interceptors, and streaming RPCs               |
| [golang-how-to](content/skills/samber-golang/golang-how-to)                                 | Go skills orchestrator — task routing, cluster disambiguation, project config  |
| [golang-lint](content/skills/samber-golang/golang-lint)                                     | Linting best practices and golangci-lint configuration                         |
| [golang-modernize](content/skills/samber-golang/golang-modernize)                           | Modernize code to use the latest Go language features and idioms               |
| [golang-naming](content/skills/samber-golang/golang-naming)                                 | Naming — packages, constructors, interfaces, errors, enums                     |
| [golang-observability](content/skills/samber-golang/golang-observability)                   | slog logging, Prometheus metrics, and OpenTelemetry tracing                    |
| [golang-performance](content/skills/samber-golang/golang-performance)                       | Performance optimization — allocations, memory layout, GC tuning               |
| [golang-pkg-go-dev](content/skills/samber-golang/golang-pkg-go-dev)                         | Package docs via godig (pkg.go.dev API) — versions, importers, CVEs            |
| [golang-popular-libraries](content/skills/samber-golang/golang-popular-libraries)           | Recommends production-ready Go libraries and frameworks                        |
| [golang-project-layout](content/skills/samber-golang/golang-project-layout)                 | Project layout, directory structure, and workspace setup                       |
| [golang-refactoring](content/skills/samber-golang/golang-refactoring)                       | Safe at-scale restructuring — coverage-adaptive transforms, stacked PRs        |
| [golang-safety](content/skills/samber-golang/golang-safety)                                 | Defensive coding to prevent panics, nil crashes, and data races                |
| [golang-samber-do](content/skills/samber-golang/golang-samber-do)                           | Dependency injection with samber/do                                            |
| [golang-samber-hot](content/skills/samber-golang/golang-samber-hot)                         | In-memory caching with samber/hot — LRU, LFU, TTL, sharding                    |
| [golang-samber-lo](content/skills/samber-golang/golang-samber-lo)                           | Functional programming helpers with samber/lo                                  |
| [golang-samber-mo](content/skills/samber-golang/golang-samber-mo)                           | Monadic types with samber/mo — Option, Result, Either, Future                  |
| [golang-samber-oops](content/skills/samber-golang/golang-samber-oops)                       | Structured error handling with samber/oops                                     |
| [golang-samber-ro](content/skills/samber-golang/golang-samber-ro)                           | Reactive streams and event-driven programming with samber/ro                   |
| [golang-samber-slog](content/skills/samber-golang/golang-samber-slog)                       | Structured logging extensions with samber/slog-* packages                      |
| [golang-security](content/skills/samber-golang/golang-security)                             | Security best practices — injection prevention, crypto, secrets management     |
| [golang-spf13-cobra](content/skills/samber-golang/golang-spf13-cobra)                       | CLI command tree with spf13/cobra                                              |
| [golang-spf13-viper](content/skills/samber-golang/golang-spf13-viper)                       | Configuration management with spf13/viper                                      |
| [golang-stay-updated](content/skills/samber-golang/golang-stay-updated)                     | Resources to stay updated with Go news, communities, and releases              |
| [golang-stretchr-testify](content/skills/samber-golang/golang-stretchr-testify)             | Testing with stretchr/testify — assert, require, mock, and suite               |
| [golang-structs-interfaces](content/skills/samber-golang/golang-structs-interfaces)         | Struct and interface design — composition, embedding, type assertions          |
| [golang-swagger](content/skills/samber-golang/golang-swagger)                               | OpenAPI/Swagger documentation with swaggo/swag                                 |
| [golang-testing](content/skills/samber-golang/golang-testing)                               | Production-ready tests — table-driven, mocks, integration, benchmarks, fuzzing |
| [golang-troubleshooting](content/skills/samber-golang/golang-troubleshooting)               | Systematic troubleshooting — debugging, race detection, pprof, Delve           |
| [golang-uber-dig](content/skills/samber-golang/golang-uber-dig)                             | Dependency injection with uber-go/dig                                          |
| [golang-uber-fx](content/skills/samber-golang/golang-uber-fx)                               | Application framework with uber-go/fx — lifecycle, modules, signals            |

#### [shadcn/improve](https://github.com/shadcn/improve)

| Skill                                    | Description                                                          |
| ---------------------------------------- | -------------------------------------------------------------------- |
| [improve](content/skills/shadcn-improve/improve) | Read-only senior-advisor survey — prioritized plans for other agents |

#### [tw93/Kami](https://github.com/tw93/Kami) (tag `V1.20.0`)

| Skill                         | Description                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| [kami](content/skills/tw93-kami/kami) | Typeset resumes, one-pagers, white papers, letters, portfolios, slide decks, and landing pages |

#### [tw93/Waza](https://github.com/tw93/Waza) (tag `v3.42.0`)

| Skill                             | Description                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------- |
| [check](content/skills/tw93-waza/check)   | Review diffs, PRs, issue queues, release readiness, and project audits        |
| [health](content/skills/tw93-waza/health) | Budget-aware audit of agent instructions, hooks/MCP, and AI maintainability   |
| [hunt](content/skills/tw93-waza/hunt)     | Find root cause before fixing errors, crashes, regressions, and failing tests |
| [learn](content/skills/tw93-waza/learn)   | Six-phase research workflow from raw material to publish-ready output         |
| [read](content/skills/tw93-waza/read)     | Fetch and summarize URLs/PDFs (or convert to Markdown)                        |
| [think](content/skills/tw93-waza/think)   | Turn rough ideas into approved, decision-complete plans before coding         |
| [ui](content/skills/tw93-waza/ui)         | Production-grade UI — pages, components, typography, screenshot polish        |
| [write](content/skills/tw93-waza/write)   | Polish Chinese/English prose — drafts, docs, release notes, localization      |

#### [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)

| Skill                                                      | Description                                                                                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [agent-browser](content/skills/vercel-agent-browser/agent-browser) | Browser automation CLI for AI agents — navigate, fill forms, click, screenshot, scrape, and test web apps; also drives Electron apps and cloud browsers |

#### [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill                                                              | Description                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [react-best-practices](content/skills/vercel-agent/react-best-practices)   | React and Next.js performance optimization guidelines from Vercel    |
| [web-design-guidelines](content/skills/vercel-agent/web-design-guidelines) | Review UI code for Web Interface Guidelines compliance and UX audits |

#### [vercel-labs/skills](https://github.com/vercel-labs/skills)

| Skill                                    | Description                       |
| ---------------------------------------- | --------------------------------- |
| [find-skills](content/skills/vercel/find-skills) | Discover and install agent skills |

#### [vuejs-ai/skills](https://github.com/vuejs-ai/skills)

| Skill                                                                            | Description                                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [vue-best-practices](content/skills/vuejs-ai/vue-best-practices)                         | Vue 3 best practices — Composition API with `<script setup>` and TypeScript     |
| [vue-debug-guides](content/skills/vuejs-ai/vue-debug-guides)                             | Vue 3 debugging and error handling for runtime errors, warnings, and SSR issues |
| [vue-jsx-best-practices](content/skills/vuejs-ai/vue-jsx-best-practices)                 | JSX syntax in Vue (class vs className, JSX plugin config)                       |
| [vue-options-api-best-practices](content/skills/vuejs-ai/vue-options-api-best-practices) | Vue 3 Options API style (data(), methods, this context)                         |
| [vue-pinia-best-practices](content/skills/vuejs-ai/vue-pinia-best-practices)             | Pinia stores, state management patterns, and reactivity                         |
| [vue-router-best-practices](content/skills/vuejs-ai/vue-router-best-practices)           | Vue Router 4 patterns, navigation guards, and route-component lifecycle         |
| [vue-testing-best-practices](content/skills/vuejs-ai/vue-testing-best-practices)         | Vue testing with Vitest, Vue Test Utils, and Playwright for E2E                 |

#### [vueuse/skills](https://github.com/vueuse/skills)

| Skill                                              | Description                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| [vueuse-functions](content/skills/vueuse/vueuse-functions) | Apply VueUse composables to build concise, maintainable Vue.js / Nuxt features |

#### [honojs/skills](https://github.com/honojs/skills)

| Skill                            | Description                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| [hono](content/skills/hono/hono)         | Build Hono web applications — routing, middleware, JSX, validation, testing, streaming  |
| [hono-jsx](content/skills/hono/hono-jsx) | Build Hono UI with hono/jsx — jsxRenderer layouts, Vite setup, forms, client components |

## Agents

Synced Cursor plugin subagents at `content/agents/{repoKey}/{target}.md`. These are not installed by `npx skills add`. Copy the `.md` files into `~/.cursor/agents/` (see [Installation](#installation)).

#### [cursor/plugins](https://github.com/cursor/plugins) (thermos)

Paired with the thermos skills above. The skill `thermos` invokes these by `name`.

| Agent                                                                                                               | Description                                             |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [thermo-nuclear-code-quality-review-subagent](content/agents/cursor-plugins/thermo-nuclear-code-quality-review-subagent.md) | Task subagent for the code-quality rubric (diff-scoped) |
| [thermo-nuclear-review-subagent](content/agents/cursor-plugins/thermo-nuclear-review-subagent.md)                           | Task subagent for the deep-review rubric (diff-scoped)  |

#### [pbakaus/impeccable](https://github.com/pbakaus/impeccable)

Paired with the `impeccable` skill. The skill's build flow spawns these by `name` for finish review, design-system documentation, asset production, live manual edits, and motion review.

| Agent                                                                                 | Description                                                                                |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [impeccable-asset-producer](content/agents/impeccable/impeccable-asset-producer.md)           | Produces clean reusable raster assets from approved mock references without redesigning    |
| [impeccable-documenter](content/agents/impeccable/impeccable-documenter.md)                   | Records DESIGN.md and its sidecar from the shipped build artifact                          |
| [impeccable-finish-reviewer](content/agents/impeccable/impeccable-finish-reviewer.md)         | Reviews a finished build against its direction contract and returns ordered material fixes |
| [impeccable-manual-edit-applier](content/agents/impeccable/impeccable-manual-edit-applier.md) | Applies leased live manual copy-edit batches to source files                               |
| [impeccable-motion-reviewer](content/agents/impeccable/impeccable-motion-reviewer.md)         | Reviews captured motion filmstrips for continuity, timing, craft, and reduced-motion behavior |

## How It Works

Direct scripts manage upstream skill repositories (see `scripts/`):

1. **`pnpm upstream`** — Clone or update external git repositories into `upstream/`
2. **`pnpm sync`** — Update upstream repos, then copy mapped skills into `content/skills/{repoKey}/{target}/`, mapped agents into `content/agents/{repoKey}/{target}.md`, and mapped rules into `content/rules/{repoKey}/{target}.md`; prints a Markdown change report
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

Single branch `main`: the source tree and the published install surface are the same tree. The discovery contract is declared in [skills.sh.json](skills.sh.json) (`content/skills` container); never force-push `main` (the skills CLI lockfile pulls by the install-time commit SHA). `deploy.yml` runs the gates on every push (lint / test / check / site:build / smoke) and deploys the [installer site](https://rockcookies.github.io/skills/) to GitHub Pages as a build artifact — CI never writes any branch. Upstream syncs are manual: run `pnpm sync`, review, commit.

## Credits

Project structure and workflow inspired by [antfu/skills](https://github.com/antfu/skills).

## License

MIT
