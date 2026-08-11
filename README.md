# RockCookies' Skills

A curated collection of [Agent Skills](https://agentskills.io/home) for full-stack development, with skills synced from upstream repositories via a CLI tool.

Synced skills live at `skills/{repoKey}/{target}/`. Hand-maintained skills live under `skills/custom/`. Repository sources and skill mappings are configured in [meta.ts](meta.ts).

## Installation

Skills in this repo live under `skills/{repoKey}/{target}/`, so pass `--full-depth` so the CLI discovers nested `SKILL.md` files.

```bash
npx skills add rockcookies/skills --full-depth --skill '*' -g
```

Or a single skill:

```bash
npx skills add rockcookies/skills --full-depth --skill vue-best-practices -g
```

Learn more about the CLI at [skills](https://github.com/vercel-labs/skills).

### Go skills ([samber/cc-skills-golang](https://github.com/samber/cc-skills-golang), tag `v1.9.1`)

Atomic and cross-referencing — prefer the ⭐ set (or all), then add category / library skills as needed. Installing a skill does **not** pull linked skills automatically.

```bash
# All Go skills
npx skills add rockcookies/skills --full-depth --skill 'golang-*' -g
```

#### ⭐ Recommended

Upstream general-purpose set for every Go project. Includes `golang-how-to` (orchestrator).

```bash
npx skills add rockcookies/skills --full-depth \
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
npx skills add rockcookies/skills --full-depth \
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
npx skills add rockcookies/skills --full-depth \
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
npx skills add rockcookies/skills --full-depth \
  --skill golang-benchmark \
  --skill golang-observability \
  --skill golang-performance \
  --skill golang-testing \
  --skill golang-troubleshooting \
  -g
```

#### Project Setup

```bash
npx skills add rockcookies/skills --full-depth \
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
npx skills add rockcookies/skills --full-depth \
  --skill golang-graphql \
  --skill golang-grpc \
  --skill golang-swagger \
  -g
```

#### Dependency Injection

```bash
npx skills add rockcookies/skills --full-depth \
  --skill golang-google-wire \
  --skill golang-uber-dig \
  --skill golang-uber-fx \
  --skill golang-samber-do \
  -g
```

#### Frameworks

```bash
npx skills add rockcookies/skills --full-depth \
  --skill golang-spf13-cobra \
  --skill golang-spf13-viper \
  -g
```

#### samber/\*

```bash
npx skills add rockcookies/skills --full-depth \
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
npx skills add rockcookies/skills --full-depth \
  --skill golang-stretchr-testify \
  -g
```

#### Pin skills in the project agent config

After installing, add a `## Required Go skills` block to `CLAUDE.md` or `AGENTS.md`. Use `/golang-how-to configure` or copy from [golang-how-to/references/project-config.md](skills/samber-golang/golang-how-to/references/project-config.md).

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

Hand-maintained web style skills live under `skills/custom/` (`web-naming`, `web-code-style`, `web-zustand`). Install by stack:

#### Tooling (antfu)

```bash
npx skills add rockcookies/skills --full-depth \
  --skill antfu \
  --skill vite \
  --skill vitest \
  --skill unocss \
  -g
```

#### Vue

```bash
npx skills add rockcookies/skills --full-depth \
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
npx skills add rockcookies/skills --full-depth \
  --skill tanstack-integration \
  --skill tanstack-query \
  --skill tanstack-router \
  --skill tanstack-start \
  -g
```

#### React / Next.js & web guidelines

```bash
npx skills add rockcookies/skills --full-depth \
  --skill react-best-practices \
  --skill web-design-guidelines \
  -g
```

#### Hono / Playwright / web naming & style

```bash
npx skills add rockcookies/skills --full-depth \
  --skill hono-skills \
  --skill playwright-cli \
  --skill web-naming \
  --skill web-code-style \
  --skill web-zustand \
  -g
```

#### UI / design / image gen

```bash
npx skills add rockcookies/skills --full-depth \
  --skill frontend-design \
  --skill ui \
  --skill baoyu-design \
  --skill baoyu-image-gen \
  -g
```

## Skills

### Hand-maintained Skills

> Opinionated workflows and conventions maintained by RockCookies under `skills/custom/`.

| Skill                                                      | Description                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [chinese-tech-writing](skills/custom/chinese-tech-writing) | 高质量中文写作 — 博客、技术文档、产品文案、周刊、报告与教程润色 |
| [git-atomic-commit](skills/custom/git-atomic-commit)       | Atomic Conventional Commits — one logical change per commit     |
| [git-rebase-surgeon](skills/custom/git-rebase-surgeon)     | Safe history rewriting — rebase, squash, sync with upstream     |
| [git-semantic-search](skills/custom/git-semantic-search)   | Git archaeology — Pickaxe, Bisect, and Blame                    |
| [web-naming](skills/custom/web-naming)                     | Web/React UI naming — identifiers, files, components/Hooks/props |
| [web-code-style](skills/custom/web-code-style)             | Web/React UI clarity — control flow, JSX complexity, comments    |
| [web-zustand](skills/custom/web-zustand)                   | Web/React Zustand — StoreImpl, nested slices, action tiers       |

### Upstream Skills

Synced from external repositories into `skills/{repoKey}/{target}/`.

#### [antfu/skills](https://github.com/antfu/skills)

| Skill                         | Description                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| [antfu](skills/antfu/antfu)   | Anthony Fu's opinionated JS/TS tooling — eslint config, pnpm, monorepo, library publishing |
| [unocss](skills/antfu/unocss) | UnoCSS instant atomic CSS engine, Tailwind superset                                        |
| [vite](skills/antfu/vite)     | Vite build tool — config, plugin API, SSR, Vite 8 Rolldown migration                       |
| [vitest](skills/antfu/vitest) | Vitest fast unit testing, Jest-compatible API                                              |

#### [anthropics/skills](https://github.com/anthropics/skills)

| Skill                                                | Description                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| [frontend-design](skills/anthropics/frontend-design) | Distinctive, intentional visual design for new or reshaped UI |
| [skill-creator](skills/anthropics/skill-creator)     | Create, edit, and benchmark agent skills                      |

#### [deckardger/tanstack-agent-skills](https://github.com/deckardger/tanstack-agent-skills)

| Skill                                                              | Description                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [tanstack-integration](skills/tanstack-agent/tanstack-integration) | TanStack Query + Router + Start full-stack data flow, SSR, caching   |
| [tanstack-query](skills/tanstack-agent/tanstack-query)             | TanStack Query — data fetching, caching, mutations, server state     |
| [tanstack-router](skills/tanstack-agent/tanstack-router)           | TanStack Router — type-safe routing, data loading, search params     |
| [tanstack-start](skills/tanstack-agent/tanstack-start)             | TanStack Start — server functions, middleware, SSR, auth, deployment |

#### [JimLiu/baoyu-skills](https://github.com/JimLiu/baoyu-skills)

| Skill                                           | Description                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------- |
| [baoyu-image-gen](skills/baoyu/baoyu-image-gen) | AI image generation across OpenAI, Google, DashScope, Z.AI, Replicate, and more |

#### [jimliu/baoyu-design](https://github.com/jimliu/baoyu-design)

| Skill                                            | Description                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [baoyu-design](skills/baoyu-design/baoyu-design) | Polished design artifacts as self-contained HTML — mockups, prototypes, wireframes, decks |

#### [mattpocock/skills](https://github.com/mattpocock/skills) (tag `v1.2.3`)

| Skill                                                                            | Description                                                          |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [ask-matt](skills/mattpocock/ask-matt)                                           | Router over the engineering/productivity skills in this set          |
| [code-review](skills/mattpocock/code-review)                                     | Review changes since a fixed point along Standards and Spec axes     |
| [codebase-design](skills/mattpocock/codebase-design)                             | Shared vocabulary for designing deep modules                         |
| [diagnosing-bugs](skills/mattpocock/diagnosing-bugs)                             | Diagnosis loop for hard bugs and performance regressions             |
| [domain-modeling](skills/mattpocock/domain-modeling)                             | Build domain terminology, ubiquitous language, and ADRs              |
| [grill-me](skills/mattpocock/grill-me)                                           | Relentless interview to sharpen a plan or design                     |
| [grill-with-docs](skills/mattpocock/grill-with-docs)                             | Grill a plan while creating ADRs and glossary as you go              |
| [grilling](skills/mattpocock/grilling)                                           | Grill a plan, decision, or idea to stress-test your thinking         |
| [handoff](skills/mattpocock/handoff)                                             | Compact the conversation into a handoff document for another agent   |
| [implement](skills/mattpocock/implement)                                         | Implement work from a spec or set of tickets                         |
| [improve-codebase-architecture](skills/mattpocock/improve-codebase-architecture) | Scan for deepening opportunities, report in HTML, then grill         |
| [prototype](skills/mattpocock/prototype)                                         | Throwaway prototype to answer a design question                      |
| [research](skills/mattpocock/research)                                           | Investigate against high-trust sources; capture findings as Markdown |
| [resolving-merge-conflicts](skills/mattpocock/resolving-merge-conflicts)         | Resolve an in-progress git merge/rebase conflict                     |
| [setup-matt-pocock-skills](skills/mattpocock/setup-matt-pocock-skills)           | One-time setup — issue tracker, triage labels, domain doc layout     |
| [tdd](skills/mattpocock/tdd)                                                     | Test-driven development — red-green-refactor and integration tests   |
| [teach](skills/mattpocock/teach)                                                 | Teach a new skill or concept within the workspace                    |
| [to-questionnaire](skills/mattpocock/to-questionnaire)                           | Turn a decision into a questionnaire for someone else to fill in     |
| [to-spec](skills/mattpocock/to-spec)                                             | Turn the current conversation into a published spec                  |
| [to-tickets](skills/mattpocock/to-tickets)                                       | Break a plan into tracer-bullet tickets with blocking edges          |
| [triage](skills/mattpocock/triage)                                               | Move issues and external PRs through triage roles                    |
| [wait-what](skills/mattpocock/wait-what)                                         | Re-pitch a message that didn't land in ASD-STE100 + ubiquitous language |
| [wayfinder](skills/mattpocock/wayfinder)                                         | Plan multi-session work as decision tickets on the tracker           |
| [wizard](skills/mattpocock/wizard)                                               | Generate an interactive bash wizard for human-only manual steps      |
| [writing-for-agents](skills/mattpocock/writing-for-agents)                       | Writing documents (skills, AGENTS.md, CLAUDE.md) that agents consume |

#### [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)

| Skill                                                  | Description                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| [playwright-cli](skills/playwright-cli/playwright-cli) | Automate browser interactions, test web pages, and work with Playwright tests |

#### [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang) (tag `v1.9.1`)

| Skill                                                                               | Description                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [golang-benchmark](skills/samber-golang/golang-benchmark)                           | Benchmarking, profiling, and pprof/benchstat performance measurement           |
| [golang-cli](skills/samber-golang/golang-cli)                                       | CLI app development — command structure, flags, config, signals, completion    |
| [golang-code-style](skills/samber-golang/golang-code-style)                         | Code style, formatting, and clarity conventions                                |
| [golang-concurrency](skills/samber-golang/golang-concurrency)                       | Concurrency patterns — goroutines, channels, sync primitives, errgroup         |
| [golang-context](skills/samber-golang/golang-context)                               | Idiomatic context.Context — propagation, cancellation, timeouts, values        |
| [golang-continuous-integration](skills/samber-golang/golang-continuous-integration) | CI/CD pipelines with GitHub Actions for Go projects                            |
| [golang-data-structures](skills/samber-golang/golang-data-structures)               | Slices, maps, arrays, container packages, and generic collections              |
| [golang-database](skills/samber-golang/golang-database)                             | Database access — parameterized queries, transactions, connection pool         |
| [golang-dependency-injection](skills/samber-golang/golang-dependency-injection)     | DI patterns — manual DI and library comparison (wire, dig, fx, samber/do)      |
| [golang-dependency-management](skills/samber-golang/golang-dependency-management)   | go.mod, versioning, vulnerability scanning, and automated updates              |
| [golang-design-patterns](skills/samber-golang/golang-design-patterns)               | Idiomatic patterns — functional options, graceful shutdown, resilience         |
| [golang-documentation](skills/samber-golang/golang-documentation)                   | godoc, README, CHANGELOG, Example tests, and API docs                          |
| [golang-error-handling](skills/samber-golang/golang-error-handling)                 | Idiomatic error handling — wrapping, errors.Is/As, custom types, slog          |
| [golang-google-wire](skills/samber-golang/golang-google-wire)                       | Compile-time dependency injection with google/wire                             |
| [golang-gopls](skills/samber-golang/golang-gopls)                                   | Semantic code intelligence via gopls — navigate, rename, extract, diagnostics  |
| [golang-graphql](skills/samber-golang/golang-graphql)                               | GraphQL APIs with gqlgen or graphql-go                                         |
| [golang-grpc](skills/samber-golang/golang-grpc)                                     | gRPC servers/clients, protobuf, interceptors, and streaming RPCs               |
| [golang-how-to](skills/samber-golang/golang-how-to)                                 | Go skills orchestrator — task routing, cluster disambiguation, project config  |
| [golang-lint](skills/samber-golang/golang-lint)                                     | Linting best practices and golangci-lint configuration                         |
| [golang-modernize](skills/samber-golang/golang-modernize)                           | Modernize code to use the latest Go language features and idioms               |
| [golang-naming](skills/samber-golang/golang-naming)                                 | Naming — packages, constructors, interfaces, errors, enums                     |
| [golang-observability](skills/samber-golang/golang-observability)                   | slog logging, Prometheus metrics, and OpenTelemetry tracing                    |
| [golang-performance](skills/samber-golang/golang-performance)                       | Performance optimization — allocations, memory layout, GC tuning               |
| [golang-pkg-go-dev](skills/samber-golang/golang-pkg-go-dev)                         | Package docs via godig (pkg.go.dev API) — versions, importers, CVEs            |
| [golang-popular-libraries](skills/samber-golang/golang-popular-libraries)           | Recommends production-ready Go libraries and frameworks                        |
| [golang-project-layout](skills/samber-golang/golang-project-layout)                 | Project layout, directory structure, and workspace setup                       |
| [golang-refactoring](skills/samber-golang/golang-refactoring)                       | Safe at-scale restructuring — coverage-adaptive transforms, stacked PRs        |
| [golang-safety](skills/samber-golang/golang-safety)                                 | Defensive coding to prevent panics, nil crashes, and data races                |
| [golang-samber-do](skills/samber-golang/golang-samber-do)                           | Dependency injection with samber/do                                            |
| [golang-samber-hot](skills/samber-golang/golang-samber-hot)                         | In-memory caching with samber/hot — LRU, LFU, TTL, sharding                    |
| [golang-samber-lo](skills/samber-golang/golang-samber-lo)                           | Functional programming helpers with samber/lo                                  |
| [golang-samber-mo](skills/samber-golang/golang-samber-mo)                           | Monadic types with samber/mo — Option, Result, Either, Future                  |
| [golang-samber-oops](skills/samber-golang/golang-samber-oops)                       | Structured error handling with samber/oops                                     |
| [golang-samber-ro](skills/samber-golang/golang-samber-ro)                           | Reactive streams and event-driven programming with samber/ro                   |
| [golang-samber-slog](skills/samber-golang/golang-samber-slog)                       | Structured logging extensions with samber/slog-* packages                      |
| [golang-security](skills/samber-golang/golang-security)                             | Security best practices — injection prevention, crypto, secrets management     |
| [golang-spf13-cobra](skills/samber-golang/golang-spf13-cobra)                       | CLI command tree with spf13/cobra                                              |
| [golang-spf13-viper](skills/samber-golang/golang-spf13-viper)                       | Configuration management with spf13/viper                                      |
| [golang-stay-updated](skills/samber-golang/golang-stay-updated)                     | Resources to stay updated with Go news, communities, and releases              |
| [golang-stretchr-testify](skills/samber-golang/golang-stretchr-testify)             | Testing with stretchr/testify — assert, require, mock, and suite               |
| [golang-structs-interfaces](skills/samber-golang/golang-structs-interfaces)         | Struct and interface design — composition, embedding, type assertions          |
| [golang-swagger](skills/samber-golang/golang-swagger)                               | OpenAPI/Swagger documentation with swaggo/swag                                 |
| [golang-testing](skills/samber-golang/golang-testing)                               | Production-ready tests — table-driven, mocks, integration, benchmarks, fuzzing |
| [golang-troubleshooting](skills/samber-golang/golang-troubleshooting)               | Systematic troubleshooting — debugging, race detection, pprof, Delve           |
| [golang-uber-dig](skills/samber-golang/golang-uber-dig)                             | Dependency injection with uber-go/dig                                          |
| [golang-uber-fx](skills/samber-golang/golang-uber-fx)                               | Application framework with uber-go/fx — lifecycle, modules, signals            |

#### [shadcn/improve](https://github.com/shadcn/improve)

| Skill                                    | Description                                                          |
| ---------------------------------------- | -------------------------------------------------------------------- |
| [improve](skills/shadcn-improve/improve) | Read-only senior-advisor survey — prioritized plans for other agents |

#### [tw93/Waza](https://github.com/tw93/Waza) (tag `v3.34.0`)

| Skill                             | Description                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------- |
| [check](skills/tw93-waza/check)   | Review diffs, PRs, issue queues, release readiness, and project audits        |
| [health](skills/tw93-waza/health) | Budget-aware audit of agent instructions, hooks/MCP, and AI maintainability   |
| [hunt](skills/tw93-waza/hunt)     | Find root cause before fixing errors, crashes, regressions, and failing tests |
| [learn](skills/tw93-waza/learn)   | Six-phase research workflow from raw material to publish-ready output         |
| [read](skills/tw93-waza/read)     | Fetch and summarize URLs/PDFs (or convert to Markdown)                        |
| [think](skills/tw93-waza/think)   | Turn rough ideas into approved, decision-complete plans before coding         |
| [ui](skills/tw93-waza/ui)         | Production-grade UI — pages, components, typography, screenshot polish        |
| [write](skills/tw93-waza/write)   | Polish Chinese/English prose — drafts, docs, release notes, localization      |

#### [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill                                                              | Description                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [react-best-practices](skills/vercel-agent/react-best-practices)   | React and Next.js performance optimization guidelines from Vercel    |
| [web-design-guidelines](skills/vercel-agent/web-design-guidelines) | Review UI code for Web Interface Guidelines compliance and UX audits |

#### [vercel-labs/skills](https://github.com/vercel-labs/skills)

| Skill                                    | Description                       |
| ---------------------------------------- | --------------------------------- |
| [find-skills](skills/vercel/find-skills) | Discover and install agent skills |

#### [vuejs-ai/skills](https://github.com/vuejs-ai/skills)

| Skill                                                                            | Description                                                                     |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [vue-best-practices](skills/vuejs-ai/vue-best-practices)                         | Vue 3 best practices — Composition API with `<script setup>` and TypeScript     |
| [vue-debug-guides](skills/vuejs-ai/vue-debug-guides)                             | Vue 3 debugging and error handling for runtime errors, warnings, and SSR issues |
| [vue-jsx-best-practices](skills/vuejs-ai/vue-jsx-best-practices)                 | JSX syntax in Vue (class vs className, JSX plugin config)                       |
| [vue-options-api-best-practices](skills/vuejs-ai/vue-options-api-best-practices) | Vue 3 Options API style (data(), methods, this context)                         |
| [vue-pinia-best-practices](skills/vuejs-ai/vue-pinia-best-practices)             | Pinia stores, state management patterns, and reactivity                         |
| [vue-router-best-practices](skills/vuejs-ai/vue-router-best-practices)           | Vue Router 4 patterns, navigation guards, and route-component lifecycle         |
| [vue-testing-best-practices](skills/vuejs-ai/vue-testing-best-practices)         | Vue testing with Vitest, Vue Test Utils, and Playwright for E2E                 |

#### [vueuse/skills](https://github.com/vueuse/skills)

| Skill                                              | Description                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| [vueuse-functions](skills/vueuse/vueuse-functions) | Apply VueUse composables to build concise, maintainable Vue.js / Nuxt features |

#### [yusukebe/hono-skill](https://github.com/yusukebe/hono-skill)

| Skill                                  | Description                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| [hono-skills](skills/hono/hono-skills) | Build Hono web applications — routing, middleware, JSX, validation, testing, streaming |

## How It Works

This project uses an interactive CLI (`pnpm cli`) to manage upstream skill repositories:

1. **Manage upstream repositories** — Clone or update external git repositories into `upstream/`
2. **Sync skills** — Update upstream repos, then copy skill files into `skills/{repoKey}/{target}/`
3. **Cleanup** — Remove orphaned upstream repositories

Repository sources and skill mappings live in [meta.ts](meta.ts). Pins:

| Key             | Upstream                | Pin           |
| --------------- | ----------------------- | ------------- |
| `samber-golang` | samber/cc-skills-golang | tag `v1.9.1`  |
| `mattpocock`    | mattpocock/skills       | tag `v1.2.3`  |
| `tw93-waza`     | tw93/Waza               | tag `v3.34.0` |

Unpinned repos track the default branch. Upstreams listed in `meta.ts` with an empty `skills` array are reserved for future use and are skipped by Sync.

## Development

```bash
# Install dependencies
pnpm install

# Interactive CLI (upstream / sync / cleanup)
pnpm cli

# Lint and format
pnpm lint
pnpm fmt
```

## Credits

Project structure and workflow inspired by [antfu/skills](https://github.com/antfu/skills).

## License

MIT
