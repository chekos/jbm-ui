# Agent contract

Every gallery item has one typed contract in `contracts/items/<name>.ts`. It is the source of truth for what agents read: `/catalog.json`, `/llms.txt`, the gallery cards, and the props and stage sections of `/c/<name>`. The schema is `contracts/schema.ts`; start new items from `contracts/template.ts`.

## Fields

| Field | Authored | Meaning |
| --- | --- | --- |
| `name` | yes | Registry item name; equals the file name. |
| `entry` | yes | `component` has a `/c/<name>` page. `bundle` re-exports other items and has no QA page: its catalog `page` is `null`, `pageReason` says which pages to open, and `/c/<name>` is a noindex notice that links them (`ui-bits`). `doc` is a gallery documentation entry without a registry item (`install` names the item that ships its code; `surface-depth` → `tokens`). |
| `title`, `description` | yes | Written back into `registry.json` by `pnpm contracts:build`. `title` is the primary export when the first `api` entry is a component (`ToolCaddy`, `UiButton`, `ActionLink`), otherwise the name in PascalCase (`Tokens`, `MotionHooks`, `UiBits`); validation enforces it. |
| `category` | yes | Behaviour-based category, one of the list in `components/gallery/categories.ts` (UI, UI Bits, Layout, Motion, Interactive, Foundations); written back into `registry.json` `categories`. Motion is for items that play a Remotion timeline (Player previews with frames and replay); Interactive is for pieces that respond to the end reader at runtime (scroll, pointer, click, hover). A piece whose state comes only from props, such as a progress or position value its host drives, is not Interactive: it goes with what it depicts (UI for text and page pieces, UI Bits for paper illustrations). Each category's one-line definition (`categoryDefinitions`) prints under its heading on the gallery index, in `/llms.txt` and `/llms-full.txt`, and in `/catalog.json`. A category's pager then walks one kind of bench. |
| `capabilities` | yes | What the preview offers: `controls`, `scroll`, `replay`, `portrait`, `player` (previews in a Remotion Player; the gallery routes the preview from this tag). `portrait` (landscape and vertical stage toggle) requires `player`. Search for "remotion" matches items whose `needsRemotion` is true, not the `player` tag. |
| `api` | descriptions only | Every runtime export of the item's files, or listed in `omit` with a reason. Components list `props`; hooks and functions list `params` and `returns`; constants and types need a `summary`; bundles use `re-export` with `from`. Prop and parameter types, required flags, and defaults are extracted from source; a JSDoc comment on a prop's declaration can stand in for its description. |
| `stage` | yes | `declared` with `landscape` and `vertical` boxes (`width` in stage px, `"auto"`, or `"fill"`; `height` in stage px) and a `basis`, or `fluid` / `n/a` with a `reason`. |
| `examples` | yes | At least one. `code` uses real `@/jbm/…` imports, declares any placeholder it uses (`declare const timings: …`), and calls hooks only inside a component; the first is the card and page snippet. Imports from items the install does not bring in carry `// install @jbm/<item> separately`. |
| `qa` | yes | What to inspect before accepting a change. |
| `cues` | optional | `player` items only: `[{ label, at, note? }]`, up to four timeline moments worth inspecting, in order. `at` is seconds on the gallery preview timeline (read the demo timings in `components/gallery/timing.ts`); `label` says what happens in at most 24 characters ("Bug appears", "Fix lands"). The QA strip shows Begin, each cue, and End (rows of three) instead of a fixed Middle frame. Validation rejects a cue that does not land strictly between the first and last preview frame, and `scripts/strip-cues.test.mjs` ties each cue to its demo's cue sheet. Generated entries add `frame` (zero-based, 30 fps). |
| `docs` | optional | `[{ title, url }]`: guides that genuinely cover the item, not passing mentions. URLs are absolute on the production origin: `https://jbm-ui.bns.studio/docs/<slug>.md` for `docs/<slug>.md`, which must exist. Agent-facing outputs stay on this site, so links into the repository are rejected. |
| `schemas` | optional | `[{ title, url }]`: machine-readable schemas for the item's input data, served by the site (`https://jbm-ui.bns.studio/schemas/<name>.json`). `scene-spec` links the scene-spec JSON Schema. |

