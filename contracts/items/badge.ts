import type { ItemContract } from "../schema"

export default {
  name: "badge",
  entry: "component",
  title: "Badge",
  description: "Round check or cross badge in accent, ink, or paper tones for fixed and broken states.",
  category: "UI Bits",
  capabilities: [],
  api: [
    {
      export: "Badge",
      kind: "component",
      summary:
        "Circle with the paper shadow and a stroked check or cross (55% of the size). Accent and ink fills draw a cream mark; paper draws an ink mark with a 2px ink outline. Static; animate it by wrapping or via style.",
      props: {
        kind: "Mark to draw: check (fixed) or x (broken).",
        size: "Diameter in stage pixels.",
        tone: "Fill: accent (vermilion, default), ink, or paper (cream with an ink outline).",
        style: "Inline styles merged last; use for absolute placement, opacity, or transforms.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 44, height: 44 },
    vertical: { width: 44, height: 44 },
    basis: "Square size × size box at the default size 44; the shadow extends below it.",
  },
  examples: [
    {
      title: "Fixed and broken",
      code: 'import { Badge } from "@/jbm/ui/badge"\n\n<div style={{ display: "flex", gap: 40 }}>\n  <Badge kind="check" size={100} />\n  <Badge kind="x" size={100} tone="ink" />\n</div>',
    },
  ],
  qa: [
    "Compare all three tones with both marks: the mark stays legible (cream on accent and ink, ink on paper).",
    "At small sizes the 4-unit stroke of the 24-unit icon scales down; check the check and cross remain readable around 24px.",
  ],
} satisfies ItemContract
