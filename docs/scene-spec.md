# Scene specs

Install `@jbm/scene-spec` to receive `SceneFromSpec`, the `SceneSpec` / `ScenesFile` types, and their component dependencies. A scene spec is plain data (usually written as YAML) that compiles to a Remotion scene in either orientation.

The compiler consumes a **parsed object**. YAML parsing, narration timing, translation, composition dimensions, and scene duration belong to the video project. The compiler does not validate the shape of its input: an unknown block `type` renders nothing, and a missing required field either throws a plain `TypeError` or renders an empty element. Validate specs against the JSON Schema before compiling.

- JSON Schema (draft 2020-12), generated from `registry/jbm/motion/spec.ts`: <https://jbm-ui.bns.studio/schemas/scene-spec.json>. The root validates a scenes file; `#/$defs/SceneSpec` validates one scene.
- Types: `registry/jbm/motion/spec.ts`. Compiler: `registry/jbm/motion/compile.tsx`.

## Quick start

1. Install the item and a YAML parser: `npx shadcn@latest add @jbm/scene-spec`, then `npm install js-yaml` (and `@types/js-yaml` for TypeScript).
2. Parse with `js-yaml` 4 (`load`, YAML 1.2), validate, and hand each scene to `SceneFromSpec` inside its own `<Sequence>`.

```tsx
import { readFileSync } from "node:fs" // or fetch, or a bundler raw import
import { load } from "js-yaml"
import Ajv2020 from "ajv/dist/2020"
import { SceneFromSpec } from "@/jbm/motion/compile"
import type { ScenesFile } from "@/jbm/motion/spec"
import schema from "./scene-spec.schema.json" // curl -o from the URL above

const validate = new Ajv2020({ allErrors: true }).compile(schema)
const data = load(readFileSync("scenes.yaml", "utf8"))
if (!validate(data)) throw new Error(JSON.stringify(validate.errors, null, 2))
const scenes = data as ScenesFile

// Inside a 1920×1080 (landscape) or 1080×1920 (vertical) composition, one Sequence per scene:
<SceneFromSpec
  spec={scenes.scenes[0]}
  orientation="landscape"
  host={{
    resolve: (phrase) => secondsFromSceneStart(phrase), // your narration timing table
    t: (text) => translate(text), // optional; identity when omitted
  }}
/>
```

YAML notes: quote strings that contain `: `, ` #`, or start with `@`, `*`, `&`, `!`, `{`, `[`, `'`, `"`, or `-`. Numbers stay numbers (`at: 0.5` is seconds); `at: explain+0.2` is a string. Write line breaks as `"\n"` inside double quotes. Any YAML parser that yields the same plain objects works; the examples in this file are parsed with `js-yaml` 4 in CI.

## Multi-scene composition

A complete Remotion entry: one 1080×1920 `<Composition>`, one `<Series.Sequence>` per scene with its own `durationInFrames`, YAML parsed with `js-yaml` and validated with `ajv` against the schema, Geist loaded with `@remotion/google-fonts`, and a literal phrase → seconds table standing in for narration timing. Times inside each scene start at 0 because every scene has its own sequence. It is the last example of `@jbm/scene-spec`, and CI typechecks it in a fresh consumer.

```tsx
import { Composition, Series } from "remotion"
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist"
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono"
import { load } from "js-yaml"
import Ajv2020 from "ajv/dist/2020"
import { SceneFromSpec } from "@/jbm/motion/compile"
import type { ScenesFile } from "@/jbm/motion/spec"
import schema from "./scene-spec.schema.json" // curl -o scene-spec.schema.json https://jbm-ui.bns.studio/schemas/scene-spec.json

// npm install remotion @remotion/google-fonts js-yaml ajv (and @types/js-yaml).
// Token font stacks fall back to the family names "Geist" and "Geist Mono" these load.
loadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] })
loadGeistMono("normal", { weights: ["400", "500"], subsets: ["latin"] })

const FPS = 30
const yamlText = `
scenes:
  - id: hook
    anchors: { reveal: "hecha de piezas" }
    blocks:
      - { type: big, at: 0, text: "Una biblioteca." }
      - { type: note, at: reveal, text: "Hecha de piezas." }
  - id: pieces
    composition: { safeArea: full, layout: illustration }
    anchors: { build: "una pieza" }
    blocks:
      - type: screens
        pieces:
          - { kind: card, at: build }
          - { kind: button, at: build+0.6 }
