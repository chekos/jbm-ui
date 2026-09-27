import type { ItemContract } from "../schema"

export default {
  name: "label",
  entry: "component",
  title: "Label",
  description: "Uppercase, tracked, muted kicker that names a scene or page section.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Label",
      kind: "component",
      summary:
        "Block-level Geist sans kicker at 26px, weight 600, 4px letter spacing, uppercase, in the dim token color. Sits top-left of a scene or above a section.",
      props: {
        children: "Kicker text; rendered uppercase regardless of the source casing.",
        style: "Inline styles merged last; override color (for example color.soft on dark cards) or fontSize here.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "A block div that fills its container's width. One line is 26px type at the font's normal line height (not set explicitly, so the exact height depends on Geist's metrics); long text wraps and adds lines.",
  },
  examples: [
    {
      title: "Section kicker",
      code: 'import { Label } from "@/jbm/ui/label"\n\n<Label>Una idea a la vez</Label>',
    },
    {
      title: "On a dark card",
      code: 'import { Label } from "@/jbm/ui/label"\nimport { color } from "@/jbm/lib/tokens"\n\n<Label style={{ color: color.soft }}>Dark</Label>',
    },
  ],
  qa: [
    "Confirm the text renders uppercase with visible tracking in the dim color on cream.",
    "Check a long kicker wraps cleanly inside the safe area, and that style overrides (color on dark surfaces) keep readable contrast.",
  ],
} satisfies ItemContract
