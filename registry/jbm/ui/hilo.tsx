import { color } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

/** `arc` bows the thread sideways; `s` leaves and arrives level, like a line tied to a tab. */
export type HiloCurve = "arc" | "s"

export type HiloProps = {
  /** Where the thread is tied first, in the parent SVG's user units. */
  from: Pt
  /** Where the thread is tied last, in the parent SVG's user units. */
  to: Pt
  /** Curvature, 0 = straight. `arc`: sideways bow as a fraction of the from→to distance (positive bows left of travel, upward for a left-to-right thread). `s`: level handles as a fraction of the horizontal distance (0.5 is a soft S). */
  bend?: number
  /** Curve family that `bend` shapes. */
  curve?: HiloCurve
  /** Progress 0–1. Without `snapAt` it lays the thread from `from` to `to`. With `snapAt`, 0 → snapAt lays it and snapAt → 1 snaps it. */
  draw?: number
  /** Thread stroke width in user units. Knots, fibers and the notch scale with it. */
  width?: number
  /** The `draw` value (0–1) at which the laid thread snaps. Omit for a thread that never snaps; 0 starts already laid, so `draw` drives only the snap. */
  snapAt?: number
  /** Where the thread parts, as a fraction 0–1 of its length from `from` (clamped to 0.05–0.95). */
  breakAt?: number
  /** 0–1: how many curled fibers peel off each snapped end, and how long. 0 is a clean cut. */
  fray?: number
  /** 0–1: before a snap, how far the thread sags under gravity; after a snap, how limply the two ends hang. */
  slack?: number
  /** Fills the span between the frayed ends with a vermilion bar: the only accent the thread draws. */
  notch?: boolean
  /** Small ink knots where the thread is tied to `from` and `to`. */
  knots?: boolean
}

/** A cubic Bézier: start, two handles, end. */
export type HiloCubic = readonly [Pt, Pt, Pt, Pt]

