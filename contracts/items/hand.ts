import type { ItemContract } from "../schema"

export default {
  name: "hand",
  entry: "component",
  title: "Hand",
  description:
    "Static line-art hand in open-palm, pointing, pinching, gripping, typing, or holding pose, independent of placement and props.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Hand",
      kind: "component",
      summary:
        "Card-filled, ink-outlined hand drawn in a 30×29 viewBox. The pose swaps the silhouette only; it owns no position, rotation, folder, pen, or timeline (use Mano from @jbm/mano for placement inside an SVG, Pluma from @jbm/pluma for a held pen). Other SVG attributes pass through to the root <svg>.",
      props: {
        pose: "Silhouette: `open` (open palm, fingers together), `point` (index finger extended), `pinch` (index bent over the thumb; also the pen grip Pluma uses, so there is no pen pose), `grip` (all four fingers curled, as on a sheet or tab edge), `type` (four fingers down with the thumb tucked, resting on keys), or `hold` (side-on fist around a mug handle or object). Also sets the accessible label, e.g. \"Hand: point\".",
      },
    },
    {
      export: "handPoses",
      kind: "constant",
      summary:
        "Every pose name in gallery order: open, point, pinch, grip, type, hold. HandPose is its element type.",
    },
    {
      export: "handWrist",
      kind: "constant",
      summary:
        "Per pose, the straight wrist edge in the 30×29 viewBox as two points, thumb side first. The forearm leaves along its normal; Mano attaches its sleeve here.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 180, height: 174 },
    vertical: { width: 180, height: 174 },
    basis:
      "The 30×29 viewBox renders at width 180; height is auto from the aspect ratio (180 × 29/30 = 174). Pass `width` (the gallery uses 155) or style.width to scale; maxWidth is 100% of the container. Every pose shares the box and the wrist sits at its lower edge.",
  },
  examples: [
    {
      title: "Pinching hand",
      code: 'import { Hand } from "@/jbm/ui/hand"\n\n<Hand pose="pinch" width={160} />',
    },
    {
      title: "The four reader poses",
      code: 'import { Hand } from "@/jbm/ui/hand"\n\n<Hand pose="point" width={120} />\n<Hand pose="type" width={120} />\n<Hand pose="grip" width={120} />\n<Hand pose="hold" width={120} />',
    },
    {
      title: "Place and rotate inside an SVG",
      code: 'import { Hand } from "@/jbm/ui/hand"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\n<Hand pose="open" width={120} />\n<svg viewBox="0 0 500 340">\n  <Mano at={{ x: 160, y: 30 }} pose="point" angle={12} />\n</svg>',
    },
  ],
  qa: [
    "Switch Pose through all six: each silhouette sits in the same box with the wrist at the bottom and keeps simple geometric line art and the same outline weight.",
    "Enlarge the open palm, type, and grip poses and inspect the finger joins: outer contour and interior dividers meet on the same centerline with the same stroke width.",
    "Name each pose in one noun at gallery size: grip reads as a closed hand, type as fingers down, hold as a fist.",
    "Check the card fill and ink stroke read on cream, and the aria-label follows the pose.",
    "Scale with width at narrow screens: the 30:29 aspect ratio holds.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
