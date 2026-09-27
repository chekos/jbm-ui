import type { ItemContract } from "../schema"

export default {
  name: "surface-depth",
  entry: "doc",
  install: "tokens",
  title: "Surface depth",
  description:
    "Fine borders, inset edge lighting, and layered shadows. Compare the original surface and inspect each layer.",
  category: "Foundations",
  capabilities: ["controls"],
  api: [
    {
      export: "shadow",
      kind: "constant",
      summary:
        "Complete raised-surface box-shadows: `card` for light surfaces and `cardDark` for ink surfaces. Apply the whole recipe rather than copying layers into components.",
    },
    {
      export: "surfaceBorder",
      kind: "constant",
      summary:
        "The 1px border that defines the silhouette: `card` (ink at 12%) and `cardDark` (ink at 65%). Pair with the shadow of the same name.",
    },
    {
      export: "shadowLayers",
      kind: "constant",
      summary:
        "Each recipe split into `inset` (upper edge highlight and lower inner line), `contact` (1px crisp contact), and `ambient` (offsets 3, 6, 12, 24px with negative spread and falling opacity). The gallery lab toggles these independently.",
    },
  ],
  stage: {
    mode: "n/a",
    reason:
      "Documentation entry for token recipes; nothing installs as a component. The gallery lab renders two sample surfaces with layer toggles.",
  },
  examples: [
    {
      title: "Light raised surface",
      code: 'import { shadow, surfaceBorder } from "@/jbm/lib/tokens"\n\n// Light surface (use cardDark for dark surfaces)\n<div style={{\n  boxShadow: shadow.card,\n  border: surfaceBorder.card,\n}} />',
    },
    {
      title: "Dark surface",
      code: 'import { color, radius, shadow, surfaceBorder } from "@/jbm/lib/tokens"\n\n<div style={{\n  background: color.codeBg,\n  borderRadius: radius.card,\n  boxShadow: shadow.cardDark,\n  border: surfaceBorder.cardDark,\n}} />',
    },
  ],
  qa: [
    "Toggle Before and Layered: Before shows the original single broad shadow and 2px border and disables the layer controls.",
    "Toggle border, inset highlight, contact shadow, and soft outer shadows one at a time on both the light and dark samples; each change should be visible and none should leave a clipped shadow.",
    "Inspect at actual display scale: edges readable without looking embossed, and the highlight reads as edge light rather than a separate stripe.",
    "Press Copy token usage with and without clipboard access; the status line reports success or points to the Usage snippet.",
    "Exercise the buttons and checkboxes by keyboard and confirm visible focus.",
  ],
  docs: [
    { title: "Surface depth guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/surface-depth.md" },
  ],
} satisfies ItemContract
