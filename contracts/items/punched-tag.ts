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
        "A card-stock luggage tag: the two corners at the hole end cut off at 45°, the other end rounded 12px, a 14px cream punched hole ringed in ink inside a flat line-grey reinforcement washer (4px; on ink or accent stock the ring is grey too, one eyelet), and one line of 28px extra-bold content beside it that ends in an ellipsis past maxWidth. Paper's stock, shared outline (kept the same width along the cuts), and shadow. No string: tie a Hilo at the hole (VideoPrint's layout gives the point). Width follows content up to maxWidth.",
      props: {
        children: "Tag content, usually a short name or a URL; kept on one line and cut with an ellipsis when it would pass maxWidth.",
        tone: "Stock: `paper` (card with ink text), `accent` (vermilion), or `ink`; text switches to cream on accent and ink.",
        scale: "Size multiplier (default 1) for the tag's own geometry: hole (14 × scale px), its washer (4 × scale px), its ring (the shared outline, stroke.outline × scale, between 1px and stroke.outline), the corner cuts, radii, gap, padding, and type, so a tag on a smaller print keeps its proportions.",
        cut: "Depth of the hole end's two 45° corner cuts in px before scale (default 14). A slim tag (VideoPrint's) passes 8. Deeper than half the tag's height, the two cuts meet in one point (edge and stock clamp alike).",
        maxWidth: "Widest the tag gets, as px or a CSS length (default \"100%\"). Longer content stays on one line and ends in an ellipsis. In a grid or flex parent, give its track a zero minimum (minmax(0, 1fr), min-width: 0) so the one-line label cannot widen the track past the container.",
        labelStyle: "Styles merged onto the one-line label, e.g. VideoPrint's Geist Mono at 14 × scale px. The one-line rule (nowrap, hidden overflow, ellipsis) stays unless you override it.",
        style: "Inline styles merged last onto the tag's box, e.g. padding or gap. The edge sits in a transparent 3px border, so padding keeps its meaning.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width follows the content (14px hole + 18px gap + text) plus 40px horizontal padding and 6px of edge (the 3px shared outline each side), capped at maxWidth (default 100% of the container). Height is one 28px line at normal line height plus 32px padding and 6px of edge; the label never wraps.",
  },
  examples: [
    {
      title: "Ink tag",
      code: 'import { PunchedTag } from "@/jbm/ui/punched-tag"\n\n<PunchedTag tone="ink">Modelo</PunchedTag>',
    },
  ],
  qa: [
    "Toggle Ink stock: the hole stays cream inside one grey eyelet (ring and washer), never a radio-button target, and the text stays legible.",
    "Check a long label or URL at narrow width: it stays on one line and ends in an ellipsis inside the tag, and the hole keeps its 14px circle.",
    "Enlarge the cut corners at 8×: the ink edge keeps the shared outline's width along each cut, meets the straight edges without a step, and no square shadow corner shows beyond the cuts.",
    "Compare the shadow and edge with other paper surfaces; the tag draws no string (Hilo is the connector).",
    "Set scale to 0.575 (a 276px VideoPrint): the hole, ring, corner cuts, radii, and type shrink together and the hole stays in proportion to the text.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
