import type { ItemContract } from "../schema"

export default {
  name: "pluma",
  entry: "component",
  title: "Pluma",
  description: "A pen held in the Hand's pinch or tripod writing grip, with helpers that report the nib and grip points.",
  category: "UI Bits",
  family: "Hands",
  capabilities: ["controls"],
  api: [
    {
      export: "Pluma",
      kind: "component",
      summary:
        "SVG group: an ink pen (one silhouette: round-ended barrel tapering straight on to a pointed nib) held by the Hand through Mano, in one of two grips. `pinch` (default, unchanged): the pen weaves with the pinch: the nib and lower shaft pass behind the thumb and the index pad, and from the grip point (in the open pocket of the pinch, where the change of layer cannot show) the upper shaft crosses in front of the index knuckle. A mask cuts the lower pen along the hand's outline (handOutline) plus a gap half the outline wide; over the hand, a second mask cuts the hand's ink along the upper shaft plus the same half-outline gap (refilled with card only inside the hand's fill) and the shaft is drawn again on top. `write`: the Hand's tripod writing pose; the pen lies over the hand and the hand's front (thumb and index finger, handOutline's `front`) over the pen, so the nib and lower barrel pass under the thumb and index fingertips, and the upper barrel crosses the web between them in front of the palm and out over the back of the hand; a mask cuts the pen along the front plus its outline and a half-outline gap, so the barrel always stops at a drawn fingertip or crease, and the hand's ink is cut along the pen plus the same gap (sparing the front's contours, refilled with card inside the hand's fill). In both grips the barrel's edges and the hand's contours stay separate at every crossing and nothing is painted on the page outside the hand, so writing under or beside the nib stays whole. Rotation, grip point, nib, and grip are props; no internal timer. Render inside an <svg>.",
      props: {
        at: "Grip point in parent SVG units: where the hand holds the pen (pinch: the pocket between the fingertips; write: where the barrel leaves the notch between the thumb and index tips). The hand and pen rotate about it.",
        angle: "Rotation in degrees about at for hand and pen together; positive is clockwise. At 0 the hand stands upright, wrist down (write's pen then lies nearly level, nib to the left); the film's writing tilts are about −20° and −45° (write at −45° stands as its reference does).",
        nibOffset:
          "Nib position relative to at in parent units, before rotation. The pen runs from the nib through at and on past it (17/30 × size for pinch, 22.5/30 × size for write). Defaults to the pose's writing slant: pinch (−7.75, 9.81) × size/30, at size 180 (−46.5, 58.9); write (−11.91, −1.46) × size/30, at size 180 (−71.47, −8.78). A custom direction turns the hand about at by the same amount, so the barrel always lies in the grip rather than across the palm; the length sets the nib's reach.",
        size: "Hand width in parent units, as in Mano; the pen scales with it.",
        hand: "Draw the Hand. Set false for the pen alone, e.g. released on the desk.",
        pose: "The grip: `pinch` (default; the Hand's pinch, exactly as before write existed) or `write` (the Hand's tripod writing pose, the nib and lower barrel under the thumb and index fingertips and the upper barrel over the web). plumaPoses lists both.",
      },
    },
    {
      export: "plumaNib",
      kind: "function",
      summary:
        "Where the nib is for a Pluma drawn with the same at, angle, nibOffset, and size, so ink and pen share one point: drive a PaperLine's reveal, or a thread's start, from it.",
      params: {
        at: "The Pluma's grip point.",
        angle: "The Pluma's rotation in degrees.",
        nibOffset: "The Pluma's nibOffset, if set.",
        size: "The Pluma's hand width.",
        pose: "The Pluma's pose; defaults to pinch.",
      },
      returns: "The nib point { x, y } in parent units.",
    },
    {
      export: "plumaCaretGap",
      kind: "function",
      summary:
        "How far right of a caret (the end of the last written glyph) to put the nib so the pen's near edge, cone then barrel, clears the ink for `rise` units above the nib at this rotation. Add it to the caret's x before solving the grip point with plumaNib, so the pen never covers the last glyph.",
      params: {
        angle: "The Pluma's rotation in degrees.",
        rise: "How far above the nib the written ink reaches (its ascenders), in parent units.",
        nibOffset: "The Pluma's nibOffset, if set.",
        size: "The Pluma's hand width.",
        pose: "The Pluma's pose; defaults to pinch.",
      },
      returns: "A distance in parent units, 0 or more.",
    },
    {
      export: "plumaGrip",
      kind: "function",
      summary:
        "Where a pose holds the pen relative to the top-left corner of the Hand's box, for a hand size wide: draw Pluma at that corner plus this point and its hand lands exactly where a bare Hand (or Mano without an anchor) of that size would, e.g. to add the pen to a hand already placed in a scene.",
      params: {
        pose: "pinch (default) or write.",
        size: "The hand width; default 180.",
      },
      returns: "The grip point { x, y } in parent units.",
    },
    {
      export: "plumaPoses",
      kind: "constant",
      summary: "The grips Pluma draws: pinch, write. PlumaPose is its element type.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 188, height: 186 },
    vertical: { width: 188, height: 186 },
    basis:
      "Parent SVG units at size 180, angle 0: the pinching hand fills the 180 × 174 box anchored on the grip point (6.4, 12.1 in the Hand viewBox, so at is 38.4 right of and 72.6 below its top-left corner). The nib reaches 8 left of the box and the barrel end about 12 above it, so the drawing spans about 188 × 186.",
  },
  examples: [
    {
      title: "Write with the tripod grip at the film's tilt",
      code: 'import { Pluma, plumaNib } from "@/jbm/motion/pluma"\n\n// The nib ends the written word; solve the grip point from it.\nconst nib = { x: 260, y: 200 }\nconst o = plumaNib({ x: 0, y: 0 }, -45, undefined, 180, "write")\n<svg viewBox="0 0 600 340">\n  <Pluma at={{ x: nib.x - o.x, y: nib.y - o.y }} angle={-45} size={180} pose="write" />\n</svg>',
    },
    {
      title: "Write a line: the reveal follows the nib",
      code: 'import { Pluma, plumaNib } from "@/jbm/motion/pluma"\n\nconst line = { x: 120, y: 200, w: 360 }\nconst progress = 0.4 // from a slider or useProgress\nconst nib = { x: line.x + line.w * progress, y: line.y }\n// Solve the grip point from the nib you want: at = nib − offset.\nconst o = plumaNib({ x: 0, y: 0 })\nconst at = { x: nib.x - o.x, y: nib.y - o.y }\n<svg viewBox="0 0 600 340">\n  <line x1={line.x} y1={line.y} x2={nib.x} y2={nib.y} stroke="#20241F" strokeWidth={3} />\n  <Pluma at={at} />\n</svg>',
    },
    {
      title: "Writing, then the pen released",
      code: 'import { Pluma } from "@/jbm/motion/pluma"\n\n<svg viewBox="0 0 1920 1080">\n  <Pluma at={{ x: 900, y: 460 }} size={260} angle={-10} />\n  <Pluma at={{ x: 1400, y: 820 }} size={260} angle={-80} hand={false} />\n</svg>',
    },
  ],
  qa: [
    "Switch Grip to write and render it writing a word at −20° and −45°, at 150 and 180: a stranger says \"a hand writing with a pen\"; the nib and lower barrel pass under the thumb and index fingertips, the upper barrel lies over the web and the back of the hand, and the barrel stops a gap short of every fingertip and crease it passes under (nothing pierces a finger; the middle fingertip shows below the barrel, behind it).",
    "Grip write at 2× and 8×: no ink of the hand runs into the barrel, no barrel edge ends in the middle of a finger, and the cut in the hand's outline where the barrel leaves over the back of the hand shows card inside the hand and nothing on the page.",
    "Rotate from −40° to 40° with the nib marker on: plumaNib lands on the drawn nib tip at every angle and size.",
    "Enlarge the pinch: the nib and lower shaft pass behind the thumb and the index pad, the pen shows in the pocket between them, and from there the upper shaft crosses in front of the index knuckle, one continuous pen with no gap or seam where it changes layer; a stranger says \"a hand writing with a pen\".",
    "Turn Hand off: the pen alone keeps its length and nib; a stranger names it \"pen\".",
    "At 8× and angles −30°, 0°, 30°: wherever the barrel meets the thumb or index contour a gap separates them (under the hand, the mask gap; over it, the cut in the hand's ink, whose ends fall short of the barrel both inside the hand and on the page); no outline disappears into the barrel, no card or cream ring shows around the hand on the page, and the last written glyph under the nib stays whole.",
    "The underside of the bent index (the pad over the pen) is one smooth curve, with no corner where it turns down toward the thumb.",
    "Set nibOffset to (0, 90) and (−80, 20): the hand turns with the pen and the barrel still passes through the pinch, never behind the palm.",
    "On the bench, drag Write to End at Rotation −30° and 30°: the whole hand, barrel tail included, stays inside the stage.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
