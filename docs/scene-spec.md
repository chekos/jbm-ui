# Scene specs

Install `@jbm/scene-spec` to receive `SceneFromSpec`, the `SceneSpec` / `ScenesFile` types, and their component dependencies. The compiler consumes a parsed object; YAML parsing, narration timing, translation, composition dimensions, and scene duration belong to the video project.

```yaml
scenes:
  - id: example
    anchors:
      explain: "Una idea a la vez"
    blocks:
      - type: big
        at: 0
        text: "Una idea a la vez."
      - type: code
        at: explain
        title: hello.ts
        charsPerSecond: 24
        lines:
          - text: 'const idea = "simple";'
            at: explain
          - text: 'render(idea);'
            at: explain+0.5
            color: soft
```

```tsx
import { SceneFromSpec } from "./jbm/motion/compile";
import type { ScenesFile } from "./jbm/motion/spec";

// Parse scenes.yaml in the host, then supply one scene inside its Sequence.
const scenes: ScenesFile = parsedYaml;
<SceneFromSpec
  spec={scenes.scenes[0]}
  orientation="landscape"
  host={{ resolve: phrase => secondsFromSceneStart(phrase), t: translate }}
/>;
```

Use a 1920×1080 composition for landscape and 1080×1920 for vertical. Blocks flow top to bottom inside `stage[orientation]` safe-area coordinates. Author content to fit the available height; the compiler does not automatically paginate or shrink overflowing content. `gap` and spacer `h` accept a number or `{ landscape, vertical }`.

Supported blocks: `big`, `stat-row`, `note`, `callout`, `bullets`, `chips`, `code`, `spacer`. Stat rows become stacked row-mode cards in vertical. Displayed strings pass through optional `host.t`; named anchors map to narration phrases and pass through `host.resolve`. Numeric times are seconds relative to the scene, including code-line times; strings accept anchor names and signed offsets such as `explain+0.2` or `explain-0.5`. Invalid or unresolved anchors throw with the scene ID.

Code blocks forward optional `charsPerSecond` to CodeCard (default 32); use a positive finite value. Line times are earliest starts, and lines type sequentially. The code block's `at` controls its card entrance; set line cues at or after that entrance. Budget scene duration using `codeTypingSchedule` from the bundled `code-card-timing.js`, including its terminal frame and any other block entrances. Code text is typed in place.

The gallery's Layout category shows explicit compositions in both orientations. Existing scaffolded videos contain copied source: update their `src/jbm` files or reinstall the registry components to receive these changes. Installing the registry does not update old copies automatically.

Run `pnpm registry:build && node --test scripts/scene-spec.test.mjs` (Node 22.15+ or 24+) to check anchor resolution, block compilation, and a strict consumer assembled solely from published registry dependencies.

## Illustrated blocks and exits

`paper` and `ui-bits` provide pure React cut-out surfaces and interface illustrations. The motion registry adds:

- `screens`: `pieces` with kind/anchor, optional `again` cues and `sticker`; optional per-orientation `h`.
- `catalog`: anchored interface `items`, optional `tokens`, `tokensAt`, title, and stamp.
- `propagate`: a source and positive integer `targets`; optional bug, fix/fixed, recolor/recolored pairs. Arrival must be later than departure; pulses follow those exact times, even for trips shorter than 0.3 seconds.
- `shelf`: labeled library cards with anchored entrances and optional paper/accent/ink tones.
- `twice`: first button `at`, `second`, and optional `strike` cue.
- `brand`: an anchored brand lockup with optional tagline and size.
- `overlay`: a separate safe-area layer containing nested blocks; `valign` defaults to center.

Any block can use `until` to fade out and drift upward over 0.4 seconds. Flow blocks retain their layout space after exiting; overlays remain outside the flow even when they exit. Scene `valign: center` centers the main stack, and big blocks accept `align: center` plus line breaks. Anchors and translations follow the same rules as other blocks.

The illustrated gallery timelines end at their final interpolation or spring-settling frame. Input cursors are decorative timeline blinks and freeze when playback finishes.

## Compose for the frame

Changing canvas dimensions alone is not portrait composition. Give each shot a focal subject, readable type at phone size, and intentional changes at narration beats. Review beginning, middle, and end frames in both orientations before rendering the full video. Check clipping, platform controls, caption space, and whether empty space serves the shot.

Existing specs keep their legacy top-to-bottom layout and safe area. Opt into new composition settings explicitly:

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

`variants.landscape` and `variants.vertical` override shared composition options. An optional `blocks` override replaces the complete block list, preserving shared anchors and translation. Use it to change wording, text size, ordering, or illustration selection for an orientation. It does not merge blocks by index.

Layouts:

- `flow`: existing stack; honors `valign` and `gap`.
- `hero`: centers the stack; set the headline's `size` and line breaks deliberately. It does not automatically fit text.
- `headline-illustration`: exactly two blocks, no scene `title`. First is the headline; second is the subject. `headlineRatio` reserves a fraction of usable height (default 0.25), with the gap subtracted first.
- `illustration`: exactly one subject block, no scene `title`; uses the available area.

In illustration layouts, `screens`, `propagate`, and `code` receive the allocated height (explicit `h` on screens/propagate wins). `subjectScale` enlarges the subject while reducing its logical rendering box so the allocated footprint stays fixed. It applies to the subject only, not the headline. Other blocks keep their intrinsic height; there is no automatic text fitting, overflow repair, or pagination. Large content and explicit heights still require visual inspection. Exit cues retain flow space; use overlays or separate scenes for replacement beats.

Safe areas use pixel insets on the expected 1920×1080 or 1080×1920 composition:

| Preset | Portrait insets: top / right / bottom / left |
| --- | --- |
| `legacy` (default) | 100 / 72 / 480 / 72 |
| `full` | 100 / 72 / 100 / 72 |
| `social` | 160 / 160 / 320 / 72 |

`full` keeps modest editorial margins; for true edge-to-edge use `{ top: 0, right: 0, bottom: 0, left: 0 }`. `social` is a house preset for reserving caption/control space, not a guarantee for any platform. Landscape full/social use 90 / 120 / 90 / 120. Custom insets must be nonnegative finite numbers and leave a positive content area.

The gallery's Scene spec preview switches between the three composition layouts, full/social safe areas, and optional guides, displaying landscape and portrait side by side. Pass `showSafeArea` to `SceneFromSpec` for a debug outline; omit it for final renders. No layout can infer visual storytelling from narration: author the visual beats and inspect their actual frames. Reinstall or update copied components in existing video projects to receive this API.

For `screens`, `phoneScale` grows the phone itself (default 1); for example use `phoneScale: 1.5` in the subject block above. Non-default sizes are capped against the available box and the final pile dimensions. This differs from `subjectScale`, which scales fixed-size features but can leave responsive proportions unchanged. Inspect any tilted edges and stickers as part of the frame review.
