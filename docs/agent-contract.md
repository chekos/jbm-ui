# Agent contract

Every gallery item has one typed contract in `contracts/items/<name>.ts`. It is the source of truth for what agents read: `/catalog.json`, `/llms.txt`, the gallery cards, and the props and stage sections of `/c/<name>`. The schema is `contracts/schema.ts`; start new items from `contracts/template.ts`.

## Fields

| Field | Authored | Meaning |
| --- | --- | --- |
| `name` | yes | Registry item name; equals the file name. |
| `entry` | yes | `component` has a `/c/<name>` page. `bundle` re-exports other items and has no page (`pageReason` says which pages to open; `ui-bits`). `doc` is a gallery documentation entry without a registry item (`install` names the item that ships its code; `surface-depth` → `tokens`). |
| `title`, `description` | yes | Written back into `registry.json` by `pnpm contracts:build`. |
| `category` | yes | Behaviour-based category, one of the list in `components/gallery/categories.ts`; written back into `registry.json` `categories`. |
| `capabilities` | yes | What the preview offers: `controls`, `scroll`, `replay`, `portrait`, `player` (previews in a Remotion Player; the gallery routes the preview from this tag). `portrait` (landscape and vertical stage toggle) requires `player`. Search for "remotion" matches items whose `needsRemotion` is true, not the `player` tag. |
| `api` | descriptions only | Every runtime export of the item's files, or listed in `omit` with a reason. Components list `props`; hooks and functions list `params` and `returns`; constants and types need a `summary`; bundles use `re-export` with `from`. Prop and parameter types, required flags, and defaults are extracted from source; a JSDoc comment on a prop's declaration can stand in for its description. |
| `stage` | yes | `declared` with `landscape` and `vertical` boxes (`width` in stage px, `"auto"`, or `"fill"`; `height` in stage px) and a `basis`, or `fluid` / `n/a` with a `reason`. |
| `examples` | yes | At least one. `code` uses real `@/jbm/…` imports; the first is the card and page snippet. Imports from items the install does not bring in carry `// install @jbm/<item> separately`. |
| `qa` | yes | What to inspect before accepting a change. |
| `docs` | optional | `[{ title, url }]`: guides that genuinely cover the item, not passing mentions. URLs are absolute; repository files use GitHub blob URLs on main (`https://github.com/chekos/jbm-ui/blob/main/docs/<guide>.md`) and must exist. |
| `schemas` | optional | `[{ title, url }]`: machine-readable schemas for the item's input data, served by the site (`https://jbm-ui.bns.studio/schemas/<name>.json`). `scene-spec` links the scene-spec JSON Schema. |

Derived at build time from `registry.json`: `needsRemotion` (the item or anything it installs depends on `remotion`), `registryDependencies`, `installName`, `files`, `sourcePath`, `page`, and `registryItem`.

## Add or change an item

1. Copy `contracts/template.ts` to `contracts/items/<name>.ts` and fill it in. Read the component source for props and defaults, and `docs/scene-spec.md` for stage sizes.
2. Run `pnpm contracts:validate <name>` until it passes. It checks required fields, props against source, example imports, and stage sizes, without writing files.
3. Run `pnpm contracts:build`, then `pnpm registry:build`, and commit `contracts/generated/`, `public/schemas/`, `registry.json`, and `public/r/`.

`pnpm contracts:status` lists items that still need a contract. Contracts are the only source of gallery metadata: an item without one fails `pnpm contracts:check` and the full contract test.

## How generation works

`scripts/lib/contracts.mjs` evaluates each contract (they may only use `import type`), extracts prop facts from `registry/jbm/` with the TypeScript compiler, validates, and emits:

- `contracts/generated/catalog.json`: full entries for server code (`lib/contracts.ts` → `/catalog.json`, `/llms.txt`, `/c/<name>`).
- `contracts/generated/gallery.json`: the lean card fields that `components/gallery/item-meta.ts` ships to the browser.
- `public/schemas/scene-spec.json`: the scene-spec JSON Schema (draft 2020-12), generated from the types and JSDoc in `registry/jbm/motion/spec.ts` by `scripts/lib/scene-spec-schema.mjs` and served statically at `/schemas/scene-spec.json`.

`docs` and `schemas` appear in `contracts/generated/catalog.json` entries only when a contract lists them. Every URL must be absolute http(s); links to this repository or to files this site serves must point at files that exist.

`pnpm registry:check` runs `pnpm contracts:check` and fails when the generated files, the schema, or `registry.json` are stale. `node --test scripts/scene-spec-schema.test.mjs` also validates the scene-spec guide's YAML examples against the schema and the compiler. `node --test scripts/contracts.test.mjs` validates every contract; set `CONTRACT_ITEMS="a b"` to test a subset.
