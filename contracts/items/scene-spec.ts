import type { ItemContract } from "../schema"

export default {
  name: "scene-spec",
  entry: "component",
  title: "Scene spec",
  description:
    "Compiles a YAML-shaped scene spec into a Remotion scene for either orientation, with timed blocks, explicit layouts, orientation overrides, and configurable safe areas.",
  category: "Layout",
  capabilities: ["controls", "replay", "portrait", "player"],
  api: [
    {
      export: "SceneFromSpec",
      kind: "component",
      summary:
        "Renders one SceneSpec as a full-canvas Scene for one orientation. Blocks (big, stat-row, note, callout, bullets, chips, code, spacer, screens, catalog, propagate, shelf, twice, brand, overlay) stack inside the safe area with `gap` between them; `composition` and `variants[orientation]` choose the layout (flow, hero, headline-illustration, illustration), safe area, headline ratio, subject scale, and optional block overrides. Anchors resolve through `host.resolve`, text through `host.t`. It does not fit, shrink, or paginate content, and throws on invalid layouts, anchors, gaps, or insets.",
      props: {
        spec: "Parsed scene (SceneSpec): id, anchors, blocks, and optional title, composition, variants, gap, and valign.",
        showSafeArea: "Draws a dashed vermilion outline of the safe area for debugging; leave off for final renders.",
        orientation: "landscape (for a 1920 × 1080 composition) or vertical (1080 × 1920); picks stage geometry, block sizes, and variants.",
        host: "Injected services: `resolve(phrase)` returns seconds from scene start for an anchor's narration phrase; optional `t(string)` translates on-screen text.",
      },
    },
    {
      export: "resolveAt",
      kind: "function",
      summary: 'Resolves a block time: a number of seconds, an anchor name, or an anchor with a signed offset such as "explain+0.2".',
      params: {
        at: "Seconds from scene start, or an anchor name with an optional +/- offset in seconds.",
        spec: "The scene whose `anchors` map names to narration phrases; its id appears in errors.",
        host: "Supplies `resolve(phrase)` in seconds.",
      },
      returns: "Seconds from scene start. Throws on malformed, unknown, or non-finite anchors.",
    },
    {
      export: "sceneGeometry",
      kind: "function",
      summary: "Safe-area rectangle in canvas pixels for an orientation and safe-area preset or custom insets.",
      params: {
        orientation: "landscape or vertical; selects stage[orientation].",
        safeArea: 'legacy (default; portrait bottom 480), full (portrait 100/72/100/72, landscape 90/120/90/120), social (portrait 160/160/320/72), or explicit { top, right, bottom, left } insets.',
      },
      returns: "{ left, top, width, height } in canvas pixels. Throws when insets are negative, non-finite, or leave no content area.",
    },
    { export: "Host", kind: "type", summary: "Timing and translation services injected by the video project: `resolve(phrase)` and optional `t(s)`." },
    { export: "SceneSpec", kind: "type", summary: "One scene: id, anchors, blocks, title, starts, composition, variants, gap, valign." },
    { export: "ScenesFile", kind: "type", summary: "The parsed YAML file: `{ scenes: SceneSpec[] }`." },
    { export: "Block", kind: "type", summary: "Any block body plus an optional `until` exit cue." },
    { export: "CompositionOptions", kind: "type", summary: "safeArea, layout, headlineRatio, subjectScale, gap, valign, and an optional full blocks override." },
    { export: "SafeArea", kind: "type", summary: '"legacy" | "full" | "social" | explicit pixel insets.' },
    { export: "SceneLayout", kind: "type", summary: '"flow" | "hero" | "headline-illustration" | "illustration".' },
    { export: "At", kind: "type", summary: "A time: anchor name (optionally with an offset) or seconds." },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 1920, height: 1080 },
    vertical: { width: 1080, height: 1920 },
    basis:
      "SceneFromSpec renders a Scene that fills its parent (position absolute, inset 0); use a 1920 × 1080 composition for landscape and 1080 × 1920 for vertical. Blocks lay out inside sceneGeometry(orientation, safeArea).",
  },
  examples: [
    {
      title: "Compile a parsed scene",
      code: 'import { SceneFromSpec } from "@/jbm/motion/compile"\nimport type { ScenesFile } from "@/jbm/motion/spec"\n\nconst scenes: ScenesFile = parsedYaml\n<SceneFromSpec spec={scenes.scenes[0]} orientation="landscape"\n  host={{ resolve: (phrase) => timings[phrase] }} />\n// See docs/scene-spec.md for blocks, layouts, and safe areas.',
    },
    {
      title: "Headline and illustration, tuned for portrait",
      code: 'import type { SceneSpec } from "@/jbm/motion/spec"\n\nconst spec: SceneSpec = {\n  id: "library",\n  anchors: { build: "una biblioteca" },\n  composition: { safeArea: "full", layout: "headline-illustration", subjectScale: 1.3 },\n  variants: { vertical: { headlineRatio: 0.23, gap: 48 } },\n  blocks: [\n    { type: "big", at: 0, text: "Una biblioteca.\\nMuchas posibilidades.", align: "center", size: 90 },\n    { type: "screens", pieces: [{ kind: "card", at: "build" }, { kind: "button", at: "build+0.6" }], phoneScale: 1.5 },\n  ],\n}',
    },
  ],
  qa: [
    "Switch the preview through hero, headline-illustration, and illustration layouts and full/social safe areas; inspect beginning, middle, and end frames in both landscape and portrait.",
    "Turn guides on to see the safe area, then confirm showSafeArea is off in final renders.",
    "Nothing auto-fits: check tall content (code, stat rows, long headlines) for overflow or clipping at the safe-area edges, especially in portrait.",
    "Exercise error paths: unknown anchors, headline-illustration with other than two blocks or with a title, and invalid gap or insets must throw with the scene id or a clear message.",
  ],
} satisfies ItemContract
