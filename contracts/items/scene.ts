import type { ItemContract } from "../schema"

export default {
  name: "scene",
  entry: "component",
  title: "Scene",
  description: "Full-bleed cream canvas that fills its composition and clips overflow; one per scene.",
  category: "Layout",
  capabilities: ["player"],
  api: [
    {
      export: "Scene",
      kind: "component",
      summary:
        "Absolutely positioned div with inset 0, the canvas background color, and overflow hidden. Place one inside each Remotion Sequence and lay out blocks inside it.",
      props: {
        children: "Scene content; absolutely positioned children are placed relative to the scene.",
        style: "Inline styles merged last, e.g. flex centering or padding.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: "fill", height: 1080 },
    vertical: { width: "fill", height: 1920 },
    basis:
      "inset: 0 fills the positioned parent, which in a composition is the full stage: 1920×1080 in landscape and 1080×1920 in vertical (stage tokens in lib/tokens.ts).",
  },
  examples: [
    {
      title: "A headline on the canvas",
      code: 'import { Scene } from "@/jbm/motion/scene"\nimport { Big } from "@/jbm/ui/big" // install @jbm/big separately\n\n<Scene><Big>Una idea a la vez.</Big></Scene>',
    },
    {
      title: "Centered content",
      code: 'import { Scene } from "@/jbm/motion/scene"\n\n<Scene style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 120 }}>\n  {children}\n</Scene>',
    },
  ],
  qa: [
    "Check the canvas covers the full composition in both orientations with no white edge, and content outside it is clipped.",
    "The preview is a single still frame; confirm the background is the cream canvas token, not a hard-coded color.",
  ],
} satisfies ItemContract
