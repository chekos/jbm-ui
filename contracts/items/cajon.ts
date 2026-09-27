import type { ItemContract } from "../schema"

const drawerProps = {
  x: "Left edge of the drawer in the parent SVG's user units.",
  y: "Top of the drawer's back edge reference in parent SVG units; the front and folders are placed from it.",
  w: "Drawer width in parent SVG units. The front folder is w − 52 wide and its height (and the front's) scales with it at 150:205; folders further back are narrower. Above the 420 reference the furniture grows with it: walls, margins, front travel, the front folder's rise, lift clearance, and the handle all scale by w / 420 (narrower drawers keep the reference sizes).",
  h: "Nominal drawer depth, returned by cajonLayout for composites; the drawing does not use it (front height follows w).",
  folders:
    "Folders front to back (index 0 nearest the front, drawn last). Each is a DrawerFolder: name (drawn whole on its tab in Geist 800), accent, pulled, k, open, reveal, sublabel (Geist italic), sublabelReveal.",
  open: "Drawer opening from 0 (closed) to 1 (front slid forward 104 units, folders raised 62 and fanned by depthSpacing; both × w / 420 above 420). Clamped; pulled and ajar folders only rise while open.",
  depthSpacing:
    "Rise from one folder to the next one back, in parent SVG units. Default: tab height + band + a lip of flap, so every tab and a band of back panel stay visible for up to eight folders; more folders share the rise of eight. At labelSize 13 that is 46 (55 with sublabels). A smaller value packs folders and may hide names.",
  tabLayout:
    "\"stair\" (default) puts every tab at its folder's left edge, so tabs climb as back folders narrow; \"stagger3\" cycles tabs left, center, right.",
  labelSize:
    "Name size in parent SVG units (default 13). Tab height is 27/13 of it, the sublabel 0.8 of it. Tab widths come from sansWidth (Geist 800). Perspective does not depend on it: a folder's inset follows its depth in the drawer (its rise over the rise of eight folders), up to a fifth of the width at the back. For video at 1080 use about 24–36.",
}

