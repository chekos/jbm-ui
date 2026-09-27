import type { ItemContract } from "../schema"

export default {
  name: "tear",
  entry: "component",
  title: "Tear",
  description:
    "A sheet torn into strips along seams: controlled progress moves each strip to its own destination, with frayed, seeded edges at every seam.",
  category: "UI Bits",
  family: "Paper & writing",
  capabilities: ["controls"],
  api: [
    {
      export: "Tear",
      kind: "component",
      summary:
        "A w × h Paper-style sheet cut at `seams` into strips. At progress 0 the strips tile the sheet exactly and no seam shows; as progress rises each strip translates and turns toward its destination, its frayed seam edges fade in over its first 5% of travel, and the sheet's shadow hands over to per-strip shadows. Writing is laid out once on the whole sheet and clipped to each strip. Pure React, controlled, and deterministic per frame.",
      props: {
        w: "Sheet width in stage px.",
        h: "Sheet height in stage px.",
        seams: "Seam y positions in stage px from the top; n usable seams make n + 1 strips. Non-finite values, seams closer than frayReach(fray) + 4 to an edge, and seams closer than twice that to the previous seam are dropped (see tearSeams).",
        progress: "0 = the whole sheet, 1 = every strip at its destination. Clamped and linear; ease it yourself.",
        pieces: "Destinations top to bottom: `{ to: { x, y, rotate } }`, an offset in stage px from the strip's place in the whole sheet and a turn in degrees about the strip's centre. A missing entry or field stays put.",
        stagger: "Delay between strips as a share of progress: strip i starts at i × stagger and all finish at 1. Capped at 0.9 / (strips − 1).",
        seed: "Fray pattern. Paper's starting tear with the same seed, seam y, and w follows the same edge.",
        fray: "Fray amplitude in stage px (default FRAY, 6); edges stay within 1.8 × fray of the seam.",
        tone: '"paper" (card fill, ink edge), "accent", or "ink", as in Paper.',
        radius: "Corner radius of the sheet's four outer corners in stage px; strips keep square corners at seams.",
        edge: "Draws the 2px outline on straight edges and, once torn, on frayed edges.",
        shadow: "Paper shadow for the sheet and then each strip.",
        children:
          "The sheet's writing on the whole w × h sheet, clipped to each strip. A node is repeated in every strip; a function `({ index, top, bottom, progress }) => node` is called per strip (coordinates are the sheet's). Copies after the first strip are aria-hidden.",
        contentStyle: "Styles for the w × h content layer each strip clips, for padding or layout.",
        style: "Inline styles merged onto the w × h root.",
      },
    },
    {
      export: "tearGeometry",
      kind: "function",
      summary:
        "Outlines for every strip in sheet coordinates. Neighbouring strips share the identical frayed polyline, so together they cover the sheet exactly; with an edge the straight sides sit 1px in, on the centreline of Paper's 2px border.",
      params: {
        w: "Sheet width in stage px.",
        h: "Sheet height in stage px.",
        seams: "Seam y positions; filtered by tearSeams.",
        seed: "Fray pattern; default 1.",
        fray: "Fray amplitude; default FRAY.",
        radius: "Outer corner radius; default 22.",
        edge: "Insets the straight sides by 1px for a 2px stroke; default true.",
      },
      returns:
        "One `{ index, top, bottom, outline, edges, seamAbove, seamBelow, center }` per strip: SVG path data for the closed outline, the straight edges, and each frayed seam (null at the sheet's top or bottom), plus the rotation centre.",
    },
    {
      export: "tearSeams",
      kind: "function",
      summary: "The seams Tear uses, from the ones you pass.",
      params: {
        h: "Sheet height in stage px.",
        seams: "Candidate seam y positions.",
        fray: "Fray amplitude; default FRAY.",
      },
      returns:
        "Finite seams, sorted, at least frayReach(fray) + 4 inside the sheet and at least twice that apart, so frayed edges never cross each other or the sheet's edge.",
    },
    {
      export: "tearPieceProgress",
      kind: "function",
      summary: "One strip's own travel after stagger.",
      params: {
        progress: "0–1 overall progress.",
        index: "Strip index, top to bottom.",
        count: "Number of strips.",
        stagger: "Share of progress between strip starts; default 0.",
      },
      returns: "0–1: clamp((progress − index × stagger) / (1 − stagger × (count − 1))).",
    },
    { export: "TearProps", kind: "type", summary: "Props of Tear." },
    { export: "TearPiece", kind: "type", summary: "`{ to?: TearDestination }`, one entry of `pieces`." },
    {
      export: "TearDestination",
      kind: "type",
      summary: "`{ x?: number; y?: number; rotate?: number }`: offset in stage px and turn in degrees.",
    },
    {
      export: "TearPieceInfo",
      kind: "type",
      summary: "`{ index, top, bottom, progress }`, what a render-prop child receives per strip.",
    },
    { export: "TearGeometry", kind: "type", summary: "One strip from tearGeometry." },
  ],
  stage: {
    mode: "fluid",
    reason:
      "The root is exactly w × h stage px, the size of the whole sheet; strips move by their destinations beyond it without changing layout, so leave room for the largest offset plus about 20px of shadow. The gallery uses a 520 × 760 sheet with offsets up to 72px on a 760 × 960 stage.",
  },
  examples: [
    {
      title: "A long page tearing into four register strips",
      code: 'import { Tear } from "@/jbm/ui/tear"\n\n// progress comes from your timeline, e.g. interpolate(frame, [0, 45], [0, 1]).\n<Tear\n  w={520}\n  h={760}\n  radius={10}\n  seams={[190, 380, 570]}\n  progress={0.6}\n  stagger={0.1}\n  pieces={[\n    { to: { x: -40, y: -70, rotate: -5 } },\n    { to: { x: 36, y: -24, rotate: 3 } },\n    { to: { x: -30, y: 24, rotate: -2 } },\n    { to: { x: 34, y: 72, rotate: 3 } },\n  ]}\n>\n  {({ index, top }) => (\n    <div style={{ position: "absolute", left: 40, top: top + 32 }}>strip {index + 1}</div>\n  )}\n</Tear>',
    },
    {
      title: "Continue a Paper's starting tear",
      code: 'import { Paper } from "@/jbm/ui/paper"\nimport { Tear } from "@/jbm/ui/tear"\n\n// The same seed, seam, and width give the same frayed edge in both.\nexport function Page({ torn }: { torn: boolean }) {\n  return torn ? (\n    <Tear w={520} h={760} radius={10} seams={[380]} progress={0.4} pieces={[{ to: { y: -40, rotate: -3 } }, { to: { y: 40, rotate: 4 } }]} />\n  ) : (\n    <Paper w={520} h={760} radius={10} tension={1} seam={380} />\n  )\n}',
    },
  ],
  qa: [
    "At Tear 0 the sheet must look whole: no seam line, hairline, or shadow between strips. Compare it with a plain Paper of the same size and radius.",
    "Drag Tear through 0.02, 0.05, 0.5, and 1: seam edges fade in as the strips part, each strip keeps its frayed edges, and later strips overlap earlier ones.",
    "At 2× zoom check where a frayed seam meets a straight side: the lines join on one centreline with the same 2px width.",
    "Step Seams from 1 to 6 and Fray seed from 1 to 9: frayed edges never cross each other or the sheet's edge, and the pattern changes only with the seed.",
    "Set Stagger to 0 and 0.3: every strip still reaches its destination at progress 1.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
