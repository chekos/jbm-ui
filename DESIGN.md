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
- **Stamp Vermilion** (`stamp-vermilion`): the one mark per composition that makes something official: the key number, the accent chip, the word in a headline, the focus ring, the sticky-note paper tone. It is also the gallery's focus outline and wordmark accent.

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
- **Headline** (650, clamp(28px, 2.8vw, 36px), 1.1, -0.035em): the gallery's section headings (UI, Motion, …); they outrank the 22px card titles. The page header is a single row whose only `h1` is the 26px mono wordmark.
- **Title** (600, 22px, -0.6px): component names on gallery cards.
- **Body** (400, 18px, 1.7): long-form explanatory copy in Graphite, capped near 550px.
- **Body small** (400, 14px, 1.6): card descriptions and secondary copy.
- **Label** (600, 26px stage pixels, 4px tracking, uppercase): the scene kicker that sits top-left of every scene.
- **Mono label** (400, 12px, 2px tracking when uppercase): filter and section counts, the result status, card capability tags, swatch codes, and numbers with units.

### Named Rules
**The Measured-Things-Are-Mono Rule.** Code, labels, counts, and numbers with units use Geist Mono. Prose and headlines never do.

## Layout

Scenes are laid out on fixed stages: landscape is 1920×1080 with 120px side padding and content between y 90 and 920; vertical is 1080×1920 with 72px padding and content between y 100 and 1440. Captions live below the safe area. Components declare their height so layout checks can enforce these bounds. A component that must fit both orientations takes a `w` or `row` prop, not a second file. Portrait needs deliberate subject sizing, not a stretched landscape layout.

The gallery is a centred 1440px shell with 56px gutters (20px under 760px). A one-row header sits above the Install once block and a sticky toolbar of filters, search, result status, and section anchors, followed by a two-column grid of component cards with 28px gaps that collapses to one column on narrow screens. Each preview renders an 800×500 stage scaled to the card width through a container query, so previews show true proportions at any width.

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
- **Toolbar:** sticky on Cream Canvas between hairline rules. Category filters are the primary navigation, with 12px mono counts at 65% opacity; a mono result status, a Clear action while filtered, and section anchors sit on the row below. On narrow screens the filters scroll in one row and the anchors hide; on short viewports the toolbar stops sticking.

### Install block
- **Style:** a two-column block under the header: 22px title and 14px Graphite prose on the left, the `components.json` snippet in a code block on the right with its copy button in the top-right corner. It stacks on narrow screens. Each card repeats only its own `npx shadcn@latest add @jbm/<name>` command, in the same code-row style.

### Paper (signature)
The cut-out primitive behind illustrations and UI bits: a flat shape in `paper`, `accent`, or `ink` tone with a 2px edge, `paperShadow`, and an optional rotation. Compose illustrations from Paper and the other primitives rather than drawing new surfaces.

### Replay control (signature)
A heavy, icon-only replay button that traces its arrow from tail to head as the animation plays, disables while charging, and shows a fully charged icon at rest. Motion previews never autoplay or loop; this control is the only way to play them.

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
