# RockCookies' Skills

A curated collection of [Agent Skills](https://agentskills.io/home) for full-stack Vue/TypeScript development, with vendored skills synced from upstream repositories via a CLI tool.

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
| [evo-archiving](skills/evo-archiving) | Archive changes after implementation by updating architecture docs and ledger for AI context continuity |
| [evo-brainstorming](skills/evo-brainstorming) | Explore user intent, requirements, and design before any creative work |
| [evo-executing-plans](skills/evo-executing-plans) | Execute a written implementation plan with batch execution and review checkpoints |
| [evo-writing-plans](skills/evo-writing-plans) | Write comprehensive implementation plans for multi-step tasks before touching code |
| [git-master](skills/git-master) | Git expert for atomic commits, rebasing, and history management with style detection |
| [node-dev](skills/node-dev) | Modern JavaScript/TypeScript runtime development conventions and tooling |

### Vendored Skills

Synced from external repositories that maintain their own skills.

| Skill | Description | Source |
|-------|-------------|--------|
| [tsdown](skills/tsdown) (Official) | tsdown - TypeScript library bundler powered by Rolldown | [rolldown/tsdown](https://github.com/rolldown/tsdown) |
| [turborepo](skills/turborepo) (Official) | Turborepo - high-performance build system for monorepos | [vercel/turborepo](https://github.com/vercel/turborepo) |
| [vueuse-functions](skills/vueuse-functions) (Official) | VueUse - 200+ Vue composition utilities | [vueuse/skills](https://github.com/vueuse/skills) |
| [vue-best-practices](skills/vue-best-practices) | Vue 3 + TypeScript best practices | [vuejs-ai/skills](https://github.com/vuejs-ai/skills) |
| [vue-router-best-practices](skills/vue-router-best-practices) | Vue Router best practices | [vuejs-ai/skills](https://github.com/vuejs-ai/skills) |
| [vue-testing-best-practices](skills/vue-testing-best-practices) | Vue testing best practices | [vuejs-ai/skills](https://github.com/vuejs-ai/skills) |
| [find-skills](skills/find-skills) | Discover and install agent skills | [vercel-labs/skills](https://github.com/vercel-labs/skills) |
| [skill-creator](skills/skill-creator) | Create, modify, and benchmark agent skills | [anthropics/skills](https://github.com/anthropics/skills) |
| [frontend-design](skills/frontend-design) | Production-grade frontend interfaces with high design quality | [anthropics/skills](https://github.com/anthropics/skills) |
| [web-design-guidelines](skills/web-design-guidelines) | Web Interface Guidelines compliance and UX audits | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) |

## How It Works

This project uses a CLI tool (`pnpm start`) to manage vendored skill repositories:

1. **`pnpm start vendor`** - Clone/update external git repositories into `vendor/`
2. **`pnpm start sync`** - Copy skill files from vendor repos into `skills/`
3. **`pnpm start cleanup`** - Remove orphaned vendor repositories

Repository sources and skill mappings are configured in [meta.ts](meta.ts).

## Development

```bash
# Install dependencies
pnpm install

# Clone vendor repositories
pnpm start vendor

# Sync skills from vendors
pnpm start sync

# Clean up orphaned vendors
pnpm start cleanup
```

## Credits

Project structure and workflow inspired by [antfu/skills](https://github.com/antfu/skills).

## License

MIT
