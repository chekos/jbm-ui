import { useId } from "react"
import { Mano } from "./mano"
import { handOutline } from "../ui/hand"
import { type Pt } from "../lib/geometry"
import { color } from "../lib/tokens"
export type PlumaProps = {
  /** Grip point in parent units: where the pinch holds the pen. Rotation pivots here. */
  at: Pt
  /** Rotation in degrees about `at` for the hand and pen together; positive is clockwise. */
  angle?: number
  /**
   * Nib position relative to `at` in parent units, before rotation. The pen runs from the nib
   * through `at` and on past the knuckles. Defaults to the pinch's natural writing slant; the
   * hand turns about `at` by however far this points away from that slant, so the barrel always
   * sits in the pinch instead of crossing the palm. Its length sets how far the nib reaches.
   */
  nibOffset?: Pt
  /** Hand width in parent units, as in Mano; the pen scales with it. */
  size?: number
  /** Draw the pinching Hand. `false` leaves the pen alone, e.g. released on the desk. */
  hand?: boolean
}
// Hand-viewBox geometry of the pen in the pinch pose (issue #137): the grip point sits in the
// pocket between the bent index pad and the thumb; the nib leaves past the thumb tip and the
// barrel runs up behind the index finger, out above the knuckles. The nib sits far enough past the
// thumb that a stretch of barrel shows between the hand's mask gap and the cone (issue #164), so
// the cone never reads as a clipped triangle cut off from the pen.
const GRIP = { x: 6.4, y: 12.1 }
const NIB = { x: -3.2, y: 24.26 }
const TAIL = 17 // viewBox units from the grip to the barrel's end
const WIDTH = 2.6
const CONE = 3.6
const rotate = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180
  return {
    x: p.x * Math.cos(r) - p.y * Math.sin(r),
    y: p.x * Math.sin(r) + p.y * Math.cos(r),
  }
}
/** Default nib offset from the grip for a hand `size` wide, before rotation. */
function defaultNib(size: number): Pt {
  const s = size / 30
  return { x: (NIB.x - GRIP.x) * s, y: (NIB.y - GRIP.y) * s }
}
/**
 * The nib's point in parent units for a Pluma drawn at `at`/`angle`: feed it to whatever the
 * pen writes (a PaperLine's reveal, a Hilo's start) so ink and pen share one point.
 */
export function plumaNib(
  at: Pt,
  angle = 0,
  nibOffset?: Pt,
  size = 180
): Pt {
  const r = rotate(nibOffset ?? defaultNib(size), angle)
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
  size = 180
): number {
  const s = size / 30
  const n = rotate(nibOffset ?? defaultNib(size), angle)
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
/** A pen held in the Hand's pinch; seek-safe, every quantity is a prop. Render inside an <svg>. */
export function Pluma({
  at,
  angle = 0,
  nibOffset,
  size = 180,
  hand = true,
}: PlumaProps) {
  const s = size / 30
  const nib = nibOffset ?? defaultNib(size)
  const len = Math.hypot(nib.x, nib.y) || 1
  // Pen-local frame: +x runs from the grip toward the nib.
  const dir = (Math.atan2(nib.y, nib.x) * 180) / Math.PI
  const w = WIDTH * s
  const cone = CONE * s
  const tail = TAIL * s
  const coneBase = len - cone
  // The hand follows the pen: turn it by the offset's departure from the natural slant.
  const natural = defaultNib(size)
  let follow = dir - (Math.atan2(natural.y, natural.x) * 180) / Math.PI
  while (follow > 180) follow -= 360
  while (follow < -180) follow += 360
  const handAngle = f(angle + follow)
  // The pen passes behind the hand: a mask cuts it along the hand's silhouette plus a gap half the
  // outline wide, so the two ink edges stay apart. Nothing is painted over the page, so writing
  // under the nib stays whole.
  const maskId = `pluma-${useId().replace(/[^\w-]/g, "")}`
  const outline = handOutline("pinch")
  const reach = (tail + len + size) * 2
  return (
    <g>
      {hand && (
        <mask id={maskId} maskUnits="userSpaceOnUse" x={f(at.x - reach)} y={f(at.y - reach)} width={f(2 * reach)} height={f(2 * reach)}>
          <rect x={f(at.x - reach)} y={f(at.y - reach)} width={f(2 * reach)} height={f(2 * reach)} fill="#fff" />
          <g
            transform={`translate(${f(at.x)} ${f(at.y)}) rotate(${handAngle}) translate(${f(-GRIP.x * s)} ${f(-GRIP.y * s)}) scale(${f(s)}) ${outline.transform}`}
          >
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
      <g mask={hand ? `url(#${maskId})` : undefined}>
        <g
          transform={`translate(${f(at.x)} ${f(at.y)}) rotate(${f(angle + dir)})`}
          data-pluma-nib={`${f(len)}`}
        >
          {/* one silhouette: round tail cap, barrel, and a cone tapering straight on to the nib */}
          <path
            d={`M${f(coneBase)} ${f(-w / 2)} H${f(-tail + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 0 ${f(-tail + w / 2)} ${f(w / 2)} H${f(coneBase)} L${f(len)} 0 Z`}
            fill={color.ink}
          />
        </g>
      </g>
      {hand && (
        <Mano
          at={at}
          pose="pinch"
          size={size}
          angle={handAngle}
          anchor={GRIP}
        />
      )}
    </g>
  )
}
