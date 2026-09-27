import type { ItemContract } from "../schema"

export default {
  name: "score-scale",
  entry: "component",
  title: "Score Scale",
  description: "A read-only score meter with endpoint labels and a controlled marker.",
  category: "UI",
  capabilities: ["controls"],
  api: [
    {
      export: "ScoreScale",
      kind: "component",
      summary:
        "Read-only meter (role meter, not an input): a label and formatted value above a track with five evenly spaced ticks and a vermilion marker, with endpoint captions below. The marker position is (value − min) / (max − min); the caller controls value. Throws RangeError for non-finite numbers or max ≤ min.",
      props: {
        value: "Score to display. Finite values are clamped to min…max before positioning and formatting.",
        min: "Low end of the scale; the left endpoint caption when labels is omitted.",
        max: "High end of the scale; must be greater than min. The right endpoint caption when labels is omitted.",
        label: "Visible heading and the meter's accessible name.",
        labels: "Endpoint captions [low, high] shown under the track instead of min and max.",
        formatValue:
          "Formats the clamped value for the accent readout and aria-valuetext, e.g. (v) => `${v} / 10`.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fills its container (minWidth 0); the track spans it less 12px padding per side. Height is about 95 stage pixels at one line each: heading row, 22px gap, 24px track, 10px gap, 12px mono captions. Long label, value, or endpoint captions wrap and add lines.",
  },
  examples: [
    {
      title: "Score out of ten with named endpoints",
      code: 'import { ScoreScale } from "@/jbm/ui/score-scale"\n\n<ScoreScale label="Claridad" value={6} min={0} max={10}\n  labels={["Por explorar", "Lista para compartir"]}\n  formatValue={(v) => `${v} / 10`} />\n// Read-only meter; clamps values to the range.',
    },
  ],
  qa: [
    "Drag the score control through min, the middle, and max: the marker sits on the first, center, and last ticks and never leaves the track.",
    "Pass a value outside the range: the marker and readout show the clamped value.",
    "Check long labels and endpoint captions wrap without overlapping at narrow widths.",
    "Screen readers announce a meter with aria-valuetext from formatValue; it is not focusable or draggable itself.",
  ],
  docs: [
    { title: "Visual primitives guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
