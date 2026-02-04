# Project Architecture

> Auto-maintained by AI. Last updated: 2026-02-04

## Overview

A modular CLI tool for managing vendored skill repositories. The tool handles initialization, synchronization, and update checking of external git repositories that contain skill documentation.

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
├── skills/             # Synced skill documentation (version controlled)
├── vendor/             # Git repository checkouts (not version controlled)
└── meta.ts             # Configuration for repositories
```

## Components

### CLI Layer (`scripts/cli.ts`)
Thin orchestrator that parses arguments and delegates to command handlers. Uses `@clack/prompts` for interactive UI.

### Command Handlers (`src/cli-commands/`)
- `init.command.ts` - Initialize vendor repositories
- `sync.command.ts` - Sync vendor repositories and copy skills

### Services (`src/services/`)
- `GitService` - Wrapper around `simple-git` for git operations
- `VendorService` - Vendor repository management (clone, fetch, reset)
- `SyncService` - Handles skill synchronization from vendors

### Utils (`src/utils/`)
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
