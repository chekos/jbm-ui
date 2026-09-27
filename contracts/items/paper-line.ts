import type { ItemContract } from "../schema"

export default {
  name: "paper-line",
  entry: "component",
  title: "PaperLine",
  description:
    "Line of text with controlled grapheme reveal, ink lift, strike-through, and dotted underline.",
  category: "UI",
  capabilities: ["controls"],
  api: [
    {
      export: "PaperLine",
      kind: "component",
      summary:
        "Inline-block line of handwritten-on-paper text. Every progress input is controlled 0–1 (clamped; non-finite values count as 0) with no timer, so a slider or video timeline drives it. Hidden graphemes keep their space, and a visually hidden copy exposes the full text to assistive technology.",
      props: {
        text: "The line's text; revealed by whole graphemes (emoji and combined characters stay intact).",
        reveal: "Share of graphemes shown, 0–1; visible count is ceil(reveal × graphemes). The full footprint is reserved at every value.",
        lift: "Ink lift 0–1: the line moves up to 60px right and 40px up, rotates up to −9°, and fades (opacity 1 − lift²).",
        strike: "Vermilion 2px strike-through across the middle, drawn left to right as 0–1 of the line width. Meant for single short lines.",
        dotted: "Adds a 2px dotted underline in the dim color.",
        accent: "Uses the vermilion accent for the text instead of ink.",
        mono: "Uses the mono font stack instead of sans.",
        style: "Inline styles merged last onto the outer span, e.g. fontSize or fontWeight (both inherit by default).",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Inline-block text at the inherited font size with line-height 1.4; width follows the text up to 100% of the container and height grows when it wraps. Lift translates up to 60px right and 40px up without affecting layout, so leave headroom (the gallery pads 32px above).",
  },
  examples: [
    {
      title: "Partly written line",
      code: 'import { PaperLine } from "@/jbm/ui/paper-line"\n\n<PaperLine text="Una idea clara." reveal={0.7} lift={0} strike={0} />',
    },
    {
      title: "Crossed-out mono note",
      code: 'import { PaperLine } from "@/jbm/ui/paper-line"\n\n<PaperLine text="v1 descartada" mono dotted strike={1} style={{ fontSize: 22 }} />',
    },
  ],
  qa: [
    "Drag Reveal from 0 to 1: graphemes appear left to right, the line never changes width, and 0 shows nothing.",
    "Drag Lift ink to 1: the line drifts up-right, tilts, and fades out completely without overlapping controls.",
    "Drag Strike to 1 on a single line; on a wrapped line the stroke sits at the block's vertical middle, so keep struck lines short.",
    "Toggle Dotted underline and Accent ink independently, and check each combination with mono.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
