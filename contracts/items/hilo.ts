import type { ItemContract } from "../schema"

const threadProps = {
  from: "Where the thread is tied first ({ x, y } in the parent SVG's user units). The first piece always starts exactly here.",
  to: "Where the thread is tied last ({ x, y }, same units). Once laid, the last piece always ends exactly here, snapped or not.",
  bend: "Curvature; 0 is straight. With curve `arc`, a sideways bow as a fraction of the from→to distance (positive bows left of travel: upward for a left-to-right thread). With curve `s`, the length of the level handles as a fraction of the horizontal distance (0.5 is a soft S), clamped to 0–1: shorter handles would point back past the anchors and hook the thread around its own knots.",
  curve: "`arc` bows the thread sideways; `s` leaves `from` and arrives at `to` level, like a line of writing tied to a folder tab.",
  draw: "Progress 0–1. Without snapAt it lays the thread from `from` to `to` by arc length. With snapAt, 0 → snapAt lays it and snapAt → 1 snaps it: the ends recoil apart, fray, and hang by `slack`. Clamped; NaN is 0.",
  width: "Thread stroke width in user units (minimum 0.5); defaults to the shared outline, stroke.outline (3). Knots are 1.4× it in radius; frayed strands split the cut between them; the notch tints each broken tip at this width. A snapped end is cut square. The bench's Width runs from 1.5, so the thread never renders as a faint hairline.",
  snapAt: "The draw value (0–1) at which the laid thread snaps. Omit for a thread that never snaps. 0 starts fully laid, so draw drives only the snap.",
  breakAt: "Where the thread parts, as a fraction of its length from `from`; clamped to 0.05–0.95. The gap opens symmetrically around it: about a fifth of the length, at most 90 units (20 widths for a thick thread), moved inward just enough to leave each end a stub longer than its knot and strands.",
  fray: "0–1: how each broken end frays: two short tapered strands below 0.5, three from 0.5. Their bases tile the square cut (so the thread splits into them with no step and no round cap), and each runs straight on along the thread, turning at most 8° toward gravity, no longer than about 1.5 widths (never under 3 units): a frayed end, never claws, legs, or a fan. 0 is a clean, square cut.",
  slack: "0–1. Before a snap, how far the thread sags under gravity (the middle drops up to a quarter of the from→to distance). As the ends recoil that sag hands over to the ends: fully snapped, the route no longer sags and each end hangs from its own anchor, tangent there, its free tip dropping up to half its piece's length. With slack the bow of an arc relaxes as the ends recoil, so limp ends always droop downward, never arch up, whichever way the arc bowed.",
  notch: "Marks the break in vermilion on the broken ends themselves: the last max(5, 3 × width) units of each piece, along its own curve and at the thread's width, and their strands. Never a free capsule floating in the gap, so the snapped thread reads as two broken ends, not a thread with a bead. The only accent the thread draws.",
  knots: "Small ink dots at the tied points: `from` as soon as any thread is laid, `to` once it is fully laid.",
}

