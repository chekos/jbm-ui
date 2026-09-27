import { Mano, type ManoArm } from "./mano"
import { type Pt } from "../lib/geometry"
import { color } from "../lib/tokens"
export type PlumaProps = {
  /** Grip point in parent units: where the pinch holds the pen. Rotation pivots here. */
  at: Pt
  /** Rotation in degrees about `at` for the hand and pen together; positive is clockwise. */
  angle?: number
  /**
   * Nib position relative to `at` in parent units, before rotation. The pen runs from the nib
   * through `at` and on past the knuckles. Defaults to the pinch's natural writing slant.
   */
  nibOffset?: Pt
  /** Hand width in parent units, as in Mano; the pen scales with it. */
  size?: number
  /** Draw the pinching Hand. `false` leaves the pen alone, e.g. released on the desk. */
  hand?: boolean
  /** Sleeve from the frame edge, passed to Mano. */
  arm?: boolean | ManoArm
  /** Sleeve cuff, passed to Mano: ink or vermilion (the viewer's hand). */
  cuff?: "ink" | "accent"
}
// Hand-viewBox geometry of the pen in the pinch pose (issue #137): the grip point sits in the
// pocket between the bent index pad and the thumb; the nib leaves past the thumb tip and the
// barrel runs up behind the index finger, out above the knuckles.
const GRIP = { x: 6.4, y: 12.1 }
const NIB = { x: -1.35, y: 21.91 }
const TAIL = 17 // viewBox units from the grip to the barrel's end
const WIDTH = 2.6
const CONE = 3.6
const RING = 0.8
const OUTLINE = 1.234
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
const f = (n: number) => +n.toFixed(2)
/** A pen held in the Hand's pinch; seek-safe, every quantity is a prop. Render inside an <svg>. */
export function Pluma({
  at,
  angle = 0,
  nibOffset,
  size = 180,
  hand = true,
  arm,
  cuff,
}: PlumaProps) {
  const s = size / 30
  const nib = nibOffset ?? defaultNib(size)
  const len = Math.hypot(nib.x, nib.y) || 1
  // Pen-local frame: +x runs from the grip toward the nib.
  const dir = (Math.atan2(nib.y, nib.x) * 180) / Math.PI
  const w = WIDTH * s
  const cone = CONE * s
  const ring = RING * s
  const tail = TAIL * s
  const coneBase = len - cone
  const barrelEnd = coneBase - ring
  return (
    <g>
      <g
        transform={`translate(${f(at.x)} ${f(at.y)}) rotate(${f(angle + dir)})`}
        data-pluma-nib={`${f(len)}`}
      >
        {/* barrel: tail cap through to the ring */}
        <path
          d={`M${f(barrelEnd)} ${f(-w / 2)} H${f(-tail + w / 2)} A${f(w / 2)} ${f(w / 2)} 0 0 0 ${f(-tail + w / 2)} ${f(w / 2)} H${f(barrelEnd)} Z`}
          fill={color.ink}
        />
        {/* a card ring between the barrel and the cone */}
        <rect
          x={f(barrelEnd)}
          y={f(-w / 2)}
          width={f(ring)}
          height={f(w)}
          fill={color.card}
        />
        {/* cone to the nib point */}
        <path
          d={`M${f(coneBase)} ${f(-w / 2)} L${f(len)} 0 L${f(coneBase)} ${f(w / 2)} Z`}
          fill={color.ink}
          stroke={color.ink}
          strokeWidth={f(OUTLINE * s * 0.35)}
          strokeLinejoin="round"
        />
      </g>
      {hand && (
        <Mano
          at={at}
          pose="pinch"
          size={size}
          angle={angle}
          anchor={GRIP}
          arm={arm}
          cuff={cuff}
        />
      )}
    </g>
  )
}
