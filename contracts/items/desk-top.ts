import type { ItemContract } from "../schema"

const deskProps = {
  box: "Desk footprint { x, y, w, h } in the parent SVG's user units, including the front edge band and any drawer region. Tilt and the drawer never change it.",
  light:
    "Light on the whole desk, 0–1 (1 full cream): every fill mixes in OKLab toward the palette's line token, reaching it at 0.72 (the visual language's deepest folder), then toward ink (deskLight). The drawer pull follows it; the ink stroke does not. Clamped.",
  edge: "Camera tilt, 0–1: reveals a front band up to 22 units tall at 1, taken out of the surface's depth: the desk's front edge under the desk top, and a side drawer's own near face under it. 0 is straight down. Clamped.",
  drawer:
    "Edge that holds an open drawer (start left, end right, top, bottom). The drawer box is pulled out past the desk top's edge, which is the one seam line, and is narrower than the desk along it; its outer wall is its front, thicker than the other walls and carrying the pull (the same label-plate pull as Cajon). Its opening is darker than the desk and runs on under the desk top. Omit for no drawer.",
  drawerSize:
    "Drawer region depth across its edge in parent units, the 6-unit seam included: along the width for start and end, along the height for top and bottom. Defaults to 40% of that dimension; kept between 44 and 80% of the plan.",
}

export default {
  name: "desk-top",
  entry: "component",
  title: "DeskTop",
  description:
    "A cream desk seen from above, with light, a tilt-revealed front edge, and an optional pulled-out drawer.",
  category: "UI Bits",
  family: "Desk objects",
  capabilities: ["controls"],
  api: [
    {
      export: "DeskTop",
      kind: "component",
      summary:
        "SVG <g> of a top-down desk: an empty cream surface with an ink edge that sheets, axes, and props lie on, an optional open drawer pulled out at one edge, and a front edge band the camera tilt reveals. It owns no sheets, axes, hands, or drawer contents; compose Ejes, DeskProp, Paper, or Cajon on top. Controlled; no internal timer. Render inside an <svg>.",
      props: deskProps,
    },
    {
      export: "deskTopLayout",
      kind: "function",
      summary:
        "Desk geometry for composites: where the flat surface is, where its centre is (Ejes cross there by default), and the drawer's region, box, opening, front, and pull.",
      params: deskProps,
      returns:
        "{ box, surface, center, drawer, front, plan, slab, drawn, fill }: surface is the flat top Box; center its centre; drawer is { panel, body, well, front, pull } or null (panel the whole region, body the pulled-out box inside it, well its opening, front its thicker outer wall, pull the plate on it); front is the edge band Box (h 0 when flat); plan the surface, seam, and drawer region above the band; slab the desk top as drawn, out to the seam line; drawn is drawing geometry for DeskTop itself; fill holds the surface, handle, front, panel, and well colours after light. All in parent SVG units.",
    },
    {
      export: "deskLight",
      kind: "function",
      summary:
        "A #rrggbb token colour under light k, kept on the palette: mixed in OKLab toward the line token as k falls from 1 to 0.72, then from line toward ink. DeskTop's fills use it.",
      params: {
        hex: "A #rrggbb colour, normally a jbm token such as color.bg or color.card.",
        k: "Light, 0–1 (clamped): 1 returns the colour, 0.72 the line token, 0 ink.",
      },
      returns: "The lit colour as #rrggbb.",
    },
    {
      export: "deskShade",
      kind: "function",
      summary:
        "Scales a #rrggbb colour's OKLab lightness by k (clamped 0–1), keeping its chroma. Kept for compatibility; DeskTop now lights its fills with deskLight, which stays on the palette.",
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
    "At index size the default (Tilted, drawer end) reads as a desk with a drawer pulled out, not a tablet: a plain cream top with its front edge, and a narrower drawer box with a pull on its outer front.",
    "Drag Edge from Flat to Tilted: the front band grows from the bottom inside the box, the surface loses the same depth, their shared edge stays one line with square corners where they meet, and a side drawer shows its own near face.",
    "Step Drawer through none, start, end, top, and bottom: the box never moves; the drawer box sits on the chosen edge, narrower than the desk, meeting it at one seam line (never a double line); its opening is darker than the desk and open toward the seam; every drawer has exactly one pull, on its outer front; a top or bottom drawer takes 40% of the height, not of the width.",
    "Drag Light from 1 to 0.72: every fill, the drawer pull included, darkens together toward the line token (never taupe); the ink edge does not change.",
    "At 8× zoom check the rounded corners, the seam where the drawer meets the desk and the band, and that no contour doubles, steps, or leaves a stub.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
