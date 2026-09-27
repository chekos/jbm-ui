import type { ItemContract } from "../schema"

const drawerProps = {
  x: "Left edge of the drawer in the parent SVG's user units.",
  y: "Top of the drawer's back edge reference in parent SVG units; the front and folders are placed from it.",
  w: "Drawer width in parent SVG units. Folders are w − 52 wide and their height (and the front's) scales with it at 150:205.",
  h: "Nominal drawer depth, returned by cajonLayout for composites; the drawing does not use it (front height follows w).",
  folders:
    "Folders front to back (index 0 nearest the front, drawn last). name labels the tab (truncated after 16 characters) and sets the tab width; accent fills it vermilion; pulled lifts it 0–1 out of the drawer.",
  open: "Drawer opening from 0 (closed) to 1 (front slid forward 104 units, folders raised 62). Clamped; pulled folders only rise while open.",
}

export default {
  name: "cajon",
  entry: "component",
  title: "Cajon",
  description: "A fixed-size filing drawer with complete folders packed front to back.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Cajon",
      kind: "component",
      summary:
        "SVG <g> of a filing drawer: dark interior, complete FolderOutline folders with staggered tabs, side walls, and a card front with a handle. Folders are occluded by the front, never shortened. Controlled by open and each folder's pulled; no internal timer. Render inside an <svg>.",
      props: drawerProps,
    },
    {
      export: "cajonLayout",
      kind: "function",
      summary:
        "The geometry Cajon draws, for composites that need to place hands or labels on folders.",
      params: drawerProps,
      returns:
        "{ x, y, w, h, front, frontHeight, folders } where each folder has x, y (top of tab), w, h, tabX, tabWidth, and anchor, the tab's grip point, in parent SVG units.",
    },
    {
      export: "DrawerFolder",
      kind: "type",
      summary: "{ name, accent?, pulled? }: one folder in the drawer.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 420, height: 382 },
    vertical: { width: 420, height: 382 },
    basis:
      "Parent SVG user units at the defaults w 420 and open 1 with up to four unlifted folders: from the back edge at y + 10 to the front's bottom at y + 391 (front at y + 82, plus 32, plus a 277 front height from w). Five or more folders raise the back tabs to y + 4. open 0 ends at y + 287. A lifted folder rises up to its height + 24 (≈ 293) above its resting place, so leave headroom (the gallery uses viewBox 0 −260 500 700).",
  },
  examples: [
    {
      title: "Open drawer with one folder lifted",
      code: 'import { Cajon } from "@/jbm/motion/cajon"\n\n<svg viewBox="0 -260 500 700">\n  <Cajon x={40} y={10} open={1} folders={[\n    { name: "análisis", accent: true, pulled: 0.5 },\n    { name: "diseño" },\n    { name: "pruebas" },\n  ]} />\n</svg>',
    },
    {
      title: "Point a hand at a folder tab",
      code: 'import { Cajon, cajonLayout } from "@/jbm/motion/cajon"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst props = { x: 40, y: 10, open: 1, folders: [{ name: "datos", pulled: 0.4 }] }\nconst tab = cajonLayout(props).folders[0].anchor\n<svg viewBox="0 -260 500 700">\n  <Cajon {...props} />\n  <Mano at={tab} pose="pinch" size={120} anchor={{ x: 15, y: 5 }} />\n</svg>',
    },
  ],
  qa: [
    "Drag Open through 0, 0.5, and 1: the front slides forward, folders rise, and no folder shows below the front edge.",
    "Lift the front folder to 1: its complete outline, tab, and label clear the drawer and stay inside the viewBox headroom.",
    "Try 0, 1, 3, 6, and 12 folders: tabs stagger across three positions, back folders stay visible above the front ones, and 12 folders still fit the back edge.",
    "Long folder names truncate with an ellipsis and tab widths cap at 55% of the folder width.",
    "The Mano anchor in the second example is an estimate of the pinch fingertip; verify it visually for your pose.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
