import type { ItemContract } from "../schema"

export default {
  name: "slip",
  entry: "component",
  title: "Slip",
  description:
    "Taped paper slip of out-of-register writing that peels, lifts, and travels while registers reflow around it.",
  category: "UI Bits",
  family: "Paper & writing",
  capabilities: ["controls"],
  api: [
    {
      export: "Slip",
      kind: "component",
      summary:
        "A small paper strip carrying a few marks of one register (RegisterInk), with torn masking tape across its top edge. Controlled and timer-free: `lift` peels the tape flap (fully by 0.4), deepens the shadow, raises the slip by 10 × scale px, tilts it 3°, and scales it 4%; `offset` translates it from its resting place. It owns no hand and no path: place it absolutely where it rests (usually registerGap on the source sheet), drive offset along your own path, and hold it with Mano at slipGrip.",
      props: {
        lift: "0 flat on a sheet, 1 held above it. Clamped.",
        offset: "Translation in px from the resting place (default { x: 0, y: 0 }).",
        tape: "Masking tape across the top edge with torn ends (default true). Its right third is a flap that peels up about its fold as lift goes 0 → 0.4 and sticks again on landing.",
        dashed: "Dashed ink outline instead of solid: the slip flagged as out of place (default false). Ink, not vermilion.",
        kind: "Register drawn on the slip: mono, plain, grid, or prose (default prose).",
        n: "Count for that register: prose source ticks (default 2), mono steps (1), plain groups or grid tables (2).",
        w: "Slip width in px (default 240).",
        h: "Slip height in px (default 72).",
        rotate: "Resting rotation in degrees (default −2).",
        scale: "Mark scale; pass the source sheet's scale (Register uses w / 360) so the slip's bars match the page it sits on. Default 1.",
        reveal: "Writing drawn on the slip so far, 0–1 (default 1).",
        accent: "Cell indices whose lead mark is vermilion.",
        style: "Styles merged onto the outer box, e.g. position, left, top.",
      },
    },
    {
      export: "slipPoint",
      kind: "function",
      summary: "Maps a point on the slip (local px from its top-left) to the host's px after lift, rotation, and offset, relative to the slip's resting top-left.",
      params: { props: "The Slip's props (lift, offset, w, h, rotate, scale).", local: "Point on the slip in its own px." },
      returns: "Pt in the host's px.",
    },
    {
      export: "slipGrip",
      kind: "function",
      summary: "Where a pinch holds the slip: the middle of its bottom edge (default) or top edge, in the host's px relative to the resting top-left. Put Mano's pinch there (pose \"pinch\", anchor { x: 6, y: 10 }).",
      params: { props: "The Slip's props.", edge: "\"bottom\" (default) or \"top\"." },
      returns: "Pt in the host's px.",
    },
    { export: "SlipProps", kind: "type", summary: "Slip's props." },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 240, height: 72 },
    vertical: { width: 240, height: 72 },
    basis:
      "w × h stage px at the defaults (240 × 72). The tape reaches about 7 × scale px above the top edge, and a peeled flap about 20 × scale px more; lift adds up to 10 × scale px of rise and 4% scale, and offset moves it anywhere, all without affecting layout.",
  },
  examples: [
    {
      title: "A taped prose slip, flagged",
      code: 'import { Slip } from "@/jbm/ui/slip"\n\n<Slip kind="prose" w={240} h={72} dashed />',
    },
    {
      title: "Lift from one register, land in another",
      code: 'import { Register, registerGap } from "@/jbm/ui/register"\nimport { Slip, slipGrip } from "@/jbm/ui/slip"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\nconst t = 0.5 // carry progress from a slider or frame\nconst sheet = { w: 250, h: 300, gap: 66 } as const\nconst src = { ...sheet, kind: "mono", n: 6, gapAt: 3 } as const\nconst dst = { ...sheet, kind: "prose", n: 3, gapAt: 4 } as const\nconst a = registerGap({ ...src, reflow: 1 })!\nconst b = registerGap({ ...dst, reflow: 1 })!\nconst from = { x: a.x + 30, y: a.y + 7 } // dst sheet sits 300 px to the right\nconst to = { x: 300 + b.x + 30, y: b.y + 7 }\nconst slip = { w: 190, h: 52, scale: 250 / 360, lift: 1,\n  offset: { x: (to.x - from.x) * t, y: (to.y - from.y) * t } }\nconst grip = slipGrip(slip)\n\n<div style={{ position: "relative", width: 560, height: 320 }}>\n  <Register {...src} reflow={1 - t} style={{ position: "absolute", left: 0, top: 0 }} />\n  <Register {...dst} reflow={t} style={{ position: "absolute", left: 300, top: 0 }} />\n  <Slip {...slip} style={{ position: "absolute", left: from.x, top: from.y }} />\n  <svg width={560} height={320} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>\n    <Mano at={{ x: from.x + grip.x, y: from.y + grip.y }} pose="pinch" size={96} anchor={{ x: 6, y: 10 }} />\n  </svg>\n</div>',
    },
  ],
  qa: [
    "Drag Lift 0 → 0.4 → 1: the tape flap peels up about its fold (a wedge opens under it, no gap along the fold's top), then the slip rises, tilts, and its shadow deepens; back to 0 it lies flat and the flap sticks down continuously.",
    "Drag Carry 0 → 1 with Lift at Held: the slip leaves the Tutorial's gap, arcs over, and settles in the Explicación's gap; the source closes to evenly spaced steps while the destination opens exactly one slip-height of room, and no writing passes under the landed slip.",
    "Toggle Tape, Dashed outline, and Hand independently: each changes only its own object; the dashed outline is ink.",
    "With Hand on, check the pinch stays on the slip's bottom edge at every Carry and Lift value, including the extremes.",
    "Check 2× zoom: torn tape teeth, the fold, and the outline corners join cleanly with even stroke widths.",
  ],
  docs: [{ title: "Writing registers guide", url: "https://jbm-ui.bns.studio/docs/writing-registers.md" }],
} satisfies ItemContract