export default {
  name: "hilo",
  entry: "component",
  title: "Hilo",
  description:
    "An ink thread tied between two points that lays out, sags, and snaps into frayed ends with an optional vermilion notch.",
  category: "UI Bits",
  family: "Paper & writing",
  capabilities: ["controls"],
  api: [
    {
      export: "Hilo",
      kind: "component",
      summary:
        "SVG <g> of an ink thread: one exact cubic Bézier while laying or tied, two pinned pieces after a snap (cut square, each end splitting into two or three short tapered strands), an optional vermilion tint on the broken tips, and ink knots at the tied points. No arrows. Controlled and deterministic: every quantity comes from props, with no timer or randomness. Render inside an <svg> whose units match your anchors.",
      props: threadProps,
    },
    {
      export: "hiloGeometry",
      kind: "function",
      summary:
        "The geometry Hilo draws, for tests and composites (a hand pinching the thread, a label at the break).",
      params: threadProps,
      returns:
        "{ base, length, lay, recoil, snapped, width, pieces, inked, strands, notch, knots, knotRadius }: base is the resting cubic [start, handle, handle, end]; lay and recoil are the two phases (0–1); pieces are the whole laid or snapped cubics (pieces[0][0] is always `from`, and when laid the last piece ends at `to`); inked are the pieces as drawn in ink, each broken end short of its tint; strands are tapered strand outlines [base corner, point, base corner]; notch is the list of vermilion tints (the exact ends of the pieces), empty without `notch`; knots are the tied points. A thread laid to within six widths of `to` counts as laid, so its far knot shows.",
    },
    {
      export: "cubicPoint",
      kind: "function",
      summary: "A point on a cubic Bézier, for placing things along hiloGeometry's pieces.",
      params: { c: "Cubic [start, handle, handle, end].", t: "Curve parameter 0–1 (not arc length)." },
      returns: "{ x, y } in the cubic's units.",
    },
    { export: "HiloProps", kind: "type", summary: "Props of Hilo and hiloGeometry." },
    { export: "HiloCurve", kind: "type", summary: "\"arc\" | \"s\": the curve family bend shapes." },
    { export: "HiloCubic", kind: "type", summary: "A cubic Bézier as four points: start, two handles, end." },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Spans its anchors: the box from `from` to `to`, plus the bow (bend × distance for `arc`), the sag (up to slack × a quarter of the distance below the chord), and after a snap the hanging ends (up to half of each piece below its anchor, replacing the sag). Knots add 1.4 × width around each anchor. Size the parent SVG for those extremes.",
  },
  examples: [
    {
      title: "Tie a line of writing to a folder tab",
      code: 'import { Hilo } from "@/jbm/ui/hilo"\n\ndeclare const progress: number\n// Draw it over the stage, in the same units as your sheet and drawer.\n<svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>\n  <Hilo from={{ x: 520, y: 402 }} to={{ x: 1340, y: 236 }} curve="s" bend={0.5} draw={progress} />\n</svg>',
    },
    {
      title: "Snap into a vermilion gap",
      code: 'import { Hilo } from "@/jbm/ui/hilo"\n\ndeclare const progress: number\n// draw 0 → 0.5 lays the thread; 0.5 → 1 snaps it.\n<svg viewBox="0 0 500 200">\n  <Hilo from={{ x: 40, y: 100 }} to={{ x: 460, y: 100 }} draw={progress} snapAt={0.5} breakAt={0.4} fray={0.6} notch />\n</svg>',
    },
    {
      title: "Thread from a drawer's folder tab",
      code: 'import { Hilo } from "@/jbm/ui/hilo"\nimport { Cajon, cajonLayout } from "@/jbm/motion/cajon" // install @jbm/cajon separately\n\nconst drawer = { x: 520, y: 10, open: 1, folders: [{ name: "Taylor 1911" }] }\nconst tab = cajonLayout(drawer).folders[0].anchor\n<svg viewBox="0 -260 1000 700">\n  <Cajon {...drawer} />\n  <Hilo from={{ x: 60, y: 120 }} to={tab} curve="s" bend={0.5} slack={0.1} />\n</svg>',
    },
  ],
  qa: [
    "Drag Draw from 0 to 1 without a snap: the thread grows from `from` along one smooth curve, the `from` knot appears first, and the `to` knot only when it arrives.",
    "Turn on the snap and drag past 50%: at the snap the two pieces coincide with the tied thread (no jump), then recoil apart; `from` and `to` never move.",
    "Snapped at the bench defaults reads as broken at a glance: two slack ends apart, each a square cut splitting into short strands, the broken tips tinted vermilion along their own curve at the thread's width (no floating bar or bead in the gap). Fray 0 is a clean square cut; 1 gives three strands per end that tile the cut, straight on along the thread, never claws, legs, or a fan.",
    "Slack 0 keeps the snapped ends on the original line (the rompe look); 1 lets them hang limply as two ends, each from its own anchor, never one deep V. With Curve arc, Slack Limp, both halves droop (never arch up). The tints stay on the tips at every slack and are the only vermilion.",
    "Try Break point 5% and 95%, Bend at both ends of its range (−0.3 to 0.3 for arc, 0 to 1 for S), both curve families, Slack 1, and Width 1 and 6 at 8× zoom: nothing leaves the viewBox, no S hooks around its knots at any width, and both tints sit on the tips at every combination.",
    "Place the anchors on real objects (a Cajon tab from cajonLayout, a VideoPrint mark from videoPrintLayout) and check the knots land on them. In the bench's Thread to drawer scene, knots sit on each tab's left edge, more than a knot's radius clear of its name; a thread into a tab below the rim passes behind the side wall (the wall is drawn over its inside segment) and never across the wall's face or the drawer front; no two threads cross; closing the drawer hides each thread behind the front at its own spot. On a phone the scene uses a narrower stage, so tab names stay legible.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
