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
        pose: "Silhouette: `open` (open palm, fingers together), `point` (index finger extended), `pinch` (index bent over the thumb; also the pen grip Pluma uses, so there is no pen pose), `grip` (front view, the four fingers curled to knuckle-height bumps and the thumb folded across the palm: the grabbing hand; lay the bumps over a sheet or tab edge), `type` (the open palm with the fingers foreshortened and the thumb tucked beside the index; turn it 180° over a keyboard so the fingertips rest on the home row), or `hold` (side-on fist: the four fingers stacked and pointing left, the thumb resting across the top; the fingers wrap a mug handle). Also sets the accessible label, e.g. \"Hand: point\".",
        halo: "Knock the hand out of what it overlaps: a card ring half the outline wide just outside the contour, so ink art passing behind the hand (a pen barrel, a thread) never fuses with its outline. Default false.",
      },
    },
    {
      export: "handPoses",
      kind: "constant",
      summary:
        "Every pose name in gallery order: open, point, pinch, grip, type, hold. HandPose is its element type.",
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
    "Enlarge the open palm, grip, type, and hold poses and inspect the finger joins: outer contour and interior dividers meet on the same centerline with the same stroke width, and grip, type, and hold keep the open palm's wrist cut and palm base exactly.",
    "Name each pose at gallery size: grip reads as a grabbing hand (curled fingers, thumb across the palm), hold as a fist holding something from the side (thumb over the top). type alone reads as a relaxed flat hand; it reads as typing only when turned 180° over a DeskProp keyboard.",
    "Check the card fill and ink stroke read on cream, and the aria-label follows the pose.",
    "Scale with width at narrow screens: the 30:29 aspect ratio holds.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