Derived at build time from `registry.json`: `needsRemotion` (the item or anything it installs depends on `remotion`), `registryDependencies`, `installName`, `files`, `sourcePath`, `page` (`/c/<name>`, or `null` for a bundle, whose `pageReason` names the pages to open), and `registryItem`.

## Agent outputs stay on this site

The source repository is public, and human pages link it ("Source ↗", built with `repoSourceUrl` in `lib/site.ts`), but nothing agent-facing does, so an agent never needs GitHub access. Agents read source code from the registry item JSON (`/r/<name>.json`, `files[].content`) and guides from `/docs/<slug>.md`, which the site serves as `text/markdown`. `pnpm contracts:build` copies every guide a contract links, plus this file and `docs/scene-spec.md`, into `contracts/generated/docs.json` for `app/docs/[file]/route.ts`. `node --test scripts/agent-catalog.test.mjs` fails if any agent-facing output (catalog, per-item Markdown and JSON, `llms*.txt`, published guides, the scene-spec schema, registry JSON) contains a repository URL, or if a `/docs/` link has no published guide.

Unknown per-item endpoints answer in their own format (`proxy.ts`, reading `contracts/generated/routes.json`): `/catalog/<name>.md` returns a Markdown 404 and `/catalog/<name>.json` a JSON 404 (`{ error, didYouMean, index: "/llms.txt" }`), both naming the closest items; `didYouMean` (and `suggestion`) is `null` when no name is similar. All 404s, including `/docs/<slug>.md` and `/c/<name>`, share `nearestItemNames` in `lib/agent-routes.ts` and its documented `SUGGESTION_THRESHOLD`. A different casing of a known name redirects (`/catalog/Folder.md` → `/catalog/folder.md`).

## Add or change an item

1. Copy `contracts/template.ts` to `contracts/items/<name>.ts` and fill it in. Read the component source for props and defaults, and `docs/scene-spec.md` for stage sizes.
2. Run `pnpm contracts:validate <name>` until it passes. It checks required fields, props against source, example imports, and stage sizes, without writing files.
3. Run `pnpm contracts:build`, then `pnpm registry:build`, and commit `contracts/generated/`, `public/schemas/`, `registry.json`, and `public/r/`.

`pnpm contracts:status` lists items that still need a contract. Contracts are the only source of gallery metadata: an item without one fails `pnpm contracts:check` and the full contract test.

## How generation works

`scripts/lib/contracts.mjs` evaluates each contract (they may only use `import type`), extracts prop facts from `registry/jbm/` with the TypeScript compiler, validates, and emits:

- `contracts/generated/catalog.json`: full entries for server code (`lib/contracts.ts` → `lib/agent-catalog.ts` → `/llms.txt`, `/llms-full.txt`, `/catalog.json`, `/catalog/<name>.md`, `/catalog/<name>.json`, `/c/<name>`). Contract fields beyond the core schema pass through to the catalog and per-item Markdown unchanged.
- `contracts/generated/gallery.json`: the lean card fields that `components/gallery/item-meta.ts` ships to the browser.
- `contracts/generated/docs.json`: the published guides (`lib/docs.ts` → `/docs/<slug>.md`, and the `docs` list in `/catalog.json` and `/llms.txt`).
- `public/schemas/scene-spec.json`: the scene-spec JSON Schema (draft 2020-12), generated from the types and JSDoc in `registry/jbm/motion/spec.ts` by `scripts/lib/scene-spec-schema.mjs` and served statically at `/schemas/scene-spec.json`.

`docs` and `schemas` appear in `contracts/generated/catalog.json` entries only when a contract lists them. Every URL must be absolute http(s); links to files this site serves must point at files that exist.

`pnpm registry:check` runs `pnpm contracts:check` and fails when the generated files, the schema, or `registry.json` are stale. `node --test scripts/scene-spec-schema.test.mjs` also validates the scene-spec guide's YAML examples against the schema and the compiler. `node --test scripts/contracts.test.mjs` validates every contract; set `CONTRACT_ITEMS="a b"` to test a subset.
