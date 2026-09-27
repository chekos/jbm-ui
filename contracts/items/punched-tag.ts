import type { ItemContract } from "../schema"

export default {
  name: "punched-tag",
  entry: "component",
  title: "PunchedTag",
  description:
    "Card-stock luggage-style label with a punched hole and bold content, in paper, accent, or ink stock.",
  category: "UI Bits",
  family: "Tape, clips & marks",
  capabilities: ["controls"],
  api: [
    {
      export: "PunchedTag",
      kind: "component",
      summary:
        "A Paper with a rounded 36px left end, a 14px cream punched hole ringed in ink, and 28px extra-bold content beside it. Width follows content up to 100% of the container.",
      props: {
        children: "Tag content, usually a short name; wraps anywhere when space runs out.",
        tone: "Stock: `paper` (card with ink text), `accent` (vermilion), or `ink`; text switches to cream on accent and ink.",
        scale: "Size multiplier (default 1) for the tag's own geometry: hole (14 × scale px), its ring (2 × scale, at least 1px), the radii, gap, padding, and type, so a tag on a smaller print keeps its proportions.",
        style: "Inline styles merged last onto the Paper, e.g. width or padding.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width follows the content (14px hole + 18px gap + text) plus 40px horizontal padding and a 4px border, capped at 100% of the container. Height is one 28px line at normal line height plus 32px padding and 4px border, and grows when the text wraps.",
  },
  examples: [
    {
      title: "Ink tag",
      code: 'import { PunchedTag } from "@/jbm/ui/punched-tag"\n\n<PunchedTag tone="ink">Modelo</PunchedTag>',
    },
  ],
  qa: [
    "Toggle Ink stock: the hole stays cream with an ink ring and the text stays legible.",
    "Check a long label at narrow width: it wraps inside the tag and the hole keeps its 14px circle.",
    "Compare the shadow and edge with other paper surfaces.",
    "Set scale to 0.575 (a 276px VideoPrint): the hole, ring, radii, and type shrink together and the hole stays in proportion to the text.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
