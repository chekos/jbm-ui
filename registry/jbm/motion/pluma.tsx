import { useId } from "react"
import { Mano } from "./mano"
import { handOutline } from "../ui/hand"
import { type Pt } from "../lib/geometry"
import { color, outlineIn } from "../lib/tokens"
/** The hand poses Pluma can hold a pen in. */
export const plumaPoses = ["pinch", "write"] as const
export type PlumaPose = (typeof plumaPoses)[number]
export type PlumaProps = {
  /** Grip point in parent units: where the hand holds the pen. Rotation pivots here. */
  at: Pt
  /** Rotation in degrees about `at` for the hand and pen together; positive is clockwise. */
  angle?: number
  /**
   * Nib position relative to `at` in parent units, before rotation. The pen runs from the nib
   * through `at` and on past the knuckles. Defaults to the pose's natural writing slant; the
   * hand turns about `at` by however far this points away from that slant, so the barrel always
   * sits in the grip instead of crossing the palm. Its length sets how far the nib reaches.
   */
  nibOffset?: Pt
  /** Hand width in parent units, as in Mano; the pen scales with it. */
  size?: number
  /** Draw the Hand. `false` leaves the pen alone, e.g. released on the desk. */
  hand?: boolean
  /**
   * The grip: `pinch` (default) holds the pen in the Hand's pinch; `write` in the Hand's tripod
   * writing pose, the barrel along the index finger, the thumb's tip over it near the nib, and the
   * upper barrel over the web and the back of the hand. Both slant the same way at the same angle.
   */
  pose?: PlumaPose
}
// Hand-viewBox geometry of the pen in each pose. pinch (issue #137): the grip point sits in the
// pocket between the bent index pad and the thumb; the nib leaves past the thumb tip, far enough that
// a stretch of barrel shows between the hand's mask gap and the cone (issue #164). The pen weaves with
// the hand (issue #170): the nib and lower shaft pass behind the thumb and the index pad, and from the
// grip point, in the open pocket where the change of layer cannot show, the upper shaft crosses in
// front of the index knuckle toward the viewer.
// write (issue #177): the pen lies on the traced reference's barrel axis; the grip point is where it
// crosses the notch between the index and thumb tips, and the tail reaches past the back of the hand.
// The pose is turned so the default nib slants as pinch's does, so a scene swaps grips at one angle.
// The pen lies over the hand (the index and the web) and the hand's front (the thumb,
// handOutline's `front`) lies over the pen.
const GEOMETRY = {
  pinch: { grip: { x: 6.4, y: 12.1 }, nib: { x: -3.2, y: 24.26 }, tail: 17 },
  write: { grip: { x: 4.967, y: 15.786 }, nib: { x: -0.454, y: 22.653 }, tail: 26.733 },
} as const
const WIDTH = 2.6
const CONE = 3.6
/** The Hand's outline in viewBox units: 30 units across 180 stage px. */
const VIEW_OUTLINE = outlineIn(30 / 180)
/** Where pinch's upper shaft starts over the hand, in viewBox units along the pen from the grip (+ toward the nib). */
const OVER_FROM = 0
const rotate = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180
  return {
    x: p.x * Math.cos(r) - p.y * Math.sin(r),
    y: p.x * Math.sin(r) + p.y * Math.cos(r),
  }
}
/** Default nib offset from the grip for a hand `size` wide, before rotation. */
function defaultNib(size: number, pose: PlumaPose): Pt {
  const s = size / 30
  const { grip, nib } = GEOMETRY[pose]
  return { x: (nib.x - grip.x) * s, y: (nib.y - grip.y) * s }
}
/**
 * Where a pose holds the pen, relative to the top-left corner of the Hand's box, in parent units
 * for a hand `size` wide: draw Pluma at `at` = corner + this and its hand lands where a bare Hand
 * of that size would.
 */
export function plumaGrip(pose: PlumaPose = "pinch", size = 180): Pt {
  const { grip } = GEOMETRY[pose]
  return { x: +((grip.x * size) / 30).toFixed(4), y: +((grip.y * size) / 30).toFixed(4) }
}
/**
 * The nib's point in parent units for a Pluma drawn at `at`/`angle`: feed it to whatever the
 * pen writes (a PaperLine's reveal, a Hilo's start) so ink and pen share one point.
 */
