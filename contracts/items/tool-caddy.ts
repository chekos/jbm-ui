import type { ItemContract } from "../schema"

export default {
  name: "tool-caddy",
  entry: "component",
  title: "ToolCaddy",
  description: "An empty divided desktop organizer.",
  category: "UI Bits",
  family: "Desk objects",
  capabilities: [],
  api: [
    {
      export: "ToolCaddy",
      kind: "component",
      summary:
        "SVG <g> of an empty desktop organizer in three-quarter view: card front, darker side and back, an ink opening, and a carry handle rising above the rim. Tools are separate objects placed by the caller. Render inside an <svg>.",
      props: {
        x: "Left edge in the parent SVG's user units.",
        y: "Top of the rim in parent SVG units; the handle rises 36 × (w / 240) above it.",
        w: "Width in parent SVG units; the whole drawing scales uniformly by w / 240, including stroke width.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 240, height: 200 },
    vertical: { width: 240, height: 200 },
    basis:
      "Parent SVG user units at w 240: from the handle top at y − 36 to the base at y + 164. Everything scales by w / 240 (300 wide is 250 tall). Place y at least 36 × w / 240 below the viewBox top.",
  },
  examples: [
    {
      title: "Empty caddy",
      code: 'import { ToolCaddy } from "@/jbm/motion/tool-caddy"\n\n<svg viewBox="0 0 400 250">\n  <ToolCaddy x={80} y={40} />\n</svg>',
    },
  ],
  qa: [
    "The gallery preview is a still at w 300; there are no controls to exercise.",
    "Check the handle is fully inside the viewBox (it sits above y) and its gap reads as a hole.",
    "Scale w up and down: the 2px ink stroke scales with the drawing, so thin or thick edges at extreme sizes are expected; confirm they still match nearby objects.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
