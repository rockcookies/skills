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
| [git-master](skills/git-master) | Git expert for atomic commits, rebasing, and history management with style detection |
| [node-dev](skills/node-dev) | Modern JavaScript/TypeScript runtime development conventions and tooling |

### Upstream Skills

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
| [use-modern-go](skills/use-modern-go) | Modern Go syntax guidelines based on project's Go version | [JetBrains/go-modern-guidelines](https://github.com/JetBrains/go-modern-guidelines) |

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
