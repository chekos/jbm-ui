import type { ItemContract } from "../schema"

const layoutProps = {
  box: "Area the axes span { x, y, w, h }, in the parent SVG's user units; usually DeskTop's surface.",
  center: "Where the axes cross. Defaults to the centre of box. Clamped to the range (ejesLayout().range) that keeps every label inside the box, the top and bottom labels left of the vertical axis, the right label right of it, and the top label below the left/right labels; a box too small for its labels crosses at its centre.",
  h: "Horizontal axis draw progress, 0–1. Clamped.",
  v: "Vertical axis draw progress, 0–1. Clamped.",
  quiet:
    "Label size: false or 0 is full (36 units, weight 650), true or 1 is quiet (22 units, weight 500) at the same axis ends; numbers between interpolate the size and the (variable) weight together, so an animated shrink never pops.",
  reveal:
    "Per-label opacity, 0–1, keyed top, bottom, left, right. A label left out fades in over 60 units as its axis's drawing tip passes it.",
  origin:
    "Axes grow out from the crossing (center, default) or from the left and top edges (start).",
  focusInset:
    "Gap between a focus outline and the box edges and axes, in parent units (default 16). Outlines clear the labels as one aligned set: both top quadrants give up the strip for the left/right labels, both give up the strip above the horizontal axis for the top label, and both bottom quadrants the strip below it for the bottom label. An outline under 40 units on a side is not drawn.",
}

export default {
  name: "ejes",
  entry: "component",
  title: "Ejes",
  description:
    "Two ink axes that split an area into four named quadrants, with quiet labels and a focus quadrant.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Ejes",
      kind: "component",
      summary:
        "SVG <g> of two crossing ink axes with a name on each side: top and bottom flank the horizontal axis at its left end, left and right flank the vertical axis at its top end. Each axis draws by its own progress; labels arrive with their axis and can shrink to quiet. One or more quadrants can be called out by a rounded outline or light fill. Vermilion appears only with focusTone accent. Controlled; no internal timer. Render inside an <svg>, usually over DeskTop.",
      props: {
        ...layoutProps,
        labels: "Half-plane names { top, bottom, left, right }. An empty string hides that label.",
        focus:
          "Quadrant or quadrants to call out: tl, tr, bl, br, or an array (all four together for the \"cuatro\" beat). Omit for none.",
        focusTone:
          "ink (default): ink outline. fill: light ink wash, no outline. accent: vermilion outline, opt-in for the one deliberate stamp (the board's @advina answer quadrant); never the default.",
        focusProgress:
          "Focus draw progress, 0–1 (default 1): outlines draw around their perimeter, fills fade in. Clamped.",
        weight: "Axis and outline stroke width in parent units (default 2, the desk's line weight).",
      },
    },
    {
      export: "ejesLayout",
      kind: "function",
      summary:
        "Axis, label, and quadrant geometry, for placing a sheet in each quadrant or a hand at an axis end.",
      params: {
        ...layoutProps,
        labels: "Optional; when given, an empty label frees its strip so focus outlines can reach the axis.",
      },
      returns:
        "{ box, center, horizontal: { x1, x2, y }, vertical: { x, y1, y2 }, type: { size, quiet }, labels: { top|bottom|left|right: { x, y, anchor, baseline, opacity } }, quadrants: { tl|tr|bl|br: Box }, range: { x: [min, max], y: [min, max] }, focus: { tl|tr|bl|br: Box } }, in parent SVG units; a focus box too small to draw has w and h 0.",
    },
    {
      export: "quadrants",
      kind: "constant",
      summary: "[\"tl\", \"tr\", \"bl\", \"br\"]: the four quadrant keys in spoken order of the board's readers.",
    },
    {
      export: "EJES_TYPE",
      kind: "constant",
      summary: "Label sizes in parent units: { full: 36, quiet: 22 }.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 1680, height: 830 },
    vertical: { width: 936, height: 1340 },
    basis:
      "The axes span their box exactly (parent SVG units = stage pixels); labels and focus outlines stay inside it. The numbers are the act 2 desk surface at the safe area: landscape 1920 − 2 × 120 by 920 − 90, vertical 1080 − 2 × 72 by 1440 − 100.",
  },
  examples: [
    {
      title: "Four places on the desk, labels quiet, answer quadrant outlined",
      code: 'import { Ejes } from "@/jbm/ui/ejes"\n\n<svg viewBox="0 0 1920 1080">\n  <Ejes box={{ x: 120, y: 90, w: 1680, h: 830 }} h={1} v={1} quiet\n    labels={{ top: "hacer", bottom: "entender", left: "aprender", right: "trabajar" }}\n    focus="tl" />\n</svg>',
    },
    {
      title: "Draw the axes on a timeline (Remotion)",
      code: 'import { useCurrentFrame, interpolate } from "remotion"\nimport { Ejes } from "@/jbm/ui/ejes"\n\nfunction Brujula() {\n  const frame = useCurrentFrame()\n  const h = interpolate(frame, [120, 168], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })\n  const v = interpolate(frame, [204, 240], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })\n  return (\n    <svg viewBox="0 0 1920 1080">\n      <Ejes box={{ x: 120, y: 90, w: 1680, h: 830 }} h={h} v={v}\n        labels={{ top: "hacer", bottom: "entender", left: "aprender", right: "trabajar" }} />\n    </svg>\n  )\n}',
    },
    {
      title: "The one vermilion answer quadrant (opt-in)",
      code: 'import { Ejes } from "@/jbm/ui/ejes"\n\n<svg viewBox="0 0 1920 1080">\n  <Ejes box={{ x: 120, y: 90, w: 1680, h: 830 }} h={1} v={1} quiet\n    labels={{ top: "hacer", bottom: "entender", left: "aprender", right: "trabajar" }}\n    focus="tr" focusTone="accent" focusProgress={0.6} />\n</svg>',
    },
  ],
  qa: [
    "Drag Horizontal and Vertical independently from Hidden to Drawn in both Grow from modes: each axis grows only by its own control, and each label fades in as the line reaches it, not before.",
    "Drag Quiet from Full to Quiet: labels shrink toward the axis ends without moving off them; at Quiet they are small but readable.",
    "Step Focus through each quadrant and All four with every Tone: outlines never cross a label or an axis, and all four line up as one set (shared top, shared edges either side of the horizontal axis); Light fill has no outline; only Accent outline is vermilion.",
    "Drag Outline: the rounded outline draws around its perimeter; at 0 nothing shows.",
    "Check a narrow screen: the labels stay inside the box and stay legible at quiet size.",
    "Pass a center near a corner (e.g. { x: 90, y: 300 } in a 580 × 380 box): the crossing moves only as far as its labels allow, no label leaves the box or crosses an axis, and focus outlines too small to read are not drawn.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
