# Project Architecture

> Auto-maintained by AI. Last updated: 2026-02-04

## Overview

A modular CLI tool for managing git submodules that contain skill documentation. The tool handles initialization, synchronization, update checking, and cleanup of submodules from both "sources" (documentation repositories) and "vendors" (upstream projects that vendored skills).

## Structure

```
skills/
├── scripts/
│   └── cli.ts          # CLI entry point (thin orchestrator)
├── src/
│   ├── cli-commands/   # CLI command handlers
│   ├── services/       # Business logic layer
│   ├── utils/          # Utility functions
│   ├── errors/         # Custom error classes
│   └── types.ts        # Shared TypeScript types
├── skills/             # Generated/vendored skill documentation
├── sources/            # Git submodules (source repos)
├── vendor/             # Git submodules (vendor repos)
└── meta.ts             # Configuration for submodules and vendors
```

## Components

### CLI Layer (`scripts/cli.ts`)
Thin orchestrator that parses arguments and delegates to command handlers. Uses `@clack/prompts` for interactive UI.

### Command Handlers (`src/cli-commands/`)
- `init.command.ts` - Initialize submodules and skills
- `sync.command.ts` - Sync submodules and copy vendor skills
- `check.command.ts` - Check for available updates
- `cleanup.command.ts` - Remove unused submodules and skills

### Services (`src/services/`)
- `GitService` - Wrapper around `simple-git` for git operations
- `SubmoduleService` - High-level submodule management operations
- `SyncService` - Handles skill synchronization from vendors

### Utils (`src/utils/`)
- `submodule.ts` - Submodule comparison utilities
- `project-builder.ts` - Builds project lists from config
- `error.ts` - Error handling utilities

## Patterns

### Service Layer Pattern
Business logic is encapsulated in service classes that are injected into command handlers. This enables testing and separation of concerns.

### Command Pattern
Each CLI command is a separate async function that receives dependencies as parameters.

### Type Safety
Shared types are defined in `src/types.ts` and used across the codebase.

## Dependencies

- `@clack/prompts` - Interactive CLI prompts
- `simple-git` - Git operations (replaces manual `execSync`)
- `tsx` - TypeScript execution
- `typescript` - Type checking
