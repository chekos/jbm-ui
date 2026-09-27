import type { ItemContract } from "../schema"

export default {
  name: "card",
  entry: "component",
  title: "Card",
  description: "Raised surface with a fine border, layered depth, and inset edge light.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Card",
      kind: "component",
      summary:
        "Card-stock (or dark) container with the shared surface border, card shadow, 28px radius, and 40px padding.",
      props: {
        children: "Card content.",
        style: "Inline styles merged last; use for width, height, or layout, not for new shadows.",
        dark: "Uses the dark code-card fill with the dark border and shadow tokens.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fills its container and height follows the children. The card adds 40px padding and a 1px border on each side (82 stage pixels over the content); set style.width or style.height for a fixed box.",
  },
  examples: [
    {
      title: "Dark card with a headline",
      code: 'import { Card } from "@/jbm/ui/card"\nimport { color } from "@/jbm/lib/tokens"\nimport { Big } from "@/jbm/ui/big" // install @jbm/big separately\n\n<Card dark><Big color={color.bg}>Surface</Big></Card>',
    },
  ],
  qa: [
    "Compare the light and dark surfaces on cream: fine border, layered shadow, and the inset highlight on the upper edge.",
    "Check that content-driven height plus the 82px of padding and border still fits the safe area.",
  ],
  docs: [
    { title: "Surface depth guide", url: "https://jbm-ui.bns.studio/docs/surface-depth.md" },
  ],
} satisfies ItemContract
