import type { ItemContract } from "../schema"

const deskProps = {
  box: "Desk bounds { x, y, w, h } in the parent SVG's user units. The top slab starts at y + 2 and the legs reach the floor at y + h.",
  spec: "Finish and cabinet side: finish paper (card fill, default) or wood (bg fill with grain lines); drawerSide start (left, default) or end (right).",
  cabinet: "Shows the file cabinet and its drawer under the desk.",
  folders: "Folders in the cabinet drawer, as for Cajón: name, accent, and pulled per folder, index 0 nearest the front.",
  open: "Cabinet drawer opening from 0 (closed) to 1 (open). Clamped.",
}

export default {
  name: "escritorio",
  entry: "component",
  title: "Escritorio",
  description: "An empty desk with separate finish and optional file cabinet.",
  category: "Layout",
  capabilities: ["controls"],
  api: [
    {
      export: "Escritorio",
      kind: "component",
      summary:
        "SVG <g> of an empty desk (slab, apron, and two legs) sized to a box, with a paper or wood finish and an optional file cabinet between the legs. The cabinet body is drawn behind the desk and its drawer (Cajón) in front, so drawer folders can rise over the apron. Controlled; no internal timer. Render inside an <svg>.",
      props: deskProps,
    },
    {
      export: "escritorioLayout",
      kind: "function",
      summary:
        "Shared desk geometry: the cabinet fits between the legs (at most 250 wide, 12 units of clearance) from below the apron to the floor.",
      params: {
        box: deskProps.box,
        spec: "Only drawerSide affects the layout; finish is visual.",
        cabinet: "Accepted for parity with Escritorio's props; the layout always computes cabinet and drawer geometry.",
        folders: deskProps.folders,
        open: deskProps.open,
      },
      returns:
        "{ box, top, cabinet, drawer, plane, anchors }: top is box.y + 20; cabinet and drawer are the FileCabinet and Cajón props; plane holds innerLeft, innerRight, floor, and apronBottom; anchors.folders are the folder tab grip points, all in parent SVG units.",
    },
    {
      export: "DeskSpec",
      kind: "type",
      summary: "{ finish?: \"paper\" | \"wood\"; drawerSide?: \"start\" | \"end\" }.",
    },
  ],
  omit: {
    layout: "Alias of escritorioLayout, kept for existing imports.",
  },
  stage: {
    mode: "declared",
    landscape: { width: 760, height: 418 },
    vertical: { width: 760, height: 418 },
    basis:
      "Parent SVG user units for the documented box 760 × 420: width is box.w and height runs from the slab top at box.y + 2 to the floor at box.y + box.h (box.h − 2). A lifted folder in an open cabinet drawer can rise above the slab, so leave headroom when pulled is used.",
  },
  examples: [
    {
      title: "Wood desk with a cabinet on the right",
      code: 'import { Escritorio } from "@/jbm/motion/escritorio"\n\n<svg viewBox="0 0 820 530">\n  <Escritorio box={{ x: 30, y: 65, w: 760, h: 420 }}\n    cabinet spec={{ finish: "wood", drawerSide: "end" }}\n    folders={[{ name: "datos", accent: true }, { name: "notas" }]} open={1} />\n</svg>',
    },
    {
      title: "Reach for a folder with a hand",
      code: 'import { Escritorio, escritorioLayout } from "@/jbm/motion/escritorio"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst desk = { box: { x: 30, y: 65, w: 760, h: 420 }, cabinet: true, folders: [{ name: "datos" }], open: 1 }\nconst tab = escritorioLayout(desk).anchors.folders[0]\n<svg viewBox="0 0 820 530">\n  <Escritorio {...desk} />\n  <Mano at={tab} pose="pinch" size={120} anchor={{ x: 15, y: 5 }} />\n</svg>',
    },
  ],
  qa: [
    "Toggle Wood finish: only fills and grain lines change; geometry stays put.",
    "Toggle File cabinet and Cabinet on right: the cabinet sits between the legs with equal clearance on both sides and shares the floor line.",
    "With the cabinet on, drag Open and change folder count: the drawer front stays above the floor and folders draw over the apron without clipping.",
    "Try a narrow box: the cabinet shrinks to fit between the legs; very small widths are untested and may collapse it.",
    "The Mano anchor in the second example is an estimate of the pinch fingertip; verify it visually.",
  ],
} satisfies ItemContract
