import type { ItemContract } from "../schema"

export default {
  name: "folder",
  entry: "component",
  title: "Folder",
  description:
    "Controlled folder illustration that pulls its sheet upright from 0 to 1.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Folder",
      kind: "component",
      summary:
        "Accent or ink folder whose sheet rotates upright and clears the front panel as `open` goes from 0 to 1. Pure React with no internal timer; drive `open` from a slider or a video timeline.",
      props: {
        label: "Mono label printed on the front panel; also names the image for assistive technology. Labels longer than 16 characters show their first 15 characters plus an ellipsis.",
        open: "Opening progress from 0 (closed) to 1 (sheet upright). Clamped; non-finite values render closed.",
        tone: "Folder fill: vermilion accent or ink.",
        children: "Replaces the default sheet entirely. Rendered untransformed, so `open` does not move custom contents; animate them yourself or use FolderContents.",
      },
    },
    {
      export: "FolderOutline",
      kind: "component",
      summary:
        "The complete back silhouette with its tab, as an SVG path. Shared by Folder, FolderContents, FolderCarry, and filing drawers so hidden geometry stays consistent.",
      props: {
        x: "Left edge in the parent SVG's units.",
        y: "Top of the tab.",
        w: "Body width.",
        h: "Height from the top of the tab to the bottom edge.",
        tabX: "Left edge of the tab; defaults to the body's left edge.",
        tabWidth: "Tab width, including its slope.",
        tabHeight: "Tab height above the body.",
        tabSlope: "Horizontal run of the tab's slanted edge.",
        fill: "Fill color; the 2px ink edge is fixed.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 260, height: 220 },
    vertical: { width: 260, height: 220 },
    basis:
      "Fixed 260×220 viewBox rendered at 260×220 stage pixels. It keeps its aspect ratio: set style.width to scale (height is auto), and it shrinks to maxWidth 100% of its container.",
  },
  examples: [
    {
      title: "Half-open folder",
      code: 'import { Folder } from "@/jbm/ui/folder"\n\n<Folder label="Ideas" open={0.6} />\n// open: 0 (closed) to 1 (open); no internal timer.',
    },
    {
      title: "Drive it from a Remotion timeline",
      code: 'import { Folder } from "@/jbm/ui/folder"\nimport { useProgress } from "@/jbm/motion/hooks" // install @jbm/motion-hooks separately\n\n// Render inside a Remotion <Composition> or <Player>: hooks run in the component body.\nexport function OpeningFolder() {\n  const open = useProgress(0.5, 1, 0.8)\n  return <Folder label="proyecto" tone="ink" open={open} style={{ width: 390 }} />\n}',
    },
  ],
  qa: [
    "Drag open through 0, 0.5, and 1: the sheet never cuts through the front panel and its lower corner clears the folder edge.",
    "Check the label stays on the front plane while it foreshortens, and long labels truncate with an ellipsis.",
    "Compare accent and ink tones; the ink folder keeps a visible 2px edge on cream.",
    "Scale with style.width at narrow widths: the silhouette keeps its 260:220 proportions.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
    { title: "Visual primitives guide", url: "https://jbm-ui.bns.studio/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
