---
name: jbm-ui
description: Cut-paper primitives and motion blocks for tacosdedatos explainer videos and pages.
colors:
  cream-canvas: "#FFF6E8"
  card-stock: "#FFFCF5"
  press-ink: "#20241F"
  graphite: "#65675F"
  pencil-rule: "#D5D1C6"
  stamp-vermilion: "#C63D24"
  rust-annotation: "#A04D31"
  coral-glow: "#FF8A6A"
  code-green: "#9BE59B"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "96px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-2px"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(28px, 2.8vw, 36px)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    letterSpacing: "-0.6px"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.7
  body-small:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    letterSpacing: "4px"
  mono-label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    letterSpacing: "2px"
  field-phone:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  demo-fluid:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(24px, 3vw, 40px)"
    fontWeight: 400
  demo-fluid-large:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(32px, 4vw, 56px)"
    fontWeight: 400
rounded:
  swatch: "4px"
  control: "6px"
  pill: "10px"
  code: "12px"
  chip: "14px"
  paper: "22px"
  card: "28px"
spacing:
  gallery-gutter: "56px"
  gallery-gutter-narrow: "20px"
  landscape-pad: "120px"
  vertical-pad: "72px"
components:
  card:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.press-ink}"
    rounded: "{rounded.card}"
    padding: "40px"
  card-dark:
    backgroundColor: "{colors.press-ink}"
    textColor: "{colors.cream-canvas}"
    rounded: "{rounded.card}"
    padding: "40px"
  chip:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.press-ink}"
    rounded: "{rounded.chip}"
    padding: "10px 20px"
  chip-accent:
    backgroundColor: "{colors.stamp-vermilion}"
    textColor: "{colors.cream-canvas}"
    rounded: "{rounded.chip}"
    padding: "10px 20px"
  chip-solid:
    backgroundColor: "{colors.press-ink}"
    textColor: "{colors.cream-canvas}"
    rounded: "{rounded.chip}"
    padding: "10px 20px"
  gallery-filter:
    textColor: "{colors.press-ink}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  gallery-filter-active:
    backgroundColor: "{colors.press-ink}"
    textColor: "{colors.cream-canvas}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
  gallery-search:
    backgroundColor: "{colors.card-stock}"
    textColor: "{colors.press-ink}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
    width: "240px"
  add-command:
    backgroundColor: "{colors.cream-canvas}"
    textColor: "{colors.press-ink}"
    rounded: "{rounded.control}"
    padding: "8px 8px 8px 14px"
  qa-stepper:
    textColor: "{colors.press-ink}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "36px"
  qa-stepper-active:
    backgroundColor: "{colors.press-ink}"
    textColor: "{colors.cream-canvas}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "36px"
---

# Design System: jbm-ui

## Overview

**Creative North Star: "The Cut-Paper Stage"**

Everything in jbm-ui is a flat piece of card stock moved around a cream stage. Shapes are simple and geometric, cut with crisp edges, filled flat, and lifted off the canvas by a soft layered shadow. The system is tactile and plain: it should feel physical without looking realistic, like a paper-craft animation, not an illustration with lighting and texture.

The same pieces render on a web page and in a 1920×1080 or 1080×1920 Remotion stage, so every decision is made in stage pixels and inline styles. Components are deliberately low-detail: minimal contours, no incidental props, and no anatomy beyond what the explanation needs. The content being explained is the subject. The stage and its paper exist to serve it.

The gallery is the stage's backroom. It uses the same palette and type, but it is quieter: thin pencil rules, small mono labels, and transparent controls, so the previews stay the loudest thing on the page.

**Key Characteristics:**
- Two colours: press ink on cream, with one vermilion stamp per composition.
- Flat fills and fine ink edges; depth comes only from layered, ink-tinted shadows.
- Simple geometric line art; no gradients, textures, or realistic rendering.
- Geist for words, Geist Mono for anything measured, labelled, or coded.
- Sized in stage pixels and kept inside declared safe areas.

## Colors

A warm two-colour print palette: ink on cream, with vermilion used like a rubber stamp.

