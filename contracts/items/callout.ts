import type { ItemContract } from "../schema"

export default {
  name: "callout",
  entry: "component",
  title: "Callout",
  description: "Short sentence in a vermilion, ink, or outlined note pill.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Callout",
      kind: "component",
      summary:
        "Inline-block pill with line-height 1.3 and a 2px border. `accent`: vermilion fill, cream sans, 14×22px padding, 16px radius. `ink`: ink fill, cream mono, 8×14px padding, 10px radius. `note`: transparent with an accent2 border and mono text, 10×18px padding, 12px radius, for footnotes.",
      props: {
        children: "The sentence; wraps at maxWidth when set.",
        variant: '"accent", "ink", or "note". Changes fill, face, padding, and radius together.',
        size: "Font size in stage pixels.",
        maxWidth: "Maximum width in stage pixels; unset lets the pill grow with its text up to the container width.",
        style: "Inline styles merged after the variant.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: "auto", height: 71 },
    vertical: { width: "auto", height: 71 },
    basis:
      "One line of the default accent variant: 30 × 1.3 = 39 plus 28px vertical padding and 4px border = 71 stage px. Ink is 59 and note is 63 at the same size; each wrapped line adds size × 1.3. Width follows the text.",
  },
  examples: [
    {
      title: "Three variants",
      code: 'import { Callout } from "@/jbm/ui/callout"\n\n<Callout>Primero, el problema.</Callout>\n<Callout variant="ink">Luego, la idea.</Callout>\n<Callout variant="note">Al final, cómo se usa.</Callout>',
    },
    {
      title: "Wrapped in a column",
      code: 'import { Callout } from "@/jbm/ui/callout"\n\n<Callout size={34} maxWidth={936}>Una idea clara vale más que diez diapositivas.</Callout>',
    },
  ],
  qa: [
    "Compare accent, ink, and note on cream; note text uses accent2 and must stay legible at small sizes.",
    "Wrap a long sentence with maxWidth and check line spacing and padding stay even.",
    "Only one accent-filled callout per composition, and it should not compete with another accent element.",
  ],
} satisfies ItemContract
