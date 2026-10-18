import type { ItemContract } from "../schema"

export default {
  name: "icons",
  entry: "component",
  title: "JbmIcon",
  description:
    "Twelve original geometric SVG icons with outline and paper treatments, inherited color, and optional accessible labels.",
  category: "UI",
  capabilities: [],
  docs: [{ title: "Icon drawing and review guide", url: "https://jbm-ui.bns.studio/docs/icons.md" }],
  api: [
    {
      export: "JbmIcon",
      kind: "component",
      summary:
        "A static 24-unit icon. Uses a two-unit stroke derived from the shared outline token, round caps and joins. No timer, client boundary, or Remotion dependency. Decorative unless label is supplied; label an icon-only parent button separately.",
      props: {
        name: "arrow-right, search, close, check, play, replay, folder, notebook, dataset, chart, code, or agent.",
        size: "Square CSS-pixel size. Non-positive or non-finite values fall back to 24. Inspect 16, 20, 24 and 32px before use.",
        color: "Stroke color. Inherits text color by default.",
        treatment:
          "outline has no fill; paper fills enclosed silhouettes. Open marks are identical in both treatments.",
        paperColor:
          "Paper fill, cream by default. Set explicitly on dark surfaces.",
        label:
          "Accessible name for standalone meaningful icons. Omit for decorative icons beside text.",
        style:
          "Inline style overrides; width and height overrides can supersede size.",
      },
    },
    {
      export: "iconPaths",
      kind: "constant",
      summary:
        "Original body and interior-mark SVG paths on a 24×24 grid, keyed by IconName. Body paths are closed and may be filled; marks remain unfilled.",
    },
    {
      export: "IconName",
      kind: "type",
      summary: "Union of the twelve keys in iconPaths.",
    },
    { export: "IconTreatment", kind: "type", summary: "outline | paper." },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 24, height: 24 },
    vertical: { width: 24, height: 24 },
    basis:
      "Square 24×24 viewBox; size sets width and height in pixels, default 24.",
  },
  examples: [
    {
      title: "Beside a label",
      code: 'import { JbmIcon } from "@/jbm/ui/icons"\n\n<button><JbmIcon name="play" size={20} /> Start lesson</button>',
    },
    {
      title: "Standalone paper icon",
      code: 'import { JbmIcon } from "@/jbm/ui/icons"\n\n<JbmIcon name="folder" treatment="paper" paperColor="#C63D24" color="#20241F" size={32} label="Project folder" />',
    },
  ],
  qa: [
    "Open /icons to inspect all twelve silhouettes at 16, 20, 24, 32 and 48px and enlarged. Compare outline and paper treatments on cream and ink.",
    "Check icon-only controls have an accessible name on the button; decorative SVGs must stay out of the accessibility tree.",
    "Download an SVG from /icons and compare its treatment, size and colors with the selected grid specimen.",
    "The notebook, folder and table are optically simplified icons, not scaled-down animated illustrations. No overlapping paper layers or animation are implied.",
  ],
} satisfies ItemContract
