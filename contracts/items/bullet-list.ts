import type { ItemContract } from "../schema"

export default {
  name: "bullet-list",
  entry: "component",
  title: "BulletList",
  description: "Vertical list of short strings with a vermilion arrow or dot marker.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "BulletList",
      kind: "component",
      summary:
        "Flex column of rows; each row is 600-weight sans ink text with line-height 1.25, preceded by an accent → or an 18px accent dot, 16px apart. Pure React; `renderItem` lets you wrap each row, for example in a motion Pop.",
      props: {
        items: "Row strings in order. Each string is also the React key, so items must be unique.",
        marker: '"arrow" (vermilion →) or "dot" (18px vermilion circle).',
        size: "Font size of each row in stage pixels.",
        gap: "Vertical space between rows in stage pixels.",
        renderItem: "Optional wrapper called with each finished row node and its index; return the node to render (for example inside a Pop with a staggered `at`).",
        style: "Inline styles on the column, merged last; set width here in a scene.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Fills its container's width; height is n rows × size × 1.25 plus (n − 1) × gap, so three default rows are 3 × 45 + 2 × 16 = 167 stage px. Long items wrap and add lines.",
  },
  examples: [
    {
      title: "Arrow and dot lists",
      code: 'import { BulletList } from "@/jbm/ui/bullet-list"\n\n<BulletList size={28} items={["El contexto", "La pregunta", "La respuesta"]} />\n<BulletList size={28} marker="dot" items={["Simple", "Reusable", "Consistente"]} />',
    },
    {
      title: "Staggered entry in a video",
      code: 'import { BulletList } from "@/jbm/ui/bullet-list"\nimport { Pop } from "@/jbm/motion/pop" // install @jbm/pop separately\n\n<BulletList\n  items={["El contexto", "La pregunta"]}\n  renderItem={(node, i) => <Pop at={0.4 + i * 0.6} from="left" dist={14}>{node}</Pop>}\n/>',
    },
  ],
  qa: [
    "Compare arrow and dot markers: the dot stays vertically centered on the first line and the arrow is vermilion.",
    "Duplicate strings share a React key and trigger a warning; keep items unique.",
    "Check the full list height fits the safe area in portrait, where the scene compiler uses a 22px gap.",
    "With renderItem and Pop, step through the stagger and confirm every row ends fully visible.",
  ],
} satisfies ItemContract
