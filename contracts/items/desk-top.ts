import type { ItemContract } from "../schema"

const deskProps = {
  box: "Desk footprint { x, y, w, h } in the parent SVG's user units, including the front edge band and any drawer region. Tilt and the drawer never change it.",
  light:
    "Light on the whole desk, 0–1: multiplies the cream's OKLab lightness (1 full cream, 0.72 the visual language's deepest folder). Every fill follows it, the drawer pull included; the ink stroke does not. Clamped.",
  edge: "Camera tilt, 0–1: reveals the front edge band along the bottom, up to 22 units tall at 1, taken out of the surface's depth. 0 is straight down. Clamped.",
  drawer:
    "Edge that holds an empty drawer region (start left, end right, top, bottom), separated from the surface by a 6-unit seam and drawn as a panel with a recessed opening. The plan under both is one slab in the front band's shade, so the seam reads as a groove in one desk rather than a gap. Omit for no drawer.",
  drawerSize:
    "Drawer region depth across its edge in parent units, seam included: along the width for start and end, along the height for top and bottom. Defaults to 40% of that dimension; kept between 42 and 80% of the plan.",
}

export default {
  name: "desk-top",
  entry: "component",
  title: "DeskTop",
  description:
    "A cream desk seen from above, with light, a tilt-revealed front edge, and an optional drawer region.",
  category: "Layout",
  capabilities: ["controls"],
  api: [
    {
      export: "DeskTop",
      kind: "component",
      summary:
        "SVG <g> of a top-down desk: an empty cream surface with an ink edge that sheets, axes, and props lie on, an optional drawer region at one edge, and a front edge band the camera tilt reveals. It owns no sheets, axes, hands, or drawer contents; compose Ejes, DeskProp, Paper, or Cajon on top. Controlled; no internal timer. Render inside an <svg>.",
      props: deskProps,
    },
    {
      export: "deskTopLayout",
      kind: "function",
      summary:
        "Desk geometry for composites: where the flat surface is, where its centre is (Ejes cross there by default), and the drawer region's panel and opening.",
      params: deskProps,
      returns:
        "{ box, surface, center, drawer, front, fill }: surface is the flat top Box; center its centre; drawer is { panel, well } or null; front is the edge band Box (h 0 when flat); fill holds the surface, front, panel, and well colours after light. All in parent SVG units.",
    },
    {
      export: "deskShade",
      kind: "function",
      summary:
        "Scales a #rrggbb token colour's OKLab lightness by k (clamped 0–1), keeping its hue: the visual language's depth-as-light rule.",
      params: {
        hex: "A #rrggbb colour, normally a jbm token such as color.bg.",
        k: "Lightness multiplier, 0–1.",
      },
      returns: "The shaded colour as #rrggbb.",
    },
    {
      export: "DESK_EDGE",
      kind: "constant",
      summary: "Front edge band height at full tilt (edge 1), in parent units: 22.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 1680, height: 830 },
    vertical: { width: 936, height: 1340 },
    basis:
      "The desk fills its box exactly (parent SVG units = stage pixels in a 1920 × 1080 or 1080 × 1920 composition). The numbers are the safe area the act 2 layout gives it: landscape 1920 − 2 × 120 by 920 − 90, vertical 1080 − 2 × 72 by 1440 − 100. Tilt and the drawer region stay inside the box.",
  },
  examples: [
    {
      title: "Desk with the drawer kept in frame on the right",
      code: 'import { DeskTop } from "@/jbm/ui/desk-top"\n\n<svg viewBox="0 0 1920 1080">\n  <DeskTop box={{ x: 120, y: 90, w: 1680, h: 830 }} drawer="end" drawerSize={520} />\n</svg>',
    },
    {
      title: "Axes on the surface, tilting to show the desk edge",
      code: 'import { DeskTop, deskTopLayout } from "@/jbm/ui/desk-top"\nimport { Ejes } from "@/jbm/ui/ejes" // install @jbm/ejes separately\n\nconst desk = { box: { x: 120, y: 90, w: 1680, h: 830 }, edge: 1 }\nconst { surface } = deskTopLayout(desk)\n<svg viewBox="0 0 1920 1080">\n  <DeskTop {...desk} />\n  <Ejes box={surface} h={1} v={1} quiet\n    labels={{ top: "hacer", bottom: "entender", left: "aprender", right: "trabajar" }} />\n</svg>',
    },
  ],
  qa: [
    "Drag Edge from Flat to Tilted: the front band grows from the bottom inside the box, the surface loses the same depth, and their shared edge stays one line with square corners where they meet.",
    "Step Drawer through none, start, end, top, and bottom: the box never moves; the panel sits on the chosen edge with a 6-unit groove (never a bright gap); its opening is darker than the surface; a top or bottom drawer takes 40% of the height, not of the width.",
    "With a start, end, or bottom drawer and Edge above half, a small pull shows on the band under the drawer; a top drawer shows none.",
    "Drag Light from 1 to 0.72: every fill, the drawer pull included, darkens together and keeps its hue; the ink edge does not change.",
    "At 2× zoom check the rounded corners, the seam, and that no contour doubles or steps.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