const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k })
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
})
const norm = (v: Pt): Pt => {
  const l = Math.hypot(v.x, v.y)
  return l > 1e-9 ? { x: v.x / l, y: v.y / l } : { x: 1, y: 0 }
}
const finite = (p: Pt): Pt => ({
  x: Number.isFinite(p.x) ? p.x : 0,
  y: Number.isFinite(p.y) ? p.y : 0,
})
const num = (v: number | undefined, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback

export function cubicPoint(c: HiloCubic, t: number): Pt {
  const a = lerp(c[0], c[1], t),
    b = lerp(c[1], c[2], t),
    d = lerp(c[2], c[3], t)
  return lerp(lerp(a, b, t), lerp(b, d, t), t)
}

/** The exact sub-curve between parameters t0 and t1 (de Casteljau). */
function split(c: HiloCubic, t0: number, t1: number): HiloCubic {
  const left = (q: HiloCubic, t: number): HiloCubic => {
    const a = lerp(q[0], q[1], t),
      b = lerp(q[1], q[2], t),
      d = lerp(q[2], q[3], t),
      e = lerp(a, b, t),
      f = lerp(b, d, t)
    return [q[0], a, e, lerp(e, f, t)]
  }
  const right = (q: HiloCubic, t: number): HiloCubic => {
    const a = lerp(q[0], q[1], t),
      b = lerp(q[1], q[2], t),
      d = lerp(q[2], q[3], t),
      e = lerp(a, b, t),
      f = lerp(b, d, t)
    return [lerp(e, f, t), f, d, q[3]]
  }
  const head = t1 >= 1 ? c : left(c, t1)
  if (t0 <= 0) return head
  return right(head, t1 > 0 ? t0 / t1 : 0)
}

const SAMPLES = 96
/** Cumulative arc length at t = i / SAMPLES. */
function lengths(c: HiloCubic) {
  const out = [0]
  let prev = c[0]
  for (let i = 1; i <= SAMPLES; i++) {
    const p = cubicPoint(c, i / SAMPLES)
    out.push(out[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y))
    prev = p
  }
  return out
}
/** Curve parameter at a fraction 0–1 of the arc length. */
function paramAt(table: number[], fraction: number) {
  const total = table[SAMPLES]
  if (total <= 0) return fraction
  const target = unit(fraction) * total
  let i = 1
  while (i < SAMPLES && table[i] < target) i++
  const span = table[i] - table[i - 1]
  return (i - 1 + (span > 0 ? (target - table[i - 1]) / span : 0)) / SAMPLES
}

/**
 * Fibers at a frayed end, in the order they appear as fray grows: how far behind the tip each
 * peels off (in widths), where it points (degrees from the thread, turned toward gravity), and its
 * relative length. All of them fall to the same side, with uneven lengths and one trailing past the
 * tip, so an end reads as unravelled thread, never as a fan, fletching, or arrowhead. Fixed, so
 * every frame is identical.
 */
const FIBERS = [
  { root: 0, angle: 12, length: 1.3 },
  { root: 1.1, angle: 48, length: 0.62 },
  { root: 0.5, angle: 28, length: 0.95 },
  { root: 1.9, angle: 74, length: 0.4 },
  { root: 2.7, angle: 38, length: 0.75 },
] as const

/**
 * Everything Hilo draws, in parent SVG units: the resting curve, the laid or snapped pieces (each
 * pinned to its anchor), frayed fiber strokes, the vermilion notch, and the knots. Pure and
 * deterministic: the same props always give the same geometry.
 */
export function hiloGeometry({
  from: rawFrom,
  to: rawTo,
  bend = 0,
  curve = "arc",
  draw = 1,
  width = 2,
  snapAt,
  breakAt = 0.5,
  fray = 0.6,
  slack = 0,
  notch = false,
  knots = true,
}: HiloProps) {
  const from = finite(rawFrom),
    to = finite(rawTo)
  const w = Math.max(0.5, num(width, 2))
  const k = num(bend, 0)
  const s = unit(slack),
    f = unit(fray)
  const d = sub(to, from)
  const L = Math.hypot(d.x, d.y)
  // The resting curve: bend shapes it, slack sags it (gravity is +y).
  let c1: Pt, c2: Pt
  if (curve === "s") {
    c1 = { x: from.x + k * d.x, y: from.y }
    c2 = { x: to.x - k * d.x, y: to.y }
  } else {
    const n = L > 0 ? { x: d.y / L, y: -d.x / L } : { x: 0, y: -1 }
    c1 = add(add(from, d, 1 / 3), n, (4 / 3) * k * L)
    c2 = add(add(from, d, 2 / 3), n, (4 / 3) * k * L)
  }
  // Phases: lay the thread, then (optionally) snap it.
  const p = unit(draw)
  const snaps = typeof snapAt === "number" && Number.isFinite(snapAt)
  const at = snaps ? unit(snapAt) : 1
  const lay = !snaps ? p : at <= 0 ? 1 : Math.min(1, p / at)
  const recoil = snaps && at < 1 && p > at ? (p - at) / (1 - at) : 0
  // Before a snap slack sags the whole route; as the ends recoil the sag hands over to each end
  // hanging from its own anchor, so a snapped thread is two limp ends, never one deep V.
  const sag = { x: 0, y: (4 / 3) * s * 0.25 * L * (1 - recoil) }
  const base: HiloCubic = [from, add(c1, sag), add(c2, sag), to]
  const table = lengths(base)
  const length = table[SAMPLES]

  const pieces: HiloCubic[] = []
  const strands: [Pt, Pt, Pt][] = []
  let notchCurve: HiloCubic | null = null
  if (length > 0 && lay > 0 && recoil <= 0) {
    pieces.push(split(base, 0, paramAt(table, lay)))
  } else if (length > 0 && recoil > 0) {
    const b = Math.min(0.95, Math.max(0.05, num(breakAt, 0.5)))
    // Half the gap, as a fraction of the length: about a fifth of the thread, never more than 90 units.
    const half = Math.min(0.09, 45 / length, 0.8 * Math.min(b, 1 - b))
    const sA = b - recoil * half,
      sB = b + recoil * half
    const tA = paramAt(table, sA),
      tB = paramAt(table, sB)
    const a = split(base, 0, tA),
      z = split(base, tB, 1)
    // Each end hangs from its own anchor: the droop grows with u² from the anchor, so the anchor
    // and its tangent never move and only the free end falls.
    const hang = (len: number) => recoil * s * 0.5 * len
    const lenA = sA * length,
      lenB = (1 - sB) * length
    const dA = hang(lenA),
      dB = hang(lenB)
    const pieceA: HiloCubic = [
      a[0],
      a[1],
      add(a[2], { x: 0, y: dA / 3 }),
      add(a[3], { x: 0, y: dA }),
    ]
    const pieceB: HiloCubic = [
      add(z[0], { x: 0, y: dB }),
      add(z[1], { x: 0, y: dB / 3 }),
      z[2],
      z[3],
    ]
    pieces.push(pieceA, pieceB)
    // Fibers spring out quickly after the snap. Each peels off the piece a little behind the tip,
    // leaves along the thread, and curls away from it.
    const spring = Math.min(1, recoil * 3)
    const count = f > 0 ? 3 + Math.round(f * 2) : 0
    const reach = spring * w * (3 + 3 * f)
    if (reach > 0)
      for (const [piece, len, atEnd] of [
        [pieceA, lenA, true],
        [pieceB, lenB, false],
      ] as const) {
        for (const fiber of FIBERS.slice(0, count)) {
          const back = Math.min(0.45, (fiber.root * w * spring) / Math.max(len, 1e-9))
          const t = atEnd ? 1 - back : back
          const root = cubicPoint(piece, t)
          const ahead = cubicPoint(piece, atEnd ? Math.min(1, t + 0.01) : Math.max(0, t - 0.01))
          const behind = cubicPoint(piece, atEnd ? Math.max(0, t - 0.01) : Math.min(1, t + 0.01))
          const out = norm(sub(ahead, behind))
          // Turn toward gravity (+y): the side of the thread that faces down, or the same fixed
          // side when the end points straight up or down.
          const side = out.x > 1e-6 ? 1 : out.x < -1e-6 ? -1 : 1
          const r = (side * fiber.angle * Math.PI) / 180
          const dir = {
            x: out.x * Math.cos(r) - out.y * Math.sin(r),
            y: out.x * Math.sin(r) + out.y * Math.cos(r),
          }
          const l = reach * fiber.length + fiber.root * w * spring
          strands.push([root, add(root, out, l * 0.55), add(root, dir, l)])
        }
      }
    // The notch spans tip to tip along the gap in the original route, bent to follow hanging ends.
    if (notch) {
      const gap = split(base, tA, tB)
      notchCurve = [
        pieceA[3],
        add(gap[1], sub(pieceA[3], gap[0])),
        add(gap[2], sub(pieceB[0], gap[3])),
        pieceB[0],
      ]
    }
  }
  const tied = knots && lay > 0
  return {
    base,
    length,
    lay,
    recoil,
    snapped: recoil > 0,
    width: w,
    pieces,
    strands,
    strandWidth: Math.max(0.75, w * 0.6),
    notch: notchCurve,
    notchWidth: w * 4,
    knots: tied ? (lay >= 1 ? [from, to] : [from]) : [],
    knotRadius: w * 1.4,
  }
}

const n2 = (v: number) => Math.round(v * 100) / 100
const cubicPath = (c: HiloCubic) =>
  `M${n2(c[0].x)} ${n2(c[0].y)}C${n2(c[1].x)} ${n2(c[1].y)} ${n2(c[2].x)} ${n2(c[2].y)} ${n2(c[3].x)} ${n2(c[3].y)}`

/**
 * An ink thread tied from one point to another. It lays itself out with `draw`, can sag with
 * `slack`, and can snap into two frayed ends that stay tied to `from` and `to`, with an optional
 * vermilion notch in the gap. SVG <g>: render inside an <svg> that shares the anchors' units.
 */
export function Hilo(props: HiloProps) {
  const g = hiloGeometry(props)
  return (
    <g
      aria-hidden="true"
      data-hilo={g.snapped ? "snapped" : g.lay >= 1 ? "tied" : "laying"}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {g.pieces.map((c, i) => (
        <path key={i} d={cubicPath(c)} stroke={color.ink} strokeWidth={g.width} />
      ))}
      {g.strands.length > 0 && (
        <path
          d={g.strands
            .map(
              ([a, q, b]) =>
                `M${n2(a.x)} ${n2(a.y)}Q${n2(q.x)} ${n2(q.y)} ${n2(b.x)} ${n2(b.y)}`
            )
            .join("")}
          stroke={color.ink}
          strokeWidth={g.strandWidth}
        />
      )}
      {g.notch && (
        <path
          d={cubicPath(g.notch)}
          stroke={color.accent}
          strokeWidth={g.notchWidth}
        />
      )}
      {g.knots.map((k, i) => (
        <circle
          key={i}
          cx={n2(k.x)}
          cy={n2(k.y)}
          r={n2(g.knotRadius)}
          fill={color.ink}
          stroke="none"
        />
      ))}
    </g>
  )
}
