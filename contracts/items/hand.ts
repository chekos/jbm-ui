import type { ItemContract } from "../schema"

export default {
  name: "hand",
  entry: "component",
  title: "Hand",
  description:
    "Static line-art hand in open-palm, pointing, or pinching pose, independent of placement and props.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Hand",
      kind: "component",
      summary:
        "Card-filled, ink-outlined hand drawn in a 30×29 viewBox. The pose swaps the silhouette only; it owns no position, rotation, folder, or timeline (use Mano from @jbm/mano for placement inside an SVG). Other SVG attributes pass through to the root <svg>.",
      props: {
        pose: "Silhouette: `open` (open palm, fingers together), `point` (index finger extended), or `pinch`. Also sets the accessible label, e.g. \"Hand: point\".",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 180, height: 174 },
    vertical: { width: 180, height: 174 },
    basis:
      "The 30×29 viewBox renders at width 180; height is auto from the aspect ratio (180 × 29/30 = 174). Pass `width` (the gallery uses 155) or style.width to scale; maxWidth is 100% of the container.",
  },
  examples: [
    {
      title: "Pinching hand",
      code: 'import { Hand } from "@/jbm/ui/hand"\n\n<Hand pose="pinch" width={160} />',
    },
    {
      title: "Place and rotate inside an SVG",
      code: 'import { Hand } from "@/jbm/ui/hand"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\n<Hand pose="open" width={120} />\n<svg viewBox="0 0 500 340">\n  <Mano at={{ x: 160, y: 30 }} pose="point" angle={12} />\n</svg>',
    },
  ],
  qa: [
    "Switch Pose through open, point, and pinch: each silhouette is centered in the same box and keeps simple geometric line art.",
    "Enlarge the open palm and inspect the finger joins: outer contour and interior dividers meet on the same centerline with the same stroke width.",
    "Check the card fill and ink stroke read on cream, and the aria-label follows the pose.",
    "Scale with width at narrow screens: the 30:29 aspect ratio holds.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
