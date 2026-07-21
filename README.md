# RockCookies' Skills

A curated collection of [Agent Skills](https://agentskills.io/home) for full-stack development, with skills synced from upstream repositories via a CLI tool.

Synced skills live at `skills/{repoKey}/{target}/`. Hand-maintained skills live under `skills/custom/`. Repository sources and skill mappings are configured in [meta.ts](meta.ts).

## Installation

```bash
npx skills add rockcookies/skills --skill='*' -g
```

Or install specific skills:

```bash
npx skills add rockcookies/skills --skill='vue-best-practices' -g
```

Install all Go-related skills from [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang):

```bash
npx skills add rockcookies/skills --skill golang-benchmark --skill golang-cli --skill golang-code-style --skill golang-concurrency --skill golang-context --skill golang-continuous-integration --skill golang-data-structures --skill golang-database --skill golang-dependency-injection --skill golang-dependency-management --skill golang-design-patterns --skill golang-documentation --skill golang-error-handling --skill golang-google-wire --skill golang-gopls --skill golang-graphql --skill golang-grpc --skill golang-how-to --skill golang-lint --skill golang-modernize --skill golang-naming --skill golang-observability --skill golang-performance --skill golang-pkg-go-dev --skill golang-popular-libraries --skill golang-project-layout --skill golang-refactoring --skill golang-safety --skill golang-samber-do --skill golang-samber-hot --skill golang-samber-lo --skill golang-samber-mo --skill golang-samber-oops --skill golang-samber-ro --skill golang-samber-slog --skill golang-security --skill golang-spf13-cobra --skill golang-spf13-viper --skill golang-stay-updated --skill golang-stretchr-testify --skill golang-structs-interfaces --skill golang-swagger --skill golang-testing --skill golang-troubleshooting --skill golang-uber-dig --skill golang-uber-fx
```

### Recommended bundles for new Go projects

These bundles follow the upstream ⭐ recommended set in `golang-how-to`. Installing a skill does **not** pull in its linked skills automatically — add the bundle you need explicitly.

| Bundle | Skills | When to use |
| --- | ---: | --- |
| **Starter** | 12 | Upstream ⭐ set plus `golang-how-to` (orchestrator — load it on every Go task) |
| **Minimum viable** | 17 | Starter + skills the Starter set links most often |
| **Production baseline** | 22 | Minimum viable + performance, observability, project layout, and CI |

#### Starter (12 skills)

```bash
npx skills add rockcookies/skills \
  --skill golang-how-to \
  --skill golang-code-style \
  --skill golang-data-structures \
  --skill golang-design-patterns \
  --skill golang-documentation \
  --skill golang-error-handling \
  --skill golang-modernize \
  --skill golang-naming \
  --skill golang-safety \
  --skill golang-security \
  --skill golang-testing \
  --skill golang-troubleshooting \
  -g
```

#### Minimum viable (+5 skills)

```bash
npx skills add rockcookies/skills \
  --skill golang-database \
  --skill golang-lint \
  --skill golang-structs-interfaces \
  --skill golang-concurrency \
  --skill golang-context \
  -g
```

#### Production baseline (+5 skills)

```bash
npx skills add rockcookies/skills \
  --skill golang-benchmark \
  --skill golang-performance \
  --skill golang-observability \
  --skill golang-project-layout \
  --skill golang-continuous-integration \
  -g
```

#### On-demand (install when the codebase needs them)

| Skill | Install when |
| --- | --- |
| `golang-gopls` | Navigating or refactoring Go via gopls / LSP |
| `golang-refactoring` | Safe at-scale restructuring (rename, extract, move packages) |
| `golang-stretchr-testify` | Project uses `github.com/stretchr/testify` |
| `golang-samber-oops` | Project uses `github.com/samber/oops` |
| `golang-samber-slog` | Project uses `samber/slog-*` handlers |
| `golang-dependency-injection` | Choosing or comparing DI approaches (wire, dig, fx, samber/do) |
| `golang-spf13-cobra` / `golang-spf13-viper` | CLI with Cobra and/or Viper |
| `golang-cli` | General CLI architecture (beyond Cobra/Viper APIs) |
| `golang-grpc` / `golang-graphql` / `golang-swagger` | Matching API stack |
| `golang-pkg-go-dev` | Looking up pkg.go.dev docs, versions, importers, licenses, or CVEs |

#### Pin skills in the project agent config

After installing, add a `## Required Go skills` block to `CLAUDE.md` or `AGENTS.md` so agents load them every session. Use `/golang-how-to configure` or copy the list from [golang-how-to/references/project-config.md](skills/samber-golang/golang-how-to/references/project-config.md).

Example for the **Production baseline** (22 skills):

```markdown
## Required Go skills

The following Go skills MUST always load for Go-related work on this project:

- `golang-how-to`
- `golang-code-style`
- `golang-data-structures`
- `golang-design-patterns`
- `golang-documentation`
- `golang-error-handling`
- `golang-modernize`
- `golang-naming`
- `golang-safety`
- `golang-security`
- `golang-testing`
- `golang-troubleshooting`
- `golang-database`
- `golang-lint`
- `golang-structs-interfaces`
- `golang-concurrency`
- `golang-context`
- `golang-benchmark`
- `golang-performance`
- `golang-observability`
- `golang-project-layout`
- `golang-continuous-integration`
```

Learn more about the CLI usage at [skills](https://github.com/vercel-labs/skills).

### Recommended JS / TypeScript skills

There is no hand-maintained `node-*` suite in this repo anymore (only `node-naming` under custom). Pick upstream skills for your stack:

| Skill | Install when |
| --- | --- |
| `antfu` | Project setup — pnpm/monorepo, `@antfu/eslint-config`, tsconfig, library publishing |
| `vite` / `vitest` | Vite build tooling or Vitest test runner |
| `unocss` | UnoCSS atomic CSS |
| `vue-best-practices` and related `vue-*` skills | Vue 3 / Nuxt stack |
| `vueuse-functions` | VueUse composables |
| `tanstack-query` / `tanstack-router` / `tanstack-start` / `tanstack-integration` | TanStack data/routing stack |
| `hono-skills` | Hono web applications |
| `react-best-practices` | React / Next.js performance |
| `playwright-cli` | Browser automation or E2E tests |
| `frontend-design` / `web-design-guidelines` / `ui` / `baoyu-design` | UI design, UX audits, or design artifacts |
| `node-naming` | JS/TS naming conventions |

## Skills

### Hand-maintained Skills

> Opinionated workflows and conventions maintained by RockCookies under `skills/custom/`.

| Skill | Description |
|-------|-------------|
| [chinese-tech-writing](skills/custom/chinese-tech-writing) | 高质量中文写作 — 博客、技术文档、产品文案、周刊、报告与教程润色 |
| [git-atomic-commit](skills/custom/git-atomic-commit) | Atomic Conventional Commits — one logical change per commit |
| [git-rebase-surgeon](skills/custom/git-rebase-surgeon) | Safe history rewriting — rebase, squash, sync with upstream |
| [git-semantic-search](skills/custom/git-semantic-search) | Git archaeology — Pickaxe, Bisect, and Blame |
| [node-naming](skills/custom/node-naming) | JS/TS naming — identifiers, files, React components/Hooks/props |

### Upstream Skills

Synced from external repositories into `skills/{repoKey}/{target}/`.

#### [antfu/skills](https://github.com/antfu/skills)

| Skill | Description |
|-------|-------------|
| [antfu](skills/antfu/antfu) | Anthony Fu's opinionated JS/TS tooling — `@antfu/eslint-config`, pnpm catalogs, monorepo, project setup, and library publishing |
| [unocss](skills/antfu/unocss) | UnoCSS instant atomic CSS engine, superset of Tailwind CSS |
| [vite](skills/antfu/vite) | Vite build tool — configuration, plugin API, SSR, and Vite 8 Rolldown migration |
| [vitest](skills/antfu/vitest) | Vitest fast unit testing framework powered by Vite with Jest-compatible API |

#### [anthropics/skills](https://github.com/anthropics/skills)

| Skill | Description |
|-------|-------------|
| [skill-creator](skills/anthropics/skill-creator) | Create, modify, and benchmark agent skills |
| [frontend-design](skills/anthropics/frontend-design) | Distinctive, intentional visual design for new or reshaped UI |

#### [deckardger/tanstack-agent-skills](https://github.com/deckardger/tanstack-agent-skills)

| Skill | Description |
|-------|-------------|
| [tanstack-integration](skills/tanstack-agent/tanstack-integration) | Integrating TanStack Query with TanStack Router and TanStack Start — full-stack data flow, SSR, caching |
| [tanstack-query](skills/tanstack-agent/tanstack-query) | TanStack Query (React Query) — data fetching, caching, mutations, and server state management |
| [tanstack-router](skills/tanstack-agent/tanstack-router) | TanStack Router — type-safe routing, data loading, search params, and navigation |
| [tanstack-start](skills/tanstack-agent/tanstack-start) | TanStack Start — server functions, middleware, SSR, authentication, and deployment |

#### [jimliu/baoyu-design](https://github.com/jimliu/baoyu-design)

| Skill | Description |
|-------|-------------|
| [baoyu-design](skills/baoyu-design/baoyu-design) | Polished design artifacts as self-contained HTML — mockups, prototypes, wireframes, decks, design systems |

#### [mattpocock/skills](https://github.com/mattpocock/skills) (tag `v1.1.0`)

| Skill | Description |
|-------|-------------|
| [ask-matt](skills/mattpocock/ask-matt) | Router over the engineering/productivity skills in this set |
| [code-review](skills/mattpocock/code-review) | Review changes since a fixed point along Standards and Spec axes |
| [codebase-design](skills/mattpocock/codebase-design) | Shared vocabulary for designing deep modules |
| [diagnosing-bugs](skills/mattpocock/diagnosing-bugs) | Diagnosis loop for hard bugs and performance regressions |
| [domain-modeling](skills/mattpocock/domain-modeling) | Pin down domain terminology, ubiquitous language, and ADRs |
| [grill-me](skills/mattpocock/grill-me) | Relentless interview to sharpen a plan or design |
| [grill-with-docs](skills/mattpocock/grill-with-docs) | Grill a plan while creating ADRs and glossary as you go |
| [grilling](skills/mattpocock/grilling) | Stress-test a plan before building |
| [handoff](skills/mattpocock/handoff) | Compact the conversation into a handoff document for another agent |
| [implement](skills/mattpocock/implement) | Implement work from a spec or set of tickets |
| [improve-codebase-architecture](skills/mattpocock/improve-codebase-architecture) | Scan for deepening opportunities, report in HTML, then grill |
| [prototype](skills/mattpocock/prototype) | Throwaway prototype to answer a design question |
| [research](skills/mattpocock/research) | Investigate against high-trust sources; capture findings as Markdown |
| [resolving-merge-conflicts](skills/mattpocock/resolving-merge-conflicts) | Resolve an in-progress git merge/rebase conflict |
| [setup-matt-pocock-skills](skills/mattpocock/setup-matt-pocock-skills) | One-time setup — issue tracker, triage labels, domain doc layout |
| [tdd](skills/mattpocock/tdd) | Test-driven development — red-green-refactor and integration tests |
| [teach](skills/mattpocock/teach) | Teach a new skill or concept within the workspace |
| [to-spec](skills/mattpocock/to-spec) | Turn the current conversation into a published spec |
| [to-tickets](skills/mattpocock/to-tickets) | Break a plan into tracer-bullet tickets with blocking edges |
| [triage](skills/mattpocock/triage) | Move issues and external PRs through triage roles |
| [wayfinder](skills/mattpocock/wayfinder) | Plan multi-session work as investigation tickets on the tracker |
| [writing-great-skills](skills/mattpocock/writing-great-skills) | Vocabulary and principles that make a skill predictable |

#### [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)

| Skill | Description |
|-------|-------------|
| [playwright-cli](skills/playwright-cli/playwright-cli) | Automate browser interactions, test web pages and work with Playwright tests |

#### [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang) (tag `v1.9.0`)

| Skill | Description |
|-------|-------------|
| [golang-benchmark](skills/samber-golang/golang-benchmark) | Benchmarking, profiling, and performance measurement |
| [golang-cli](skills/samber-golang/golang-cli) | CLI application development with cobra, viper, and flag handling |
| [golang-code-style](skills/samber-golang/golang-code-style) | Code style, formatting, and conventions |
| [golang-concurrency](skills/samber-golang/golang-concurrency) | Concurrency patterns — goroutines, channels, sync primitives |
| [golang-context](skills/samber-golang/golang-context) | Idiomatic context.Context usage — creation, propagation, cancellation |
| [golang-continuous-integration](skills/samber-golang/golang-continuous-integration) | CI/CD pipeline configuration with GitHub Actions |
| [golang-data-structures](skills/samber-golang/golang-data-structures) | Slices, maps, arrays, container packages, and generic collections |
| [golang-database](skills/samber-golang/golang-database) | Database access — parameterized queries, transactions, connection pool |
| [golang-dependency-injection](skills/samber-golang/golang-dependency-injection) | Dependency injection patterns — manual DI, wire, dig, fx, samber/do |
| [golang-dependency-management](skills/samber-golang/golang-dependency-management) | go.mod, versioning, vulnerability scanning, and automated updates |
| [golang-design-patterns](skills/samber-golang/golang-design-patterns) | Idiomatic design patterns — functional options, graceful shutdown, resilience |
| [golang-documentation](skills/samber-golang/golang-documentation) | godoc, README, CHANGELOG, Example tests, and API docs |
| [golang-error-handling](skills/samber-golang/golang-error-handling) | Idiomatic error handling — wrapping, errors.Is/As, custom types, slog |
| [golang-google-wire](skills/samber-golang/golang-google-wire) | Compile-time dependency injection with google/wire |
| [golang-gopls](skills/samber-golang/golang-gopls) | Semantic code intelligence via gopls — navigate, rename, extract, diagnostics |
| [golang-graphql](skills/samber-golang/golang-graphql) | GraphQL APIs with gqlgen or graphql-go |
| [golang-grpc](skills/samber-golang/golang-grpc) | gRPC servers/clients, protobuf, interceptors, and streaming RPCs |
| [golang-how-to](skills/samber-golang/golang-how-to) | Go skills orchestrator — task routing, cluster disambiguation, and project skill configuration |
| [golang-lint](skills/samber-golang/golang-lint) | Linting best practices and golangci-lint configuration |
| [golang-modernize](skills/samber-golang/golang-modernize) | Modernize code to use the latest Go language features and idioms |
| [golang-naming](skills/samber-golang/golang-naming) | Naming conventions — packages, constructors, interfaces, errors, enums |
| [golang-observability](skills/samber-golang/golang-observability) | Structured logging with slog, Prometheus metrics, and OpenTelemetry tracing |
| [golang-performance](skills/samber-golang/golang-performance) | Performance optimization — allocation reduction, memory layout, GC tuning |
| [golang-pkg-go-dev](skills/samber-golang/golang-pkg-go-dev) | Package docs via godig (pkg.go.dev API) — versions, symbols, importers, licenses, and CVEs |
| [golang-popular-libraries](skills/samber-golang/golang-popular-libraries) | Recommends production-ready Go libraries and frameworks |
| [golang-project-layout](skills/samber-golang/golang-project-layout) | Project layout, directory structure, and workspace setup |
| [golang-refactoring](skills/samber-golang/golang-refactoring) | Safe at-scale restructuring — coverage-adaptive transforms, stacked PRs |
| [golang-safety](skills/samber-golang/golang-safety) | Defensive coding to prevent panics, nil crashes, and data races |
| [golang-samber-do](skills/samber-golang/golang-samber-do) | Dependency injection with samber/do |
| [golang-samber-hot](skills/samber-golang/golang-samber-hot) | In-memory caching with samber/hot — LRU, LFU, TTL, sharding |
| [golang-samber-lo](skills/samber-golang/golang-samber-lo) | Functional programming helpers with samber/lo |
| [golang-samber-mo](skills/samber-golang/golang-samber-mo) | Monadic types with samber/mo — Option, Result, Either, Future |
| [golang-samber-oops](skills/samber-golang/golang-samber-oops) | Structured error handling with samber/oops |
| [golang-samber-ro](skills/samber-golang/golang-samber-ro) | Reactive streams and event-driven programming with samber/ro |
| [golang-samber-slog](skills/samber-golang/golang-samber-slog) | Structured logging extensions with samber/slog-* packages |
| [golang-security](skills/samber-golang/golang-security) | Security best practices — injection prevention, crypto, secrets management |
| [golang-spf13-cobra](skills/samber-golang/golang-spf13-cobra) | CLI command tree with spf13/cobra |
| [golang-spf13-viper](skills/samber-golang/golang-spf13-viper) | Configuration management with spf13/viper |
| [golang-stay-updated](skills/samber-golang/golang-stay-updated) | Resources to stay updated with Go news, communities, and releases |
| [golang-stretchr-testify](skills/samber-golang/golang-stretchr-testify) | Testing with stretchr/testify — assert, require, mock, and suite |
| [golang-structs-interfaces](skills/samber-golang/golang-structs-interfaces) | Struct and interface design — composition, embedding, type assertions |
| [golang-swagger](skills/samber-golang/golang-swagger) | OpenAPI/Swagger documentation with swaggo/swag |
| [golang-testing](skills/samber-golang/golang-testing) | Production-ready tests — table-driven, mocks, integration, benchmarks, fuzzing |
| [golang-troubleshooting](skills/samber-golang/golang-troubleshooting) | Systematic troubleshooting — debugging, race detection, pprof, Delve |
| [golang-uber-dig](skills/samber-golang/golang-uber-dig) | Dependency injection with uber-go/dig |
| [golang-uber-fx](skills/samber-golang/golang-uber-fx) | Application framework with uber-go/fx — lifecycle, modules, signals |

#### [shadcn/improve](https://github.com/shadcn/improve)

| Skill | Description |
|-------|-------------|
| [improve](skills/shadcn-improve/improve) | Read-only senior-advisor survey — prioritized implementation plans for other agents |

#### [tw93/Waza](https://github.com/tw93/Waza) (tag `v3.32.0`)

| Skill | Description |
|-------|-------------|
| [check](skills/tw93-waza/check) | Review diffs, PRs, issue queues, release readiness, and project audits |
| [health](skills/tw93-waza/health) | Budget-aware audit of agent instructions, hooks/MCP, and AI maintainability |
| [hunt](skills/tw93-waza/hunt) | Find root cause before fixing errors, crashes, regressions, and failing tests |
| [learn](skills/tw93-waza/learn) | Six-phase research workflow from raw material to publish-ready output |
| [read](skills/tw93-waza/read) | Fetch and summarize URLs/PDFs (or convert to Markdown) |
| [think](skills/tw93-waza/think) | Turn rough ideas into approved, decision-complete plans before coding |
| [ui](skills/tw93-waza/ui) | Production-grade UI — pages, components, typography, screenshot polish |
| [write](skills/tw93-waza/write) | Polish Chinese/English prose — drafts, docs, release notes, localization |

#### [vercel-labs/skills](https://github.com/vercel-labs/skills)

| Skill | Description |
|-------|-------------|
| [find-skills](skills/vercel/find-skills) | Discover and install agent skills |

#### [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill | Description |
|-------|-------------|
| [web-design-guidelines](skills/vercel-agent/web-design-guidelines) | Review UI code for Web Interface Guidelines compliance and UX audits |
| [react-best-practices](skills/vercel-agent/react-best-practices) | React and Next.js performance optimization guidelines from Vercel Engineering |

#### [vueuse/skills](https://github.com/vueuse/skills)

| Skill | Description |
|-------|-------------|
| [vueuse-functions](skills/vueuse/vueuse-functions) | Apply VueUse composables to build concise, maintainable Vue.js / Nuxt features |

#### [vuejs-ai/skills](https://github.com/vuejs-ai/skills)

| Skill | Description |
|-------|-------------|
| [vue-best-practices](skills/vuejs-ai/vue-best-practices) | Vue 3 best practices — Composition API with `<script setup>` and TypeScript |
| [vue-debug-guides](skills/vuejs-ai/vue-debug-guides) | Vue 3 debugging and error handling for runtime errors, warnings, and SSR issues |
| [vue-jsx-best-practices](skills/vuejs-ai/vue-jsx-best-practices) | JSX syntax in Vue (class vs className, JSX plugin config) |
| [vue-pinia-best-practices](skills/vuejs-ai/vue-pinia-best-practices) | Pinia stores, state management patterns, and reactivity |
| [vue-router-best-practices](skills/vuejs-ai/vue-router-best-practices) | Vue Router 4 patterns, navigation guards, and route-component lifecycle |
| [vue-testing-best-practices](skills/vuejs-ai/vue-testing-best-practices) | Vue testing with Vitest, Vue Test Utils, and Playwright for E2E |

#### [yusukebe/hono-skill](https://github.com/yusukebe/hono-skill)

| Skill | Description |
|-------|-------------|
| [hono-skills](skills/hono/hono-skills) | Build Hono web applications — routing, middleware, JSX, validation, testing, and streaming |

## How It Works

This project uses an interactive CLI (`pnpm cli`) to manage upstream skill repositories:

1. **Manage upstream repositories** — Clone or update external git repositories into `upstream/`
2. **Sync skills** — Update upstream repos, then copy skill files into `skills/{repoKey}/{target}/`
3. **Cleanup** — Remove orphaned upstream repositories

Repository sources and skill mappings live in [meta.ts](meta.ts). Pins:

| Key | Upstream | Pin |
| --- | --- | --- |
| `samber-golang` | samber/cc-skills-golang | tag `v1.9.0` |
| `mattpocock` | mattpocock/skills | tag `v1.1.0` |
| `tw93-waza` | tw93/Waza | tag `v3.32.0` |

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
