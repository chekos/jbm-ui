import type { ItemContract } from "../schema"

export default {
  name: "scene-spec",
  entry: "component",
  title: "SceneFromSpec",
  description:
    "Compiles a YAML-shaped scene spec into a Remotion scene for either orientation, with timed blocks, explicit layouts, orientation overrides, and configurable safe areas.",
  category: "Layout",
  capabilities: ["controls", "replay", "portrait", "player"],
  api: [
    {
      export: "SceneFromSpec",
      kind: "component",
      summary:
        "Renders one SceneSpec as a full-canvas Scene for one orientation. Blocks (big, stat-row, note, callout, bullets, chips, code, spacer, screens, catalog, propagate, shelf, twice, brand, overlay) stack inside the safe area with `gap` between them; `composition` and `variants[orientation]` choose the layout (flow, hero, headline-illustration, illustration), safe area, headline ratio, subject scale, and optional block overrides. Anchors resolve through `host.resolve`, text through `host.t`. It does not fit, shrink, or paginate content, and throws on invalid layouts, anchors, gaps, or insets. It does not validate the spec's shape (an unknown block type renders nothing): validate parsed YAML against the JSON Schema in `schemas` first. Every block, field, default, unit, and error is listed in the scene spec guide in `docs`.",
      props: {
        spec: "One parsed scene (SceneSpec): required id and blocks; optional anchors (needed only when a block time names an anchor), title, starts, composition, variants, gap, and valign. The compiler takes plain objects; parse YAML in the host (the guide uses js-yaml 4 `load`) and validate against #/$defs/SceneSpec of the JSON Schema.",
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
    { export: "SceneSpec", kind: "type", summary: "One scene: required id and blocks; optional anchors, title, starts, composition, variants, gap, valign." },
    { export: "ScenesFile", kind: "type", summary: "The parsed YAML file: `{ scenes: SceneSpec[] }`." },
    { export: "Block", kind: "type", summary: "Any block body plus an optional `until` exit cue." },
    { export: "CompositionOptions", kind: "type", summary: "safeArea, layout, headlineRatio, subjectScale, gap, valign, and an optional full blocks override." },
    { export: "SafeArea", kind: "type", summary: '"legacy" | "full" | "social" | explicit pixel insets { top, right, bottom, left }. Social applies to vertical only; in landscape it falls back to full (90/120/90/120).' },
    { export: "PerOrientation", kind: "type", summary: "`{ landscape, vertical }` pixel values, accepted wherever a size may differ per orientation (gap, spacer h, screens and propagate h)." },
    { export: "StatItem", kind: "type", summary: "One stat-row card: at, label, value, optional sub and valueColor." },
    { export: "Exit", kind: "type", summary: "The optional `until` cue every block accepts: fade out and drift up over 0.4 s." },
    { export: "BlockBody", kind: "type", summary: "The block union without `until`, discriminated by `type`." },
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
      code: 'import { SceneFromSpec } from "@/jbm/motion/compile"\nimport type { ScenesFile } from "@/jbm/motion/spec"\n\n// Placeholders: a parsed, schema-validated scenes file, and seconds from scene start per phrase.\ndeclare const scenes: ScenesFile\ndeclare const timings: Record<string, number>\n\nexport const FirstScene = () => (\n  <SceneFromSpec spec={scenes.scenes[0]} orientation="landscape"\n    host={{ resolve: (phrase) => timings[phrase] }} />\n)\n// Every block and field: https://jbm-ui.bns.studio/docs/scene-spec.md',
    },
    {
      title: "Headline and illustration, tuned for portrait",
      code: 'import type { SceneSpec } from "@/jbm/motion/spec"\n\nconst spec: SceneSpec = {\n  id: "library",\n  anchors: { build: "una biblioteca" },\n  composition: { safeArea: "full", layout: "headline-illustration", subjectScale: 1.3 },\n  variants: { vertical: { headlineRatio: 0.23, gap: 48 } },\n  blocks: [\n    { type: "big", at: 0, text: "Una biblioteca.\\nMuchas posibilidades.", align: "center", size: 90 },\n    { type: "screens", pieces: [{ kind: "card", at: "build" }, { kind: "button", at: "build+0.6" }], phoneScale: 1.5 },\n  ],\n}',
    },
    {
      title: "Parse, validate, and compile a YAML scenes file",
      code: 'import { load } from "js-yaml"\nimport Ajv2020 from "ajv/dist/2020"\nimport { SceneFromSpec } from "@/jbm/motion/compile"\nimport type { ScenesFile } from "@/jbm/motion/spec"\nimport schema from "./scene-spec.schema.json" // curl -o scene-spec.schema.json https://jbm-ui.bns.studio/schemas/scene-spec.json\n\n// Placeholders: the YAML source, seconds from scene start per phrase, and a translator.\ndeclare const yamlText: string\ndeclare const timings: Record<string, number>\ndeclare const translate: (text: string) => string\n\nconst validate = new Ajv2020({ allErrors: true }).compile(schema)\nconst data: unknown = load(yamlText)\nif (!validate(data)) throw new Error(JSON.stringify(validate.errors, null, 2))\nconst { scenes } = data as ScenesFile\n\nexport const FirstScene = () => (\n  <SceneFromSpec spec={scenes[0]} orientation="vertical"\n    host={{ resolve: (phrase) => timings[phrase], t: translate }} />\n)',
    },
    {
      title: "Multi-scene vertical composition",
      code: 'import { Composition, Series } from "remotion"\nimport { loadFont as loadGeist } from "@remotion/google-fonts/Geist"\nimport { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono"\nimport { load } from "js-yaml"\nimport Ajv2020 from "ajv/dist/2020"\nimport { SceneFromSpec } from "@/jbm/motion/compile"\nimport type { ScenesFile } from "@/jbm/motion/spec"\nimport schema from "./scene-spec.schema.json" // curl -o scene-spec.schema.json https://jbm-ui.bns.studio/schemas/scene-spec.json\n\n// npm install remotion @remotion/google-fonts js-yaml ajv (and @types/js-yaml).\n// Token font stacks fall back to the family names "Geist" and "Geist Mono" these load.\nloadGeist("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] })\nloadGeistMono("normal", { weights: ["400", "500"], subsets: ["latin"] })\n\nconst FPS = 30\nconst yamlText = `\nscenes:\n  - id: hook\n    anchors: { reveal: "hecha de piezas" }\n    blocks:\n      - { type: big, at: 0, text: "Una biblioteca." }\n      - { type: note, at: reveal, text: "Hecha de piezas." }\n  - id: pieces\n    composition: { safeArea: full, layout: illustration }\n    anchors: { build: "una pieza" }\n    blocks:\n      - type: screens\n        pieces:\n          - { kind: card, at: build }\n          - { kind: button, at: build+0.6 }\n`\n\n// No narration yet: a literal phrase → seconds (from its scene\'s start) table, and scene lengths.\nconst timings: Record<string, number> = { "hecha de piezas": 1.2, "una pieza": 0.8 }\nconst seconds: Record<string, number> = { hook: 4, pieces: 5 }\nconst resolve = (phrase: string) => {\n  const at = timings[phrase]\n  if (at === undefined) throw new Error(`No timing for "${phrase}"`)\n  return at\n}\n\nconst validate = new Ajv2020({ allErrors: true }).compile(schema)\nconst data: unknown = load(yamlText)\nif (!validate(data)) throw new Error(JSON.stringify(validate.errors, null, 2))\nconst { scenes } = data as ScenesFile\nconst frames = (id: string) => Math.round(seconds[id] * FPS)\n\n// One Series.Sequence per scene: each scene\'s times start at 0 inside its own sequence.\nexport const Explainer = () => (\n  <Series>\n    {scenes.map((spec) => (\n      <Series.Sequence key={spec.id} durationInFrames={frames(spec.id)}>\n        <SceneFromSpec spec={spec} orientation="vertical" host={{ resolve }} />\n      </Series.Sequence>\n    ))}\n  </Series>\n)\n\n// Register in your Remotion root (registerRoot). Use 1920×1080 with orientation="landscape".\nexport const RemotionRoot = () => (\n  <Composition\n    id="explainer-vertical"\n    component={Explainer}\n    width={1080}\n    height={1920}\n    fps={FPS}\n    durationInFrames={scenes.reduce((total, spec) => total + frames(spec.id), 0)}\n  />\n)',
    },
  ],
  qa: [
    "Switch the preview through hero, headline-illustration, and illustration layouts and full/social safe areas; inspect beginning, middle, and end frames in both landscape and portrait.",
    "Turn guides on to see the safe area, then confirm showSafeArea is off in final renders.",
    "Nothing auto-fits: check tall content (code, stat rows, long headlines) for overflow or clipping at the safe-area edges, especially in portrait.",
    "Exercise error paths: unknown anchors, headline-illustration with other than two blocks or with a title, and invalid gap or insets must throw with the scene id or a clear message.",
  ],
  docs: [
    { title: "Scene spec guide", url: "https://jbm-ui.bns.studio/docs/scene-spec.md" },
  ],
  schemas: [
    { title: "Scene spec JSON Schema", url: "https://jbm-ui.bns.studio/schemas/scene-spec.json" },
  ],
} satisfies ItemContract
