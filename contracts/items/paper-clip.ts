import type { ItemContract } from "../schema"

export default {
  name: "paper-clip",
  entry: "component",
  title: "PaperClip",
  description: "Independent ink wire clip to lay across a paper edge.",
  category: "UI Bits",
  family: "Tape, clips & marks",
  capabilities: [],
  api: [
    {
      export: "PaperClip",
      kind: "component",
      summary:
        "Decorative (aria-hidden) wire clip: one 3px round-capped ink stroke in a 34×62 viewBox. It does not own the paper; position it over an edge yourself. All SVG attributes pass through to the root <svg>, so width, height, and style (e.g. absolute positioning) are set by the caller.",
      props: {},
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 26, height: 48 },
    vertical: { width: 26, height: 48 },
    basis:
      "Default width 26 and height 48 attributes on a 34×62 viewBox. Override width and height together to scale (the gallery shows 50×92); the viewBox keeps the drawing's proportions.",
  },
  examples: [
    {
      title: "Clip across a card edge",
      code: 'import { PaperClip } from "@/jbm/ui/paper-clip"\n\n<div style={{ position: "relative", width: 220, height: 120, background: "white" }}>\n  <PaperClip style={{ position: "absolute", left: 18, top: -24 }} />\n</div>',
    },
  ],
  qa: [
    "Inspect the loop at default and enlarged sizes: the single stroke has round caps and even width.",
    "Place it over a paper edge and check the part above the edge reads as clipped on, not floating.",
    "Confirm it stays aria-hidden and adds no focusable element.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
