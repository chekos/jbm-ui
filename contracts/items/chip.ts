import type { ItemContract } from "../schema"

export default {
  name: "chip",
  entry: "component",
  title: "Chip",
  description: "Inline pill in outline, vermilion accent, or solid ink, with sans or mono type.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Chip",
      kind: "component",
      summary:
        "Inline-block, non-wrapping pill with a 2px border, 10×20px padding, and the 14px chip radius. Outline (card fill, line border, ink text) by default; `accent` fills vermilion, `solid` fills ink, both with cream text.",
      props: {
        children: "Chip text; kept on one line (white-space: nowrap).",
        accent: "Fills and borders the chip with the vermilion accent. Takes precedence over `solid` when both are set.",
        solid: "Fills and borders the chip with ink.",
        mono: "Switches the face from Geist sans to Geist Mono.",
        size: "Font size in stage pixels.",
        style: "Inline styles merged last.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width follows the text. Height is 26px type at the font's normal line height (not set explicitly) plus 20px vertical padding and 4px of border; `size` scales the type only, not the padding.",
  },
  examples: [
    {
      title: "Variants",
      code: 'import { Chip } from "@/jbm/ui/chip"\n\n<Chip>Default</Chip>\n<Chip accent>Accent</Chip>\n<Chip solid>Solid</Chip>\n<Chip mono>Mono</Chip>',
    },
    {
      title: "Staggered row in a video",
      code: 'import { Chip } from "@/jbm/ui/chip"\nimport { Stagger } from "@/jbm/motion/pop" // install @jbm/pop separately\n\n<Stagger at={0.2} step={0.35}>\n  {["Idea", "Datos"].map((text) => <Chip key={text}>{text}</Chip>)}\n</Stagger>',
    },
  ],
  qa: [
    "Compare default, accent, solid, and mono side by side: outline on card fill, cream text on vermilion and ink.",
    "Check that long chip text does not overflow the safe area, because chips never wrap; wrap the row container instead.",
    "Keep at most one accent chip per composition.",
  ],
} satisfies ItemContract
