import type { ItemContract } from "../schema"

const threadProps = {
  from: "Where the thread is tied first ({ x, y } in the parent SVG's user units). The first piece always starts exactly here.",
  to: "Where the thread is tied last ({ x, y }, same units). Once laid, the last piece always ends exactly here, snapped or not.",
  bend: "Curvature; 0 is straight. With curve `arc`, a sideways bow as a fraction of the from→to distance (positive bows left of travel: upward for a left-to-right thread). With curve `s`, the length of the level handles as a fraction of the horizontal distance (0.5 is a soft S).",
  curve: "`arc` bows the thread sideways; `s` leaves `from` and arrives at `to` level, like a line of writing tied to a folder tab.",
  draw: "Progress 0–1. Without snapAt it lays the thread from `from` to `to` by arc length. With snapAt, 0 → snapAt lays it and snapAt → 1 snaps it: the ends recoil apart, fray, and hang by `slack`. Clamped; NaN is 0.",
  width: "Thread stroke width in user units (minimum 0.5). Knots are 1.4× it in radius, fibers 0.6×, the notch 4×.",
  snapAt: "The draw value (0–1) at which the laid thread snaps. Omit for a thread that never snaps. 0 starts fully laid, so draw drives only the snap.",
  breakAt: "Where the thread parts, as a fraction of its length from `from`; clamped to 0.05–0.95. The gap opens symmetrically around it: about a fifth of the length, at most 90 units.",
  fray: "0–1: curled fibers peeling off each broken end (0 none, then 3–5 of them, up to about 6× width long, splayed up to 88° from the thread). 0 is a clean cut.",
  slack: "0–1. Before a snap, how far the thread sags under gravity (the middle drops up to a quarter of the from→to distance). After a snap, how limply each end hangs from its anchor (the tip drops up to 0.3 of its piece's length).",
  notch: "Fills the span between the frayed ends with a rounded vermilion bar, tip to tip (it follows hanging ends): the only accent the thread draws. Drawn over the fiber roots, so the fibers show as whiskers at its ends.",
  knots: "Small ink dots at the tied points: `from` as soon as any thread is laid, `to` once it is fully laid.",
}

export default {
  name: "hilo",
  entry: "component",
  title: "Hilo",
  description:
    "An ink thread tied between two points that lays out, sags, and snaps into frayed ends with an optional vermilion notch.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "Hilo",
      kind: "component",
      summary:
        "SVG <g> of an ink thread: one exact cubic Bézier while laying or tied, two pinned pieces after a snap, splayed fibers at each broken end, an optional vermilion notch in the gap, and ink knots at the tied points. No arrows. Controlled and deterministic: every quantity comes from props, with no timer or randomness. Render inside an <svg> whose units match your anchors.",
      props: threadProps,
    },
    {
      export: "hiloGeometry",
      kind: "function",
      summary:
        "The geometry Hilo draws, for tests and composites (a hand pinching the thread, a label at the break).",
      params: threadProps,
      returns:
        "{ base, length, lay, recoil, snapped, width, pieces, strands, strandWidth, notch, notchWidth, knots, knotRadius }: base is the resting cubic [start, handle, handle, end]; lay and recoil are the two phases (0–1); pieces are the cubics drawn in ink (pieces[0][0] is always `from`, and when laid the last piece ends at `to`); strands are fiber [start, end] pairs; notch is the vermilion cubic or null; knots are the tied points.",
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
      "Spans its anchors: the box from `from` to `to`, plus the bow (bend × distance for `arc`), the sag (up to slack × a quarter of the distance below the chord), and after a snap the hanging ends (up to 0.3 of each piece below its anchor). Knots add 1.4 × width around each anchor. Size the parent SVG for those extremes.",
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
    "Fray 0 is a clean cut with no fibers; 1 gives five curled fibers per end. With the notch they show as whiskers above and below its ends; without it they must read as frayed tufts, never arrowheads.",
    "Slack 0 keeps the snapped ends on the original line (the rompe look); 1 lets them hang limply. The notch runs tip to tip at every slack and is the only vermilion.",
    "Try Break point 5% and 95%, Bend −0.5 and 1, both curve families, and Width 1 and 6: nothing leaves the viewBox unexpectedly and stroke joins stay round.",
    "Place the anchors on real objects (a Cajon tab from cajonLayout, a VideoPrint mark from videoPrintLayout) and check the knots land on them.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
