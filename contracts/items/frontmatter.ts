import type { ItemContract } from "../schema"

export default {
  name: "frontmatter",
  entry: "component",
  title: "Frontmatter",
  description:
    "Key/value metadata between literal YAML delimiters, with per-row emphasis, dimming, and a stacked layout.",
  category: "UI",
  capabilities: ["controls"],
  api: [
    {
      export: "Frontmatter",
      kind: "component",
      summary:
        "Mono definition list framed by `---` lines on a cream block. Two columns (keys at least 112px, values twice as wide) by default; `stacked` puts each value under its key at full width. Static: no timers or animation; change row props to emphasize or dim fields.",
      props: {
        rows: "Fields in display order. Each row renders `key:` and its value; `key` is also the React key, so keep keys unique.",
        stacked:
          "Stack each value under its key in one full-width column, for narrow or portrait compositions.",
        style:
          "Inline styles merged last over the cream background, 18px padding, and 14px mono type; use for width or font size.",
      },
    },
    {
      export: "FrontmatterRow",
      kind: "type",
      summary:
        "One field: `key` (string), `value` (ReactNode), optional `highlight` (3px vermilion bar left of the key), and optional `dim` from 0 to 1 (clamped; 1 fades key and value to 28% opacity).",
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fills the container (minWidth 0) and height follows the rows. Chrome adds 36px of padding, two delimiter lines, and 24px of list margin; rows are separated by 12px (6px plus 12px per value when stacked), and long values wrap anywhere. Set style.width for a fixed box.",
  },
  examples: [
    {
      title: "Stacked skill metadata with an emphasized and a dimmed field",
      code: 'import { Frontmatter } from "@/jbm/ui/frontmatter"\n\n<Frontmatter\n  stacked\n  rows={[\n    { key: "name", value: "pdf-processing", highlight: true },\n    { key: "description", value: "Extrae tablas de archivos PDF." },\n    { key: "license", value: "Apache-2.0", dim: 0.6 },\n  ]}\n/>',
    },
  ],
  qa: [
    "Toggle Stack fields: two-column mode keeps keys aligned at 112px minimum; stacked mode indents values under their keys with no overlap.",
    "Toggle Highlight fields: only the vermilion bar appears; text position does not shift because the bar space is always reserved.",
    "Drag Dim optional field from 0 to 1: key and value fade together to about 28% opacity and stay legible.",
    "Check a long unbroken value on a narrow screen: it wraps inside the block instead of overflowing.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