export function plumaNib(
  at: Pt,
  angle = 0,
  nibOffset?: Pt,
  size = 180,
  pose: PlumaPose = "pinch"
): Pt {
  const r = rotate(nibOffset ?? defaultNib(size, pose), angle)
  return { x: at.x + r.x, y: at.y + r.y }
}
/**
 * How far right of a caret to put the nib so the pen clears the ink before it: the pen's near
 * edge (cone, then barrel) must stay right of the caret for `rise` parent units above the nib,
 * whatever the rotation. Add it to the caret's x before solving the grip point (see plumaNib).
 */
export function plumaCaretGap(
  angle = 0,
  rise = 0,
  nibOffset?: Pt,
  size = 180,
  pose: PlumaPose = "pinch"
): number {
  const s = size / 30
  const n = rotate(nibOffset ?? defaultNib(size, pose), angle)
  const len = Math.hypot(n.x, n.y) || 1
  // Unit vector from the nib back up the pen, and the pen's half width a distance d along it.
  const u = { x: -n.x / len, y: -n.y / len }
  const cone = CONE * s
  const half = (d: number) => ((WIDTH * s) / 2) * Math.min(1, d / cone)
  const up = -u.y
  if (up <= 0) return 0
  const reach = rise / up
  let worst = 0
  for (const d of [0, Math.min(cone, reach), reach]) {
    worst = Math.min(worst, d * u.x - half(d) * Math.abs(u.y))
  }
  return +(-worst).toFixed(2)
}
const f = (n: number) => +n.toFixed(2)
/** A pen held in the Hand's pinch or writing grip; seek-safe, every quantity is a prop. Render inside an <svg>. */
export function Pluma({
  at,
  angle = 0,
  nibOffset,
  size = 180,
  hand = true,
  pose = "pinch",
}: PlumaProps) {
  const s = size / 30
  const { grip, tail: tailUnits } = GEOMETRY[pose]
  const nib = nibOffset ?? defaultNib(size, pose)
  const len = Math.hypot(nib.x, nib.y) || 1
  // Pen-local frame: +x runs from the grip toward the nib.
  const dir = (Math.atan2(nib.y, nib.x) * 180) / Math.PI
  const w = WIDTH * s
  const cone = CONE * s
  const tail = tailUnits * s
  const coneBase = len - cone
  // The hand follows the pen: turn it by the offset's departure from the natural slant.
  const natural = defaultNib(size, pose)
  let follow = dir - (Math.atan2(natural.y, natural.x) * 180) / Math.PI
  while (follow > 180) follow -= 360
  while (follow < -180) follow += 360
  const handAngle = f(angle + follow)
  const id = useId().replace(/[^\w-]/g, "")
  const maskId = `pluma-${id}`
  const cutId = `pluma-cut-${id}`
  const fillId = `pluma-fill-${id}`
  const outline = handOutline(pose)
  // The outline's width in parent units, whatever units the pose's path is authored in.
  const ink = f(VIEW_OUTLINE * s)
  const reach = (tail + len + size) * 2
  const box = { x: f(at.x - reach), y: f(at.y - reach), width: f(2 * reach), height: f(2 * reach) }
  const handFrame = `translate(${f(at.x)} ${f(at.y)}) rotate(${handAngle}) translate(${f(-grip.x * s)} ${f(-grip.y * s)}) scale(${f(s)}) ${outline.transform}`
  const penFrame = `translate(${f(at.x)} ${f(at.y)}) rotate(${f(angle + dir)})`
  const tailCap = `H${f(-tail + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 0 ${f(-tail + w / 2)} ${f(w / 2)}`
  // One silhouette: round tail cap, barrel, and a cone tapering straight on to the nib.
  const penPath = `M${f(coneBase)} ${f(-w / 2)} ${tailCap} H${f(coneBase)} L${f(len)} 0 Z`
  const mano = <Mano at={at} pose={pose} size={size} angle={handAngle} anchor={grip} />
  if (pose === "write" && hand) {
    // The pen lies over the hand and the hand's front (the thumb) over the pen. A mask cuts the pen
    // along the front plus its outline and a gap half the outline wide, so the barrel stops short of
    // the thumb's ink. Over the rest of the hand a second mask cuts
    // the hand's ink along the pen plus the same half-outline gap, sparing the front's own contours,
    // and the cut is refilled with card only inside the hand's fill; nothing is painted on the page.
    // One element per subpath, so overlapping parts (the thumb's tip and body) union whatever their
    // winding.
    const front = (outline.front ?? "").split(/(?=M)/).map((d) => d.trim())
    const frontWidth = Number(outline.strokeWidth)
    return (
      <g>
        <mask id={maskId} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          <g transform={handFrame}>
            {front.map((d) => (
              <path key={d} d={d} fill="#000" stroke="#000" strokeWidth={frontWidth * 2} strokeLinejoin="round" />
            ))}
          </g>
        </mask>
        <mask id={cutId} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          <path transform={penFrame} d={penPath} fill="#000" stroke="#000" strokeWidth={ink} strokeLinejoin="round" />
          <g transform={handFrame}>
            {front.map((d) => (
              <path key={d} d={d} fill="#fff" stroke="#fff" strokeWidth={frontWidth} strokeLinejoin="round" />
            ))}
          </g>
        </mask>
        <mask id={fillId} maskUnits="userSpaceOnUse" {...box}>
          <g transform={handFrame}>
            <path d={outline.d} fill="#fff" />
          </g>
        </mask>
        <g mask={`url(#${fillId})`}>
          <path transform={penFrame} d={penPath} fill={color.card} stroke={color.card} strokeWidth={ink} strokeLinejoin="round" />
        </g>
        <g mask={`url(#${cutId})`}>{mano}</g>
        <g mask={`url(#${maskId})`}>
          <g transform={penFrame} data-pluma-nib={`${f(len)}`}>
            <path d={penPath} fill={color.ink} />
          </g>
        </g>
      </g>
    )
  }
  // pinch: the lower pen passes behind the hand: a mask cuts it along the hand's silhouette plus a
  // gap half the outline wide, so the two ink edges stay apart. The upper shaft crosses over the
  // hand: a second mask cuts the hand's ink along the shaft plus the same half-outline gap, so its
  // contours stop short of the barrel without painting anything on the page. Inside the hand the
  // gap is refilled with card (clipped to the hand's fill), so it reads as the hand's own paper.
  // Upper shaft: from the grip point back to the round tail.
  const upper = `M${f(OVER_FROM * s)} ${f(-w / 2)} ${tailCap} H${f(OVER_FROM * s)} Z`
  return (
    <g>
      {hand && (
        <mask id={maskId} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          <g transform={handFrame}>
            <path
              d={outline.d}
              fill="#000"
              stroke="#000"
              strokeWidth={outline.strokeWidth * 2}
              strokeLinejoin="round"
            />
          </g>
        </mask>
      )}
      {hand && (
        <mask id={cutId} maskUnits="userSpaceOnUse" {...box}>
          <rect {...box} fill="#fff" />
          <path
            transform={penFrame}
            d={upper}
            fill="#000"
            stroke="#000"
            strokeWidth={f(outline.strokeWidth * s)}
            strokeLinejoin="round"
          />
        </mask>
      )}
      {hand && (
        <mask id={fillId} maskUnits="userSpaceOnUse" {...box}>
          <g transform={handFrame}>
            <path d={outline.d} fill="#fff" />
          </g>
        </mask>
      )}
      <g mask={hand ? `url(#${maskId})` : undefined}>
        <g transform={penFrame} data-pluma-nib={`${f(len)}`}>
          <path d={penPath} fill={color.ink} />
        </g>
      </g>
      {hand && (
        <>
          <g mask={`url(#${fillId})`}>
            <path
              transform={penFrame}
              d={upper}
              fill={color.card}
              stroke={color.card}
              strokeWidth={f(outline.strokeWidth * s)}
              strokeLinejoin="round"
            />
          </g>
          <g mask={`url(#${cutId})`}>{mano}</g>
          <g data-pluma-over="">
            <path transform={penFrame} d={upper} fill={color.ink} />
          </g>
        </>
      )}
    </g>
  )
}
