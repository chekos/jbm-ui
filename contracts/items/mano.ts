import type { ItemContract } from "../schema"

export default {
  name: "mano",
  entry: "component",
  title: "Mano",
  description: "Position and rotate the independent Hand illustration with controlled coordinates.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Mano",
      kind: "component",
      summary:
        "SVG <g> that places the Hand illustration at a point, scales it, and rotates it about that point. Hand owns the artwork and pose; callers own movement (e.g. pointOn and pathTilt along a path). No internal timer. Render inside an <svg>.",
      props: {
        at: "Point in the parent SVG's user units: the Hand box's top-left corner, or where the anchor point sits when anchor is set. Rotation pivots here.",
        pose: "Hand pose: open, point, pinch, grip, type, or hold (see Hand).",
        size: "Hand width in parent SVG units. Without anchor the box is size × 44/30 tall (264 at 180) with the 30×29 art centred vertically; with anchor it is size × 29/30 tall.",
        angle: "Rotation in degrees about at; positive is clockwise.",
        anchor: "Local point in the Hand's 30×29 viewBox held at `at`, including during rotation.",
        halo: "Pass Hand's card knock-out ring through, for ink art drawn behind the hand. Default false.",
      },
    },
  ],
  omit: {
    pointOn: "Re-export of scene-geometry's pointOn for moving the hand along a path; documented there.",
    pathTilt: "Re-export of scene-geometry's pathTilt for tilting the hand along a path; documented there.",
  },
  stage: {
    mode: "declared",
    landscape: { width: 180, height: 264 },
    vertical: { width: 180, height: 264 },
    basis:
      "Parent SVG user units at size 180 without anchor: a 180 × 264 box (size × 44/30) from at, with the 180 × 174 hand centred in it (about 45 units of empty space above and below). With anchor the box is size × 29/30 tall and offset so the anchor lands on at. angle rotates the box about at.",
  },
  examples: [
    {
      title: "Pointing hand, slightly rotated",
      code: 'import { Mano } from "@/jbm/motion/mano"\n\n<svg viewBox="0 0 500 340">\n  <Mano at={{ x: 160, y: 30 }} pose="point" size={155} angle={12} />\n</svg>',
    },
    {
      title: "Follow a path with its travel tilt",
      code: 'import { Mano, pointOn, pathTilt } from "@/jbm/motion/mano"\n\nconst path = [{ x: 40, y: 200 }, { x: 240, y: 60 }, { x: 440, y: 160 }]\nconst progress = 0.4 // from a slider or useProgress\n<svg viewBox="0 0 500 340">\n  <Mano at={pointOn(path, progress)} angle={pathTilt(path, progress)}\n    pose="pinch" size={120} anchor={{ x: 15, y: 14 }} />\n</svg>',
    },
  ],
  qa: [
    "Switch pose through all six at the same at: the hand stays in its box and does not jump unexpectedly.",
    "Drag Rotation from −30 to 30: the hand pivots about at (or the anchor point), not its centre.",
    "Drag Position: the hand translates without resizing or clipping at the viewBox edges.",
    "Anchor coordinates are in the 30×29 viewBox but each pose applies its own internal transform, so the fingertip lands at a different local point per pose; check the anchor visually for each pose you use.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
