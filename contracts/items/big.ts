import type { ItemContract } from "../schema"

export default {
  name: "big",
  entry: "component",
  title: "Big",
  description: "Display heading in Geist at weight 800 with tight tracking.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Big",
      kind: "component",
      summary:
        "Block-level display heading: Geist sans, weight 800, line-height 1.05, -2px letter spacing, ink by default. Children may include line breaks and accent spans.",
      props: {
        children: "Heading content; use <br /> for deliberate line breaks and a span with color.accent for the one accent word.",
        size: "Font size in stage pixels; 56 to 170 in practice.",
        color: "Text color; defaults to ink. Use color.bg on dark surfaces.",
        style: "Inline styles merged last, for example textAlign or maxWidth.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: "fill", height: 101 },
    vertical: { width: "fill", height: 101 },
    basis:
      "One line at the default size 96 with line-height 1.05: 96 × 1.05 ≈ 101 stage px. Height is lines × size × 1.05; the block div fills its container's width and wraps long text.",
  },
  examples: [
    {
      title: "Headline with an accent phrase",
      code: 'import { Big } from "@/jbm/ui/big"\nimport { color } from "@/jbm/lib/tokens"\n\n<Big size={76}>\n  Ideas que<br />\n  <span style={{ color: color.accent }}>se entienden.</span>\n</Big>',
    },
    {
      title: "Cream heading on a dark card",
      code: 'import { Big } from "@/jbm/ui/big"\nimport { color } from "@/jbm/lib/tokens"\nimport { Card } from "@/jbm/ui/card" // install @jbm/card separately\n\n<Card dark><Big size={48} color={color.bg}>Surface</Big></Card>',
    },
  ],
  qa: [
    "Check the largest size used still fits the safe area in both orientations; portrait usually needs a smaller size or manual line breaks.",
    "Confirm tight tracking does not collide glyphs at small sizes (below about 56px) and only one span uses the accent.",
  ],
} satisfies ItemContract
