import type { ItemContract } from "../schema"

export default {
  name: "ui-card",
  entry: "component",
  title: "UiCard",
  description: "Illustrated content card with a line-art picture (hills and a vermilion sun) over two text bars.",
  category: "UI Bits",
  family: "Interface bits",
  capabilities: [],
  api: [
    {
      export: "UiCard",
      kind: "component",
      summary:
        "Cream paper card with an ink outline: an SVG picture slot taking half the height, then an ink title bar and a lighter subtitle bar. Padding (7% of w), radius (8% of w), and gaps (7% of h) all scale with the box. Pure React; static.",
      props: {
        w: "Width in stage pixels, including the 2px Paper edge; sets padding, radius, and bar widths.",
        h: "Height in stage pixels; the picture is 50% of it and the bar thicknesses follow it.",
        style: "Inline styles merged over the card's column layout; use for positioning or opacity.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 220, height: 170 },
    vertical: { width: 220, height: 170 },
    basis:
      "Fixed w × h box (border-box) at the defaults 220 × 170. `w` and `h` set it directly; the Paper shadow extends below the box.",
  },
  examples: [
    {
      title: "Card at its default size",
      code: 'import { UiCard } from "@/jbm/ui/ui-card"\n\n<UiCard w={220} h={170} />',
    },
    {
      title: "Card inside a phone",
      code: 'import { UiCard } from "@/jbm/ui/ui-card"\nimport { PhoneFrame } from "@/jbm/ui/phone-frame" // install @jbm/phone-frame separately\n\n<PhoneFrame w={200} h={360} gap={14}>\n  <UiCard w={130} h={100} />\n</PhoneFrame>',
    },
  ],
  qa: [
    "Inspect the picture slot: the picture width is computed as w minus padding without the 2px edges, so it may sit about 2px right of centre; confirm this is acceptable at large w.",
    "Try a short, wide card (h well below 0.7 × w): the picture, gaps, and two bars must still fit inside the fixed height.",
    "Check the single vermilion sun stays the only accent when the card sits next to other accent pieces.",
  ],
} satisfies ItemContract
