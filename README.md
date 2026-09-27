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
- Type: Geist for words, Geist Mono for labels, code and numbers with units. Components read `--font-sans` / `--font-mono` when a host sets them and fall back to the family name that `@remotion/fonts` loads.
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

`pnpm dev` runs the preview site. `pnpm registry:build` regenerates `public/r/`. Add a component by writing it under `registry/jbm/`, registering it in `registry.json`, and adding its preview and usage snippet under `components/gallery/`.

The gallery includes all registry items, category filters, search across names, descriptions, categories, and tags, and namespace installation instructions. Each card shows its `npx shadcn@latest add @jbm/<name>` command with a Copy button and links its title to the item's `/c/<name>` QA page. For agents, `/llms.txt` (plain text) and `/catalog.json` list every gallery item with its category, capabilities, Remotion requirement, registry dependencies, install command, page, registry JSON, and usage snippet. Both are generated at build time from the same `components/gallery/item-meta.ts` data as the gallery. Motion examples use a lazily loaded Remotion Player with frameless previews, a heavy icon-only replay control that traces its arrow from tail to head with frame progress and unlocks on completion, and no autoplay or looping. Keep `remotion` and `@remotion/player` on the same exact version.

Run `pnpm lint`, `pnpm typecheck`, `pnpm registry:check`, `pnpm consumer:check`, `node --test scripts/*.test.mjs`, and `pnpm build` locally before opening a PR; the GitHub Actions `check` workflow runs the same steps. `registry:check` rebuilds the registry and fails if generated files differ from committed output. Vercel builds and deploys through the GitHub integration. Track changes in issues and link them from PRs.

Preview timing lives in `components/gallery/timing.ts`: demo anchors and content also determine Player duration and replay progress. Include the final interpolation frame, measure spring settling, and include caption fade-out; do not add an arbitrary hold after motion finishes. Static Scene previews have no replay control. Previews rest on their final frame (the finished state, e.g. Counter at 1024 and CodeCard fully typed), never on an arbitrary mid-animation frame.

Every gallery item also has a QA page at `/c/<name>`, statically generated from `components/gallery/item-meta.ts` (`getGalleryItems()`: category, capabilities, install data, and snippet). It shows a large preview, the add command, usage, and links. Motion items add a Begin / Middle / End stepper and a keyboard-operable frame scrubber with a frame and seconds readout; orientation-aware items (scene-spec) add a landscape/portrait stage toggle and a Safe-area guides overlay, off by default and drawn outside the composition. Run `node --experimental-strip-types --test scripts/preview-timing.test.mjs` for timing regressions (Node 22.6+).

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
