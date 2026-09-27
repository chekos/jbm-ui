# jbm-ui

A personal component library for tacosdedatos work, distributed as a [shadcn registry](https://ui.shadcn.com/docs/registry). One set of tokens and components renders in the browser and in Remotion, so an explainer video and a web page share the same vocabulary.

The library exists because the narrated explainers (`design/projects/2026-09-18-recap-septiembre-video`, `2026-09-19-jev-explainer-video`) kept re-implementing the same dozen visual ideas per scene. The full inventory that drives this repo is the "Motion component inventory" doc; the pipeline that consumes it is documented in the design repo's `docs/`.

## Layout

```
registry.json            what the registry publishes (built to public/r/*.json by `pnpm registry:build`)
registry/jbm/lib/        tokens.ts — palette, fonts, radii, stage safe areas, cssVars
registry/jbm/ui/         pure React: no Remotion import, inline styles from tokens. Works on any page.
registry/jbm/motion/     Remotion-only: hooks, Scene, Pop/Stagger, Counter, ProbBar, CodeCard, Captions
app/                     Next.js gallery with searchable UI, motion, and foundation previews
```

## Rules

- Two colours: ink on cream, vermilion for one accent per composition. `accent2` only for annotations, `soft` only on dark surfaces.
- Type: Geist for words, Geist Mono for labels, code and numbers with units. Components read `--font-sans` / `--font-mono` when a host sets them and fall back to the family names `Geist` and `Geist Mono`; in Remotion, load them with `@remotion/google-fonts/Geist` and `@remotion/google-fonts/GeistMono` (see the multi-scene example in `docs/scene-spec.md`) or self-host them with `@remotion/fonts`.
- Styling is inline from `tokens.ts`, not Tailwind classes, so a component is one file with no build step in Remotion. `tokens.cssVars` exposes the palette as `--jbm-*` for Tailwind code that lives next to these.
- `ui/*` never imports `remotion`. Anything with an `at` prop or a time-dependent value belongs in `motion/*` and wraps a `ui/*` piece.
- Sizes are in stage pixels (1920×1080 landscape, 1080×1920 vertical). A component that must fit both takes `w` or a `row` flag rather than a second file.
- Safe areas: landscape content y 90–920, vertical y 100–1440; captions live below. Every block declares its height so a layout check can enforce this.

## Using it

Add the namespace to a project's `components.json`:

```json
"registries": { "@jbm": "https://<host>/r/{name}.json" }
```

then `npx shadcn add @jbm/stat-card`. Items pull their own dependencies (`@jbm/tokens`, `@jbm/card`, `remotion` for motion items).

## Developing

`pnpm dev` runs the preview site. `pnpm registry:build` regenerates `public/r/`. Add a component by writing it under `registry/jbm/`, registering it in `registry.json`, adding its preview under `components/gallery/`, and writing its agent contract in `contracts/items/<name>.ts` (category, capabilities, props, stage, examples; see `docs/agent-contract.md`).

The gallery includes all registry items, category filters, search across names, descriptions, categories, and tags, and namespace installation instructions. Each card shows its `npx shadcn@latest add @jbm/<name>` command with a Copy button and links its title to the item's `/c/<name>` QA page. For agents, `/llms.txt` is a short index (purpose, install once, endpoints, guides, one line per item tagged `· Remotion` or `· React`); `/llms-full.txt` (plain text) and `/catalog.json` list every item in full with its category, capabilities, Remotion requirement, registry dependencies, install command, source files with install targets and import paths, page, registry JSON, props, declared stage size, examples, QA notes, and related items. Each item also has `/catalog/<name>.md` and `/catalog/<name>.json`, with setup, files, and links to the guides (`docs`) and JSON Schemas (`schemas`) its contract lists. Start from `/llms.txt` and fetch one item; use `/llms-full.txt` or `/catalog.json` only when you need everything at once. `/schemas/scene-spec.json` is a JSON Schema (draft 2020-12) for scene-spec files, generated from `registry/jbm/motion/spec.ts` by `pnpm contracts:build`; validate parsed YAML against it before compiling (see `docs/scene-spec.md`). All are generated at build time from the per-item agent contracts in `contracts/items/` (see `docs/agent-contract.md`), the same source as the gallery; `<link rel="alternate">` tags on every page point to them, and each `/c/<name>` page also links its own Markdown and JSON, plus a Docs / Schema row when the contract lists guides or schemas. Agent-facing outputs stay on this site and never link the repository (human pages carry a Source ↗ link to GitHub): agents read code from the registry item JSON (`/r/<name>.json`, `files[].content`) and guides from `/docs/<slug>.md` (Markdown served by the site; see `docs/agent-contract.md`). Unknown addresses get a branded 404 with links for agents; unknown `/catalog/<name>.md` and `.json` return a 404 in the same format with the closest item names (or none when nothing is similar), and a different casing redirects to the item; `/docs/<slug>.md` and `/c/<name>` 404s use the same matcher. `/c/ui-bits` is a server-rendered, noindex page that explains the bundle and links to the items it re-exports. Motion examples use a lazily loaded Remotion Player with frameless previews, a heavy icon-only replay control that traces its arrow from tail to head with frame progress and unlocks on completion, and no autoplay or looping. Keep `remotion` and `@remotion/player` on the same exact version.

Run `pnpm lint`, `pnpm typecheck`, `pnpm registry:check`, `pnpm consumer:check`, `node --test scripts/*.test.mjs`, and `pnpm build` locally before opening a PR; the GitHub Actions `check` workflow runs the same steps. `registry:check` rebuilds the registry and fails if generated files differ from committed output. Vercel builds and deploys through the GitHub integration. Track changes in issues and link them from PRs.

Preview timing lives in `components/gallery/timing.ts`: demo anchors and content also determine Player duration and replay progress. Include the final interpolation frame, measure spring settling, and include caption fade-out; do not add an arbitrary hold after motion finishes. Static Scene previews have no replay control. Previews rest on their final frame (the finished state, e.g. Counter at 1024 and CodeCard fully typed), never on an arbitrary mid-animation frame.

Every gallery item also has a QA page at `/c/<name>`, statically generated from the item's agent contract. It shows a large preview, the add command, usage examples, links, the declared stage size, a props table, and QA checks. A pager links the previous and next items in the same category. Motion items add a Single / Strip view (Begin, the moments the contract lists in `cues` such as "Bug appears" or "Fix lands", and End, side by side; a Middle frame when an item has no cues), a Begin / Middle / End stepper, and a keyboard-operable frame scrubber with a zero-based frame and seconds readout; the bench state (view, orientation, frame, layout, safe area, guides) lives in the URL and Copy link shares it; controlled illustrations (folder, desk, text fill, …) keep their control values in the URL the same way, and an unreadable, out-of-range, or default value is cleaned from the address bar on load without adding a history entry; orientation-aware items (scene-spec) add a landscape/portrait stage toggle and a Safe-area guides overlay, off by default and drawn outside the composition. Run `node --experimental-strip-types --test scripts/preview-timing.test.mjs` for timing regressions (Node 22.6+).

## ReplayButton

Install with `pnpm dlx shadcn@latest add @jbm/replay-button` after configuring the registry namespace. `ReplayButton` is a controlled plain React component with inline token styles; it needs neither Remotion nor gallery CSS. Render it inside your app's client boundary when supplying event handlers.

```tsx
<ReplayButton
  progress={progress} // normalized 0–1 from the actual animation
  charging={isPlaying}
  onReplay={restartAnimation}
  label="Replay chart animation"
/>
```

Set `charging` to true when playback starts and false when it completes. While charging, the icon traces from tail to arrowhead and activation is ignored, but the button stays focusable: it sets `aria-disabled` rather than `disabled`, so keyboard focus is never dropped mid-playback. Pass `disabled` only to remove replay entirely. The host owns announcements: pair the button with a polite live region (`role="status"`) that says “Playing” when playback starts and “Done” when it ends, as the gallery previews do. Idle renders a fully charged icon. Optional `iconSize`, `disabled`, `style`, and standard button attributes support other hosts. The component owns no animation duration; a standalone browser demo and the Remotion previews both consume the same component.

Surface styling is codified in the shared `shadow` and `surfaceBorder` tokens. See [Surface depth](docs/surface-depth.md) for the lighting model, usage rules, and visual references.

CodeCard types characters in place at `charsPerSecond` (default 32). Line `at` values are earliest start times in seconds; overlapping cues wait for the preceding line to finish. Empty lines retain their height. `codeTypingSchedule(lines, fps, charsPerSecond)` from the bundled `code-card-timing.js` provides the same end frames used by the gallery replay control.

Scene specs compile YAML-shaped blocks into landscape and vertical compositions. See [the scene-spec guide](docs/scene-spec.md) for installation, host integration, anchors, and code typing speed.

Published components must pass the [consumer contract](docs/consumer-contract.md). Run `pnpm consumer:check` for scaffold-copy and real shadcn installation checks.

The [paper and filing illustration guide](docs/design-video-components.md) covers feeding paper tape, clips and tags, controlled ink, frontmatter, nested folder contents, and shared folder/hand transport geometry adapted from the Design videos.

UI Bits are available individually as `@jbm/ui-button`, `@jbm/ui-input`, `@jbm/ui-card`, `@jbm/phone-frame`, `@jbm/badge`, `@jbm/token-glyph`, and `@jbm/piece`. Each has its own gallery preview and usage example in the UI Bits section. `@jbm/ui-bits` remains a compatible bundle that re-exports these components and their types; existing imports continue to work.
