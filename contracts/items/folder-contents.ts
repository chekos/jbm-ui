import type { ItemContract } from "../schema"

export default {
  name: "folder-contents",
  entry: "component",
  title: "FolderContents",
  description:
    "Folder that opens to reveal a sheet and a fan of nested folders whose documents extract independently.",
  category: "UI Bits",
  family: "Folders & drawers",
  capabilities: ["controls"],
  api: [
    {
      export: "FolderContents",
      kind: "component",
      summary:
        "Fills Folder's children slot with a front sheet and nested folders, each with an optional document. Every part is a rigid object that translates into view; nothing stretches. Pure React: `open`, per-entry `reveal` and `documentReveal`, and `lift` are independent 0–1 controls with no internal timer. Other SVG props pass through to the Folder svg.",
      props: {
        label:
          "Mono label for the outer folder; also names the image for assistive technology. On the front panel (accent and ink) it follows Folder's fitLine rule (compressed to 0.8, then an ellipsis); on the tab (card tone default, or labelOn \"tab\") it is a Geist 800 tab name drawn whole.",
        open:
          "Outer folder opening from 0 (closed, contents hidden) to 1 (contents shown). Clamped. Defaults to 1 here, unlike Folder's 0; every reveal is multiplied by it.",
        tone: "Outer folder fill: vermilion accent, ink, or plain cream card.",
        entries:
          "Nested folders, back to front. Their tabs pack between y 24 and 72 of the folder space, so more entries overlap more tightly instead of growing the folder. Empty by default.",
        sheet:
          "Label printed on the front sheet (first 15 characters). An empty string removes the sheet.",
        lift:
          "Raises all contents together by up to 240 folder units (0–1), clipped at the folder's top, for handing the whole group out.",
      },
    },
    {
      export: "FolderEntry",
      kind: "type",
      summary:
        "One nested folder: `id` (React key), `label` (truncated after 15 characters), `reveal` 0–1 (default 1; rises from the folder bottom), optional `document` label (12 characters shown), and `documentReveal` 0–1 (default 0; lifts the document 45 units out of its folder).",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 260, height: 220 },
    vertical: { width: 260, height: 220 },
    basis:
      "Renders Folder's fixed 260×220 viewBox at 260×220 stage pixels; entry count, reveals, and lift never change the box. Pass width (or style.width) to scale with height auto, and it shrinks to maxWidth 100%. The gallery uses width={320} with overflow visible so the opened sheet above the viewBox stays visible.",
  },
  examples: [
    {
      title: "Open project folder with one extracted document",
      code: 'import { FolderContents } from "@/jbm/ui/folder-contents"\n\n<FolderContents\n  label="proyecto"\n  open={1}\n  sheet="README.md"\n  entries={[\n    { id: "scripts", label: "scripts/" },\n    { id: "assets", label: "assets/", document: "notas.md", documentReveal: 1 },\n  ]}\n  width={320}\n  style={{ overflow: "visible" }}\n/>',
    },
  ],
  qa: [
    "Drag Open folder through 0, 0.5, and 1: the sheet and nested folders slide up as rigid shapes and never cut through the front panel.",
    "Drag Extract documents and Lift contents independently; each moves only its own objects.",
    "Set Nested folders to 0 and 8: zero entries with an empty sheet reads as an empty folder; eight entries pack tighter without resizing the folder.",
    "Toggle Reveal nested folders: hidden folders sit fully below the rim with complete outlines, clipped only at the container bottom.",
    "Uncertain: at open 1 the sheet and front folders extend above the 220-unit viewBox, so they rely on overflow visible; check clipping when overflow is left hidden.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
