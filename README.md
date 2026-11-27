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

<!-- packs:go:start -->
### Go skills ([samber/cc-skills-golang](https://github.com/samber/cc-skills-golang), tag `v2.0.0`)

Atomic and cross-referencing — prefer the ⭐ set (or all), then add category / library skills as needed. Installing a skill does **not** pull linked skills automatically.

#### ⭐ Recommended

Upstream general-purpose set for every Go project. Includes `golang-how-to` (orchestrator).

```bash
npx skills add rockcookies/skills \
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
npx skills add rockcookies/skills \
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
npx skills add rockcookies/skills \
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
npx skills add rockcookies/skills \
  --skill golang-benchmark \
  --skill golang-observability \
  --skill golang-performance \
  --skill golang-testing \
  --skill golang-troubleshooting \
  -g
```

#### Project Setup

```bash
npx skills add rockcookies/skills \
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
npx skills add rockcookies/skills \
  --skill golang-graphql \
  --skill golang-grpc \
  --skill golang-swagger \
  -g
```

#### Dependency Injection

```bash
npx skills add rockcookies/skills \
  --skill golang-google-wire \
  --skill golang-uber-dig \
  --skill golang-uber-fx \
  --skill golang-samber-do \
  -g
```

#### Frameworks

```bash
npx skills add rockcookies/skills \
  --skill golang-spf13-cobra \
  --skill golang-spf13-viper \
  -g
```

#### samber/*

```bash
npx skills add rockcookies/skills \
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
npx skills add rockcookies/skills \
  --skill golang-stretchr-testify \
  -g
```
<!-- packs:go:end -->

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

<!-- packs:js:start -->
### JS / TypeScript skills

Hand-maintained web style skills live under `content/custom/skills/` (`web-code-style`, `web-css-guidelines`). Install by stack:

#### Tooling (antfu)

```bash
npx skills add rockcookies/skills \
  --skill antfu \
  --skill vite \
  --skill vitest \
  --skill unocss \
  -g
```

#### Vue

```bash
npx skills add rockcookies/skills \
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
npx skills add rockcookies/skills \
  --skill tanstack-integration \
  --skill tanstack-query \
  --skill tanstack-router \
  --skill tanstack-start \
  -g
```

#### React / Next.js & web guidelines

```bash
npx skills add rockcookies/skills \
  --skill react-best-practices \
  --skill web-design-guidelines \
  -g
```

#### TypeScript principles (cursor/plugins)

```bash
npx skills add rockcookies/skills \
  --skill typescript-best-practices \
  --skill principle-type-system-discipline \
  --skill principle-boundary-discipline \
  --skill principle-encode-lessons-in-structure \
  -g
```

#### how & why (cursor/plugins)

Companions driving parallel `generalPurpose` Task subagents: `how` explains how a subsystem works; `why` investigates the forces that shaped it through available MCPs.

```bash
npx skills add rockcookies/skills \
  --skill how \
  --skill why \
  -g
```

#### pstack set (cursor/plugins)

All twenty-four engineering principles plus the workflow skills built on them: `benchmark-checklist`, `pstack-tdd` (aliased — `tdd` is taken) and `show-me-your-work`.

```bash
npx skills add rockcookies/skills \
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
npx skills add rockcookies/skills \
  --skill unslop \
  --skill technical-writing \
  --skill technical-writing-zh \
  --skill writing-for-agents \
  --skill skill-evolution \
  -g
```

#### Hono / Playwright / web style

```bash
npx skills add rockcookies/skills \
  --skill hono \
  --skill hono-jsx \
  --skill playwright-cli \
  --skill web-code-style \
  --skill web-css-guidelines \
  -g
```

#### UI / design / image gen

