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

Learn more about the CLI usage at [skills](https://github.com/vercel-labs/skills).

## Skills

### Hand-maintained Skills

> Opinionated workflows and conventions maintained by RockCookies.

| Skill | Description |
|-------|-------------|
| [git-master](skills/git-master) | Git workflow expert — atomic commits, safe rebasing, and history archaeology |
| [go-gorm-gen](skills/go-gorm-gen) | Type-safe DAO code generation with rockcookies/go-gen — GenerateModel, query building, dynamic SQL, custom templates, and generics |

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

This project uses a CLI tool (`pnpm start`) to manage upstream skill repositories:

1. **`pnpm start upstream`** - Clone/update external git repositories into `upstream/`
2. **`pnpm start sync`** - Copy skill files from upstream repos into `skills/`
3. **`pnpm start cleanup`** - Remove orphaned upstream repositories

Repository sources and skill mappings are configured in [meta.ts](meta.ts).

## Development

```bash
# Install dependencies
pnpm install

# Clone upstream repositories
pnpm start upstream

# Sync skills from upstream
pnpm start sync

# Clean up orphaned upstream repos
pnpm start cleanup
```

## Credits

Project structure and workflow inspired by [antfu/skills](https://github.com/antfu/skills).

## License

MIT
