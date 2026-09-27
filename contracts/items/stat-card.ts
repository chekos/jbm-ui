import type { ItemContract } from "../schema"

export default {
  name: "stat-card",
  entry: "component",
  title: "StatCard",
  description:
    "One number with its context on a raised Card: mono label, large value, and a short sub line, stacked or in a row.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "StatCard",
      kind: "component",
      summary:
        "Fixed-size Card (border-box) holding a mono label, an 800-weight value, and an optional sub line. Stacked by default for landscape; `row` puts the value (fixed 400px column) beside the label and sub for vertical stages.",
      props: {
        label: "Mono caption naming the number, 22px in the dim color.",
        value: "The number or short value; 96px stacked, 84px in row mode, -3px tracking.",
        sub: "Optional one-line context under the label (row) or under the value (stacked); dim when stacked, ink in row mode.",
        valueColor: "Value color; defaults to the vermilion accent. Use color.ink when another element already carries the accent.",
        w: "Card width in stage pixels, including padding and border.",
        h: "Card height in stage pixels, including padding and border.",
        row: "Lays value, then label and sub, side by side with 22×34px padding and a 30px gap; the scene compiler uses it for vertical stages.",
        style: "Inline styles merged after the size and row layout.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 520, height: 300 },
    vertical: { width: 520, height: 300 },
    basis:
      "Card is border-box, so the defaults w=520 and h=300 are the outer size in either orientation. For vertical stages SceneFromSpec renders `row` cards at the full content width (936) and h=180, and the gallery shows w=620 with h=245 stacked and h=140 in a row.",
  },
  examples: [
    {
      title: "Stacked and row cards",
      code: 'import { StatCard } from "@/jbm/ui/stat-card"\n\n<StatCard label="Contexto" value="1M" sub="tokens" w={620} h={245} />\n<StatCard row label="Latencia" value="0.8s" sub="p50" w={620} h={140} />',
    },
    {
      title: "Ink value beside another accent",
      code: 'import { StatCard } from "@/jbm/ui/stat-card"\nimport { color } from "@/jbm/lib/tokens"\n\n<StatCard label="Precisión" value="86%" valueColor={color.ink} />',
    },
  ],
  qa: [
    "Content does not fit itself: check the widest value and longest sub stay inside w×h in both layouts, since the card has a fixed height and does not clip or shrink text.",
    "In row mode the value column is a fixed 400px; with w below about 500 the label and sub have almost no room.",
    "Compare stacked landscape and row vertical cards on cream: fine border, layered shadow, and inset highlight come from Card.",
  ],
} satisfies ItemContract
