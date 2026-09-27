import type { ItemContract } from "../schema"

export default {
  name: "comparison-bars",
  entry: "component",
  title: "ComparisonBars",
  description: "Readable comparison rows on a shared zero-based scale, with optional emphasis.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "ComparisonBars",
      kind: "component",
      summary:
        "Description list of rows: label and formatted value on one line, then a 14px bar whose fill is value / max of the full width. Highlighted rows use vermilion for the value and fill; others use dim text and an ink fill. Bars are aria-hidden, so the text carries the data. Throws RangeError for negative or non-finite values, or a max that is not positive or below any value.",
      props: {
        items:
          "Rows in display order: label, a finite nonnegative value, and optional highlight to mark the one emphasized row.",
        max: "Shared scale ceiling. Defaults to the largest value (at least 1); set it to compare against a fixed range such as 100.",
        formatValue: "Formats each value for its readout, e.g. (v) => `${v}%`.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fills its container; bars span the full row width. Each row is about 40 stage pixels (15px label line, 4px row gap, 4px margin, 14px bar), with 20px between rows, so height grows with items. Long labels or values wrap and add lines.",
  },
  examples: [
    {
      title: "Three rows on a 0–100 scale",
      code: 'import { ComparisonBars } from "@/jbm/ui/comparison-bars"\n\n<ComparisonBars max={100} formatValue={(v) => `${v} lecturas`} items={[\n  { label: "Contexto", value: 42 },\n  { label: "Una buena pregunta", value: 68 },\n  { label: "Una idea clara", value: 90, highlight: true },\n]} />\n// Values must be nonnegative; max must cover all values.',
    },
  ],
  qa: [
    "Check fills are proportional to value / max, a zero value shows an empty track, and a value equal to max fills the row.",
    "Only the highlighted row uses vermilion; keep a single highlight per figure.",
    "At narrow widths long labels wrap above their values and bars stay full width.",
    "Read without the bars (they are aria-hidden): each dt/dd pair still states the label and value.",
  ],
  docs: [
    { title: "Visual primitives guide", url: "https://jbm-ui.bns.studio/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
