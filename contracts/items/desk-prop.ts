import type { ItemContract } from "../schema"

const propProps = {
  kind: "keycap (a single key, 56 × 56), keyboard (four rows of nine keys, the last with a space bar, 270 × 130), or mug (side view with a handle ring, 90 × 78).",
  x: "Centre of the footprint, in the parent SVG's user units.",
  y: "Centre of the footprint, in parent SVG units.",
  scale: "Uniform size multiplier (default 1). The ink stroke stays 2 parent units at any scale.",
  rotate: "Rotation in degrees around the centre (default 0).",
  press:
    "Key travel, 0–1: the keycap's top sinks and centres; on a keyboard, the keys listed in keys do. The mug ignores it. Clamped.",
  keys: "Keyboard only: indices of the keys press applies to, row by row from the top left (0–26 the three full rows, 27–31 the bottom row, 29 the space bar).",
}

export default {
  name: "desk-prop",
  entry: "component",
  title: "DeskProp",
  description: "A free-standing keycap, keyboard, or mug to place on a desk.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "DeskProp",
      kind: "component",
      summary:
        "SVG <g> of one small desk object in the library's card fill and 2-unit ink line, placed by its centre with scale and rotation. It owns no hand: compose Mano at deskPropLayout's contact point. Controlled; no internal timer. Render inside an <svg>.",
      props: propProps,
    },
    {
      export: "deskPropLayout",
      kind: "function",
      summary:
        "Placement and contact points after scale and rotation, so a fingertip lands on the keycap or a key and a grip lands on the mug's handle.",
      params: propProps,
      returns:
        "{ kind, center, size, corners, contact, keys, transform }: size is the scaled footprint; corners the four footprint corners; contact the keycap top, the home-row middle key (index 13), or the handle ring; keys every keyboard key centre (empty otherwise); transform the SVG transform the prop uses. Parent SVG units.",
    },
    {
      export: "deskPropSize",
      kind: "constant",
      summary: "Footprint of each kind at scale 1, in parent units: keycap 56 × 56, keyboard 270 × 130, mug 90 × 78.",
    },
    {
      export: "deskPropKeys",
      kind: "constant",
      summary:
        "The keyboard's 32 key rectangles in local units (centre origin): three rows of nine 22-unit keys on a 28-unit pitch, then two keys, a 134-unit space bar, and two keys.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 270, height: 130 },
    vertical: { width: 270, height: 130 },
    basis:
      "Parent SVG units for the largest kind, a keyboard at scale 1 (270 × 130). A keycap is 56 × 56 and a mug 90 × 78; everything multiplies by scale, and rotation can widen the axis-aligned bounds to the rotated corners (deskPropLayout(...).corners). On a 1920 × 1080 desk the Doorways board draws them larger: about scale 1.5 for the keyboard and 2 to 2.4 for the keycap and mug.",
  },
  examples: [
    {
      title: "Keyboard, keycap, and mug on a desk",
      code: 'import { DeskProp } from "@/jbm/ui/desk-prop"\n\n<svg viewBox="0 0 600 240">\n  <DeskProp kind="keycap" x={70} y={120} />\n  <DeskProp kind="keyboard" x={290} y={120} rotate={-4} />\n  <DeskProp kind="mug" x={520} y={120} />\n</svg>',
    },
    {
      title: "A pointing finger presses the keycap",
      code: 'import { DeskProp, deskPropLayout } from "@/jbm/ui/desk-prop"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst key = { kind: "keycap", x: 200, y: 180, scale: 1.5, press: 0.6 } as const\nconst tip = deskPropLayout(key).contact\n<svg viewBox="0 0 400 300">\n  <DeskProp {...key} />\n  <Mano at={tip} pose="point" size={120} angle={180} anchor={{ x: 9.5, y: 1.6 }} />\n</svg>',
    },
  ],
  qa: [
    "Switch Prop through keycap, keyboard, and mug: each reads as its noun alone, in card fill with the same 2-unit ink line as Hand and Folder.",
    "Drag Scale from 0.5× to 2×: proportions hold and the stroke stays 2 units, not thinner or thicker.",
    "Drag Rotation: each prop turns about its centre and stays inside the preview.",
    "Drag Press on the keycap and the keyboard: the keycap top sinks toward its centre; on the keyboard only the home-row middle key moves.",
    "Enlarge the mug: the handle ring meets the body without a gap or a doubled edge.",
    "The Mano anchor in the second example is an estimate of the fingertip; verify it visually.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