### Primary
- **Stamp Vermilion** (`stamp-vermilion`): the one mark per composition that makes something official: the key number, the accent chip, the word in a headline, the focus ring, the sticky-note paper tone. It is also the gallery's focus outline and wordmark accent. Gallery chrome never uses it for control fills: sliders, checkboxes, and radios in previews and on the QA bench take an ink `accent-color`, so the component's own stamp stays the only one.

### Secondary
- **Rust Annotation** (`rust-annotation`): annotations only, such as notes, arrows, and marginal callouts that comment on the content without competing with the vermilion stamp.

### Tertiary
- **Coral Glow** (`coral-glow`): emphasis on dark surfaces only (code cards, dark cards, and the dark theme's primary), where vermilion would lose contrast.
- **Code Green** (`code-green`): syntax and output highlights inside dark code cards; never used on cream.

### Neutral
- **Cream Canvas** (`cream-canvas`): the stage and page background. Every composition starts here.
- **Card Stock** (`card-stock`): raised surfaces such as cards, paper, the search field, and the gallery's card bodies.
- **Press Ink** (`press-ink`): text, paper edges, solid chips, the dark card fill, and the active filter.
- **Graphite** (`graphite`): muted text, kickers, captions, metadata, and counts.
- **Pencil Rule** (`pencil-rule`): hairline borders, dividers, outline chips, and control strokes.

### Named Rules
**The One Stamp Rule.** A composition gets exactly one vermilion accent. If two things are vermilion, one of them is wrong.

**The Dark-Only Coral Rule.** Coral Glow appears only on ink or dark surfaces. On cream, it fails contrast and fights the stamp.

## Typography

**Display Font:** Geist (with system-ui, sans-serif)
**Body Font:** Geist (with system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace)

**Character:** One neutral grotesque at very different weights carries all words, from heavy tight display to airy body text. The mono face marks anything measured, labelled, or coded.

Components read `--font-sans` / `--font-mono` when the host sets them (next/font in the gallery) and fall back to the family name that `@remotion/fonts` loads.

### Hierarchy
- **Display** (800, 56–170px in stage pixels, 1.05, -2px tracking): the `Big` headline in scenes; the loudest words on a stage.
- **Headline** (650, clamp(28px, 2.8vw, 36px), 1.1, -0.035em): the gallery's section headings (UI, Motion, Interactive, …); they outrank the 22px card titles. Each heading is followed by its category's one-line definition in Graphite, at most 65ch wide. The page header is a single row whose only `h1` is the 26px mono wordmark.
- **Title** (600, 22px, -0.6px): component names on gallery cards.
- **Body** (400, 18px, 1.7): long-form explanatory copy in Graphite, capped near 550px.
- **Body small** (400, 14px, 1.6): card descriptions and secondary copy.
- **Label** (600, 26px stage pixels, 4px tracking, uppercase): the scene kicker that sits top-left of every scene.
- **Mono label** (400, 12px, 2px tracking when uppercase): filter and section counts, the result status, card and item-page tag lines, the QA frame readout, swatch codes, and numbers with units.

### Named Exceptions
Three sizes sit outside the ramp on purpose and are listed as tokens so the design detector reads them:
- **Field phone** (`field-phone`, 16px): the search field's text under 760px. iOS Safari zooms any focused field below 16px, so the field steps up from 14px on phones only.
- **Demo fluid** (`demo-fluid`, clamp(24px, 3vw, 40px)) and **Demo fluid large** (`demo-fluid-large`, clamp(32px, 4vw, 56px)): the sample sentences inside the Text fill, Scroll text fill, and Flip text previews. They scale with the preview so the per-letter effect stays legible on a phone card and fills a desktop bench; they are demo content, never gallery chrome.

### Named Rules
**The Measured-Things-Are-Mono Rule.** Code, labels, counts, and numbers with units use Geist Mono. Prose and headlines never do.

## Layout

Scenes are laid out on fixed stages: landscape is 1920×1080 with 120px side padding and content between y 90 and 920; vertical is 1080×1920 with 72px padding and content between y 100 and 1440. Captions live below the safe area. Components declare their height so layout checks can enforce these bounds. A component that must fit both orientations takes a `w` or `row` prop, not a second file. Portrait needs deliberate subject sizing, not a stretched landscape layout.

The gallery is a centred 1440px shell with 56px gutters (20px under 760px). A one-row header sits above the Install once disclosure and two sticky bars: the toolbar (filters and search), then a status row (result status, Clear, and section anchors). Below them is a grid of component cards: three columns with 24px gaps at 1200px and wider, two columns with 28px gaps below that, and one column under 760px. Each preview renders an 800×500 stage scaled to the card width through a container query, so previews show true proportions at any width. Motion previews rest on their final frame.

Every item also has its own page at `/c/<name>`, a QA bench in the Operate register: calm, dense, and precise. A hairline top bar holds the wordmark and a breadcrumb (Gallery / category / item), with a pager at its right: ← previous and next → links within the item's category (wrapping at the ends, labelled "Previous in Motion: Pop") around a mono "3 of 17" count; on phones the pager takes its own row. Under it comes a compact intro: a headline-sized `h1` with the mono tag line (the category link, then capability tags separated by `·`) on the same row, then an 18px Graphite description (16px on phones). The bench is next and fits the first viewport with its controls. Its stage keeps the item's own aspect ratio (8:5 previews, 16:9 or 9:16 scene stages) inside a 10px-radius Pencil Rule frame, and its height is the viewport height left under the intro (measured after hydration, in `svh` so a collapsing phone URL bar never resizes it) minus the controls that share its column, never less than 240px. Every item shares one stage column capped at 1000px (`--bench-col-max`); when the viewport is short the stage shrinks to the height and stays left-aligned, and the toolbar, stage or strip, and stepper share its edges. Player items without orientation put the frame stepper directly under the stage. Orientation-aware stages (scene-spec) centre the stage in its column at 1024px and wider and move the orientation switch, stepper, and scene options into a 272px right rail; the stage column keeps one height in both orientations, so toggling moves nothing on the page. Below 1024px they stack switch, stage, stepper, then options, which is also the tab order. In the strip view the scene options move up: at 1024px and wider they take a row beside the toolbar (which keeps its place) and the strip spans both columns under them; below 1024px they sit between the toolbar and the strip. Under a hairline rule, an Install column (add-command row, requirements, Source ↗ (GitHub) / Registry JSON ↗ / Gallery card / Agent Markdown / Agent JSON links, and a Docs / Schema reference row when the contract lists guides or schemas) sits beside a Usage column with the contract's examples; the two stack under 760px. The props table closes the page.

## Elevation & Depth

Depth is physical and restrained. Surfaces are flat fills with a one-pixel border; a stack of ink-tinted shadows (1, 3, 6, 12, and 24px offsets with matching blur and negative spread, opacity falling as they soften) lifts them off the canvas, and a faint inset highlight catches light on the upper edge. Light always comes from above. The full recipes live in `registry/jbm/lib/tokens.ts` and `docs/surface-depth.md`.

### Shadow Vocabulary
- **Card** (`shadow.card`): application surfaces on cream, including Card, StatCard, and CodeCard.
- **Card Dark** (`shadow.cardDark`): dark cards, with a restrained cream inset instead of the bright highlight.
- **Paper drop** (`paperShadow`): contact and ambient layers plus a longer `0 18px 28px -14px` drop, for cut-out illustrations that sit on the stage.

### Named Rules
**The Surfaces-Only Rule.** Shadows belong to cards and paper. Text, chips, and transparent icon controls never gain a shadow.

**The One Recipe Rule.** Never hand-write a shadow string in a component; import `shadow`, `shadowLayers`, or `paperShadow`.

## Shapes

Corners are soft and generous on the stage and tight in the gallery chrome. Cards use a 28px radius, paper cut-outs 22px, chips 14px, code blocks 12px, and pills 10px; buttons in illustrations are full pills (radius = height / 2). Gallery controls use 6px and swatches 4px. Paper illustrations use a deliberate 2px ink edge to read as cut-outs; application cards use the hairline `surfaceBorder` instead. Illustrated objects are built from simple geometry with complete hidden geometry, so they stay correct when occluded or moved.

## Components

### Buttons (gallery)
- **Shape:** gently rounded (6px).
- **Default:** transparent with a Pencil Rule border, 14px text, and 9px 13px padding. Filters, empty-state actions, and copy buttons share it.
- **Hover:** the border darkens to Press Ink.
- **Active (`aria-pressed`):** filled with Press Ink and cream text.
- **Focus:** a 2px Stamp Vermilion outline offset 5px, shared by every link, button, input, and summary.

### Chips
- **Style:** a 2px-bordered pill (14px) in Geist 600. The default has a Card Stock fill and a Pencil Rule edge, `accent` fills Stamp Vermilion, and `solid` fills Press Ink. `mono` switches to Geist Mono for codes and values.

### Cards / Containers
- **Corner Style:** 28px.
- **Background:** Card Stock, or Press Ink when `dark`.
- **Shadow Strategy:** `shadow.card` / `shadow.cardDark` (see Elevation & Depth).
- **Border:** `surfaceBorder.card` (1px ink at 12%) or `surfaceBorder.cardDark`.
- **Internal Padding:** 40px stage pixels.

### Inputs / Fields
- **Style:** 240px search field on Card Stock with a Pencil Rule stroke, 6px radius, and 14px text, going full width (and 16px text, so iOS does not zoom) on narrow screens. A mono `/` hint marks the focus shortcut.
- **Focus:** the shared vermilion outline.

### Navigation
- **Style:** a one-row site header with a mono wordmark (26px, 700, -2px tracking, vermilion suffix), a one-line purpose, a mono item count, and a hairline bottom rule.
- **Toolbar:** sticky on Cream Canvas between hairline rules. Category filters are the primary navigation, with 12px mono counts at 65% opacity that follow the search query. The search field sits at the right and matches names, descriptions, categories, and tags. A separate sticky status row below holds the mono result status, one Clear action while filtered, and section anchors. On narrow screens the filters scroll in one row beside a 40px search toggle that opens the field below, the status row scrolls away, and the anchors hide; on short viewports the bars stop sticking.
- **Item page top bar:** the mono wordmark and a 14px Graphite breadcrumb separated by `/`, with the current item in Press Ink, over a hairline rule. The category link in the breadcrumb and the tag line both open the gallery filtered to that category.

### Install block
- **Style:** an Install once disclosure under the header: a 22px `h2` summary with a chevron, then 14px Graphite prose on the left and the `components.json` snippet in a code block on the right. It is open on wide screens and starts closed on phones, where the body stacks; once a reader toggles it, that choice is remembered in the browser and applied by an inline script before first paint, so a returning reader never sees it flash open or shut. The server-rendered snippet uses the canonical site address; after hydration it shows the current origin.

### Code block
- **Style:** every usage snippet (the card Usage disclosure, the item page's Usage examples, and Install once) is a copyable code block: 12px Geist Mono on Cream Canvas inside a Pencil Rule frame with a 6px radius, and a Copy button in the gallery button style floated top-right, so only the first lines flow around it. Code soft-wraps instead of scrolling sideways; each wrapped line hangs 2ch past its own indentation, so nested JSX keeps its shape at phone widths.
- **Behaviour:** the button is named "Copy <example title> example" and copies the exact source. A polite "Copied" status appears beside the button for 4 seconds without reflowing the code. Blocks never scroll, so they are not tab stops.

### Add-command row
- **Style:** the one-line install for a single item: `npx shadcn@latest add @jbm/<name>` in 12px Geist Mono on Cream Canvas, inside a Pencil Rule frame with a 6px radius and 8px 8px 8px 14px padding, and a trailing Copy button in the gallery button style. The command wraps anywhere on narrow cards. A 12px Graphite status confirms the copy.
- **Placement:** on every card face under the description, and at the top of the item page's Install column. The card's Usage disclosure holds the snippet, requirements, and Registry JSON ↗ and Source ↗ (GitHub, new tab) links.

### Reference row (item page)
- **Style:** under the Install column links, after a hairline Pencil Rule: a two-column definition list with 12px Geist Mono Graphite labels (Docs, Schema) in a 64px column and 12px ink links beside them, wrapping with 24px gaps and 24px minimum hit height. External links carry a trailing ↗; same-site links (the served schema) do not.
- **Behaviour:** rendered only when the contract lists `docs` or `schemas`. Links on the production origin render as site paths, so previews resolve locally.

### Not-found pages
- **Style:** the item page top bar with a Not found crumb, a headline-sized `h1` ("Nothing is filed here"), 18px Graphite prose, one solid Press Ink "Open the gallery" button, then under a hairline rule a 22px "For agents" `h2` with llms.txt, catalog.json, and registry links in the item-links style.
- **Unknown item:** `/c/<name>` for a name with no page returns a server-rendered 404 (the proxy rewrites it; other casings of a real name redirect). The `h1` reads "No gallery item is named “<name>”." and wraps long input. Up to three nearest item pages follow as title links with their `/c` paths (none for noise), then a solid Press Ink "Search the gallery for “<name>”" button and a "Browse every item" link, then For agents.
- **Bundle variant:** `/c/<bundle>` keeps the same frame with "<Title> has no page of its own": an Install the bundle column (add-command row, Markdown / JSON / Registry JSON links) beside an Open an item instead column listing each re-exported item as an ink link and a Graphite description over Pencil Rule dividers. The columns stack under 760px.

### QA frame stepper
- **Style:** on the item page, under the stage of every Remotion Player item: a segmented Begin / Middle / End control, a frame scrubber, a mono readout, and the replay control, all in one row. The segments are joined 36px buttons (40px on phones) with Pencil Rule borders and 6px outer corners. The current step fills Press Ink with cream text, and hover darkens the border to Press Ink. The scrubber is a native range input with an ink `accent-color`. The readout shows the zero-based frame index over the last frame index, both padded to the same width (`07/51`), in Press Ink, then seconds in Graphite, in tabular 12px mono. In the orientation rail the steps span the rail, the scrubber sits under them, then the readout and replay. On phones the steps, readout, and replay share one row with the full-width scrubber under them, directly below the stage.
- **Keys:** a 12px mono Graphite hint under the scrubber ("0–51 · ← → 1 · PgUp PgDn 5 · Home End"); a screen-reader sentence tied by `aria-describedby` spells it out. PageUp/PageDown step exactly 5 frames.
- **Behaviour:** the stage rests on the final frame. The scrubber's value text reads "Frame N of M, S s", and a polite status announces playing and done. Orientation-aware stages add a segmented Landscape 16:9 / Portrait 9:16 control (40px on phones), layout and safe-area selects, and a safe-area guides checkbox. The guides are drawn over the Player, never inside the composition. The guides are dashed Graphite, never a warm accent. Single-frame layouts show a note instead of the stepper.

### Bench strip view and URL state
- **Style:** motion benches carry a toolbar above the stage: a segmented Single / Strip control on the left and a Copy link button on the right. Strip shows Begin, each cue from the item's contract, and End side by side (Begin, Middle, and End when there are no cues) as exact-frame thumbnails in 10px-radius Pencil Rule frames, each captioned with what happens ("Bug appears", "Fix lands") in 14px ink, ending in an ellipsis when long, and its frame number in mono Graphite. Cells run in rows of three at one size for every item, so a pager walk compares like with like; up to four cues wrap into a second row, which still fits the first viewport; orientation-aware items show the landscape and portrait frames, with safe-area guides on every cell (their text label is left to the scene options). At 1024px and wider the landscape frames stack in a column and the portrait frames stand beside them at the full strip height (about 320×568 at 1440×900), so the whole strip still fits the first viewport; between 760px and 1024px they are two rows. On phones the landscape frames stack one per row (two per row when cues add cells) and the portrait frames share one row, under the toolbar and scene options.
- **Behaviour:** each caption is a button stretched over its cell that opens that frame (and orientation) in Single view. The Player stays mounted while hidden, so switching views keeps its state. The URL carries `view`, `orientation`, `frame` (zero-based), `layout`, `safe`, and `guides=1`, read on first client render and written with a debounced `history.replaceState`, never during playback; defaults are omitted, invalid values fall back to defaults, and an out-of-range frame clamps to the last frame. Copy link copies that stateful URL. URLs are built from the router's pathname and query, the bench is keyed by item, and a pending write never lands on another page, so the pager always opens the next item at its own defaults; it carries only `view=strip` between Player benches. Opening a strip cell moves focus to the frame scrubber and scrolls the bench into view. Before the Player loads, a placeholder with the same toolbar, stage or strip cells, stepper, and options (controls invisible, frames drawn) reserves the requested view's exact size: an inline script reads the query and measures the header before first paint, and again when the web fonts swap in, so the bench never shifts the page.
- **Controlled illustrations:** folder, desk, paper, score, clock, ticket, and text-fill benches show the same toolbar with only Copy link above the preview. Their control values (`?open=0.5&pose=pinch`) restore from the URL, write back with the same debounced `replaceState`, and leave defaults out; on load an unreadable value is dropped, an out-of-range number is rewritten as its bound, and a default is removed, without adding a history entry. Index cards keep local state.

### Progress control (previews)
- **Style:** every 0–1 preview slider shares one control: the label and a mono percentage readout on one row, then the ink-accent range input beside three joined segmented presets named for the component's own states (Closed / Half / Open, Start / Midway / Arrived, Left / Center / Right). The matching preset fills Press Ink with cream text. Non-progress sliders (angles, counts, scores, times) use the sibling range control with a readout in their own unit (−7°, 3 sheets, 6 / 10, 08:30). Small whole-number counts (Nested folders, 0–8) use the stepper sibling instead: the same label and mono readout row ("3 folders"), then a joined − / + pair in the preset style with 36×28px targets.
- **Behaviour:** presets set `aria-pressed`; the slider's `aria-valuetext` uses the readout's wording ("60%"). The stepper's buttons are named "Fewer folders" / "More folders", its readout is a polite `<output>` that announces each change, and at a bound the button turns Graphite with `aria-disabled` but keeps focus. The same controls render on cards and on `/c` pages.

### Props table (item API)
- **Style:** the last section of every item page, under a hairline rule, rendered from the item's agent contract. A 22px `h2` (Props for one export, API for several) sits beside the declared stage size: a mono 12px Graphite label column (Stage px, Landscape, Vertical, Basis) against tabular Press Ink sizes and Graphite prose, or the fluid / n/a mode with its reason. Each export gets an 18px mono `h3` with its kind in 12px Graphite mono, a 14px Graphite summary, then a fixed-layout table (Prop, Type, Default, Description) with 12px mono Graphite headers and Pencil Rule row dividers. Prop names are 600-weight ink mono; types and defaults are 12px mono; `required` is ink, `none` is Graphite. Passthrough props follow as one "Also accepts" line, and QA checks close the section as an indented list.
- **Behaviour:** static and server-rendered. Under 760px each table row stacks into a block: the prop name, then Type and Default as label and value pairs, then the description, so nothing scrolls sideways.

### Paper (signature)
The cut-out primitive behind illustrations and UI bits: a flat shape in `paper`, `accent`, or `ink` tone with a 2px edge, `paperShadow`, and an optional rotation. Compose illustrations from Paper and the other primitives rather than drawing new surfaces.

### Replay control (signature)
A heavy, icon-only replay button that traces its arrow from tail to head as the animation plays and shows a fully charged icon at rest. While charging it sets `aria-disabled` rather than `disabled`, so keyboard focus stays on it. Motion previews never autoplay or loop; this control is the only way to play them.

## Do's and Don'ts

### Do:
- **Do** import colours, radii, shadows, and fonts from `tokens.ts`; keep `globals.css` `--jbm-*` values in sync with it.
- **Do** keep exactly one Stamp Vermilion accent per composition.
- **Do** build illustrations from simple geometric primitives with flat fills and minimal contours.
- **Do** use Geist Mono for labels, counts, code, and numbers with units.
- **Do** inspect beginning, middle, and end frames in both orientations.

### Don't:
- **Don't** add gradients, textures, or realistic anatomy and lighting.
- **Don't** put shadows on text, chips, or transparent icon controls.
- **Don't** use Coral Glow or Code Green on cream.
- **Don't** autoplay or loop motion in the gallery.
- **Don't** duplicate shadow strings or introduce colours outside the palette.
