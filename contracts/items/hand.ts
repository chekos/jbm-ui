import type { ItemContract } from "../schema"

export default {
  name: "hand",
  entry: "component",
  title: "Hand",
  description:
    "Static line-art hand in open-palm, pointing, pinching, gripping, typing, holding, or writing pose, independent of placement and props.",
  category: "UI Bits",
  family: "Hands",
  capabilities: ["controls"],
  api: [
    {
      export: "Hand",
      kind: "component",
      summary:
        "Card-filled, ink-outlined hand drawn in a 30×29 viewBox. The pose swaps the silhouette only; it owns no position, rotation, folder, pen, or timeline (use Mano from @jbm/mano for placement inside an SVG, Pluma from @jbm/pluma for a held pen). Other SVG attributes pass through to the root <svg>.",
      props: {
        pose: "Silhouette: `open` (open palm, fingers together), `point` (index finger extended), `pinch` (index bent over the thumb; Pluma's default pen grip), `grip` (front-view fist: four fingers with knuckle bumps on top and the curled fingertips in a row beneath, the thumb lying across under them, pointing in; lay the knuckles over a sheet or tab edge), `type` (the hand from above on a keyboard with the fingers curled down onto the keys: four short stubs, the middle tallest, whose caps are the bent middle joints with the fingertips out of sight beneath (no marks across them), and the thumb low, pointing left toward the space bar; at thumbnail size it reads as the open palm with its fingers folded), or `hold` (upright, seen from the side: the palm rises straight from the wrist and its top sweeps up into a finger-width thumb that bends at a rounded joint and lies over the held object's rim, tip toward the fingers, with a short crease where it leaves the palm; the four fingers lie stacked on the right, wrapped round the object's side with their tips facing the palm, and the open pocket between palm, thumb, fingertips, and heel is where the object sits; draw a side-view mug or a sheet's corner behind it, the rim or top edge just under the thumb; the pose is drawn for an object, and on its own the stacked fingers read apart from the palm, so show it round one), or `write` (a right hand holding a pen in a tripod grip, seen from the thumb side and traced from the owner-chosen references (Paper page hands, artboard Hands v6 · write), turned so its wrist cut is the shared one; at a -45° rotation it stands as the reference does: the back of the hand rises to a rounded knuckle, the index finger runs along the top to its round tip, the thumb tip and the middle fingertip sit under it, and one lobe stands for the tucked ring and little fingers; the index tip overlaps the thumb tip in a filleted valley and lies in front of it, and at J, where the thumb's top side comes out from behind it, the thumb's top side runs down into the palm and the index's underside curls up into the hand, so the web between the two creases is where the barrel lies; drawn for a pen, so show it with Pluma pose write). Every pose draws its dividers from the outline's valley points in the outline's stroke width; grip, type, hold, and write draw all their ink as one path (interior lines retraced as spurs), so joins are tangent with no steps, and the valleys between fingertips and grip's palm edge between index and thumb round off in small fillets. The palm side meets the wrist cut in one tangent-continuous fillet. Also sets the accessible label, e.g. \"Hand: point\".",
        halo: "Knock the hand out of what it overlaps: a card ring half the outline wide just outside the contour, so ink art passing behind the hand (a pen barrel, a thread) never fuses with its outline. The ring paints over everything under the hand, writing included; to cut only the art behind the hand, mask that art with handOutline instead (Pluma does). Default false.",
      },
    },
    {
      export: "handOutline",
      kind: "function",
      summary:
        "A pose's closed outline in the Hand's 30×29 viewBox (for grip, type, hold, and write it also retraces the interior lines inside it, which add no area), for composites that cut art drawn behind the hand (a mask or clip path) instead of painting a halo over whatever else is under it. Place it with the same transforms as the Hand (Mano's translate, rotate, and anchor, then a scale of size / 30). For write it also names the parts that lie in front of a held pen (the thumb and index finger), so a pen drawn over the hand can stop at them.",
      params: { pose: "Hand pose; defaults to point, like Hand." },
      returns:
        "{ d, transform, strokeWidth, front }: the outline path, the transform that places it in the viewBox, the outline's stroke width in path units, and (write only; otherwise undefined) `front`, the regions in front of a held pen as closed subpaths in the same units and transform, each bounded where it crosses the pen by the hand's own ink. Stroke a path at twice the width to cover the outline plus a gap half the outline wide.",
    },
    {
      export: "handPoses",
      kind: "constant",
      summary:
        "Every pose name in gallery order: open, point, pinch, grip, type, hold, write. HandPose is its element type.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 180, height: 174 },
    vertical: { width: 180, height: 174 },
    basis:
      "The 30×29 viewBox renders at width 180; height is auto from the aspect ratio (180 × 29/30 = 174). Pass `width` (the gallery uses 155) or style.width to scale; maxWidth is 100% of the container. Every pose shares the box and the wrist sits at its lower edge.",
  },
  examples: [
    {
      title: "Pinching hand",
      code: 'import { Hand } from "@/jbm/ui/hand"\n\n<Hand pose="pinch" width={160} />',
    },
    {
      title: "Writing hand, holding a pen",
      code: 'import { Hand } from "@/jbm/ui/hand"\nimport { Pluma } from "@/jbm/motion/pluma" // install @jbm/pluma separately\n\n// write is drawn for a pen: on its own it holds nothing.\n<Hand pose="write" width={120} />\n// Pluma draws it with the pen, at the film\'s writing tilt.\n<svg viewBox="0 0 500 340">\n  <Pluma at={{ x: 220, y: 150 }} size={180} angle={-45} pose="write" />\n</svg>',
    },
    {
      title: "The four reader poses",
      code: 'import { Hand } from "@/jbm/ui/hand"\n\n<Hand pose="point" width={120} />\n<Hand pose="type" width={120} />\n<Hand pose="grip" width={120} />\n<Hand pose="hold" width={120} />',
    },
    {
      title: "Hold a side-view mug",
      code: 'import { Hand } from "@/jbm/ui/hand"\nimport { DeskProp } from "@/jbm/ui/desk-prop" // install @jbm/desk-prop separately\n\n// A 180-wide hand: the mug\'s rim (deskPropLayout(...).rim) sits at 93 48.4, just under the thumb.\n<svg viewBox="0 0 222 174">\n  <DeskProp kind="mug-side" x={157} y={98} scale={1.6} />\n  <Hand pose="hold" width={180} height={174} style={{ height: 174 }} />\n</svg>',
    },
    {
      title: "Place and rotate inside an SVG",
      code: 'import { Hand } from "@/jbm/ui/hand"\nimport { Mano } from "@/jbm/motion/mano" // install @jbm/mano separately\n\n<Hand pose="open" width={120} />\n<svg viewBox="0 0 500 340">\n  <Mano at={{ x: 160, y: 30 }} pose="point" angle={12} />\n</svg>',
    },
  ],
  qa: [
    "Switch Pose through all seven: each silhouette sits in the same box with the wrist at the bottom and keeps simple geometric line art and the same outline weight.",
    "Enlarge every pose (point and pinch included) and inspect the finger joins: each interior divider starts on the outline's valley point, continues the finger's side, and has the outline's stroke width, with no notch or step, and grip, type, hold, and write keep the open palm's wrist cut exactly (grip, type, and write also its right side). At 8×, grip, type, hold, and write show no step where a finger side meets a knuckle or fingertip arc, no sharp cusp between fingertips, and no hook at the wrist.",
    "Name each pose at gallery size and compare it with its generated reference (Paper page hands, artboard Hands v5 for type and hold): grip reads as a fist gripping an edge (knuckles on top, fingertips in a row, thumb across beneath, pointing in), type as a hand from above with its fingers curled down onto keys (short stubs with no marks across them, thumb low toward the space bar), hold as an upright hand round an object (a finger-width thumb over the rim, no bigger than a finger and never a hook arching over the top; stacked fingers on the far side; an open pocket between; a palm no wider than the finger stack is tall).",
    "Render all seven at 48px side by side: a stranger tells every pose apart, type from open above all (short folded fingers against tall straight ones), and the thumb and index tips never touch in pinch or hold (in write they meet by design, on the pen).",
    "Overlay write on its reference (Paper page hands, artboard Hands v6 · write) scaled so the wrist cuts match: the knuckle, fingertip column, and wrist land on the reference's landmarks, the knuckle kept inside the box; the six other poses render exactly as before write was added.",
    "In context, grip over a Paper sheet's top edge, type over a DeskProp keyboard (fingertips on the upper rows, thumb over the space bar), and hold upright over a side-view mug (DeskProp kind mug-side: body in the pocket, rim just under the thumb) and over a sheet's top corner.",
    "Check the card fill and ink stroke read on cream, and the aria-label follows the pose.",
    "Scale with width at narrow screens: the 30:29 aspect ratio holds.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://jbm-ui.bns.studio/docs/desk-components.md" },
  ],
} satisfies ItemContract
