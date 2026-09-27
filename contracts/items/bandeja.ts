import type { ItemContract } from "../schema"

const trayProps = {
  x: "Left edge of the tray in the parent SVG's user units.",
  y: "Top reference of the tray in parent SVG units; the back rim is at y + 16 and the base at y + 68.",
  w: "Tray width in parent SVG units; the rim, sheets, and front notch scale with it.",
  layers: "Settled sheet count; each sheet sits 4 units above the last. Floored; negative or non-finite values show none.",
  landing: "Arrival of one extra incoming sheet, 0–1: it drops from 90 units above the stack top and fades in, settling at 1. Clamped; 0 hides it.",
}

export default {
  name: "bandeja",
  entry: "component",
  title: "Bandeja",
  description: "A shallow paper tray with optional sheets.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Bandeja",
      kind: "component",
      summary:
        "SVG <g> of a shallow tray: back well, stacked card sheets, and a front lip with a finger notch that occludes their lower edges. Controlled by layers and landing; no internal timer. Render inside an <svg>.",
      props: trayProps,
    },
    {
      export: "bandejaLayout",
      kind: "function",
      summary: "Tray geometry for composites that drop or pick up sheets.",
      params: {
        x: trayProps.x,
        y: trayProps.y,
        w: trayProps.w,
        layers: trayProps.layers,
        landing: "Accepted for parity with Bandeja's props; the layout ignores it.",
      },
      returns:
        "{ x, y, w, count, floor, stackTop }: the floored sheet count, the tray floor centre (y + 41), and the centre of the top of the settled stack (floor − count × 4), in parent SVG units.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 280, height: 52 },
    vertical: { width: 280, height: 52 },
    basis:
      "Parent SVG user units at w 280: from the back rim at y + 16 to the base at y + 68. Beyond three layers the top sheets rise over the back rim (top sheet at y + 24 − 4 × (layers − 1)), and a landing sheet starts 90 units above the stack, so leave headroom above y.",
  },
  examples: [
    {
      title: "Tray with three sheets",
      code: 'import { Bandeja } from "@/jbm/motion/bandeja"\n\n<svg viewBox="0 0 400 250">\n  <Bandeja x={60} y={120} layers={3} />\n</svg>',
    },
    {
      title: "Land a sheet and aim at the stack",
      code: 'import { Bandeja, bandejaLayout } from "@/jbm/motion/bandeja"\n\nconst tray = { x: 70, y: 160, w: 360, layers: 4 }\nconst target = bandejaLayout(tray).stackTop // where the next sheet lands\n<svg viewBox="0 0 500 340">\n  <Bandeja {...tray} landing={0.6} />\n  <circle cx={target.x} cy={target.y} r={4} />\n</svg>',
    },
  ],
  qa: [
    "Drag Sheets from 0 to 12: each sheet steps up 4 units, the front lip always covers their lower edges, and tall stacks stay inside the viewBox.",
    "Step landing through 0, 0.5, and 1: the incoming sheet fades in while descending and rests exactly on the stack at 1, then increment layers to settle it.",
    "Check the front notch stays centred when w changes.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