`

// No narration yet: a literal phrase → seconds (from its scene's start) table, and scene lengths.
const timings: Record<string, number> = { "hecha de piezas": 1.2, "una pieza": 0.8 }
const seconds: Record<string, number> = { hook: 4, pieces: 5 }
const resolve = (phrase: string) => {
  const at = timings[phrase]
  if (at === undefined) throw new Error(`No timing for "${phrase}"`)
  return at
}

const validate = new Ajv2020({ allErrors: true }).compile(schema)
const data: unknown = load(yamlText)
if (!validate(data)) throw new Error(JSON.stringify(validate.errors, null, 2))
const { scenes } = data as ScenesFile
const frames = (id: string) => Math.round(seconds[id] * FPS)

// One Series.Sequence per scene: each scene's times start at 0 inside its own sequence.
export const Explainer = () => (
  <Series>
    {scenes.map((spec) => (
      <Series.Sequence key={spec.id} durationInFrames={frames(spec.id)}>
        <SceneFromSpec spec={spec} orientation="vertical" host={{ resolve }} />
      </Series.Sequence>
    ))}
  </Series>
)

// Register in your Remotion root (registerRoot). Use 1920×1080 with orientation="landscape".
export const RemotionRoot = () => (
  <Composition
    id="explainer-vertical"
    component={Explainer}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={scenes.reduce((total, spec) => total + frames(spec.id), 0)}
  />
)
```

## Minimal example

```yaml
scenes:
  - id: hello
    blocks:
      - type: big
        at: 0
        text: "Hola."
```

## Realistic example

Three scenes: a titled flow scene with stat cards and a closing overlay, a hero code scene, and a headline-illustration scene tuned for portrait.

```yaml
scenes:
  - id: intro
    title: "Componentes"
    anchors:
      numbers: "en números"
      close: "un solo vocabulario"
    composition:
      safeArea: full
    variants:
      vertical:
        safeArea: social
        gap: 32
    blocks:
      - type: big
        at: 0.2
        text: "Una biblioteca,\ndos formatos."
        until: close-0.4
      - type: stat-row
        until: close-0.4
        items:
          - { at: numbers, label: "Componentes", value: "65" }
          - { at: numbers+0.3, label: "Orientaciones", value: "2", valueColor: ink }
          - { at: numbers+0.6, label: "Autoplay", value: "0", sub: "nunca" }
      - type: overlay
        blocks:
          - { type: brand, at: close, tagline: "Un vocabulario visual" }

  - id: install
    starts: "así se instala"
    anchors:
      install: "así se instala"
      done: "y listo"
    composition:
      layout: hero
    blocks:
      - type: code
        at: 0
        title: terminal
        charsPerSecond: 40
        lines:
          - { text: "npx shadcn@latest add @jbm/scene-spec", at: install, color: green }
          - { text: "✓ src/jbm/motion/compile.tsx", at: done, color: dim }
          - { text: "✓ src/jbm/motion/spec.ts", at: done+0.2, color: dim }
      - type: note
        at: done+1
        text: "Las dependencias llegan solas."

  - id: library
    starts: "cada pieza"
    anchors:
      build: "cada pieza"
      again: "otra vez"
    composition:
      safeArea: full
      layout: headline-illustration
      subjectScale: 1.3
    variants:
      vertical:
        headlineRatio: 0.23
        gap: 48
    blocks:
      - { type: big, at: 0, text: "Una biblioteca.\nMuchas pantallas.", align: center, size: 90 }
      - type: screens
        phoneScale: 1.5
        again: [again, again+1.2]
        pieces:
          - { kind: card, at: build }
          - { kind: input, at: build+0.3 }
          - { kind: button, at: build+0.6 }
```

