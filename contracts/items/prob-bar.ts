import type { ItemContract } from "../schema"

export default {
  name: "prob-bar",
  entry: "component",
  title: "ProbBar",
  description: "Labelled probability bar that slides in and fills to its value while the number counts up.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "ProbBar",
      kind: "component",
      summary:
        "One row: a 24px mono label, a rounded track whose vermilion fill eases to `p` over 0.7 s, and the live value to two decimals. The row pops in from the left by 12px at `at`.",
      props: {
        label: "Mono label on the left, in ink.",
        p: "Target probability, 0–1; the fill ends at p × track width and the value reads p to two decimals. Not clamped: values above 1 overflow the track and are clipped.",
        at: "Start of the entrance and fill in seconds relative to the enclosing Sequence.",
        w: "Row width budget in stage pixels; the track is w − labelW − 90 wide.",
        labelW: "Width reserved for the label in stage pixels; long labels wrap inside it.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 546, height: 29 },
    vertical: { width: 546, height: 29 },
    basis:
      "Label (labelW 230) + 18 gap + track (w − labelW − 90 = 200) + 18 gap + 80px value gives w + 26 = 546 at w 520. Height is one line of 24px mono text (about 29px at normal line-height; the track itself is 22px). A label that wraps in labelW adds lines. The wrapper is a block element, so it stretches to its container's width while the row content stays w + 26.",
  },
  examples: [
    {
      title: "One probability",
      code: 'import { ProbBar } from "@/jbm/motion/prob-bar"\n\n<ProbBar label="Confianza" p={0.86} at={0.2} />',
    },
    {
      title: "A ranked list",
      code: 'import { ProbBar } from "@/jbm/motion/prob-bar"\n\n{[["gato", 0.72], ["perro", 0.21], ["zorro", 0.07]].map(([label, p], i) => (\n  <ProbBar key={label} label={String(label)} p={Number(p)} at={0.4 + i * 0.3} w={720} />\n))}',
    },
  ],
  qa: [
    "Step to the first frame (row hidden, value 0.00), mid-fill (partial bar, intermediate value), and the last frame (bar at p, value exactly p to two decimals).",
    "Check p = 0 and p = 1: an empty track still reads, and a full fill stays inside the rounded track.",
    "Try a long label: confirm it wraps within labelW and does not push the track; the exact row height at normal line-height is approximate (about 29px) and should be measured if layout depends on it.",
  ],
} satisfies ItemContract
