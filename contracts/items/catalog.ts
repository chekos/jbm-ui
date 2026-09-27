import type { ItemContract } from "../schema"

export default {
  name: "catalog",
  entry: "component",
  title: "Catalog",
  description:
    "Catalogue sheet whose interface pieces arrive and get checked off, then unfolds a second row of design-token glyphs.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "Catalog",
      kind: "component",
      summary:
        "Paper sheet that springs up into place at `at`, with one dashed slot per column. Each item's Piece pops into its slot on its cue and a check badge pops on `checkDelay` seconds later. At `tokensAt` the sheet grows downward over 0.55 s behind a dashed divider to reveal a row of TokenGlyphs that pop in on their own cues. An optional ink title sticker sits over the top edge and a stamp lands below the rows.",
      props: {
        w: "Sheet width in stage pixels; padding, gaps, slot size, pieces, captions, and badges all scale from it.",
        at: "Sheet entrance in seconds relative to the enclosing Sequence.",
        title: "Optional ink sticker label over the top-left edge; adds 30px of top padding inside the sheet.",
        items: "Top-row slots: `kind` (button, card, or input), a caption `label`, and the `at` second its piece pops in.",
        tokens: "Optional second-row slots: `kind` (color, type, or space), a caption `label`, and the `at` second its glyph pops in. Empty means no token row.",
        tokensAt: "Second at which the token row unfolds. Defaults to 0.6 s before the first token's cue.",
        stamp: "Optional loud word: `text` and the `at` second it stamps onto the sheet below the rows.",
        checkDelay: "Seconds between an item's arrival and its check badge.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 1200, height: 882 },
    vertical: { width: 936, height: 699 },
    basis:
      "Width is `w` (required); scene specs pass min(usable width, 1200) in landscape and 936 in vertical. Height is computed from w with three items, three tokens, and a title, fully unfolded: top padding (0.038 w + 30) + slot row (card height 0.8 × 0.78 slot width + caption + margin) + bottom padding + 4px border, plus the token block (two gaps of 0.031 w, a 3px divider, and a 0.9 × slot-width glyph row) once unfolded. Before unfolding it is 492 (landscape) / 393 (vertical). The title sticker extends 30px above the top edge. More columns shrink every slot.",
  },
  examples: [
    {
      title: "Pieces, then tokens",
      code: 'import { Catalog } from "@/jbm/motion/catalog"\n\n<Catalog w={936} at={3.2} title="catálogo"\n  items={[{ kind: "button", label: "botón", at: 7.4 }]}\n  tokens={[{ kind: "color", label: "color", at: 18.2 }]} />',
    },
    {
      title: "Full sheet with a stamp",
      code: 'import { Catalog } from "@/jbm/motion/catalog"\n\n<Catalog w={936} at={0.2} title="catálogo"\n  items={[\n    { kind: "button", label: "botón", at: 0.8 },\n    { kind: "card", label: "tarjeta", at: 1.2 },\n    { kind: "input", label: "input", at: 1.6 },\n  ]}\n  tokensAt={2.6}\n  tokens={[\n    { kind: "color", label: "color", at: 3.0 },\n    { kind: "type", label: "tipografía", at: 3.4 },\n    { kind: "space", label: "espaciado", at: 3.8 },\n  ]}\n  stamp={{ text: "design tokens", at: 4.4 }} />',
    },
  ],
  qa: [
    "Step to the sheet entrance, each item arrival and its check badge, the middle of the unfold (token row partially revealed and clipped), and the end (all glyphs in, stamp settled).",
    "Check the fully unfolded sheet plus the title sticker above it fits the safe area in both orientations; the height grows by the token block when it unfolds.",
    "Without tokens, confirm no divider or empty row appears and the stamp sits just below the item row.",
    "Check long captions at the scaled caption size stay inside their slots; captions are not truncated by the component.",
  ],
} satisfies ItemContract
