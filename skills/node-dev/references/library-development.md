---
name: library-development
description: Building and publishing TypeScript libraries with tsdown. Use when creating npm packages, configuring library bundling, or setting up package.json exports.
---

# Library Development

| Aspect | Choice |
|--------|--------|
| Bundler | tsdown |
| Output | Dual format (ESM + CJS) |
| DTS | Generated via tsdown |
| Exports | Auto-generated via tsdown |

## tsdown Configuration

Use tsdown with these options enabled:

```ts
// tsdown.config.ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
})
```

| Option | Value | Purpose |
|--------|-------|---------|
| `format` | `['esm', 'cjs']` | Dual format for maximum compatibility |
| `dts` | `true` | Generate `.d.ts` files |
| `exports` | `true` | Auto-update `exports` field in `package.json` |

### Multiple Entry Points

```ts
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/utils.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
})
```

The `exports: true` option auto-generates the `exports` field in `package.json` when running `tsdown`.

---

## package.json

Required fields for dual format library:

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsdown",
    "prepack": "pnpm build",
    "test": "vitest",
    "release": "bumpp -r"
  }
}
```

The `exports` field is managed by tsdown when `exports: true`. It will automatically generate proper conditional exports for both ESM and CJS consumers.

### prepack Script

For each public package, add `"prepack": "pnpm build"` to `scripts`. This ensures the package is automatically built before publishing (e.g., when running `npm publish` or `pnpm publish`). This prevents accidentally publishing stale or missing build artifacts.
