import type { ItemContract } from "../schema"

const propProps = {
  kind: "keycap (a single key, 56 × 56), keyboard (a compact 314 × 100 board: three letter rows of 14, 13, and 12 keys offset by tab, caps, and shift, then eight modifiers around a space bar), or mug (from above like the others: a round body with its rim and the handle's end to the right, 90 × 78); mug-side is the same mug standing upright seen from the side (a body a little taller than wide, the rim's ellipse across its top, and one C-shaped handle to the right, 90 × 78), for a hand that holds it.",
  x: "Centre of the footprint, in the parent SVG's user units.",
  y: "Centre of the footprint, in parent SVG units.",
  scale: "Uniform size multiplier (default 1). The ink stroke stays weight parent units at any scale.",
  rotate: "Rotation in degrees around the centre (default 0).",
  press:
    "Key travel, 0–1: the keycap's dished top sinks, centres, and shrinks 4 units a side; on a keyboard, the keys listed in keys inset 3 units a side. A pressed face takes an ink wash (0.28 at 1, the depth of the visual language's 0.72 light) so the press shows at small sizes. Both mugs ignore it. Clamped.",
  weight:
    "Ink stroke width in parent units (default stroke.outline, the shared 3-unit outline from tokens), kept at any scale. A preview that frames one prop in its own viewBox passes a weight that keeps the on-screen line the same as its neighbours'.",
  keys: "Keyboard only: indices of the keys press applies to, row by row from the top left (0–13 the tab row, 14–26 the home row, 27–38 the shift row, 39–46 the modifier row, 42 the space bar; deskPropHomeKey, 20, is the home-row key nearest the middle).",
}

export default {
  name: "desk-prop",
  entry: "component",
  title: "DeskProp",
  description: "A free-standing keycap, keyboard, or mug (from above or standing, from the side) to place on a desk.",
  category: "UI Bits",
  family: "Desk objects",
  capabilities: ["controls"],
  api: [
    {
      export: "DeskProp",
      kind: "component",
      summary:
        "SVG <g> of one small desk object in the library's card fill and the shared ink outline (stroke.outline, 3 units), placed by its centre with scale and rotation. It owns no hand: compose Mano at deskPropLayout's contact point. Controlled; no internal timer. Render inside an <svg>.",
      props: propProps,
    },
    {
      export: "deskPropLayout",
      kind: "function",
      summary:
        "Placement and contact points after scale and rotation, so a fingertip lands on the keycap or a key, a grip lands on the top-down mug's handle, and an upright hold lands on the side-view mug's free side with its thumb over the rim.",
      params: propProps,
      returns:
        "{ kind, center, size, corners, contact, rim, keys, transform }: size is the scaled footprint; corners the four footprint corners; contact the keycap top, the home-row key nearest the middle (deskPropHomeKey), the middle of the top-down mug handle's visible end, or the middle of the side-view mug's left side (away from its handle); rim the side-view mug's near rim end, where a thumb crosses the top (null for the other kinds); keys every keyboard key centre (empty otherwise); transform the SVG transform the prop uses. Parent SVG units.",
    },
    {
      export: "deskPropSize",
      kind: "constant",
      summary: "Footprint of each kind at scale 1, in parent units: keycap 56 × 56, keyboard 314 × 100 (about 3:1), mug and mug-side 90 × 78.",
    },
    {
      export: "deskPropKeys",
      kind: "constant",
      summary:
        "The keyboard's 47 key rectangles in local units (centre origin) on a 20-unit pitch with 6-unit gaps (14-unit letter keys), row by row: tab, 12 letters, and backslash; caps, 11 letters, and return; shift, 10 letters, and shift; then ctrl, alt, cmd, a 119-unit space bar (index 42), cmd, alt, fn, and ctrl. Every row is 15 key units wide, so the modifiers offset the letter rows.",
    },
    {
      export: "deskPropHomeKey",
      kind: "constant",
      summary: "Index 20 in deskPropKeys: the home-row key nearest the keyboard's middle (H), where deskPropLayout puts a keyboard's contact and a typing fingertip lands.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 314, height: 100 },
    vertical: { width: 314, height: 100 },
    basis:
      "Parent SVG units for the largest kind, a keyboard at scale 1 (314 × 100). A keycap is 56 × 56 and each mug 90 × 78; everything multiplies by scale, and rotation can widen the axis-aligned bounds to the rotated corners (deskPropLayout(...).corners). On a 1920 × 1080 desk the Doorways board draws them larger: about scale 1.5 for the keyboard and 2 to 2.4 for the keycap and mug.",
  },
  examples: [
    {
      title: "Keyboard, keycap, and mug on a desk",
      code: 'import { DeskProp } from "@/jbm/ui/desk-prop"\n\n<svg viewBox="0 0 700 240">\n  <DeskProp kind="keycap" x={70} y={120} />\n  <DeskProp kind="keyboard" x={290} y={120} rotate={-4} />\n  <DeskProp kind="mug" x={520} y={120} />\n  <DeskProp kind="mug-side" x={630} y={120} />\n</svg>',
    },
    {
      title: "A pointing finger presses the keycap",
      code: 'import { DeskProp, deskPropLayout } from "@/jbm/ui/desk-prop"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst key = { kind: "keycap", x: 200, y: 180, scale: 1.5, press: 0.6 } as const\nconst tip = deskPropLayout(key).contact\n<svg viewBox="0 0 400 300">\n  <DeskProp {...key} />\n  <Mano at={tip} pose="point" size={120} angle={180} anchor={{ x: 9.5, y: 1.6 }} />\n</svg>',
    },
  ],
  qa: [
    "Switch Prop through All four, keycap, keyboard, mug, and mug side view: each reads as its noun alone (a stranger says keyboard, not keypad or calculator, and mug, not speaker), the first three seen from above and the side-view mug standing upright, in card fill with the same on-screen ink line (the shared outline at the preview's full width) as each other.",
    "Enlarge the keyboard at 8×: neighbouring key outlines stay apart (a cream gap between every pair), the offset rows never line up into a grid, and the modifier row sits evenly around the space bar.",
    "Enlarge the side-view mug at 8×: the handle is one C-shaped loop whose ends tuck under the body without a gap or stub, and the rim's ellipse meets the body's sides at its ends.",
    "Drag Scale from 0.5× to 2×: proportions hold and the on-screen stroke stays the same, not thinner or thicker.",
    "Drag Rotation: each prop turns about its centre and stays inside the preview.",
    "Drag Press on the keycap and the keyboard to Down: the keycap top visibly sinks and darkens; on the keyboard only the home-row key nearest the middle (deskPropHomeKey) insets and darkens, visible at index size.",
    "Enlarge the mug at 30°: the handle's end meets the round body without a gap, stub, or doubled edge, and the rim ring is even.",
    "The Mano anchor in the second example is an estimate of the fingertip; verify it visually.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
