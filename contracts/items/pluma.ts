import type { ItemContract } from "../schema"

export default {
  name: "pluma",
  entry: "component",
  title: "Pluma",
  description: "A pen held in the Hand's pinch, with a helper that reports the nib point.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Pluma",
      kind: "component",
      summary:
        "SVG group: an ink pen (round-ended barrel, card ring, pointed cone) held in the Hand's pinch pose through Mano. The pen is drawn behind the hand: the nib leaves past the thumb tip and the barrel shows above the knuckles. The pen has a thin card halo and the hand a card knock-out ring (Hand's halo), so the barrel's edge and the hand's contours stay separate where they cross. Rotation, grip point, and nib are props; no internal timer. Render inside an <svg>.",
      props: {
        at: "Grip point in parent SVG units: where the pinch holds the pen. The hand and pen rotate about it.",
        angle: "Rotation in degrees about at for hand and pen together; positive is clockwise.",
        nibOffset:
          "Nib position relative to at in parent units, before rotation. The pen runs from the nib through at and 17/30 × size past it. Defaults to the pinch's writing slant, (−7.75, 9.81) × size/30: at size 180, (−46.5, 58.9). A custom direction turns the hand about at by the same amount, so the barrel always lies in the pinch rather than across the palm; the length sets the nib's reach.",
        size: "Hand width in parent units, as in Mano; the pen scales with it.",
        hand: "Draw the pinching Hand. Set false for the pen alone, e.g. released on the desk.",
        arm: "Sleeve from the frame edge, passed to Mano (true or { from, width, frame, tone }).",
        cuff: "Cuff on the sleeve, passed to Mano: `ink` or `accent` (vermilion, the viewer's hand).",
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
      },
      returns: "The nib point { x, y } in parent units.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 188, height: 186 },
    vertical: { width: 188, height: 186 },
    basis:
      "Parent SVG units at size 180, angle 0: the pinching hand fills the 180 × 174 box anchored on the grip point (6.4, 12.1 in the Hand viewBox, so at is 38.4 right of and 72.6 below its top-left corner). The nib reaches 8 left of the box and the barrel end about 12 above it, so the drawing spans about 188 × 186. arm adds a sleeve to the frame edge.",
  },
  examples: [
    {
      title: "Write a line: the reveal follows the nib",
      code: 'import { Pluma, plumaNib } from "@/jbm/motion/pluma"\n\nconst line = { x: 120, y: 200, w: 360 }\nconst progress = 0.4 // from a slider or useProgress\nconst nib = { x: line.x + line.w * progress, y: line.y }\n// Solve the grip point from the nib you want: at = nib − offset.\nconst o = plumaNib({ x: 0, y: 0 })\nconst at = { x: nib.x - o.x, y: nib.y - o.y }\n<svg viewBox="0 0 600 340">\n  <line x1={line.x} y1={line.y} x2={nib.x} y2={nib.y} stroke="#20241F" strokeWidth={3} />\n  <Pluma at={at} />\n</svg>',
    },
    {
      title: "Your hand writing, then the pen released",
      code: 'import { Pluma } from "@/jbm/motion/pluma"\n\nconst frame = { x: 0, y: 0, w: 1920, h: 1080 }\n<svg viewBox="0 0 1920 1080">\n  <Pluma at={{ x: 900, y: 460 }} size={260} angle={-10} arm={{ frame }} cuff="accent" />\n  <Pluma at={{ x: 1400, y: 820 }} size={260} angle={-80} hand={false} />\n</svg>',
    },
  ],
  qa: [
    "Rotate from −40° to 40° with the nib marker on: plumaNib lands on the drawn nib tip at every angle and size.",
    "Enlarge the pinch: the pen passes between the index pad and the thumb, behind the hand; the nib and ring show past the thumb tip and the barrel above the knuckles.",
    "Turn Hand off: the pen alone keeps its length, ring, and nib; a stranger names it \"pen\".",
    "Arm and cuff: the sleeve attaches at the wrist; only cuff accent is vermilion.",
    "At 2× and angles −40°, 0°, 40°: wherever the barrel meets the thumb or index contour a thin card gap separates them; no outline disappears into the barrel.",
    "Set nibOffset to (0, 90) and (−80, 20): the hand turns with the pen and the barrel still passes through the pinch, never behind the palm.",
    "On the bench, drag Write to End at Rotation −30° and 30° with Arm on and off: the whole hand, barrel tail included, stays inside the stage.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
