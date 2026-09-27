import type { ItemContract } from "../schema"

export default {
  name: "folder-carry",
  entry: "component",
  title: "Folder carry",
  description:
    "Folder carried along a path by its tab, interpolating size and label between two resting places.",
  category: "Motion",
  capabilities: ["controls"],
  api: [
    {
      export: "FolderCarry",
      kind: "component",
      summary:
        "SVG group (render inside an <svg>) drawing the shared folder silhouette at `carriedFolderGeometry(from, to, path, progress)`, with a fold line and the label fading from the tab to the front panel. Pure React with no timer: drive `progress` from a slider or video timeline, and place a hand at `pointOn(path, progress)`.",
      props: {
        from: "Resting geometry at progress 0, in the parent SVG's units (see tableFolderGeometry).",
        to: "Resting geometry at progress 1; may be a different scale or a drawer's own geometry.",
        path: "Grip points in the parent SVG's units; start at folderGrip(from) and end at folderGrip(to) so the endpoints do not jump.",
        progress: "Carry progress from 0 (at `from`) to 1 (at `to`), by arc length along `path`. Clamped.",
        label:
          "Folder name (first 16 characters); also labels the group as \"Carrying …\" for assistive technology. Shown on the tab at 0 and on the front panel at 1, crossfading between.",
      },
    },
    {
      export: "carriedFolderGeometry",
      kind: "function",
      summary:
        "Geometry of the carried folder: its grip sits on `pointOn(path, progress)` while width, height, tab size, and tab offset interpolate linearly from `from` to `to`.",
      params: {
        from: "Geometry at progress 0.",
        to: "Geometry at progress 1.",
        path: "Grip path in SVG units; must have at least one point.",
        progress: "0–1 carry progress; clamped.",
      },
      returns: "A FolderGeometry to pass to FolderOutline or to position a hand.",
    },
    {
      export: "folderGrip",
      kind: "function",
      summary: "Where a hand holds a folder: the tab's horizontal center, 10/27 of the tab height below the top.",
      params: { g: "Folder geometry." },
      returns: "The grip point in the same units as `g`.",
    },
    {
      export: "tableFolderGeometry",
      kind: "function",
      summary:
        "Geometry of a Folder-sized silhouette resting at `at`, scaled from Folder's 260-unit frame (body 205×150 at offset 25,55; tab 83 wide, 27 tall, 17 slope).",
      params: {
        at: "Top-left of the 260-unit folder frame, in SVG units.",
        width: "Frame width in SVG units; 260 matches a standalone Folder.",
      },
      returns: "A FolderGeometry for `from` or `to`.",
    },
    {
      export: "FolderGeometry",
      kind: "type",
      summary:
        "Folder silhouette box: `x`, `y` (top of the tab), `w`, `h`, `tabX`, `tabWidth`, and optional `tabHeight` (27) and `tabSlope` (17), all in SVG units.",
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Draws in the parent SVG's coordinate space with no box of its own; its extent is set by `from`, `to`, and `path`. The gallery demo uses a 450×270 viewBox at 100% width with folders 100 and 190 units wide.",
  },
  examples: [
    {
      title: "Carry a folder from a small to a large resting place",
      code: 'import { FolderCarry, folderGrip, tableFolderGeometry } from "@/jbm/ui/folder-carry"\n\nconst from = tableFolderGeometry({ x: 5, y: 65 }, 100)\nconst to = tableFolderGeometry({ x: 225, y: 60 }, 190)\nconst path = [folderGrip(from), { x: 200, y: 45 }, folderGrip(to)]\n\n<svg viewBox="0 0 450 270" width="100%">\n  <FolderCarry from={from} to={to} path={path} progress={0.5} label="proyecto" />\n</svg>',
    },
    {
      title: "Put a hand on the grip",
      code: 'import { FolderCarry, folderGrip, tableFolderGeometry } from "@/jbm/ui/folder-carry"\nimport { pointOn } from "@/jbm/lib/geometry"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst from = tableFolderGeometry({ x: 5, y: 65 }, 100)\nconst to = tableFolderGeometry({ x: 225, y: 60 }, 190)\nconst path = [folderGrip(from), { x: 200, y: 45 }, folderGrip(to)]\nconst progress = 0.4\n\n<svg viewBox="0 0 450 270" width="100%">\n  <FolderCarry from={from} to={to} path={path} progress={progress} label="proyecto" />\n  <Mano at={pointOn(path, progress)} pose="pinch" size={70} anchor={{ x: 6, y: 10 }} />\n</svg>',
    },
  ],
  qa: [
    "Drag Carry progress to 0, 0.5, and 1: the folder matches its resting geometry exactly at both ends, and the label moves from tab to front panel without both copies fully visible mid-way.",
    "Toggle Show hand and sweep progress: the pinch stays on the tab's grip throughout; adjust Hand angle and confirm the contact point does not drift.",
    "Check the scale change reads as smooth growth with no jump in tab shape at the endpoints.",
    "Check narrow screens: the demo SVG scales to 100% width without clipping either resting place.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/design-video-components.md" },
  ],
} satisfies ItemContract
