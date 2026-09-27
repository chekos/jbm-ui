import type { ItemContract } from "../schema"

export default {
  name: "mano",
  entry: "component",
  title: "Mano",
  description:
    "Position and rotate the independent Hand illustration with controlled coordinates, optionally on a sleeve from the frame edge.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Mano",
      kind: "component",
      summary:
        "SVG group that places the Hand illustration at a point, scales it, and rotates it about that point, with an optional sleeve so the hand never floats unattached. Hand owns the artwork and pose; callers own movement (e.g. pointOn and pathTilt along a path). No internal timer. Render inside an <svg>.",
      props: {
        at: "Point in the parent SVG's user units: the Hand box's top-left corner, or where the anchor point sits when anchor is set. Rotation pivots here.",
        pose: "Hand pose: open, point, pinch, grip, type, or hold (see Hand).",
        size: "Hand width in parent SVG units. Without anchor the box is size × 44/30 tall (264 at 180) with the 30×29 art centred vertically; with anchor it is size × 29/30 tall.",
        angle: "Rotation in degrees about at; positive is clockwise.",
        anchor: "Local point in the Hand's 30×29 viewBox held at `at`, including during rotation.",
        arm: "Sleeve from the frame edge to the wrist, drawn behind the hand. `true` for defaults, or `{ from, width, frame, tone }`: `from` is \"edge\" (default: straight out of the wrist along the forearm axis until it leaves `frame`, or 8 × size without one) or a point in parent units: the sleeve then leaves the wrist straight for a forearm stub (cuff depth + width long, square to the wrist) and bends there, at constant width with a rounded outer elbow, to end centred on that point. `width` defaults to 1.15 × the wrist (open and type keep the thumb-side corner on the hand contour and overhang the far side only); `tone` is solid `ink` (default) or `card` with an ink outline.",
        halo: "Pass Hand's card knock-out ring through, for ink art drawn behind the hand. Default false.",
        cuff: "Band across the full sleeve width at the wrist end, max(0.45 × sleeve width, 0.6 × wrist) long: `ink`, or `accent` (vermilion) to mark the viewer's own hand. Ignored without `arm`. On an ink sleeve an ink cuff shows as a card seam.",
      },
    },
    {
      export: "manoArm",
      kind: "function",
      summary:
        "The sleeve and cuff geometry Mano draws, in parent units. Pure: use it to test a staging or to place something on the arm.",
      params: {
        at: "As Mano's at.",
        pose: "As Mano's pose; picks the wrist edge.",
        size: "As Mano's size.",
        angle: "As Mano's angle.",
        anchor: "As Mano's anchor.",
        arm: "As Mano's arm; defaults to true here.",
        cuff: "As Mano's cuff; null band when unset.",
      },
      returns:
        "{ wrist, axis, spine, width, sleeve, cuff, stroke }: the wrist edge (thumb side first), the unit vector from the wrist into the sleeve stub, the sleeve centreline (wrist-end centre, the bend for a point `from`, the far end), the constant sleeve width, the sleeve outline polygon (wrist-end corners first, thumb side then far side; four points when straight), the cuff band's four corners or null, and the outline width.",
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
      "The sleeve (arm) extends past this box to the frame edge and is clipped by the SVG viewport. Parent SVG user units at size 180 without anchor: a 180 × 264 box (size × 44/30) from at, with the 180 × 174 hand centred in it (about 45 units of empty space above and below). With anchor the box is size × 29/30 tall and offset so the anchor lands on at. angle rotates the box about at.",
  },
  examples: [
    {
      title: "Pointing hand, slightly rotated",
      code: 'import { Mano } from "@/jbm/motion/mano"\n\n<svg viewBox="0 0 500 340">\n  <Mano at={{ x: 160, y: 30 }} pose="point" size={155} angle={12} />\n</svg>',
    },
    {
      title: "Your hand: sleeve from the frame edge, vermilion cuff",
      code: 'import { Mano } from "@/jbm/motion/mano"\n\nconst frame = { x: 0, y: 0, w: 1920, h: 1080 }\n<svg viewBox="0 0 1920 1080">\n  <Mano at={{ x: 1300, y: 520 }} pose="pinch" size={220} angle={-24}\n    arm={{ frame }} cuff="accent" />\n</svg>',
    },
    {
      title: "Follow a path with its travel tilt",
      code: 'import { Mano, pointOn, pathTilt } from "@/jbm/motion/mano"\n\nconst path = [{ x: 40, y: 200 }, { x: 240, y: 60 }, { x: 440, y: 160 }]\nconst progress = 0.4 // from a slider or useProgress\n<svg viewBox="0 0 500 340">\n  <Mano at={pointOn(path, progress)} angle={pathTilt(path, progress)}\n    pose="pinch" size={120} anchor={{ x: 15, y: 14 }} />\n</svg>',
    },
  ],
  qa: [
    "Turn Arm on for every pose and rotation: the sleeve meets the wrist edge exactly, runs out along the forearm, and leaves the frame; no hand floats or clips mid-palm. On open and type the sleeve's thumb-side corner continues the hand contour without a step.",
    "Give arm a `from` point to either side: the sleeve keeps its width from wrist to far end, the cuff stays a full square band on the straight stub, and the elbow is rounded.",
    "Switch Cuff between none, ink, and accent: only accent is vermilion; the band stays at the wrist through rotation and pose changes.",
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
