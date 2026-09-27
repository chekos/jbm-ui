import type { ItemContract } from "../schema"

export default {
  name: "ui-button",
  entry: "component",
  title: "UiButton",
  description: "Illustrated pill button with a label bar, in ink, accent, or outlined paper tones.",
  category: "UI Bits",
  family: "Interface bits",
  capabilities: [],
  api: [
    {
      export: "UiButton",
      kind: "component",
      summary:
        "Paper cut-out pill (radius h / 2) with a centred rounded bar standing in for the label. The bar is 42% of the width and 13% of the height (at least 6px); it is cream on ink and accent, ink on paper. Pure React with no text and no click handling: an illustration, not a control.",
      props: {
        w: "Width in stage pixels, including the 2px Paper edge.",
        h: "Height in stage pixels; also sets the pill radius (h / 2) and the label bar thickness.",
        tone: "Paper stock: ink (default, filled), accent (vermilion), or paper (cream with an ink outline and ink bar).",
        style: "Inline styles merged over the flex centring; use for positioning, opacity, or transforms.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 220, height: 70 },
    vertical: { width: 220, height: 70 },
    basis:
      "Fixed w × h box (border-box, so the 2px edge is inside) at the defaults 220 × 70. `w` and `h` set it directly; the Paper shadow extends past the box by up to about 32px below.",
  },
  examples: [
    {
      title: "Accent button",
      code: 'import { UiButton } from "@/jbm/ui/ui-button"\n\n<UiButton w={220} h={70} tone="accent" />',
    },
    {
      title: "Outlined button in a paper row",
      code: 'import { UiButton } from "@/jbm/ui/ui-button"\n\n<div style={{ display: "flex", gap: 24 }}>\n  <UiButton w={180} h={56} tone="paper" />\n  <UiButton w={180} h={56} />\n</div>',
    },
  ],
  qa: [
    "Compare ink, accent, and paper tones on cream: the paper tone keeps its 2px ink outline and ink bar; ink and accent show a cream bar.",
    "Check extremes of h: at small heights the bar floors at 6px thick; at large heights the pill stays fully rounded.",
    "Confirm the bar stays centred when style adds padding or positioning.",
  ],
} satisfies ItemContract
