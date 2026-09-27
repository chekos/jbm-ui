import type { ItemContract } from "../schema"

export default {
  name: "document",
  entry: "component",
  title: "Document",
  description: "Folded paper illustration with optional label and accent heading.",
  category: "UI Bits",
  capabilities: [],
  api: [
    {
      export: "Document",
      kind: "component",
      summary:
        "Static SVG sheet with a folded top-right corner, a heading stroke, three grey text lines, and an optional mono label. Without a label it is decorative (aria-hidden); with one it is an image named by the label.",
      props: {
        label:
          "Mono filename printed near the bottom edge; also the accessible name. Truncated to 15 characters plus an ellipsis when longer than 16. Omit for a decorative sheet.",
        accent: "Draws the heading stroke in vermilion instead of ink.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 160, height: 200 },
    vertical: { width: 160, height: 200 },
    basis:
      "Fixed 160×200 viewBox rendered at width 160 and height 200 stage pixels. The style sets height auto and maxWidth 100%, so set style.width to scale it with its 4:5 proportions; other SVG attributes pass through.",
  },
  examples: [
    {
      title: "Labelled accent document",
      code: 'import { Document } from "@/jbm/ui/document"\n\n<Document label="idea.md" accent style={{ width: 180 }} />',
    },
    {
      title: "Decorative pair, one tilted",
      code: 'import { Document } from "@/jbm/ui/document"\n\n<div style={{ display: "flex", gap: 24 }}>\n  <Document style={{ width: "42%" }} />\n  <Document label="borrador.md" style={{ width: "42%", transform: "rotate(4deg)" }} />\n</div>',
    },
  ],
  qa: [
    "Compare accent and ink headings: only the heading stroke changes color.",
    "Try a label longer than 16 characters: it ends with an ellipsis and stays inside the sheet.",
    "Scale with style.width at narrow widths: the fold and 2px ink edge keep their 160:200 proportions.",
    "Without a label the SVG is aria-hidden; with one it exposes role img and the label as its name.",
  ],
} satisfies ItemContract