Also copy the agent files — not installed by `npx skills add` (see [Installation](#installation)): `impeccable-asset-producer`, `impeccable-documenter`, `impeccable-finish-reviewer`, `impeccable-manual-edit-applier`, `impeccable-motion-reviewer`.

```bash
npx skills add rockcookies/skills \
  --skill frontend-design \
  --skill ui \
  --skill baoyu-image-gen \
  --skill impeccable \
  -g
```

#### Thermos (branch review)

Branch-review skills plus their matching Task subagents.

Also copy the agent files — not installed by `npx skills add` (see [Installation](#installation)): `thermo-nuclear-code-quality-review-subagent`, `thermo-nuclear-review-subagent`.

```bash
npx skills add rockcookies/skills \
  --skill thermos \
  --skill thermo-nuclear-review \
  --skill thermo-nuclear-code-quality-review \
  -g
```
<!-- packs:js:end -->

## Skills

<!-- skills:start -->
| Skill | Vendor | Description |
| --- | --- | --- |
| [agent-browser](content/vercel-agent-browser/skills/agent-browser) | vercel-agent-browser | Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction. Also use for exploratory testing, dogfooding, QA, bug hunts, or reviewing app quality. Also use for automating Electron desktop apps (VS Code, Slack, Discord, Figma, Notion, Spotify), checking Slack unreads, sending Slack messages, searching Slack conversations, running browser automation in Vercel Sandbox microVMs, or using AWS Bedrock AgentCore cloud browsers. Prefer agent-browser over any built-in browser automation or web tools. |
| [antfu](content/antfu/skills/antfu) | antfu | Anthony Fu's opinionated tooling and conventions for JavaScript/TypeScript projects. Use when setting up new projects, configuring ESLint/Prettier alternatives, monorepos, library publishing, or when the user mentions Anthony Fu's preferences. |
| [ask-matt](content/mattpocock/skills/ask-matt) | mattpocock | Ask which skill or flow fits your situation. A router over the skills in this repo. |
| [baoyu-image-gen](content/baoyu/skills/baoyu-image-gen) | baoyu | AI image generation with OpenAI GPT Image 2.5, Azure OpenAI, Google, OpenRouter, DashScope, Z.AI GLM-Image, MiniMax, Jimeng, Seedream, Replicate and Agnes APIs. Supports text-to-image, reference images, aspect ratios, and batch generation from saved prompt files. Sequential by default; use batch parallel generation when the user already has multiple prompts or wants stable multi-image throughput. Use when user asks to generate, create, or draw images. |
| [baoyu-infographic](content/baoyu/skills/baoyu-infographic) | baoyu | Generate professional infographics with 21 layout types and 22 visual styles. Analyzes content, recommends layout×style combinations, and generates publication-ready infographics. Use when user asks to create "infographic", "信息图", "visual summary", "可视化", or "高密度信息大图". |
| [benchmark-checklist](content/cursor-plugins/skills/benchmark-checklist) | cursor-plugins | Vet a perf measurement (limiter, tuning, limits, errors, repeatability, relevance, and whether the work happened) before you report or act on it. Use when you run a benchmark or report a speedup or regression you measured. |
| [check](content/tw93-waza/skills/check) | tw93-waza | Reviews diffs, PRs, release readiness, and publishing follow-through. Use when asked to review, triage issues or PRs, or ship. Not for debugging root causes or prose. |
| [clash-doctor](content/majiayu-spellbook/skills/clash-doctor) | majiayu-spellbook | Clash Verge 与 mihomo 诊断和 profile 管理。当用户遇到代理失败、需要配置 AI 工具路由、本地 Hub 拓扑、多机对齐、TUN 绕过、克隆或切换订阅，或同步后 配置未生效时使用。进程线路使用 clash-routes，出口 IP 质量使用 ip-check。 普通网络测速不使用。 |
| [clash-routes](content/majiayu-spellbook/skills/clash-routes) | majiayu-spellbook | 查看本机进程的 Mihomo 实时代理链。当用户问 Claude、Codex、Gemini、ChatGPT、 浏览器或其他进程走哪个代理时使用。只读。Profile 拓扑和写入使用 clash-doctor， 出口 IP 质量使用 ip-check。 |
| [code-review](content/mattpocock/skills/code-review) | mattpocock | Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X". |
| [codebase-audit](content/majiayu-spellbook/skills/codebase-audit) | majiayu-spellbook | 全面代码库审计 — 自适应并行深度分析（前后端契约、数据完整性、异常处理/安全、架构/技术债、配置/缓存），结构化 findings + 对抗验证 + 基线对比，输出按严重程度排序的统一报告和修复路线图。支持 quick 快速体检模式。Use when user asks to audit, analyze, or review an entire codebase for design issues, find hidden bugs, check architecture health, or asks '全面审查', '代码库审计', '分析设计问题', 'audit codebase', 'health check', '有哪些问题', '快速体检'. Also trigger when user asks to find silent degradation, data flow breakpoints, type mismatches between frontend and backend, or wants to understand technical debt across a project. |
| [codebase-design](content/mattpocock/skills/codebase-design) | mattpocock | Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary. |
| [cursor-plan-pipeline](content/custom/skills/cursor-plan-pipeline) | custom | Cursor Plan Mode 流水线：拷问 → think 审查清单 → CreatePlan；UI 批准后实现，再 check。仅在 Cursor 且需要 Plan Mode 闸口时使用。用户说 cursor-plan-pipeline、 Plan Mode 拷问落地、Cursor 里 grill 出计划时触发。Not for other runtimes (→ grill-and-think). Not for live incident 排障 (→ hunt). |
| [diagnosing-bugs](content/mattpocock/skills/diagnosing-bugs) | mattpocock | Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow. |
| [domain-modeling](content/mattpocock/skills/domain-modeling) | mattpocock | Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a GLOSSARY.md, or recording or editing an ADR. |
| [figma-to-react](content/majiayu-spellbook/skills/figma-to-react) | majiayu-spellbook | Use when the user wants to extract Figma designs into production-ready React or Next.js components with TypeScript, Tailwind CSS, and pixel-perfect accuracy. |
| [find-skills](content/vercel/skills/find-skills) | vercel | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill. |
| [frontend-design](content/anthropics/skills/frontend-design) | anthropics | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults. |
| [git-atomic-commit](content/custom/skills/git-atomic-commit) | custom | 生成原子化的 Git 提交——每个提交只包含一个逻辑变更（One logical change → One revertable commit），格式遵循与项目风格一致的 Conventional Commits。 Use when the user has multiple files or concerns to commit, needs to split a mixed index into atomic commits, or asks for Conventional Commits / 原子提交. Not for history rewriting or rebase (→ git-rebase-surgeon). Not for pickaxe / blame / bisect archaeology (→ git-semantic-search). |
| [git-rebase-surgeon](content/custom/skills/git-rebase-surgeon) | custom | 带前置校验的安全 Git 历史重写。用于用户要求 rebase、squash 提交、与上游同步分支， 或重写历史时。Use when the user asks to rebase, squash commits, sync a branch with upstream, or rewrite history with a safety net and force-with-lease. Not for creating new atomic commits (→ git-atomic-commit). Not for pickaxe / blame / bisect archaeology (→ git-semantic-search). |
| [git-semantic-search](content/custom/skills/git-semantic-search) | custom | Git 考古 —— 用 Pickaxe、Bisect、Blame 追溯代码何时被引入、删除或修改。 Use when the user asks who wrote a line, when a bug started, where a symbol came from, or needs archaeology of any code change. Not for generic git log browsing. Not for creating atomic commits (→ git-atomic-commit). Not for rebase or history rewriting (→ git-rebase-surgeon). |
| [golang-benchmark](content/samber-golang/skills/golang-benchmark) | samber-golang | Golang benchmarking, profiling, and performance measurement. Use when writing, running, or comparing Go benchmarks, profiling hot paths with pprof, interpreting CPU/memory/trace profiles, analyzing results with benchstat, setting up CI benchmark regression detection, or investigating production performance with Prometheus runtime metrics. Also use when the developer needs deep analysis on a specific performance indicator - this skill provides the measurement methodology, while `golang-performance` provides the optimization patterns. |
| [golang-cli](content/samber-golang/skills/golang-cli) | samber-golang | Golang CLI application development. Use when building, modifying, or reviewing a Go CLI tool — especially for command structure, flag handling, configuration layering, version embedding, exit codes, I/O patterns, signal handling, shell completion, argument validation, and CLI unit testing. Also triggers when code uses cobra, viper, or urfave/cli. For cobra-specific APIs → See `golang-spf13-cobra` skill; for viper configuration layering → See `golang-spf13-viper` skill. |
| [golang-code-style](content/samber-golang/skills/golang-code-style) | samber-golang | Golang code style conventions — line length and breaking, variable declarations, control flow clarity, when comments help vs hurt. Use when writing or reviewing Go code, asking about style or clarity, or establishing project coding standards. Not for naming conventions (→ See `golang-naming` skill), linter configuration (→ See `golang-lint` skill), or doc comments (→ See `golang-documentation` skill). |
| [golang-concurrency](content/samber-golang/skills/golang-concurrency) | samber-golang | Golang concurrency patterns. Use when writing or reviewing concurrent Go code involving goroutines, channels, select, locks, sync primitives, errgroup, singleflight, worker pools, or fan-out/fan-in pipelines. Also triggers when you detect goroutine leaks, race conditions, channel ownership issues, or need to choose between channels and mutexes. |
| [golang-context](content/samber-golang/skills/golang-context) | samber-golang | Idiomatic context.Context usage in Golang — propagation through API boundaries, cancellation, timeouts and deadlines, request-scoped values, context.WithoutCancel for background work outliving requests. Apply when designing context propagation across layers, debugging leaked or unexpired contexts, choosing between context.Background/TODO/WithoutCancel, or storing values in context. Not for code that merely accepts ctx as first parameter. |
| [golang-continuous-integration](content/samber-golang/skills/golang-continuous-integration) | samber-golang | CI/CD pipeline configuration using GitHub Actions for Golang projects — testing, linting, SAST, security scanning, code coverage, Dependabot, Renovate, GoReleaser, code review automation, and release pipelines. Use when setting up or improving Go project CI, configuring GitHub Actions workflows, adding linters or security scanners, automating dependency updates, or adding quality gates. |
| [golang-data-structures](content/samber-golang/skills/golang-data-structures) | samber-golang | Golang data structures — slices (internals, capacity growth, preallocation, slices package), maps (internals, hash buckets, maps package), arrays, container/list/heap/ring, strings.Builder vs bytes.Buffer, generic collections, pointers (unsafe.Pointer, weak.Pointer), and copy semantics. Use when choosing or optimizing Go data structures, implementing generic containers, using container/ packages, unsafe or weak pointers, or questioning slice/map internals. |
| [golang-database](content/samber-golang/skills/golang-database) | samber-golang | Comprehensive guide for Go database access — parameterized queries, struct scanning, NULLable columns, transactions, isolation levels, SELECT FOR UPDATE, connection pool, batch processing, context propagation, and migration tooling. Use when writing, reviewing, or debugging Golang code that interacts with PostgreSQL, MariaDB, MySQL, or SQLite; for database testing; or for questions about database/sql, sqlx, or pgx. Does NOT generate database schemas or migration SQL. |
| [golang-dependency-injection](content/samber-golang/skills/golang-dependency-injection) | samber-golang | Comprehensive guide for dependency injection (DI) in Golang. Covers why DI matters (testability, loose coupling, separation of concerns, lifecycle management), manual constructor injection, and DI library comparison (google/wire, uber-go/dig, uber-go/fx, samber/do). Use this skill when designing service architecture, setting up dependency injection, refactoring tightly coupled code, managing singletons or service factories, or when the user asks about inversion of control, service containers, or wiring dependencies in Go. For a specific DI library, → See `golang-google-wire`, `golang-uber-dig`, `golang-uber-fx`, or `golang-samber-do` skills. |
| [golang-dependency-management](content/samber-golang/skills/golang-dependency-management) | samber-golang | Dependency management strategies for Golang projects — go.mod management, installing/upgrading packages, Minimal Version Selection, vulnerability scanning, outdated dependency tracking, binary size analysis, Dependabot/Renovate setup, conflict resolution, and go.work workspaces. Use when adding, removing, or upgrading Go dependencies, auditing vulnerabilities, resolving version conflicts, or setting up automated dependency updates. |
| [golang-design-patterns](content/samber-golang/skills/golang-design-patterns) | samber-golang | Idiomatic Golang design patterns — functional options, constructors, error flow and cascading, resource management and lifecycle, graceful shutdown, resilience, architecture, dependency injection, data handling, streaming, and more. Apply when explicitly choosing between architectural patterns, implementing functional options, designing constructor APIs, setting up graceful shutdown, applying resilience patterns, or asking which idiomatic Go pattern fits a specific problem. |
| [golang-documentation](content/samber-golang/skills/golang-documentation) | samber-golang | Comprehensive documentation guide for Golang projects, covering godoc comments, README, CONTRIBUTING, CHANGELOG, Go Playground, Example tests, API docs, and llms.txt. Use when writing or reviewing doc comments, documentation, adding code examples, setting up doc sites, or discussing documentation best practices. Triggers for both libraries and applications/CLIs. |
| [golang-error-handling](content/samber-golang/skills/golang-error-handling) | samber-golang | Idiomatic Golang error handling — creation, wrapping with %w, errors.Is/As, errors.Join, custom error types, sentinel errors, panic/recover, the single handling rule, structured logging with slog, HTTP request logging middleware, and samber/oops for production errors. Built to make logs usable at scale with log aggregation 3rd-party tools. Apply when creating, wrapping, inspecting, or logging errors in Go code. For samber/oops specifics → See `golang-samber-oops` skill; for slog handler ecosystem → See `golang-samber-slog` skill. |
| [golang-google-wire](content/samber-golang/skills/golang-google-wire) | samber-golang | Compile-time dependency injection in Golang using google/wire — wire.NewSet, wire.Build, wire.Bind (interface→concrete), wire.Struct, wire.Value, wire.InterfaceValue, wire.FieldsOf, cleanup functions, //go:build wireinject injector files, and generated wire_gen.go. Apply when using or adopting google/wire, when the codebase imports `github.com/google/wire`, or when wiring an application graph at compile time via `wire.Build`. For runtime DI with reflection, see `golang-uber-dig` skill. |
| [golang-gopls](content/samber-golang/skills/golang-gopls) | samber-golang | Golang semantic code intelligence via `gopls`, the official Go language server — go-to-definition, find references, call/implementation hierarchy, workspace symbol search, package API discovery, diagnostics, safe rename, refactors (extract/inline/fill/rewrite code actions), formatting, and generated tests. Reaches an agent via gopls's own MCP server (`go_*` tools), Claude Code's native `LSP` tool, or the `gopls` CLI. Use when navigating or refactoring Go code — jumping to a definition, finding call sites before a rename, understanding a file's or package's dependencies, running diagnostics after an edit, or extracting/inlining/renaming. Not for the published ecosystem — packages not in your `go.mod`, versions, licenses, importers — → See `golang-pkg-go-dev` skill (`godig`). Not for a whole-tree vulnerability audit → See `golang-security` skill (`govulncheck`). |
| [golang-graphql](content/samber-golang/skills/golang-graphql) | samber-golang | Implements GraphQL APIs in Golang using gqlgen or graphql-go. Apply when building GraphQL servers, designing schemas, writing resolvers, handling subscriptions, or integrating GraphQL with existing Go HTTP services. Also apply when the codebase imports `github.com/99designs/gqlgen` or `github.com/graph-gophers/graphql-go`. |
| [golang-grpc](content/samber-golang/skills/golang-grpc) | samber-golang | Provides gRPC usage guidelines, protobuf organization, and production-ready patterns for Golang microservices. Use when implementing, reviewing, or debugging gRPC servers/clients, writing proto files, setting up interceptors, handling gRPC errors with status codes, configuring TLS/mTLS, testing with bufconn, or working with streaming RPCs. |
| [golang-how-to](content/samber-golang/skills/golang-how-to) | samber-golang | Golang skills orchestrator — always active on any Golang coding, review, debug, or setup task. Reads the task context and loads the most relevant skills from samber/cc-skills-golang, often multiple at once: writing a gRPC service loads golang-grpc + golang-testing + golang-error-handling; debugging a panic loads golang-troubleshooting + golang-safety; auditing security loads golang-security + golang-lint + golang-safety. Also: disambiguates competing clusters when two skills seem to overlap (performance vs benchmark vs troubleshooting, samber/lo vs mo vs ro, DI cluster, safety vs security), and configures the project's agent-config file (CLAUDE.md, AGENTS.md, GEMINI.md, Cursor rules, or Copilot instructions) to force-trigger skills in a project (/golang-how-to configure). |
| [golang-lint](content/samber-golang/skills/golang-lint) | samber-golang | Linting best practices and golangci-lint configuration for Golang projects — running linters, configuring .golangci.yml, suppressing warnings with nolint directives, interpreting lint output, and selecting linters. Use when configuring golangci-lint, asking about lint warnings or nolint suppressions, setting up code quality tooling, or choosing linters. Also use when the user mentions golangci-lint, go vet, staticcheck, or revive. |
| [golang-modernize](content/samber-golang/skills/golang-modernize) | samber-golang | Modernize Golang code to use recent language features, standard library improvements, and idiomatic patterns. Trigger proactively when writing or reviewing Go code and old-style patterns are detected, or when encountering a deprecation warning. Also use when the user explicitly asks for modernization, a Go version upgrade, or a CI/tooling refresh. |
| [golang-naming](content/samber-golang/skills/golang-naming) | samber-golang | Go (Golang) naming conventions — covers packages, constructors, structs, interfaces, constants, enums, errors, booleans, receivers, getters/setters, functional options, acronyms, test functions, and subtest names. Use this skill when writing new Go code, reviewing or refactoring, choosing between naming alternatives (New vs NewTypeName, isConnected vs connected, ErrNotFound vs NotFoundError, StatusReady vs StatusUnknown at iota 0), debating Go package names (utils/helpers anti-patterns), or asking about Go naming best practices. Also trigger when the user mentions MixedCaps vs snake_case, ALL_CAPS constants, Get-prefix on getters, or error string casing. Do NOT use for general Go implementation questions that don't involve naming decisions. |
| [golang-observability](content/samber-golang/skills/golang-observability) | samber-golang | Golang everyday observability — the always-on signals in production. Covers structured logging with slog, Prometheus metrics, OpenTelemetry distributed tracing, continuous profiling with pprof/Pyroscope, server-side RUM event tracking, alerting, and Grafana dashboards. Apply when instrumenting Go services for production monitoring, setting up metrics or alerting, adding OpenTelemetry tracing, correlating logs with traces, migrating legacy loggers (zap/logrus/zerolog) to slog, adding observability to new features, or implementing GDPR/CCPA-compliant tracking with Customer Data Platforms (CDP). Not for temporary deep-dive performance investigation (→ See `golang-benchmark` and `golang-performance` skills). |
| [golang-performance](content/samber-golang/skills/golang-performance) | samber-golang | Golang performance optimization patterns and methodology - if X bottleneck, then apply Y. Covers allocation reduction, CPU efficiency, memory layout, GC tuning, pooling, caching, and hot-path optimization. Use when profiling or benchmarks have identified a bottleneck and you need the right optimization pattern to fix it. Also use when performing performance code review to suggest improvements or benchmarks that could help identify quick performance gains. Not for measurement methodology (→ See `golang-benchmark` skill) or debugging workflow (→ See `golang-troubleshooting` skill). |
| [golang-pkg-go-dev](content/samber-golang/skills/golang-pkg-go-dev) | samber-golang | Golang package and module documentation and exploration via `godig`, a pkg.go.dev API client (CLI + MCP server) — package docs, API references, symbols, code examples, available versions, importers (who imports a package), licenses, and known vulnerabilities. Read-only, no auth. Use for looking up any Go/Golang library's documentation, API signatures, usage examples, which versions exist, whether a dependency has CVEs, or who imports a package — prefer this over Context7 for any Go package or module. Triggers on: how to use a Go library, Go API docs, import usage, code examples, pkg.go.dev. Not for upgrading dependencies (→ See `golang-dependency-management` skill) or choosing a library (→ See `golang-popular-libraries` skill). Not for local symbols, or for navigating an already-used dependency's resolved source, call sites, or generic instantiations — → See `golang-gopls` skill for those. |
| [golang-popular-libraries](content/samber-golang/skills/golang-popular-libraries) | samber-golang | Recommends production-ready Golang libraries and frameworks. Apply when the user explicitly asks for library suggestions, wants to compare alternatives, needs to choose a library for a specific task, or when a new dependency is being added to the project. |
| [golang-project-layout](content/samber-golang/skills/golang-project-layout) | samber-golang | Provides a guide for setting up Golang project layouts and workspaces. Use when starting a new Go project, organizing an existing codebase, setting up a monorepo with multiple packages, creating CLI tools with multiple main packages, deciding between cmd/internal/pkg directory conventions, or discussing package restructuring, package splits, or module splits. |
| [golang-refactoring](content/samber-golang/skills/golang-refactoring) | samber-golang | Golang refactoring — the safe, at-scale process for restructuring existing Go code: a coverage-adaptive safety net, tool-driven behavior-preserving transforms (gopls Rename/Inline/Extract, `gofmt -r`, `eg`, `gopatch`, `go/analysis` fixers), the Fowler catalog mapped to Go, breaking import cycles, moving types across packages, and a human-in-the-loop workflow of small stacked PRs on a refactoring branch. Apply when code is hard to maintain, a function/type has grown too large, a code smell needs fixing, adding a feature is blocked by the current structure, or the user asks to clean up, refactor, or improve Go code — also for renaming at scale, extracting functions/interfaces, moving code between packages, splitting packages, or planning a multi-step refactor. Target styles owned elsewhere → See `golang-naming` (renames), `@golang-project-layout` (splits), `@golang-modernize` (idioms), `@golang-code-style` (control flow), `@golang-design-patterns` (patterns/DI). |
| [golang-safety](content/samber-golang/skills/golang-safety) | samber-golang | Defensive Golang coding to prevent panics, silent data corruption, and subtle runtime bugs. Use when encountering nil panics, append aliasing, map concurrent access, float comparison pitfalls, or zero-value design questions. Also use when reviewing code for nil-safety, numeric conversion overflow, resource lifecycle issues (defer in loops), or defensive copying of slices and maps. |
| [golang-samber-do](content/samber-golang/skills/golang-samber-do) | samber-golang | Dependency injection in Golang using samber/do — service containers, lifecycle management, scopes, health checks, graceful shutdown, and module organization. Apply when using or adopting samber/do, when the codebase imports github.com/samber/do or github.com/samber/do/v2, or when refactoring manual constructor injection into a DI container. |
| [golang-samber-hot](content/samber-golang/skills/golang-samber-hot) | samber-golang | In-memory caching in Golang using samber/hot — eviction algorithms (LRU, LFU, TinyLFU, W-TinyLFU, S3FIFO, ARC, TwoQueue, SIEVE, FIFO), TTL, cache loaders, sharding, stale-while-revalidate, missing key caching, and Prometheus metrics. Apply when using or adopting samber/hot, when the codebase imports github.com/samber/hot, or when the project repeatedly loads the same medium-to-low cardinality resources at high frequency and needs to reduce latency or backend pressure. |
| [golang-samber-lo](content/samber-golang/skills/golang-samber-lo) | samber-golang | Functional programming helpers for Golang using samber/lo — 500+ type-safe generic functions for slices, maps, channels, strings, math, tuples, and concurrency (Map, Filter, Reduce, GroupBy, Chunk, Flatten, Find, Uniq, etc.). Core immutable package (lo), concurrent variants (lo/parallel aka lop), in-place mutations (lo/mutable aka lom), lazy iterators (lo/it aka loi for Go 1.23+), and experimental SIMD (lo/exp/simd). Apply when using or adopting samber/lo, when the codebase imports github.com/samber/lo, or when implementing functional-style data transformations in Go. Not for streaming pipelines (→ See `golang-samber-ro` skill). |
| [golang-samber-mo](content/samber-golang/skills/golang-samber-mo) | samber-golang | Monadic types for Golang using samber/mo — Option, Result, Either, Future, IO, Task, and State types for type-safe nullable values, error handling, and functional composition with pipeline sub-packages. Apply when using or adopting samber/mo, when the codebase imports `github.com/samber/mo`, or when considering functional programming patterns as a safety design for Golang. |
| [golang-samber-oops](content/samber-golang/skills/golang-samber-oops) | samber-golang | Structured error handling in Golang with samber/oops — error builders, stack traces, error codes, error context, error wrapping, error attributes, user-facing vs developer messages, panic recovery, and logger integration. Apply when using or adopting samber/oops, or when the codebase already imports github.com/samber/oops. |
| [golang-samber-ro](content/samber-golang/skills/golang-samber-ro) | samber-golang | Reactive streams and event-driven programming in Golang using samber/ro — ReactiveX implementation with 150+ type-safe operators, cold/hot observables, 5 subject types (Publish, Behavior, Replay, Async, Unicast), declarative pipelines via Pipe, 40+ plugins (HTTP, cron, fsnotify, JSON, logging), automatic backpressure, error propagation, and Go context integration. Apply when using or adopting samber/ro, when the codebase imports github.com/samber/ro, or when building asynchronous event-driven pipelines, real-time data processing, streams, or reactive architectures in Go. Not for finite slice transforms (→ See `golang-samber-lo` skill). |
| [golang-samber-slog](content/samber-golang/skills/golang-samber-slog) | samber-golang | Structured logging extensions for Golang using samber/slog-**** packages — multi-handler pipelines (slog-multi), log sampling (slog-sampling), attribute formatting (slog-formatter), HTTP middleware (slog-fiber, slog-gin, slog-chi, slog-echo), and backend routing (slog-datadog, slog-sentry, slog-loki, slog-syslog, slog-logstash, slog-graylog...). Apply when using or adopting slog, or when the codebase already imports any github.com/samber/slog-* package. |
| [golang-security](content/samber-golang/skills/golang-security) | samber-golang | Security best practices and vulnerability prevention for Golang. Covers injection (SQL, command, XSS), cryptography, filesystem safety, network security, cookies, secrets management, memory safety, and logging. Apply when writing, reviewing, or auditing Go code for security, or when working on any risky code involving crypto, I/O, secrets management, user input handling, or authentication. Includes configuration of security tools. |
| [golang-spf13-cobra](content/samber-golang/skills/golang-spf13-cobra) | samber-golang | Golang CLI command tree library using spf13/cobra — cobra.Command, RunE vs Run, PersistentPreRunE hook chain, Args validators (NoArgs, ExactArgs, MatchAll, custom), persistent vs local flags, command groups, ValidArgsFunction, RegisterFlagCompletionFunc, ShellCompDirective, usage/help template customization, man-page and markdown doc generation, and testing with SetArgs/SetOut/SetErr. Apply when using or adopting spf13/cobra, or when the codebase imports `github.com/spf13/cobra`. For configuration layering alongside cobra, see the `golang-spf13-viper` skill. For general CLI architecture (project layout, exit codes, signal handling, I/O patterns), see `golang-cli`. |
| [golang-spf13-viper](content/samber-golang/skills/golang-spf13-viper) | samber-golang | Golang configuration library using spf13/viper — layered precedence (flag > env > file > KV > default), BindPFlag/BindPFlags, SetEnvPrefix + SetEnvKeyReplacer + AutomaticEnv, ReadInConfig + ConfigFileNotFoundError, Unmarshal + mapstructure struct tags, Sub for sub-trees, WatchConfig + OnConfigChange for hot reload, viper.New() for test isolation, and remote KV integration. Apply when using or adopting spf13/viper, or when the codebase imports `github.com/spf13/viper`. For CLI command structure alongside viper, see the `golang-spf13-cobra` skill. For general CLI architecture, see `golang-cli`. |
| [golang-stay-updated](content/samber-golang/skills/golang-stay-updated) | samber-golang | Provides resources to stay updated with Golang news, communities and people to follow. Use when seeking Go learning resources, discovering new libraries, finding community channels, or keeping up with Go language changes and releases. |
| [golang-stretchr-testify](content/samber-golang/skills/golang-stretchr-testify) | samber-golang | Comprehensive guide to stretchr/testify for Golang testing. Covers assert, require, mock, and suite packages in depth. Use when writing tests with testify, creating mocks, setting up test suites, or choosing between assert and require. Covers testify assertions, mock expectations, argument matchers, call verification, suite lifecycle, and advanced patterns like Eventually, JSONEq, and custom matchers. Apply when the codebase imports github.com/stretchr/testify. |
| [golang-structs-interfaces](content/samber-golang/skills/golang-structs-interfaces) | samber-golang | Golang struct and interface design patterns — composition, embedding, type assertions, type switches, interface segregation, dependency injection via interfaces, struct field tags, and pointer vs value receivers. Use this skill when designing Go types, defining or implementing interfaces, embedding structs or interfaces, writing type assertions or type switches, adding struct field tags for JSON/YAML/DB serialization, or choosing between pointer and value receivers. Also use when the user asks about "accept interfaces, return structs", compile-time interface checks, or composing small interfaces into larger ones. |
| [golang-swagger](content/samber-golang/skills/golang-swagger) | samber-golang | Golang OpenAPI/Swagger documentation with swaggo/swag — annotation comments (@Summary, @Param, @Success, @Router, @Security), swag init code generation, framework integrations (gin, echo, fiber, chi, net/http), security definitions (Bearer/JWT, OAuth2, API key), and struct tags (swaggertype, enums, example, swaggerignore). Apply when adding or maintaining Swagger/OpenAPI docs in a Go project, or when the codebase imports github.com/swaggo/swag, github.com/swaggo/gin-swagger, github.com/swaggo/echo-swagger, github.com/swaggo/http-swagger, or github.com/swaggo/files. |
| [golang-testing](content/samber-golang/skills/golang-testing) | samber-golang | Production-ready Golang tests — table-driven tests, testify suites and mocks, parallel tests, fuzzing, fixtures, goroutine leak detection with goleak, snapshot testing, code coverage, integration tests, idiomatic test naming. Use when writing or reviewing Go tests, choosing a testing approach, setting up Go test CI, or debugging flaky/slow tests. For testify-specific APIs see `golang-stretchr-testify`; for measurement methodology see `golang-benchmark`. |
| [golang-troubleshooting](content/samber-golang/skills/golang-troubleshooting) | samber-golang | Troubleshoot Golang programs systematically - find and fix the root cause. Use when encountering bugs, crashes, deadlocks, or unexpected behavior in Go code. Covers debugging methodology, common Go pitfalls, test-driven debugging, pprof setup and capture, Delve debugger, race detection, GODEBUG tracing, and production debugging. Start here for any 'something is wrong' situation. Not for interpreting profiles or benchmarking (→ See `golang-benchmark` skill) or applying optimization patterns (→ See `golang-performance` skill). |
| [golang-uber-dig](content/samber-golang/skills/golang-uber-dig) | samber-golang | Implements dependency injection in Golang using uber-go/dig — reflection-based container, Provide/Invoke, dig.In/dig.Out parameter and result objects, named values, value groups, optional dependencies, scopes, and Decorate. Apply when using or adopting uber-go/dig, when the codebase imports `go.uber.org/dig`, or when wiring an application graph at startup. For higher-level lifecycle and modules, see `golang-uber-fx` skill. |
| [golang-uber-fx](content/samber-golang/skills/golang-uber-fx) | samber-golang | Golang application framework using uber-go/fx — fx.New, fx.Provide, fx.Invoke, fx.Module, fx.Lifecycle hooks, fx.Annotate (name/group/As), fx.Decorate, fx.Supply, fx.Replace, fx.WithLogger, and signal-aware Run(). Apply when using or adopting uber-go/fx, when the codebase imports `go.uber.org/fx`, or when wiring services with fx.New. For raw DI without lifecycle, see `golang-uber-dig` skill. |
| [grill-and-think](content/custom/skills/grill-and-think) | custom | 跨运行时设计流水线：拷问 → 深思 → 实现 → 审查。编排 grill-me/grill-with-docs、 think、check。宿主有原生计划批准 UI 时用该闸口且 think 只做审查；否则跑 think 全文并口头批准。用户说 grill-and-think、拷问深思、设计落地流水线时触发。 Not for Cursor Plan Mode (→ cursor-plan-pipeline). Not for live incident 排障 (→ hunt). |
| [grill-me](content/mattpocock/skills/grill-me) | mattpocock | A relentless interview to sharpen a plan or design. |
| [grill-with-docs](content/mattpocock/skills/grill-with-docs) | mattpocock | A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go. |
| [grilling](content/mattpocock/skills/grilling) | mattpocock | Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases. |
| [handoff](content/mattpocock/skills/handoff) | mattpocock | Compact the current conversation into a handoff document for another agent to pick up. |
| [health](content/tw93-waza/skills/health) | tw93-waza | Audits or prunes agent config, instruction drift, hooks or MCP, and AI maintainability. Use when Claude, Codex, or Pi setup looks wrong or guidance needs slimming. Not for application bugs or PR review. |
| [hierarchical-agents-md](content/custom/skills/hierarchical-agents-md) | custom | 层级 AGENTS.md / README.md：init、update、audit、reorganize、trim。 初始化 Agent 指令、代码改动后同步文档、检查文档漂移、重组仓库文档层级、精简规则与 Skills。 Not for 写业务代码或生成文档站点。 |
| [hono](content/hono/skills/hono) | hono | Use when building Hono web applications or when the user asks about Hono APIs, routing, middleware, JSX, validation, testing, or streaming. TRIGGER when code imports from 'hono' or 'hono/*', or user mentions Hono. Use Hono CLI to inspect and test the app. |
| [hono-jsx](content/hono/skills/hono-jsx) | hono | Use when building UI for a Hono app with hono/jsx — pages, layouts, forms, and interactive parts — server-rendered with jsxRenderer, developed and built with Vite, with client components via hono/jsx/dom. TRIGGER when tsconfig has jsxImportSource "hono/jsx", code imports 'hono/jsx', 'hono/jsx/dom', 'hono/jsx-renderer' or 'vite-ssr-components', or the user asks for a page, screen, layout, or form in a Hono project. Never reach for React. |
| [how](content/cursor-plugins/skills/how) | cursor-plugins | Use for "how does X work", code walkthroughs before changing something, and placement / ownership / layering questions ("where should this live", "which package owns this", "is this the right layer"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation. |
| [hunt](content/tw93-waza/skills/hunt) | tw93-waza | Finds root cause before any fix. Use when something errors, crashes, regresses, or used to work. Not for code review or new features. |
| [impeccable](content/impeccable/skills/impeccable) | impeccable | Use to design, redesign, critique, audit, polish or animate a frontend: websites, landing pages, dashboards, app UI, components, native iOS/Android screens, or a design system (DESIGN.md). |
| [implement](content/mattpocock/skills/implement) | mattpocock | Implement a piece of work based on a spec or set of tickets. |
| [implement-spec](content/mattpocock/skills/implement-spec) | mattpocock | Implement the result of /to-spec and /to-tickets in code. |
| [improve](content/shadcn-improve/skills/improve) | shadcn-improve | Survey any codebase as a senior advisor and produce prioritized, self-contained implementation plans for OTHER models/agents to execute. Strictly read-only on source code — never implements, fixes, or refactors anything itself. Use when asked to audit a codebase, find improvement opportunities (bugs, security, performance, test coverage, tech debt, migrations, DX), suggest features or where to take the project next (roadmap, product direction), or generate handoff plans for another agent to implement. |
| [improve-codebase-architecture](content/mattpocock/skills/improve-codebase-architecture) | mattpocock | Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. |
| [ip-check](content/majiayu-spellbook/skills/ip-check) | majiayu-spellbook | 检测一个 IP 或住宅/机房代理节点的质量——注册库、地理库一致性、ASN/org、风控信誉、黑名单、住宅真实性、BGP 宣告、目标服务(Grok/Claude/ChatGPT)解锁与延迟三角测量。判定该 IP 能否安全用于 AI 服务(避免被地理库误判到别国导致区域锁)。当用户说"查这个 IP"、"这个节点在哪"、"这个代理能用吗"、"IP 质量检测"、"验收住宅 IP"、"为什么被判定在 X 国"、"check ip"、给出 socks5 代理凭证问归属或解锁时使用。 |
| [kami](content/tw93-kami/skills/kami) | tw93-kami | Typeset professional documents with Kami templates: resumes, one-pagers, white papers, letters, portfolios, and slide decks. Use when asked to 做 PDF / 排版 / 简历 / 一页纸 / PPT / slides, or to create a Kami landing page. Not for auditing or restyling an existing product site. |
| [learn](content/tw93-waza/skills/learn) | tw93-waza | Runs a six-phase research workflow from source bundle to publish-ready output. Use when researching an unfamiliar domain or compiling materials into one reference. Not for quick lookups or single-file reads. |
| [lieflat-less-ai-tone](content/lieflat-less-ai-tone/skills/lieflat-less-ai-tone) | lieflat-less-ai-tone | 三层去 AI 味：脚本检测出分级报告（A 机械改/B 建议改/C 只报告/X 已否决/F 指纹）+ 语义层判读（同义重命名/衔接连环/结论冒号/同构三连），先向用户交付专业、可读的改前报告，列出本篇指标、研究显著性、原文例句和具体改法；收到用户回复后按白名单规则改写，复测并生成前后对比报告（默认 Markdown，与文稿同格式）。规则基于两轮实测（629 篇对照 + 270 对同题同事实配对复测）整理。适用于写作完成后的成稿清理。 |
| [playwright-cli](content/playwright-cli/skills/playwright-cli) | playwright-cli | Automate browser interactions, test web pages and work with Playwright tests. |
| [pr](content/mattpocock/skills/pr) | mattpocock | Use when writing a PR body. |
| [principle-attack-the-premise](content/cursor-plugins/skills/principle-attack-the-premise) | cursor-plugins | Apply when two or more fixes that share one premise have failed the same gate. Write the premise down and test it directly before you write another fix that assumes it. |
| [principle-boundary-discipline](content/cursor-plugins/skills/principle-boundary-discipline) | cursor-plugins | Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions. |
| [principle-build-the-lever](content/cursor-plugins/skills/principle-build-the-lever) | cursor-plugins | Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun. |
| [principle-encode-lessons-in-structure](content/cursor-plugins/skills/principle-encode-lessons-in-structure) | cursor-plugins | Apply when you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, metadata flag, runtime check, or script instead of more text. |
| [principle-exhaust-the-design-space](content/cursor-plugins/skills/principle-exhaust-the-design-space) | cursor-plugins | Apply when facing a novel UI interaction or architectural decision with no precedent in the codebase. Build 2-3 competing prototypes and compare side by side before committing. |
| [principle-experience-first](content/cursor-plugins/skills/principle-experience-first) | cursor-plugins | Apply when product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over more rough ones. |
| [principle-explain-the-number](content/cursor-plugins/skills/principle-explain-the-number) | cursor-plugins | Apply before you measure, and before you trust, report, or act on a number you measured: a speedup, a regression, a throughput, a latency, or an eval result. Find what limits it, and rule out that it measured something other than the work you think. |
| [principle-fix-root-causes](content/cursor-plugins/skills/principle-fix-root-causes) | cursor-plugins | Apply when debugging. Trace each symptom back to the first place the system went wrong and fix it there. A guard is a fix only when the state it handles is legitimate. |
| [principle-foundational-thinking](content/cursor-plugins/skills/principle-foundational-thinking) | cursor-plugins | Apply before writing logic: choosing core types and data structures, sequencing scaffold-vs-feature work, asking what concurrent actors share. Get the data structures right so downstream code becomes obvious. |
| [principle-guard-the-context-window](content/cursor-plugins/skills/principle-guard-the-context-window) | cursor-plugins | Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads. |
| [principle-laziness-protocol](content/cursor-plugins/skills/principle-laziness-protocol) | cursor-plugins | Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem. |
| [principle-make-operations-idempotent](content/cursor-plugins/skills/principle-make-operations-idempotent) | cursor-plugins | Apply when designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state regardless of partial prior runs. |
| [principle-migrate-callers-then-delete-legacy-apis](content/cursor-plugins/skills/principle-migrate-callers-then-delete-legacy-apis) | cursor-plugins | Apply when introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserving compatibility layers. |
| [principle-minimize-reader-load](content/cursor-plugins/skills/principle-minimize-reader-load) | cursor-plugins | Apply when reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope. |
| [principle-model-the-domain](content/cursor-plugins/skills/principle-model-the-domain) | cursor-plugins | Apply when writing stateful logic, or when code branches a lot or repeats a shape assumption across files. |
| [principle-never-block-on-the-human](content/cursor-plugins/skills/principle-never-block-on-the-human) | cursor-plugins | Apply when tempted to ask 'should I do X?' on reversible work. |
| [principle-outcome-oriented-execution](content/cursor-plugins/skills/principle-outcome-oriented-execution) | cursor-plugins | Apply during planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediate states with throwaway compatibility code. |
| [principle-prove-it-works](content/cursor-plugins/skills/principle-prove-it-works) | cursor-plugins | Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.' |
| [principle-redesign-from-first-principles](content/cursor-plugins/skills/principle-redesign-from-first-principles) | cursor-plugins | Apply when integrating a new requirement into an existing design. |
| [principle-separate-before-serializing-shared-state](content/cursor-plugins/skills/principle-separate-before-serializing-shared-state) | cursor-plugins | Apply when concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant. |
| [principle-sequence-verifiable-units](content/cursor-plugins/skills/principle-sequence-verifiable-units) | cursor-plugins | Apply to multi-step work (sweeps, migrations, runs of similar edits) and to how you stack commits and PRs. Break work into small units that each end in a verifiable state, check each before the next, and order delivery so the sequence proves itself to a reviewer. |
| [principle-subtract-before-you-add](content/cursor-plugins/skills/principle-subtract-before-you-add) | cursor-plugins | Apply when sequencing an addition, refactor, or rewrite. Remove dead code, redundant validators, and stub references first, then build on the simpler base. |
| [principle-test-behavior-not-implementation](content/cursor-plugins/skills/principle-test-behavior-not-implementation) | cursor-plugins | Apply when you write, change, or keep a test. Assert what the code's users can observe, so that the test fails when that behavior breaks and keeps passing when only the internals change. |
| [principle-type-system-discipline](content/cursor-plugins/skills/principle-type-system-discipline) | cursor-plugins | Apply when designing types, reviewing a function signature, or writing code in any statically-typed language. Make illegal states unrepresentable, brand semantic primitives, parse external data at boundaries, exhaust variants, derive from authoritative schemas. |
| [prototype](content/mattpocock/skills/prototype) | mattpocock | Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like. |
| [pstack-tdd](content/cursor-plugins/skills/pstack-tdd) | cursor-plugins | Use only when the user explicitly asks for TDD, a failing test, or a regression test, OR when the bug has an obvious cheap local test target. Skip when the test path is unclear, expensive, integration-heavy, or not requested. |
| [react-best-practices](content/vercel-agent/skills/react-best-practices) | vercel-agent | React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements. |
| [read](content/tw93-waza/skills/read) | tw93-waza | Fetches URLs and PDFs, then summarizes or returns clean Markdown; can also search the web through DeepSeek when built-in search is thin. Use when asked to read, fetch, quote, cite, convert, or save a URL or PDF. Not for local text files already in the repo. |
| [research](content/mattpocock/skills/research) | mattpocock | Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent. |
| [retro](content/mattpocock/skills/retro) | mattpocock | Conduct a retrospective on a coding session. |
| [setup-matt-pocock-skills](content/mattpocock/skills/setup-matt-pocock-skills) | mattpocock | Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills. |
| [show-me](content/humanlayer/skills/show-me) | humanlayer | Help the user understand the current topic visually with concise diagrams, code-shape sketches, and focused HTML artifacts. |
| [show-me-your-work](content/cursor-plugins/skills/show-me-your-work) | cursor-plugins | Keep a reviewable decision trail for long-running or unattended work: a TSV log with one row per decision (what, why, evidence, result). Local by default; commit it when a reviewer needs the trail to trust the result. Use for /show-me-your-work, autonomous or multi-phase runs, or work a human reviews after stepping away. |
| [skill-creator](content/anthropics/skills/skill-creator) | anthropics | Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy. |
| [skill-evolution](content/custom/skills/skill-evolution) | custom | 审计、改造、验证并持续改进现有 Agent Skill：工作地图、验收契约、可靠工具、 回归测试与基于证据的反馈闭环。用户要求改进/改造/审计某个 Skill、检查 SKILL.md 或其脚本、把反复纠正沉淀为规则或测试、或建立 Skill 长期维护流程 时使用。Not for 从零创建或跑 eval/benchmark（→ skill-creator）。 Not for 日常执行目标 Skill 本身的任务。 |
| [steelman](content/custom/skills/steelman) | custom | 双向钢人论证（steelman）：先把支持和反对当前选项的论证都强化到最强再裁决， 用于重要决定，对抗谄媚。用户点名钢人/steelman/双向钢人论证，或明确要求 唱反调、压力测试、论证、帮我想清楚一个决定时使用（含工程 A vs B）。 日常小决定直接答。方案与架构用 think；抽需求用 grilling。 不要仅因「纠结/拿不准」就触发。 |
| [tanstack-integration](content/tanstack-agent/skills/tanstack-integration) | tanstack-agent | Best practices for integrating TanStack Query with TanStack Router and TanStack Start. Patterns for full-stack data flow, SSR, and caching coordination. |
| [tanstack-query](content/tanstack-agent/skills/tanstack-query) | tanstack-agent | TanStack Query (React Query) best practices for data fetching, caching, mutations, and server state management. Activate when building data-driven React applications with server state. |
| [tanstack-router](content/tanstack-agent/skills/tanstack-router) | tanstack-agent | TanStack Router best practices for type-safe routing, data loading, search params, and navigation. Activate when building React applications with complex routing needs. |
| [tanstack-start](content/tanstack-agent/skills/tanstack-start) | tanstack-agent | TanStack Start best practices for full-stack React applications. Server functions, middleware, SSR, authentication, and deployment patterns. Activate when building full-stack apps with TanStack Start. |
| [tdd](content/mattpocock/skills/tdd) | mattpocock | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests. |
| [teach](content/mattpocock/skills/teach) | mattpocock | Teach the user a new skill or concept, within this workspace. |
| [technical-writing](content/cursor-plugins/skills/technical-writing) | cursor-plugins | Layered technical-writing standard: Diátaxis structure, Google developer style sentences, STE instruction rules, Global English syntax. Use for /technical-writing or when writing or reviewing docs, RFCs, readmes, PR descriptions, or commit messages. |
| [technical-writing-zh](content/custom/skills/technical-writing-zh) | custom | 中文写作补充：输出为中文时，先加载 unslop 与 technical-writing，再套中文词表、 标点、混排空格与人称。用户说 technical-writing-zh、中文写作、中文润色、 中文技术文档时触发。列出的 skill 缺失则停下并报告缺哪个。 Not for English output (→ unslop + technical-writing). Not for 纯代码生成、数据查询、非写作任务. |
| [thermo-nuclear-code-quality-review](content/cursor-plugins/skills/thermo-nuclear-code-quality-review) | cursor-plugins | Run an extremely strict maintainability review for abstraction quality, giant files, and spaghetti-condition growth. Use for a thermo-nuclear code quality review, thermonuclear review, deep code quality audit, or especially harsh maintainability review. |
| [thermo-nuclear-review](content/cursor-plugins/skills/thermo-nuclear-review) | cursor-plugins | Comprehensive security and correctness audit of a branch's changes. Use for thermo nuclear, thermonuclear, or deep review requests, or branch/PR diff audits focused on bugs, breaking changes, security issues, devex regressions, and feature-gate leaks. |
| [thermos](content/cursor-plugins/skills/thermos) | cursor-plugins | Launch both thermo-nuclear review subagents in parallel, then synthesize their findings. Use for thermos, double thermo review, or combined bug/security and code-quality branch audits. |
| [think](content/tw93-waza/skills/think) | tw93-waza | Turns rough ideas into approved, decision-complete plans before coding. Use when planning architecture, judging whether to build, or writing a handoff. Not for bug fixes or small edits. |
| [to-questionnaire](content/mattpocock/skills/to-questionnaire) | mattpocock | Turn a decision you can't fully answer into a questionnaire for someone else to fill in. |
| [to-spec](content/mattpocock/skills/to-spec) | mattpocock | Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed. |
| [to-tickets](content/mattpocock/skills/to-tickets) | mattpocock | Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker). |
| [triage](content/mattpocock/skills/triage) | mattpocock | Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs. |
| [typescript-best-practices](content/cursor-plugins/skills/typescript-best-practices) | cursor-plugins | TypeScript best practices. Use when reading or editing any .ts or .tsx file. |
| [ui](content/tw93-waza/skills/ui) | tw93-waza | Produces distinctive production UI and screenshot-grounded visual polish. Use when building or restyling pages, components, or typography. Not for backend logic or data pipelines. |
| [unocss](content/antfu/skills/unocss) | antfu | UnoCSS instant atomic CSS engine, superset of Tailwind CSS. Use when configuring UnoCSS, writing utility rules, shortcuts, or working with presets like Wind, Icons, Attributify. |
| [unslop](content/cursor-plugins/skills/unslop) | cursor-plugins | Cut AI tells from any writing. |
| [vite](content/antfu/skills/vite) | antfu | Vite build tool configuration, plugin API, SSR, and Vite 8 Rolldown migration. Use when working with Vite projects, vite.config.ts, Vite plugins, or building libraries/SSR apps with Vite. |
| [vitest](content/antfu/skills/vitest) | antfu | Vitest fast unit testing framework powered by Vite with Jest-compatible API. Use when writing tests, mocking, configuring coverage, or working with test filtering and fixtures. |
| [vue-best-practices](content/vuejs-ai/skills/vue-best-practices) | vuejs-ai | MUST be used for Vue.js tasks. Strongly recommends Composition API with `<script setup>` and TypeScript as the standard approach. Covers Vue 3, SSR, Volar, vue-tsc. Load for any Vue, .vue files, Vue Router, Pinia, or Vite with Vue work. ALWAYS use Composition API unless the project explicitly requires Options API. |
| [vue-debug-guides](content/vuejs-ai/skills/vue-debug-guides) | vuejs-ai | Vue 3 debugging and error handling for runtime errors, warnings, async failures, and SSR/hydration issues. Use when diagnosing or fixing Vue issues. |
| [vue-jsx-best-practices](content/vuejs-ai/skills/vue-jsx-best-practices) | vuejs-ai | JSX syntax in Vue (e.g., class vs className, JSX plugin config). |
| [vue-options-api-best-practices](content/vuejs-ai/skills/vue-options-api-best-practices) | vuejs-ai | Vue 3 Options API style (data(), methods, this context). Each reference shows Options API solution only. |
| [vue-pinia-best-practices](content/vuejs-ai/skills/vue-pinia-best-practices) | vuejs-ai | Pinia stores, state management patterns, store setup, and reactivity with stores. |
| [vue-router-best-practices](content/vuejs-ai/skills/vue-router-best-practices) | vuejs-ai | Vue Router 4 patterns, navigation guards, route params, and route-component lifecycle interactions. |
| [vue-testing-best-practices](content/vuejs-ai/skills/vue-testing-best-practices) | vuejs-ai | Use for Vue.js testing. Covers Vitest, Vue Test Utils, component testing, mocking, testing patterns, and Playwright for E2E testing. |
| [vueuse-functions](content/vueuse/skills/vueuse-functions) | vueuse | Apply VueUse composables where appropriate to build concise, maintainable Vue.js / Nuxt features. |
| [wait-what](content/mattpocock/skills/wait-what) | mattpocock | Stop. That last message did not land: re-pitch it. |
| [wayfinder](content/mattpocock/skills/wayfinder) | mattpocock | Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear. |
| [web-code-style](content/custom/skills/web-code-style) | custom | Web 全栈（React 前端与 Node 服务端）的命名约定与代码风格：标识符、文件、组件/Hook/props 命名，控制流、函数设计、间接层、JSX 复杂度与注释。写或审 Web 代码时使用， 即使用户没有明说「命名」或「风格」。 Not for 渲染性能与 hooks 规则（→ react-best-practices）、类型建模（→ typescript-best-practices）、 Vue SFC（→ vue-* skills）、formatter/linter 已覆盖的机械规则。 |
| [web-css-guidelines](content/custom/skills/web-css-guidelines) | custom | CSS / Tailwind v4 写法与排障指导（已剔 IE；每条规则附 Tailwind v4 写法）。写、审、排障、 重构 CSS 或 Tailwind 工具类时用——布局/居中/宽高、flex/grid、sticky、z-index、显隐过渡、 行高/截断、变量与深色、响应式/clamp、毛玻璃/mask/渐变、滚动性能、样式不生效，即使没有明说。 Not for 类名与标识符命名（→ web-code-style）。 |
| [web-design-guidelines](content/vercel-agent/skills/web-design-guidelines) | vercel-agent | Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices". |
| [week-retro](content/custom/skills/week-retro) | custom | 跨运行时周回顾与 workflow learning loop：从本周真实会话与计划提取证据，按 Evidence → Friction/Success → Root Cause → Candidate → Promote/Reject → Eval 闭环分析；区分可跨项目复用的流水线约束与不可提升的项目特例；审查 Skill Selection vs Execution。只报告与建议，不自动改全局文件。用于 week-retro、 周回顾、优化 workflow、Skill 路由审查、上下文卫生检查。Not for weekly diary. Not for live incident 排障 (→ hunt). |
| [why](content/cursor-plugins/skills/why) | cursor-plugins | Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, postmortems, or data-backed thresholds. Returns a cited read on decisions and tradeoffs. Use how for runtime behavior. |
| [wizard](content/mattpocock/skills/wizard) | mattpocock | Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself. |
| [write](content/tw93-waza/skills/write) | tw93-waza | Rewrites and polishes Chinese or English prose, technical instructions, and product copy. Use when drafting, editing, localizing, or cutting AI tone. Not for code comments or commit messages. |
| [writing-for-agents](content/mattpocock/skills/writing-for-agents) | mattpocock | Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md. |
<!-- skills:end -->

## Agents

Synced Cursor plugin subagents at `content/{repoKey}/agents/{target}.md`. These are not installed by `npx skills add`. Copy the `.md` files into `~/.cursor/agents/` (see [Installation](#installation)).

<!-- agents:start -->
| Agent | Vendor | Description |
| --- | --- | --- |
| [thermo-nuclear-code-quality-review-subagent](content/cursor-plugins/agents/thermo-nuclear-code-quality-review-subagent.md) | cursor-plugins | Thermo-nuclear code quality audit (maintainability, structure, 1k-line rule, spaghetti, code-judo). Invoked via Task after a parent gathers diff and file contents. Loads rubric from the thermo-nuclear-code-quality-review skill in the Thermos plugin. |
| [thermo-nuclear-review-subagent](content/cursor-plugins/agents/thermo-nuclear-review-subagent.md) | cursor-plugins | Thermo-nuclear branch audit (bugs, breaking changes, security, devex, feature-flag leaks) scoped to the diff. Invoked via Task after a parent gathers diff and file contents. Loads rubric from the thermo-nuclear-review skill in the Thermos plugin. |
| [impeccable-asset-producer](content/impeccable/agents/impeccable-asset-producer.md) | impeccable | Produces clean reusable raster assets from approved Impeccable mock references without redesigning the direction. |
| [impeccable-documenter](content/impeccable/agents/impeccable-documenter.md) | impeccable | Records DESIGN.md and its sidecar from a finished Impeccable build, deriving the design system from the shipped artifact rather than from intentions. |
| [impeccable-finish-reviewer](content/impeccable/agents/impeccable-finish-reviewer.md) | impeccable | Reviews a finished Impeccable build against its direction contract, the approved comp, and the chosen world's quality bar, returning an ordered list of material fixes. |
| [impeccable-manual-edit-applier](content/impeccable/agents/impeccable-manual-edit-applier.md) | impeccable | Applies leased Impeccable live manual copy-edit batches to source and returns canonical Apply results. |
| [impeccable-motion-reviewer](content/impeccable/agents/impeccable-motion-reviewer.md) | impeccable | Reviews captured Impeccable motion for continuity, timing, craft, and reduced-motion behavior, returning evidence-cited material fixes. |
<!-- agents:end -->

## How It Works

Direct scripts manage upstream skill repositories (see `src/commands/`):

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
pnpm readme    # refresh README generated blocks (packs + skills/agents tables)
pnpm site:preview

# Lint, format, tests
pnpm lint
pnpm fmt
pnpm test

# Publish (dev -> main snapshot + tag, then Actions deploys Pages)
pnpm release:dry
pnpm release
```

By default upstream checkouts live in `upstream/`. Set `SKILLS_UPSTREAM_DIR` to share one copy of the checkouts across git worktrees:

```bash
export SKILLS_UPSTREAM_DIR=~/.cache/rockcookies-skills/upstream
```

### Branch model

Two branches: `dev` is the full development tree (this tree — `src/`, `site/`, tooling), while `main` is the published install surface, snapshot-published from `dev` via `pnpm release`. The whitelist is `content/` + `skills.sh.json` + `README.md` + `LICENSE` + `.github/workflows/deploy.yml`; each release is a single fast-forward commit on `main` carrying a `Source-Commit:` trailer (tagged `vYYYY.MM.DD`). `deploy.yml` reads the trailer, checks out the matching `dev` source, verifies the published tree matches it, runs the gates and deploys GitHub Pages. Never force-push `main` (the skills CLI lockfile pulls by the install-time commit SHA); roll content back with `pnpm release --source=<old dev sha>`.

## Credits

Project structure and workflow inspired by [antfu/skills](https://github.com/antfu/skills).

## License

MIT
