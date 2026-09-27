import type { ItemContract } from "../schema"

export default {
  name: "figure-caption",
  entry: "component",
  title: "Figure Caption",
  description: "An editorial figure label, caption, and provenance that wraps on narrow screens.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "FigureCaption",
      kind: "component",
      summary:
        "A <figcaption> with a hairline top rule: an optional vermilion `Fig. <index>` label, the caption text (18px bold), and optional mono provenance below. Place it as the first or last child of a <figure>; figcaption attributes and ref pass through.",
      props: {
        index: "Figure number or label, rendered as `Fig. <index>` in uppercase vermilion mono. Omit (null/undefined) to hide.",
        provenance: "Optional source or credit line under the caption, 12px dim mono.",
        layout:
          "\"inline\" places the label beside the caption and wraps below it when narrower than about 180px of caption room; \"stacked\" always puts the label above.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fills the figure. Height is 18px top padding plus the 1px border, the caption lines (18px × 1.4), and optional provenance (8px + 12px × 1.6 per line); stacked layout, or inline layout that wraps, adds the label line plus a 10px gap.",
  },
  examples: [
    {
      title: "Caption a chart",
      code: 'import { FigureCaption } from "@/jbm/ui/figure-caption"\n\n<figure>\n  <img src="/chart.png" alt="Descripción del gráfico" />\n  <FigureCaption index="01" provenance="Fuente: nuestro estudio">\n    Menos ruido. Más señal.\n  </FigureCaption>\n</figure>',
    },
  ],
  qa: [
    "Compare inline and stacked layouts; in inline, narrow the screen until the caption wraps below the label without overlap.",
    "Check with and without index and provenance: no empty gaps appear when either is omitted.",
    "Confirm it is used inside a <figure> so the caption is associated with the visual.",
  ],
} satisfies ItemContract
