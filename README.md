# RockCookies' Skills

A curated collection of [Agent Skills](https://agentskills.io/home) for full-stack development, with skills synced from upstream repositories via a CLI tool.

## Installation

```bash
npx skills add rockcookies/skills --skill='*' -g
```

Or install specific skills:

```bash
npx skills add rockcookies/skills --skill='vue-best-practices' -g
```

Install all Go-related skills (RockCookies `go-rc-*` plus upstream `golang-*` from [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang)):

```bash
npx skills add rockcookies/skills --skill go-rc-fetch --skill go-rc-gorm-gen --skill golang-benchmark --skill golang-cli --skill golang-code-style --skill golang-concurrency --skill golang-context --skill golang-continuous-integration --skill golang-data-structures --skill golang-database --skill golang-dependency-injection --skill golang-dependency-management --skill golang-design-patterns --skill golang-documentation --skill golang-error-handling --skill golang-google-wire --skill golang-graphql --skill golang-grpc --skill golang-lint --skill golang-modernize --skill golang-naming --skill golang-observability --skill golang-performance --skill golang-popular-libraries --skill golang-project-layout --skill golang-safety --skill golang-samber-do --skill golang-samber-hot --skill golang-samber-lo --skill golang-samber-mo --skill golang-samber-oops --skill golang-samber-ro --skill golang-samber-slog --skill golang-security --skill golang-spf13-cobra --skill golang-spf13-viper --skill golang-stay-updated --skill golang-stretchr-testify --skill golang-structs-interfaces --skill golang-swagger --skill golang-testing --skill golang-troubleshooting --skill golang-uber-dig --skill golang-uber-fx
```

Learn more about the CLI usage at [skills](https://github.com/vercel-labs/skills).

## Skills

### Hand-maintained Skills

> Opinionated workflows and conventions maintained by RockCookies.

| Skill | Description |
|-------|-------------|
| [git-master](skills/git-master) | Git workflow expert — atomic commits, safe rebasing, and history archaeology |
| [go-rc-fetch](skills/go-rc-fetch) | HTTP client for [rockcookies/go-fetch](https://github.com/rockcookies/go-fetch) — dispatcher middleware, request chaining, response decoding, and exchange logging |
| [go-rc-gorm-gen](skills/go-rc-gorm-gen) | Type-safe DAO code generation with [rockcookies/go-gen](https://github.com/rockcookies/go-gen) — GenerateModel, query building, custom templates, datatypes, soft delete, and generics |

### Upstream Skills

Synced from external repositories that maintain their own skills.

#### [antfu/skills](https://github.com/antfu/skills)

| Skill | Description |
|-------|-------------|
| [node-dev](skills/node-dev) | Modern JavaScript/TypeScript runtime development conventions and tooling |
| [unocss](skills/unocss) | UnoCSS instant atomic CSS engine, superset of Tailwind CSS |

#### [anthropics/skills](https://github.com/anthropics/skills)

| Skill | Description |
|-------|-------------|
| [skill-creator](skills/skill-creator) | Create, modify, and benchmark agent skills |
| [frontend-design](skills/frontend-design) | Production-grade frontend interfaces with high design quality |

#### [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)

| Skill | Description |
|-------|-------------|
| [playwright-cli](skills/playwright-cli) | Automate browser interactions, test web pages and work with Playwright tests |

#### [vercel-labs/skills](https://github.com/vercel-labs/skills)

| Skill | Description |
|-------|-------------|
| [find-skills](skills/find-skills) | Discover and install agent skills |

#### [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)

| Skill | Description |
|-------|-------------|
| [web-design-guidelines](skills/web-design-guidelines) | Review UI code for Web Interface Guidelines compliance and UX audits |

#### [vueuse/skills](https://github.com/vueuse/skills)

| Skill | Description |
|-------|-------------|
| [vueuse-functions](skills/vueuse-functions) | Apply VueUse composables to build concise, maintainable Vue.js / Nuxt features |

#### [vuejs-ai/skills](https://github.com/vuejs-ai/skills)

| Skill | Description |
|-------|-------------|
| [vue-best-practices](skills/vue-best-practices) | Vue 3 best practices — Composition API with `<script setup>` and TypeScript |
| [vue-debug-guides](skills/vue-debug-guides) | Vue 3 debugging and error handling for runtime errors, warnings, and SSR issues |
| [vue-jsx-best-practices](skills/vue-jsx-best-practices) | JSX syntax in Vue (class vs className, JSX plugin config) |
| [vue-pinia-best-practices](skills/vue-pinia-best-practices) | Pinia stores, state management patterns, and reactivity |
| [vue-router-best-practices](skills/vue-router-best-practices) | Vue Router 4 patterns, navigation guards, and route-component lifecycle |
| [vue-testing-best-practices](skills/vue-testing-best-practices) | Vue testing with Vitest, Vue Test Utils, and Playwright for E2E |

#### [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang)

| Skill | Description |
|-------|-------------|
| [golang-benchmark](skills/golang-benchmark) | Benchmarking, profiling, and performance measurement |
| [golang-cli](skills/golang-cli) | CLI application development with cobra, viper, and flag handling |
| [golang-code-style](skills/golang-code-style) | Code style, formatting, and conventions |
| [golang-concurrency](skills/golang-concurrency) | Concurrency patterns — goroutines, channels, sync primitives |
| [golang-context](skills/golang-context) | Idiomatic context.Context usage — creation, propagation, cancellation |
| [golang-continuous-integration](skills/golang-continuous-integration) | CI/CD pipeline configuration with GitHub Actions |
| [golang-data-structures](skills/golang-data-structures) | Slices, maps, arrays, container packages, and generic collections |
| [golang-database](skills/golang-database) | Database access — parameterized queries, transactions, connection pool |
| [golang-dependency-injection](skills/golang-dependency-injection) | Dependency injection patterns — manual DI, wire, dig, fx, samber/do |
| [golang-dependency-management](skills/golang-dependency-management) | go.mod, versioning, vulnerability scanning, and automated updates |
| [golang-design-patterns](skills/golang-design-patterns) | Idiomatic design patterns — functional options, graceful shutdown, resilience |
| [golang-documentation](skills/golang-documentation) | godoc, README, CHANGELOG, Example tests, and API docs |
| [golang-error-handling](skills/golang-error-handling) | Idiomatic error handling — wrapping, errors.Is/As, custom types, slog |
| [golang-google-wire](skills/golang-google-wire) | Compile-time dependency injection with google/wire |
| [golang-graphql](skills/golang-graphql) | GraphQL APIs with gqlgen or graphql-go |
| [golang-grpc](skills/golang-grpc) | gRPC servers/clients, protobuf, interceptors, and streaming RPCs |
| [golang-lint](skills/golang-lint) | Linting best practices and golangci-lint configuration |
| [golang-modernize](skills/golang-modernize) | Modernize code to use the latest Go language features and idioms |
| [golang-naming](skills/golang-naming) | Naming conventions — packages, constructors, interfaces, errors, enums |
| [golang-observability](skills/golang-observability) | Structured logging with slog, Prometheus metrics, and OpenTelemetry tracing |
| [golang-performance](skills/golang-performance) | Performance optimization — allocation reduction, memory layout, GC tuning |
| [golang-popular-libraries](skills/golang-popular-libraries) | Recommends production-ready Go libraries and frameworks |
| [golang-project-layout](skills/golang-project-layout) | Project layout, directory structure, and workspace setup |
| [golang-safety](skills/golang-safety) | Defensive coding to prevent panics, nil crashes, and data races |
| [golang-samber-do](skills/golang-samber-do) | Dependency injection with samber/do |
| [golang-samber-hot](skills/golang-samber-hot) | In-memory caching with samber/hot — LRU, LFU, TTL, sharding |
| [golang-samber-lo](skills/golang-samber-lo) | Functional programming helpers with samber/lo |
| [golang-samber-mo](skills/golang-samber-mo) | Monadic types with samber/mo — Option, Result, Either, Future |
| [golang-samber-oops](skills/golang-samber-oops) | Structured error handling with samber/oops |
| [golang-samber-ro](skills/golang-samber-ro) | Reactive streams and event-driven programming with samber/ro |
| [golang-samber-slog](skills/golang-samber-slog) | Structured logging extensions with samber/slog-* packages |
| [golang-security](skills/golang-security) | Security best practices — injection prevention, crypto, secrets management |
| [golang-spf13-cobra](skills/golang-spf13-cobra) | CLI command tree with spf13/cobra |
| [golang-spf13-viper](skills/golang-spf13-viper) | Configuration management with spf13/viper |
| [golang-stay-updated](skills/golang-stay-updated) | Resources to stay updated with Go news, communities, and releases |
| [golang-stretchr-testify](skills/golang-stretchr-testify) | Testing with stretchr/testify — assert, require, mock, and suite |
| [golang-structs-interfaces](skills/golang-structs-interfaces) | Struct and interface design — composition, embedding, type assertions |
| [golang-swagger](skills/golang-swagger) | OpenAPI/Swagger documentation with swaggo/swag |
| [golang-testing](skills/golang-testing) | Production-ready tests — table-driven, mocks, integration, benchmarks, fuzzing |
| [golang-troubleshooting](skills/golang-troubleshooting) | Systematic troubleshooting — debugging, race detection, pprof, Delve |
| [golang-uber-dig](skills/golang-uber-dig) | Dependency injection with uber-go/dig |
| [golang-uber-fx](skills/golang-uber-fx) | Application framework with uber-go/fx — lifecycle, modules, signals |

## How It Works

This project uses an interactive CLI (`pnpm cli`) to manage upstream skill repositories:

1. **Manage upstream repositories** — Clone or update external git repositories into `upstream/`
2. **Sync skills** — Update upstream repos, then copy skill files into `skills/`
3. **Cleanup** — Remove orphaned upstream repositories

Repository sources and skill mappings are configured in [meta.ts](meta.ts). The `samber/cc-skills-golang` upstream is pinned to tag `v1.5.0` in `meta.ts`.

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
