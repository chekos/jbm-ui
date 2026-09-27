import type { ItemContract } from "../schema"

export default {
  name: "file-cabinet",
  entry: "component",
  title: "FileCabinet",
  description:
    "SVG cabinet enclosure around a controlled filing drawer whose folders slide out and lift.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "FileCabinet",
      kind: "component",
      summary:
        "An SVG <g> for use inside your own <svg>: a fixed card enclosure with a chamfered top, and a Cajon drawer inset 10px at the sides and 32px from the top. `open` and per-folder `pulled` are controlled 0–1; the enclosure never moves or resizes.",
      props: {
        x: "Left edge of the enclosure in the parent SVG's units.",
        y: "Top edge of the enclosure.",
        w: "Enclosure width; the drawer is w − 20.",
        h: "Enclosure height; the drawer is h − 44.",
        folders:
          "Folders in the drawer, index 0 nearest the front. Each has a `name` (tab label, truncated after 16 characters), optional `accent` fill, and optional `pulled` 0–1 lift. Count never changes the drawer size; more than six pack closer.",
        open: "Drawer opening from 0 (closed) to 1 (open). Clamped.",
      },
    },
    {
      export: "FileCabinetBody",
      kind: "component",
      summary:
        "The enclosure alone, so composites (such as Escritorio) can draw foreground furniture between it and the moving drawer.",
      props: {
        x: "Left edge in the parent SVG's units.",
        y: "Top edge.",
        w: "Width.",
        h: "Height.",
      },
    },
    {
      export: "fileCabinetLayout",
      kind: "function",
      summary: "Computes the enclosure box and the drawer props FileCabinet renders, for composites that draw the parts separately.",
      params: {
        x: "Left edge of the enclosure.",
        y: "Top edge of the enclosure.",
        w: "Enclosure width.",
        h: "Enclosure height.",
        folders: "Drawer folders, passed through to the drawer.",
        open: "Drawer opening 0–1, passed through to the drawer.",
      },
      returns: "`{ body: Box, drawer: CajonProps }`: the enclosure box and the inset drawer props (x + 10, y + 32, w − 20, h − 44).",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 300, height: 360 },
    vertical: { width: 300, height: 360 },
    basis:
      "Default w 300 by h 360 in the parent SVG's units, placed at x, y. The drawer stays inside the enclosure at every opening, but lifted folders rise above the top by up to about their height plus 24 (roughly 190 units at the default width), so the parent viewBox needs headroom: the gallery uses \"0 -260 500 700\".",
  },
  examples: [
    {
      title: "Open cabinet with one folder",
      code: 'import { FileCabinet } from "@/jbm/ui/file-cabinet"\n\n<svg viewBox="0 -260 500 650">\n  <FileCabinet x={80} folders={[{ name: "datos" }]} open={1} />\n</svg>',
    },
    {
      title: "Lift the front folder",
      code: 'import { FileCabinet } from "@/jbm/ui/file-cabinet"\n\n<svg viewBox="0 -260 500 700">\n  <FileCabinet x={85} y={-20} w={330} h={350} open={0.8}\n    folders={[{ name: "análisis", accent: true, pulled: 0.6 }, { name: "diseño" }]} />\n</svg>',
    },
  ],
  qa: [
    "Drag Open through 0, 0.5, and 1: the enclosure never moves or resizes and only the drawer travels toward the viewer.",
    "Try folder counts 0, 1, 3, 6, and 12: the drawer size is unchanged and extra folders pack toward the back.",
    "Drag Lift front folder to 1: the folder body is complete behind the drawer front, keeps its size, and stays within the viewBox headroom.",
    "Check the preview at narrow widths; the SVG scales with its viewBox.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
