import { color } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

/** `arc` bows the thread sideways; `s` leaves and arrives level, like a line tied to a tab. */
export type HiloCurve = "arc" | "s"

export type HiloProps = {
  /** Where the thread is tied first, in the parent SVG's user units. */
  from: Pt
  /** Where the thread is tied last, in the parent SVG's user units. */
  to: Pt
  /** Curvature, 0 = straight. `arc`: sideways bow as a fraction of the from→to distance (positive bows left of travel, upward for a left-to-right thread). `s`: level handles as a fraction of the horizontal distance, clamped to 0–1 so the thread never hooks around its anchors (0.5 is a soft S). */
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
  /** Marks the gap with a vermilion bar between the frayed ends, held clear of both so the thread still reads as broken: the only accent the thread draws. */
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
 * Fibers at a frayed end, in the order they appear as fray grows: where each leaves the cut
 * across the thread (-1 is the edge away from gravity, 1 the edge toward it), how far it droops
 * from the thread's direction (degrees, always toward gravity), and its relative length. They
 * leave the cut side by side, as if the thread came apart into its strands, then droop a little
 * more the lower they start, with uneven lengths: a small tuft of unravelled fibers, never legs
 * along the thread, a symmetric fan, fletching, or an arrowhead. Fixed, so every frame is
 * identical.
 */
const FIBERS = [
  { across: -0.85, angle: 3, length: 1 },
  { across: 0.85, angle: 22, length: 0.55 },
  { across: 0.1, angle: 11, length: 0.8 },
  { across: -0.35, angle: 6, length: 0.66 },
  { across: 0.5, angle: 16, length: 0.46 },
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
    // Level handles shorter than 0 point back past the anchors and hook the thread around its
    // own knots; longer than 1 they cross and loop. 0–1 keeps every S a single sweep.
    const h = Math.min(1, Math.max(0, k))
    c1 = { x: from.x + h * d.x, y: from.y }
    c2 = { x: to.x - h * d.x, y: to.y }
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
  const notchWidth = 2 * w + 2
  const strandWidth = Math.min(Math.max(0.75, w * 0.4), 1.6)
  if (length > 0 && lay > 0 && recoil <= 0) {
    pieces.push(split(base, 0, paramAt(table, lay)))
  } else if (length > 0 && recoil > 0) {
    // Half the gap, as a fraction of the length: about a fifth of the thread, never more than 90
    // units, or 20 widths for a thick thread, so its fibers and the notch still fit with paper
    // showing between them.
    const half = Math.min(
      Math.max(0.09, (10 * w) / length),
      Math.max(45, 10 * w) / length,
      0.45
    )
    // The gap opens around the break point, moved inward just enough to leave each end a stub
    // longer than its knot and fibers.
    const stub = Math.min(0.5 - half, Math.max(0.04, (8 * w) / length))
    const b = Math.min(
      1 - half - stub,
      Math.max(half + stub, Math.min(0.95, Math.max(0.05, num(breakAt, 0.5))))
    )
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
    // The gap along the route: fibers and the notch are sized to fit inside it, so the two ends
    // never touch each other or the notch.
    const gapSpan = (sB - sA) * length
    // The notch marks the gap without closing it: a straight vermilion bar where the missing
    // span of thread was, lowered with the ends' mean droop so it stays between them as they
    // hang, and held clear of both tips and their fibers by open paper.
    const paper = Math.max(4, 1.5 * w + 1)
    const tips = [pieceA[3], pieceB[0]]
    const placeNotch = (reach: number): HiloCubic | null => {
      const drop = { x: 0, y: (dA + dB) / 2 }
      const gap = split(base, tA, tB)
      const span: HiloCubic = [
        add(gap[0], drop),
        add(gap[1], drop),
        add(gap[2], drop),
        add(gap[3], drop),
      ]
      const spanTable = lengths(span)
      const spanLength = spanTable[SAMPLES]
      // Clear of each tip: the fibers' reach, then a visible strip of paper, then the bar's cap.
      const clear = reach + paper + notchWidth / 2
      if (spanLength - 2 * clear < 2 * notchWidth) return null
      // A straight bar between the trimmed ends: a stamp, never a worm where the route turns.
      const q0 = cubicPoint(span, paramAt(spanTable, clear / spanLength)),
        q3 = cubicPoint(span, paramAt(spanTable, 1 - clear / spanLength))
      // Ends hanging unevenly can swing a tip or its piece toward the bar: keep the longest run
      // of it that stays clear of both tips, their fibers, and both pieces.
      const body = [pieceA, pieceB].flatMap((c) =>
        Array.from({ length: 49 }, (_, i) => cubicPoint(c, i / 48))
      )
      const bodyClear = paper + (notchWidth + w) / 2
      const RUN = 120
      let best = [0, -1],
        start = -1
      for (let i = 0; i <= RUN + 1; i++) {
        let ok = i <= RUN
        if (ok) {
          const q = lerp(q0, q3, i / RUN)
          ok =
            tips.every((t) => Math.hypot(q.x - t.x, q.y - t.y) >= clear) &&
            body.every((t) => Math.hypot(q.x - t.x, q.y - t.y) >= bodyClear)
        }
        if (ok && start < 0) start = i
        if (!ok && start >= 0) {
          if (i - 1 - start > best[1] - best[0]) best = [start, i - 1]
          start = -1
        }
      }
      const p0 = lerp(q0, q3, best[0] / RUN),
        p3 = lerp(q0, q3, best[1] / RUN)
      return Math.hypot(p3.x - p0.x, p3.y - p0.y) >= 2 * notchWidth
        ? [p0, lerp(p0, p3, 1 / 3), lerp(p0, p3, 2 / 3), p3]
        : null
    }
    // Fibers spring out quickly after the snap. Each leaves the tip's cross-section, runs on
    // nearly along the thread, and droops a little toward gravity: a fine tuft at each end.
    const spring = Math.min(1, recoil * 5)
    const count = f > 0 ? 3 + Math.round(f * 2) : 0
    let reach = count > 0 ? spring * Math.min(w * (4 + 4 * f), 0.15 * gapSpan + w) : 0
    // In a tight gap (a thick thread, an end hanging back toward the other) the fibers shorten
    // to make room for the notch.
    if (notch)
      for (const k of [1, 0.7, 0.45]) {
        notchCurve = placeNotch(reach * k)
        if (notchCurve) {
          reach *= k
          break
        }
      }
    if (reach > 0)
      for (const [piece, atEnd] of [
        [pieceA, true],
        [pieceB, false],
      ] as const) {
        const tip = atEnd ? piece[3] : piece[0]
        const near = cubicPoint(piece, atEnd ? 0.99 : 0.01)
        const out = norm(sub(tip, near))
        // Turn toward gravity (+y): the side of the thread that faces down, or the same fixed
        // side when the end points straight up or down.
        const side = out.x > 1e-6 ? 1 : out.x < -1e-6 ? -1 : 1
        // Across the thread, pointing to the gravity side.
        const across = { x: -out.y * side, y: out.x * side }
        for (const fiber of FIBERS.slice(0, count)) {
          const root = add(add(tip, across, (fiber.across * w) / 2), out, -0.5 * w)
          const r = (side * fiber.angle * Math.PI) / 180
          const dir = {
            x: out.x * Math.cos(r) - out.y * Math.sin(r),
            y: out.x * Math.sin(r) + out.y * Math.cos(r),
          }
          const l = reach * fiber.length
          // Too short to read as a fiber (the first instant of the snap): leave it out.
          if (l < 2 * strandWidth) continue
          // Leaves along the thread, then bends to its droop: a soft curl, never a corner.
          strands.push([root, add(root, out, l * 0.5), add(root, dir, l)])
        }
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
    strandWidth,
    notch: notchCurve,
    notchWidth,
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
        <path
          key={i}
          d={cubicPath(c)}
          stroke={color.ink}
          strokeWidth={g.width}
          // A snapped end is cut square, so its fibers read as the thread coming apart, not as
          // whiskers on a rounded stub. The tied end sits under its knot.
          strokeLinecap={g.snapped ? "butt" : undefined}
        />
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
