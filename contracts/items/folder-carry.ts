import type { ItemContract } from "../schema"

export default {
  name: "folder-carry",
  entry: "component",
  title: "FolderCarry",
  description:
    "Folder carried along a path by its tab, interpolating size and label between two resting places.",
  category: "UI Bits",
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
          "Folder name; also labels the group as \"Carrying …\" for assistive technology. On the tab (shown at 0) it follows Cajon's rule: drawn whole in Geist 800, compressed when the tab is short, never cut. On the front panel (shown at 1) it follows Folder's fitLine rule. The two crossfade.",
        fill: "Folder fill passed to FolderOutline: a palette token such as color.accent (default, vermilion), color.ink, or color.card, or a drawer shade from drawerLight(k) for a folder lifted out of a Cajon.",
        labelColor: "Label color. Defaults to labelInkOn(fill): color.ink on light fills (OKLab lightness above 0.6, including every drawerLight shade from k 0.72 up) and color.bg (cream) on vermilion and ink.",
        labelSize: "Tab name size in the parent SVG's units. Defaults to 13/27 of the tab height, Cajon's ratio, so a folder carried out of a drawer keeps the drawer's tab type at the handoff.",
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
        "Folder silhouette box: `x`, `y` (top of the tab), `w`, `h`, `tabX`, `tabWidth`, and optional `tabHeight` (27), `tabSlope` (17), and `flap` (absolute y of the front flap's top edge; defaults to 40/27 of the tab height below `y`), all in SVG units. A cajonLayout() folder is a FolderGeometry, flap included, so the fold line matches the drawer's.",
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
      title: "Carry a plain cream folder",
      code: 'import { FolderCarry, folderGrip, tableFolderGeometry } from "@/jbm/ui/folder-carry"\nimport { color } from "@/jbm/lib/tokens"\n\nconst from = tableFolderGeometry({ x: 5, y: 65 }, 100)\nconst to = tableFolderGeometry({ x: 225, y: 60 }, 190)\nconst path = [folderGrip(from), { x: 200, y: 45 }, folderGrip(to)]\n\n<svg viewBox="0 0 450 270" width="100%">\n  <FolderCarry from={from} to={to} path={path} progress={0.5} label="Doorways" fill={color.card} />\n</svg>',
    },
    {
      title: "Put a hand on the grip",
      code: 'import { FolderCarry, folderGrip, tableFolderGeometry } from "@/jbm/ui/folder-carry"\nimport { pointOn } from "@/jbm/lib/geometry"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst from = tableFolderGeometry({ x: 5, y: 65 }, 100)\nconst to = tableFolderGeometry({ x: 225, y: 60 }, 190)\nconst path = [folderGrip(from), { x: 200, y: 45 }, folderGrip(to)]\nconst progress = 0.4\n\n<svg viewBox="0 0 450 270" width="100%">\n  <FolderCarry from={from} to={to} path={path} progress={progress} label="proyecto" />\n  <Mano at={pointOn(path, progress)} pose="pinch" size={70} anchor={{ x: 6, y: 10 }} />\n</svg>',
    },
  ],
  qa: [
    "Set Folder fill to card and ink: the carried folder keeps that fill at every progress, with an ink label on cream and a cream label on ink; vermilion appears only with the accent fill.",
    "Drag Carry progress to 0, 0.5, and 1: the folder matches its resting geometry exactly at both ends, and the label moves from tab to front panel without both copies fully visible mid-way.",
    "Toggle Show hand and sweep progress: the pinch stays on the tab's grip throughout; adjust Hand angle and confirm the contact point does not drift.",
    "Check the scale change reads as smooth growth with no jump in tab shape at the endpoints.",
    "Carry a folder out of a Cajon with fill drawerLight(0.8) and the drawer's folder as `from`: at progress 0 the tab name is ink, whole, the same size as the drawer's names, and the fold line sits on the drawer's flap line.",
    "Check narrow screens: the demo SVG scales to 100% width without clipping either resting place.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
