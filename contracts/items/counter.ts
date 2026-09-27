import type { ItemContract } from "../schema"

export default {
  name: "counter",
  entry: "component",
  title: "Counter",
  description: "Number that counts up to a target.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "Counter",
      kind: "component",
      summary:
        "Renders a Big numeral that eases from 0 to `n`, rounded to whole numbers, on the Remotion timeline.",
      props: {
        n: "Target value; the count ends here and holds.",
        at: "Start time in seconds from the start of the sequence.",
        dur: "Seconds the count takes to reach `n`.",
        size: "Font size in stage pixels, passed to Big.",
        color: "Text color; keep the one vermilion accent per composition.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: "auto", height: 147 },
    vertical: { width: "auto", height: 147 },
    basis:
      "One line of Big at size 140 with line-height 1.05. Height is size × 1.05; width follows the digit count of `n` (about 0.6 × size per digit).",
  },
  examples: [
    {
      title: "Count to a key number",
      code: 'import { Counter } from "@/jbm/motion/counter"\n\n<Counter n={1024} at={0.2} dur={1.5} />',
    },
    {
      title: "Smaller, in ink, beside other text",
      code: 'import { Counter } from "@/jbm/motion/counter"\nimport { color } from "@/jbm/lib/tokens"\n\n<Counter n={42} at={1} size={96} color={color.ink} />\n// Render inside a Remotion <Composition> or <Player>.',
    },
  ],
  qa: [
    "Step to the first, middle, and last frames: 0 before `at`, an intermediate whole number mid-count, and exactly `n` at rest.",
    "Check the widest value of `n` stays inside the safe area at the chosen size in both orientations.",
    "Confirm only one element on the stage uses the accent color.",
  ],
} satisfies ItemContract
