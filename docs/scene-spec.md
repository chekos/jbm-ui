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

The gallery's Layout category shows one spec in both orientations. Existing scaffolded videos contain copied source: update their `src/jbm` files or reinstall the registry components to receive these changes. Installing the registry does not update old copies automatically.

Run `pnpm registry:build && node --test scripts/scene-spec.test.mjs` (Node 22.15+ or 24+) to check anchor resolution, block compilation, and a strict consumer assembled solely from published registry dependencies.