export default {
  name: "cajon",
  entry: "component",
  title: "Cajon",
  description:
    "A fixed-size filing drawer whose complete folders fan front to back, darker with depth.",
  category: "UI Bits",
  family: "Folders & drawers",
  capabilities: ["controls"],
  api: [
    {
      export: "Cajon",
      kind: "component",
      summary:
        "SVG <g> of a filing drawer: dark interior, complete FolderOutline folders stepping up and narrowing toward the back, side walls, and a card front with a handle. Each folder's light (k) darkens with depth, its name inks in with reveal, and its front flap can stand ajar. Folders are occluded by the front and by each other, never shortened. Controlled by open and per-folder values; no internal timer. Render inside an <svg>.",
      props: drawerProps,
    },
    {
      export: "cajonLayout",
      kind: "function",
      summary:
        "The geometry Cajon draws, for composites that attach threads, hands, or labels to folders.",
      params: drawerProps,
      returns:
        "{ x, y, w, h, front, frontTop, frontHeight, scale, depthSpacing, labelSize, band, folders, anchors }. frontTop is the drawer front's top edge; scale is max(1, w / 420). Each folder has x, y (top of tab), w, h, tabX, tabWidth, tabHeight, tabSlope, anchor (tab grip point), label { x, y baseline, mid, end, scale }, sublabel { x, y, scale }, flap (front flap's top edge), opening { drop, lean } (the ajar flap), visible (0–1, how much of the tab shows above the drawer front; 0 inside a closed drawer), and light (effective k). anchors(i, n) returns n points on folder i's tab midline, from just before the name (clear of its first letter, where a knot sits) to the tab's straight edge; once a tab is below the drawer front's top edge the points stop at that rim, so threads never reach through the front. [] for an unknown folder or n < 1.",
    },
    {
      export: "drawerLight",
      kind: "function",
      summary:
        "Folder fill for a light value k, mixed in OKLab from the palette tokens only: k 1 is the card, lower k moves lightness toward ink by 1 − k while the hue warms toward cream; k 0 is ink.",
      params: { k: "Light from 0 to 1; clamped, non-finite values give the card." },
      returns: "An sRGB hex color.",
    },
    {
      export: "backLight",
      kind: "constant",
      summary: "0.72: the light of the backmost folder when k is not given (the front folder is 1).",
    },
    {
      export: "DrawerFolder",
      kind: "type",
      summary:
        "{ name, accent?, pulled?, k?, open?, reveal?, sublabel?, sublabelReveal? }: one folder. pulled 0–1 lifts it out and brings k to 1; k defaults to a ramp from 1 (front) to 0.72 (back); open 0–1 stands the front flap ajar: its top edge drops a fifth of the folder height and leans out, and the folder rises (by that drop plus a lip, at most as far as keeps the tab of the folder behind it in view) so at least half the shaded opening shows above whatever is in front of it (vermilion folders shade toward ink, never a new colour); reveal 0–1 inks the name in grapheme by grapheme (sublabelReveal defaults to it).",
    },
    {
      export: "CajonProps",
      kind: "type",
      summary: "Box (x, y, w, h) plus folders, open, depthSpacing, tabLayout, and labelSize.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 420, height: 382 },
    vertical: { width: 420, height: 382 },
    basis:
      "Parent SVG user units at the defaults w 420, open 1, and one folder: from the back edge at y + 10 to the front's bottom at y + 391 (front at y + 82, plus 32, plus a 277 front height from w). Each further folder rises depthSpacing (46 at labelSize 13, 55 with sublabels) above the one in front, from the front folder's top at y + 52: eight folders reach y − 270 (y − 333 with sublabels). open 0 ends at y + 287. A lifted folder rises its height + 24 (up to ≈ 293) above its resting place, so leave headroom (the gallery uses viewBox 0 −400 500 840).",
  },
  examples: [
    {
      title: "Six sources fanned by age",
      code: 'import { Cajon } from "@/jbm/motion/cajon"\n\n<svg viewBox="0 -300 500 740">\n  <Cajon x={40} y={10} open={1} folders={[\n    { name: "Grove 1983", sublabel: "High Output Management" },\n    { name: "Mintzberg 1979", sublabel: "Structuring of Organizations" },\n    { name: "Simon 1947", sublabel: "Administrative Behavior" },\n    { name: "Training Within Industry 1940s", sublabel: "Job Instruction", reveal: 0.5 },\n    { name: "Taylor 1911", sublabel: "Principles of Scientific Management" },\n  ]} />\n</svg>',
    },
    {
      title: "Tie threads to a tab",
      code: 'import { Cajon, cajonLayout } from "@/jbm/motion/cajon"\nimport { color } from "@/jbm/lib/tokens"\n\nconst props = { x: 40, y: 10, folders: [{ name: "Procida 2017" }, { name: "Taylor 1911" }] }\nconst ends = cajonLayout(props).anchors(0, 3)\n\n<svg viewBox="-200 -200 700 640">\n  <Cajon {...props} />\n  {ends.map((p, i) => (\n    <path key={i} d={`M-180 ${i * 40}C-60 ${i * 40} ${p.x - 80} ${p.y} ${p.x} ${p.y}`} fill="none" stroke={color.ink} strokeWidth={2} />\n  ))}\n</svg>',
    },
    {
      title: "Point a hand at a folder tab",
      code: 'import { Cajon, cajonLayout } from "@/jbm/motion/cajon"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst props = { x: 40, y: 10, open: 1, folders: [{ name: "datos", pulled: 0.4 }] }\nconst tab = cajonLayout(props).folders[0].anchor\n<svg viewBox="0 -260 500 700">\n  <Cajon {...props} />\n  <Mano at={tab} pose="pinch" size={120} anchor={{ x: 15, y: 5 }} />\n</svg>',
    },
  ],
  qa: [
    "Drag Open through 0, 0.5, and 1: the front slides forward, folders rise and fan, and no folder shows below the front edge.",
    "Try 1, 3, 6, and 8 folders with and without sublabels: every tab and the band under it stay visible, back folders are narrower and darker, never larger. At 12 folders the stair keeps the height of eight and labels may overlap.",
    "Sweep Name reveal 0 → 1: tabs start blank and names ink in from the left, one grapheme at a time; the tab never changes width.",
    "Lift a back folder: it rises behind the folders in front and brightens to k 1; its complete outline appears as it clears them.",
    "Pick any folder in Target and set Flap ajar: the folder rises until its shaded opening shows above the folder (or drawer front) in front of it while the tab of the folder behind stays in view, the flap's top edge drops and its corners lean just past the body, and the bottom corners stay fixed. On a vermilion folder the opening is a darker vermilion.",
    "Tab names are bold sans (Geist 800), sublabels italic sans. Long names (\"Training Within Industry 1940s\") draw whole: the tab widens to the folder, then the name compresses; there is no ellipsis.",
    "Set Name size to 24 with six folders: back folders narrow exactly as at 13; at w 900 the handle, walls, and travel grow with the drawer.",
    "Switch Tab layout to stagger3: tabs cycle left, center, right and sublabels stay inside the folder.",
    "The Mano anchor in the hand example is an estimate of the pinch fingertip; verify it visually for your pose.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
