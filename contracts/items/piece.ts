import type { ItemContract } from "../schema"

export default {
  name: "piece",
  entry: "component",
  title: "Piece",
  description: "Picks the button, input, or card illustration by kind and sizes it from one width.",
  category: "UI Bits",
  capabilities: [],
  api: [
    {
      export: "Piece",
      kind: "component",
      summary:
        "Renders UiButton, UiInput, or UiCard for `kind` at width `w`; height follows each piece's proportion (button and input 0.32 × w, card 0.78 × w). Lets a list of `{ kind }` entries render interface pieces without branching.",
      props: {
        kind: "Which piece to draw: button, input, or card.",
        w: "Width in stage pixels; height is derived from it per kind.",
        tone: "Button tone only (ink by default, accent, or paper); ignored by input and card.",
        cursorOn: "Input only: shows or hides the text cursor (UiInput default: shown); ignored by button and card.",
        style: "Inline styles forwarded to the chosen piece.",
      },
    },
    {
      export: "PieceKind",
      kind: "type",
      summary: 'The piece names: "button" | "input" | "card".',
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 220, height: 70 },
    vertical: { width: 220, height: 70 },
    basis:
      "No defaults: `w` is required. At w = 220 a button or input is 220 × 70 (round(0.32 × w)); a card is 220 × 172 (round(0.78 × w)).",
  },
  examples: [
    {
      title: "One button",
      code: 'import { Piece } from "@/jbm/ui/piece"\n\n<Piece kind="button" w={220} />',
    },
    {
      title: "A row of every kind",
      code: 'import { Piece, type PieceKind } from "@/jbm/ui/piece"\n\nconst kinds: PieceKind[] = ["button", "input", "card"]\n<div style={{ display: "flex", gap: 30, alignItems: "center" }}>\n  {kinds.map((kind) => <Piece key={kind} kind={kind} w={180} tone="accent" cursorOn={false} />)}\n</div>',
    },
  ],
  qa: [
    "Render all three kinds at the same w and check their heights (0.32, 0.32, 0.78 × w) and baseline alignment in a row.",
    "Pass tone and cursorOn to each kind: tone changes only the button and cursorOn only the input.",
  ],
} satisfies ItemContract
