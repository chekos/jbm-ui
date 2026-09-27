import type { ItemContract } from "../schema"

export default {
  name: "token-glyph",
  entry: "component",
  title: "TokenGlyph",
  description: "Square glyphs for design tokens: overlapping colour swatches, an Aa type sample, or a spacing dimension line.",
  category: "UI Bits",
  family: "Interface bits",
  capabilities: [],
  api: [
    {
      export: "TokenGlyph",
      kind: "component",
      summary:
        "One of three static illustrations in a size × size square: `color` draws an ink and a vermilion circle overlapping with the paper shadow; `type` draws a heavy Geist \"Aa\" with a vermilion a; `space` draws two ink blocks with a vermilion double-headed dimension arrow between them.",
      props: {
        kind: "Which token to illustrate: color, type, or space.",
        size: "Side of the square in stage pixels; every shape and the type size (70% of it) scale with it.",
        style: "Inline styles on the outer element (a div for color and type, an svg for space).",
      },
    },
    {
      export: "TokenKind",
      kind: "type",
      summary: 'The glyph names: "color" | "type" | "space".',
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 150, height: 150 },
    vertical: { width: 150, height: 150 },
    basis: "Square size × size box at the default size 150; the colour swatch shadows extend past it.",
  },
  examples: [
    {
      title: "All three tokens",
      code: 'import { TokenGlyph, type TokenKind } from "@/jbm/ui/token-glyph"\n\nconst kinds: TokenKind[] = ["color", "type", "space"]\n<div style={{ display: "flex", gap: 30 }}>\n  {kinds.map((kind) => <TokenGlyph key={kind} kind={kind} size={150} />)}\n</div>',
    },
  ],
  qa: [
    "Render the three kinds side by side at one size: they share the square footprint and read at similar visual weight.",
    "Check the type glyph renders in Geist (font.sans) and does not overflow the square when fonts load late.",
    "Scale size down to about 60px: the spacing arrowheads and dimension line stay distinct.",
  ],
} satisfies ItemContract
