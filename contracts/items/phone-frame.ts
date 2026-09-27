import type { ItemContract } from "../schema"

export default {
  name: "phone-frame",
  entry: "component",
  title: "PhoneFrame",
  description: "Phone silhouette with a thick ink edge and speaker slot that stacks your content at the bottom of its screen.",
  category: "UI Bits",
  capabilities: [],
  api: [
    {
      export: "PhoneFrame",
      kind: "component",
      summary:
        "Card-stock phone with an ink edge (1.6% of w, at least 5px), corner radius 13% of w, the paper shadow, and a speaker slot near the top. Children lay out as a centred column pushed to the bottom of the screen (justify flex-end). Content is not clipped or scaled to fit.",
      props: {
        w: "Width in stage pixels, including the edge; sets edge thickness, radius, padding (10% of w, plus 8% extra on top), and the speaker slot.",
        h: "Height in stage pixels, including the edge.",
        rotate: "Tilt in degrees; applied as a CSS rotate, so the layout box stays w × h.",
        children: "Screen content, stacked as a column from the bottom up.",
        style: "Inline styles merged last; can override padding, alignment, or transform.",
        gap: "Space between children in stage pixels.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 420, height: 780 },
    vertical: { width: 420, height: 780 },
    basis:
      "Fixed w × h box (border-box) at the defaults 420 × 780. `w` and `h` set it directly; `rotate` tilts it visually without changing the layout box, and the shadow extends below.",
  },
  examples: [
    {
      title: "Phone holding interface pieces",
      code: 'import { PhoneFrame } from "@/jbm/ui/phone-frame"\nimport { UiCard } from "@/jbm/ui/ui-card" // install @jbm/ui-card separately\nimport { UiButton } from "@/jbm/ui/ui-button" // install @jbm/ui-button separately\n\n<PhoneFrame w={200} h={360} gap={14} rotate={-2}>\n  <UiCard w={130} h={100} />\n  <UiButton w={130} h={40} />\n</PhoneFrame>',
    },
  ],
  qa: [
    "Fill the screen with children taller than the inner area: they overflow the top edge (nothing clips), so size content to h minus the padding.",
    "Check small w: the edge floors at 5px and the speaker slot at 5px tall.",
    "Rotate by a few degrees and confirm corners and shadow stay inside the composition's safe area.",
  ],
} satisfies ItemContract