## Scene fields

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | string | yes | | Appears in error messages. |
| `blocks` | Block[] | yes | | Top to bottom. See [Blocks](#blocks). |
| `anchors` | Record<string, string> | | `{}` | Anchor name → narration phrase spoken in this scene. Optional: needed only when a block time names an anchor. |
| `title` | string | | | Label at the top left, entering at 0.1 s. Not allowed with the `headline-illustration` or `illustration` layouts. |
| `starts` | string | | | First words of the scene, for a host that cuts scene boundaries from a narration transcript. Not needed on the first scene; the compiler ignores it. |
| `gap` | number \| `{ landscape, vertical }` | | `40` | px between blocks. `0 ≤ gap <` safe-area height. |
| `valign` | `"top"` \| `"center"` | | `"top"` | Vertical placement of the flow stack. |
| `composition` | CompositionOptions without `blocks` | | | Shared by both orientations. See [Composition](#composition-layouts-variants-and-safe-areas). |
| `variants` | `{ landscape?, vertical? }` of CompositionOptions | | | Per orientation; each key overrides `composition`. |

## Timing and anchors

Every time (`at`, `until`, `again`, `second`, …) is an `At`: a **number** of seconds from scene start, or a **string** anchor reference.

- `"explain"`: the anchor's phrase, resolved by `host.resolve(phrase)` to seconds from scene start.
- `"explain+0.2"`, `"explain-0.5"`, `"explain + 0.2"`: that time plus a signed offset in seconds. Pattern: `^\s*[\w-]+?\s*([+-]\s*(\d+(\.\d+)?|\.\d+))?\s*$`.
- An anchor named exactly like the whole string wins first, so `my-cue-0.5` resolves the anchor `my-cue-0.5` if it exists and otherwise `my-cue` minus 0.5 s.
- `host.resolve` receives the phrase, not the anchor name. Its result must be finite.
- Every displayed string passes through `host.t` (identity when omitted): block text, labels, titles, taglines, sticker/stamp text, and code lines.

## Blocks

Every block accepts `until` (At): from that time it fades out and drifts up 30 px over 0.4 s. Flow blocks keep their layout space after exiting; use an `overlay` or a separate scene for a replacement beat. Sizes are canvas px; V = vertical, L = landscape.

### `big`

Headline in the display face; enters with a `Pop`.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | Entrance. |
| `text` | string | yes | | `\n` breaks lines. |
| `color` | `"accent"` \| `"ink"` | | ink | |
| `size` | number | | 120 L / 96 V | Font size px. Not auto-fitted. |
| `from` | `"up"` \| `"scale"` \| `"left"` | | `"up"` | Entrance motion. |
| `align` | `"left"` \| `"center"` | | `"left"` | |

### `stat-row`

Stat cards: side by side (300 px tall, width split with 40 px gaps) in landscape; stacked row cards (180 px, 30 px apart) in vertical. An empty list renders nothing.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `items` | StatItem[] | yes | | One card each. |
| `items[].at` | At | yes | | Card entrance. |
| `items[].label` | string | yes | | Caption. |
| `items[].value` | string | yes | | Display text, e.g. `"42 %"`. |
| `items[].sub` | string | | | Line under the value. |
| `items[].valueColor` | `"accent"` \| `"ink"` | | `"accent"` | |

### `note`

Small annotation (Callout note variant, 24 px L / 22 px V) sliding in from the left.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | Entrance. |
| `text` | string | yes | | |

### `callout`

Boxed statement (34 px L / 30 px V).

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | Entrance. |
| `text` | string | yes | | |
| `variant` | `"accent"` \| `"ink"` | | `"accent"` | |

### `bullets`

36 px bullet list; item *k* enters at `at + k × step`.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | First item. |
| `items` | string[] | yes | | |
| `step` | number | | `0.6` | Seconds between items, ≥ 0. |
| `marker` | `"arrow"` \| `"dot"` | | `"arrow"` | |

### `chips`

Wrapping row of chips (26 px L / 28 px V); chip *k* enters at `at + k × step`.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | First chip. |
| `items` | string[] | yes | | |
| `step` | number | | `0.35` | Seconds between chips, ≥ 0. |
| `accent` | boolean | | `false` | Vermilion chips. |
| `mono` | boolean | | `false` | Monospace text. |

### `code`

Dark code card whose lines type in place. Flow size: L min(safe width, 1200) × 480, V safe width × 520; in `illustration` / `headline-illustration` layouts it takes the allocated height.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | Card entrance; set line cues at or after it. |
| `title` | string | | | File name in the header. |
| `charsPerSecond` | number | | `32` | Typing speed; positive and finite. |
| `lines` | `{ text, at, color? }[]` | yes | | May be empty. |
| `lines[].text` | string | yes | | Typed character by character. |
| `lines[].at` | At | yes | | Earliest typing start. |
| `lines[].color` | `"green"` \| `"soft"` \| `"dim"` | | cream | |

**Typing speed.** Lines type sequentially. With `fps` from the composition, line *i* starts at frame `max(end of line i−1, round(at × fps))` and ends `ceil(characters × fps / charsPerSecond)` frames later (characters are Unicode code points). The last line is complete at its end frame. Budget scene duration with `codeTypingSchedule(lines, fps, charsPerSecond)` from the bundled `code-card-timing.js`, which returns `{ characters, start, end }` per line in frames, plus any later block entrances. Example: 38 characters at 40 chars/s and 30 fps take `ceil(38 × 30 / 40) = 29` frames.

### `spacer`

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `h` | number \| `{ landscape, vertical }` | yes | | Empty height in px. |

### `screens`

A phone screen built piece by piece, then rebuilt on a new screen at every `again` cue.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `pieces` | `{ kind, at }[]` | yes | | |
| `pieces[].kind` | `"button"` \| `"input"` \| `"card"` | yes | | |
| `pieces[].at` | At | yes | | Placement. |
| `again` | At[] | | `[]` | Each cue starts a new screen. |
| `phoneScale` | number | | `1` | Phone size multiplier, > 0; capped against the box. |
| `sticker` | `{ text, at }` | | | Sticker on the pile. |
| `h` | number \| `{ landscape, vertical }` | | flow: 720 L / 1000 V; illustration layouts: allocated height | Block height px. |

### `catalog`

A catalogue sheet: interface pieces on the top row, design-token glyphs on a second row that unfolds.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | Sheet entrance. |
| `title` | string | | | Sheet heading. |
| `items` | `{ kind, label, at }[]` | yes | | `kind`: `"button"` \| `"input"` \| `"card"`. |
| `tokens` | `{ kind, label, at }[]` | | `[]` | `kind`: `"color"` \| `"type"` \| `"space"`. |
| `tokensAt` | At | | first token cue − 0.6 s | When the sheet unfolds. |
| `stamp` | `{ text, at }` | | | Stamp pressed on the sheet. |

Width: L min(safe width, 1200), V safe width.

### `propagate`

One source card fanning out to a grid of target screens; cues travel along the lines.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | Source entrance. |
| `label` | `{ text, at }` | | | Caption over the source. |
| `targets` | integer | | `6` | ≥ 1. Up to 6 in one row, then two rows. |
| `bug` | At | | | A defect badge appears on the source and every target. |
| `fix` | At | | | Fix departs; needs `fixed`. |
| `fixed` | At | | | Fix arrives; must be later than `fix`. |
| `recolor` | At | | | Recolor departs; needs `recolored`. |
| `recolored` | At | | | Recolor arrives; must be later than `recolor`. |
| `h` | number \| `{ landscape, vertical }` | | flow: 760 L / 1040 V; illustration layouts: allocated height | Block height px. |

A departure without its arrival (or the reverse) never animates.

### `shelf`

A pile of wide library cards, each on its own cue. Width: L min(safe width, 1100), V safe width.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `items` | `{ text, at, tone? }[]` | yes | | Top to bottom. |
| `items[].tone` | `"paper"` \| `"accent"` \| `"ink"` | | `"paper"` | `accent` for the card that is yours. |

### `twice`

A button, the same button again, and a vermilion cross over the second. Width: L min(safe width, 1000), V safe width.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | First button. |
| `second` | At | yes | | Duplicate button. |
| `strike` | At | | | Cross over the duplicate. |

### `brand`

The jbm brand lockup.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `at` | At | yes | | Entrance. |
| `tagline` | string | | | Line under the lockup. |
| `size` | number | | 52 L / 56 V | px. |

### `overlay`

A layer over the flow, filling the safe area: its blocks stack in their own column with the scene gap, so a late beat can take the middle of the screen after earlier blocks exit. It takes no layout space. `until` on the overlay fades the whole layer.

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `blocks` | Block[] | yes | | Any blocks, including `until`. |
| `valign` | `"top"` \| `"center"` | | `"center"` | |

## Composition: layouts, variants, and safe areas

`CompositionOptions` (in `composition`, or per orientation in `variants.landscape` / `variants.vertical`):

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `safeArea` | `"legacy"` \| `"full"` \| `"social"` \| `{ top, right, bottom, left }` | `"legacy"` | See the table below. |
| `layout` | `"flow"` \| `"hero"` \| `"headline-illustration"` \| `"illustration"` | `"flow"` | |
| `headlineRatio` | number | `0.25` | Strictly between 0 and 1. |
| `subjectScale` | number | `1` | > 0 and finite. |
| `gap` | number \| `{ landscape, vertical }` | scene `gap` | px. |
| `valign` | `"top"` \| `"center"` | scene `valign` | |
| `blocks` | Block[] | scene `blocks` | `variants` only: replaces the whole block list for that orientation (no index merge); anchors are shared. |

Resolution: options = `{ ...composition, ...variants[orientation] }`, key by key.

Layouts:

- `flow`: stack top to bottom; honors `valign` and `gap`.
- `hero`: centers the stack vertically. Set the headline's `size` and line breaks deliberately; text is not fitted.
- `headline-illustration`: exactly two blocks and no scene `title`. The first is the headline, the second the subject. The headline gets `(safe height − gap) × headlineRatio`, the subject the rest.
- `illustration`: exactly one subject block and no scene `title`; the subject gets the whole safe area.

In illustration layouts, `screens`, `propagate`, and `code` receive the allocated height (an explicit `h` on screens/propagate wins). `subjectScale` enlarges the subject while shrinking its logical box, so the footprint stays fixed; it applies to the subject only. Other blocks keep their intrinsic height. Nothing auto-fits, repairs overflow, or paginates.

Safe areas are canvas-pixel insets, **top / right / bottom / left**, on a 1920×1080 landscape or 1080×1920 vertical composition:

| Preset | Landscape | Vertical | Content box L / V |
| --- | --- | --- | --- |
| `legacy` (default) | 90 / 120 / 160 / 120 | 100 / 72 / 480 / 72 | 1680×830 / 936×1340 |
| `full` | 90 / 120 / 90 / 120 | 100 / 72 / 100 / 72 | 1680×900 / 936×1720 |
| `social` | 90 / 120 / 90 / 120 (falls back to `full`) | 160 / 160 / 320 / 72 | 1680×900 / 848×1440 |

`social` is a house preset that reserves caption and control space in portrait; it is not a guarantee for any platform, and in landscape it is identical to `full`. For edge to edge use `{ top: 0, right: 0, bottom: 0, left: 0 }`. Custom insets must be nonnegative finite numbers that leave a positive content area. `sceneGeometry(orientation, safeArea)` returns the content box `{ left, top, width, height }`.

Pass `showSafeArea` to `SceneFromSpec` for a dashed debug outline; omit it for final renders.

## Errors

`SceneFromSpec` and `resolveAt` throw `Error` synchronously while building the tree:

| Message | Cause |
| --- | --- |
| `scene <id>: bad anchor "<at>"` | String time does not match the anchor pattern. |
| `scene <id>: unknown anchor "<name>"` | Anchor not in `anchors`. |
| `scene <id>: non-finite time` | Numeric time is `NaN` or infinite. |
| `scene <id>: non-finite anchor "<at>"` | `host.resolve` returned a non-finite number. |
| `Invalid scene safe-area insets` | Negative or non-finite insets, or no content area left. |
| `subjectScale must be positive and finite` | |
| `headlineRatio must be between 0 and 1` | Includes 0 and 1 themselves. |
| `headline-illustration requires exactly two blocks and no title` | |
| `illustration requires exactly one block and no title` | |
| `gap must fit inside the safe area` | `gap < 0`, non-finite, or ≥ safe-area height. |

Components throw while rendering (inside Remotion):

| Message | Cause |
| --- | --- |
| `RangeError: charsPerSecond must be a positive finite number` | `code.charsPerSecond` ≤ 0 or non-finite. |
| `phoneScale must be positive and finite` | `screens.phoneScale`. |
| `RangeError: targets must be a positive integer` | `propagate.targets`. |
| `RangeError: Propagation arrival must be later than departure` | `fixed` ≤ `fix` or `recolored` ≤ `recolor`. |

The JSON Schema catches unknown block types, missing or misspelled fields, wrong value types, malformed anchor strings, and the numeric ranges above. It cannot check anchor names against `anchors`, block counts per layout, the `title` rule, the `gap` upper bound, the safe-area content box, or arrival-after-departure.

## Compose for the frame

Changing canvas dimensions alone is not portrait composition. Give each shot a focal subject, readable type at phone size, and intentional changes at narration beats. Review beginning, middle, and end frames in both orientations before rendering the full video. Check clipping, platform controls, caption space, and whether empty space serves the shot.

Existing specs keep their legacy top-to-bottom layout and safe area; opt into composition settings explicitly. A single scene (validated against `#/$defs/SceneSpec`):

```yaml
id: library
anchors:
  build: "una biblioteca"
composition:
  safeArea: full
  layout: headline-illustration
  subjectScale: 1.3
blocks:
  - { type: big, at: 0, text: "Una biblioteca.\nMuchas posibilidades.", align: center, size: 90 }
  - type: screens
    pieces:
      - { kind: card, at: build }
      - { kind: input, at: "build+0.3" }
      - { kind: button, at: "build+0.6" }
    phoneScale: 1.5
variants:
  vertical:
    headlineRatio: 0.23
    gap: 48
```

For `screens`, `phoneScale` grows the phone itself; non-default sizes are capped against the available box and the final pile dimensions. `subjectScale` instead scales fixed-size features and can leave responsive proportions unchanged. Inspect tilted edges and stickers as part of the frame review. No layout can infer visual storytelling from narration: author the visual beats and inspect their actual frames.

The gallery's Scene spec preview switches between the composition layouts, full/social safe areas, and optional guides, in landscape and portrait. The illustrated gallery timelines end at their final interpolation or spring-settling frame; input cursors are decorative blinks that freeze when playback finishes.

## Updating and verification

Existing scaffolded videos contain copied source: update their `src/jbm` files or reinstall the registry components to receive changes. Installing the registry does not update old copies.

- `node --test scripts/scene-spec.test.mjs` (Node 22.15+): anchor resolution, block compilation, and a strict consumer assembled from published registry dependencies (run `pnpm registry:build` first).
- `node --test scripts/scene-spec-schema.test.mjs`: the JSON Schema is current, every YAML example in this file parses with `js-yaml`, validates, and compiles in both orientations, and this reference lists every block and field in the schema.
- Change fields in `registry/jbm/motion/spec.ts` (JSDoc supplies schema descriptions, `@default`, and ranges), then run `pnpm contracts:build` and `pnpm registry:build`.
