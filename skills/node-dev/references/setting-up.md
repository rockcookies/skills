---
name: setting-up
description: Project setup files including .gitignore, GitHub Actions workflows, and VS Code extensions. Use when initializing new projects or adding CI/editor config.
---

# Project Setup

## .gitignore

Create when `.gitignore` is not present:

```
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# cache
.cache
cache
.eslintcache

# build outputs
dist
.output
lib-cov
.next
.nuxt
out
build

# turbo
.turbo

# storybook
storybook-static

# logs
*.log
logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# environment files
.env
.env.local
.env.*.local

# misc
.DS_Store
.idea
*.pem
*.tgz
.wrangler
.claude/settings.local.json
```

## GitHub Actions

Add these workflows when setting up a new project. Skip if workflows already exist. All use [sxzz/workflows](https://github.com/sxzz/workflows) reusable workflows.

### Autofix Workflow

**`.github/workflows/autofix.yml`** - Auto-fix linting on PRs:

```yaml
name: autofix.ci

on: [pull_request]

jobs:
  autofix:
    uses: sxzz/workflows/.github/workflows/autofix.yml@v1
    permissions:
      contents: read
```

### Unit Test Workflow

**`.github/workflows/unit-test.yml`** - Run tests on push/PR:

```yaml
name: Unit Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions: {}

jobs:
  unit-test:
    uses: sxzz/workflows/.github/workflows/unit-test.yml@v1
```

### Release Workflow

**`.github/workflows/release.yml`** - Publish on tag (library projects only):

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    uses: sxzz/workflows/.github/workflows/release.yml@v1
    with:
      publish: true
    permissions:
      contents: write
      id-token: write
```
