# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sergio and his coding agents. They build tacosdedatos narrated explainer videos (Remotion) and companion web pages from one shared set of pieces. Agents install components through the `@jbm` shadcn namespace and compose them into scenes; Sergio reviews the results visually.

## Product Purpose

jbm-ui is a personal component library, distributed as a shadcn registry, so that an explainer video and a web page share one visual vocabulary. It exists because each explainer kept re-implementing the same dozen visual ideas per scene. Success: a new scene or page is assembled from registry items, not rebuilt, and renders identically in the browser and in Remotion.

The Next.js gallery serves two jobs equally:

- **Catalog:** find a component quickly, see it behave, and copy its install command and usage snippet.
- **QA bench:** inspect components during development: states, landscape and portrait stage orientations, independent controls, and motion from beginning to end before they go into videos.

## Positioning

One set of tokens and components works in plain React pages and in Remotion compositions. `ui/` items are pure React with inline token styles and no build step; `motion/` items wrap them with timeline behavior. Illustrations are simple geometric line art built from reusable primitives and matched to reference images.

## Operating Context

- Consumers run `npx shadcn add @jbm/<item>` after adding the namespace to `components.json`.
- Videos use 1920×1080 landscape and 1080×1920 vertical stages with declared safe areas; scene specs compile YAML-shaped blocks into both orientations (`docs/scene-spec.md`).
- Reference-based illustration work follows `docs/illustration-workflow.md`.
- Work is tracked in GitHub issues with PRs on `codex/` branches; Vercel deploys the gallery from GitHub; a GitHub Actions `check` workflow runs lint, typecheck, registry, consumer, node tests, and build.

## Capabilities and Constraints

- The registry publishes `ui`, `motion`, and `lib` items (the inventory lives in `registry.json`); `public/r/` is generated output.
- `ui/` never imports Remotion; anything time-dependent lives in `motion/`.
- The gallery gives every item a working preview, a usage example, and a behavior-based category. It has search and category filters, and each item has a `/c/<name>` QA page with a frame stepper for motion.
- Agents can read the whole catalog without rendering the gallery: `/llms.txt` indexes every item; `/llms-full.txt`, `/catalog.json`, and the per-item `/catalog/<name>.md` and `/catalog/<name>.json` give each item's category, capabilities, install command, dependencies, files with install targets and import paths, props, declared stage size, examples, QA notes, related items, and links to guides and JSON Schemas, generated from one typed contract per item (`docs/agent-contract.md`). Scene specs have a published JSON Schema at `/schemas/scene-spec.json`, so an agent can author and validate a scenes file before compiling it. Contracts are the single source for gallery metadata (titles, descriptions, categories, capabilities, snippets) and for each `/c/<name>` props table; `pnpm registry:check` fails when a contract is missing, disagrees with source props, or its generated output is stale.
- Motion previews never autoplay or loop; replay is explicit.
- Published components must pass the consumer contract (`docs/consumer-contract.md`).
- Components are sized in stage pixels and declare their heights so layout checks can enforce safe areas.

## Brand Commitments

- Palette: ink on cream, vermilion as the single accent per composition. `accent2` is for annotations only; `soft` is for dark surfaces only.
- Type: Geist for words; Geist Mono for labels, code, and numbers with units.
- Raised surfaces use the shared shadow and border tokens (`docs/surface-depth.md`).
- The library belongs to tacosdedatos, and component names mix Spanish and English (`escritorio`, `cajon`, `mano`).

## Evidence on Hand

- Source videos: `design/projects/2026-09-18-recap-septiembre-video` and `2026-09-19-jev-explainer-video` in the design repo, plus the "Motion component inventory" doc.
- Design-video reference guides: `docs/design-video-components.md`, `docs/desk-components.md`, `docs/visual-primitives.md`.
- Test fixtures are in `fixtures/`. There are no external users, testimonials, or adoption metrics, and future work must not invent any.

## Product Principles

1. **Build once, render everywhere.** Every component must work unchanged in a web page and in a Remotion stage.
2. **Primitives over composites.** Expose independent objects separately from the composites and transforms built on them.
3. **Seeing is the test.** Passing builds is not enough. Accept a component only after visual QA against the reference and the gallery at intermediate and extreme states.
4. **Restraint in the palette.** One accent per composition; nothing competes with the content being explained.
5. **Agent-legible.** Rules, categories, and usage snippets are explicit enough that an agent can install and compose correctly without guessing.

## Accessibility & Inclusion

The gallery targets WCAG 2.2 AA: keyboard operability, visible focus, sufficient contrast on cream, correct behavior on narrow screens, and no autoplaying motion, with reduced-motion preferences respected.
