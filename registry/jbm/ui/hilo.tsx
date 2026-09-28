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
  /** 0–1: how many short tapered strands (two or three) split from each snapped end, and how long (at most about 1.5 widths). 0 is a clean cut. */
  fray?: number
  /** 0–1: before a snap, how far the thread sags under gravity; after a snap, how limply the two ends hang (a limp end droops downward and loses the arc's bow, whichever way it bowed). */
  slack?: number
  /** Marks the break in vermilion: a short tint on each broken tip, at the thread's width and along its curve, so the mark belongs to the ends. The only accent the thread draws. */
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
 * Strands at a frayed end, in the order they appear as fray grows: where each leaves the cut
 * across the thread (-1 to 1, gravity side positive), its share of the cut's width, how far it
 * turns toward gravity (degrees), and its relative length. Two or three short, straight, tapered
 * strands that tile the cut, so the thread splits into them without a step: a frayed end, never
 * claws, legs, or a fan. Fixed, so every frame is identical.
 */
const STRANDS = [
  [{ across: 0, share: 1, angle: 0, length: 1 }],
  [
    { across: -0.5, share: 0.5, angle: 2, length: 1 },
    { across: 0.5, share: 0.5, angle: 7, length: 0.72 },
  ],
  [
    { across: -0.667, share: 0.333, angle: 2, length: 0.85 },
    { across: 0, share: 0.334, angle: 4, length: 1 },
    { across: 0.667, share: 0.333, angle: 8, length: 0.7 },
  ],
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
  let lay = !snaps ? p : at <= 0 ? 1 : Math.min(1, p / at)
  const recoil = snaps && at < 1 && p > at ? (p - at) / (1 - at) : 0
  // Before a snap slack sags the whole route; as the ends recoil the sag hands over to each end
  // hanging from its own anchor, so a snapped thread is two limp ends, never one deep V.
  const sag = { x: 0, y: (4 / 3) * s * 0.25 * L * (1 - recoil) }
  // A snapped thread has no tension left to hold its bow: with slack the bow relaxes toward the
  // straight line as the ends recoil, and each end then droops under gravity (below), so limp
  // ends always hang down, never arch up, whichever way the arc bowed.
  const relax = s * recoil
  const straight1 = add(from, d, 1 / 3),
    straight2 = add(from, d, 2 / 3)
  const base: HiloCubic = [
    from,
    add(lerp(c1, straight1, relax), sag),
    add(lerp(c2, straight2, relax), sag),
    to,
  ]
  const table = lengths(base)
  const length = table[SAMPLES]
  // Within a few knot radii of the far anchor the thread is laid: it reaches the knot, which
  // then shows, instead of stopping in mid-air a hair short of it.
  if (lay > 0 && lay < 1 && (1 - lay) * length <= 6 * w) lay = 1

  const pieces: HiloCubic[] = []
  const strands: Pt[][] = []
  const tints: HiloCubic[] = []
  const inked: HiloCubic[] = []
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
    // A limp end keeps its anchor tangent but only briefly: the anchor's handle shortens with
    // slack, so the end falls away from its pin almost at once instead of first running on along
    // the old route (which reads as an arch).
    const grip = 1 - 0.75 * relax
    const pieceA: HiloCubic = [
      a[0],
      lerp(a[0], a[1], grip),
      add(a[2], { x: 0, y: dA / 3 }),
      add(a[3], { x: 0, y: dA }),
    ]
    const pieceB: HiloCubic = [
      add(z[0], { x: 0, y: dB }),
      add(z[1], { x: 0, y: dB / 3 }),
      lerp(z[3], z[2], grip),
      z[3],
    ]
    pieces.push(pieceA, pieceB)
    // Strands spring out quickly after the snap: straight continuations of the thread, at most
    // about 1.5 widths long (never under 3 units, so a fine thread still shows its fray).
    const spring = Math.min(1, recoil * 5)
    const count = f > 0 ? (f < 0.5 ? 2 : 3) : 0
    const reach = count > 0 ? spring * Math.max(3, w * (0.9 + 0.6 * f)) : 0
    // The vermilion tint: the last few units of each broken end, along its own curve.
    const tintLen = Math.max(5, 3 * w)
    for (const [piece, atEnd] of [
      [pieceA, true],
      [pieceB, false],
    ] as const) {
      const pt = lengths(piece)
      const pl = pt[SAMPLES]
      if (notch && pl > 2 * tintLen) {
        const cut = paramAt(pt, atEnd ? 1 - tintLen / pl : tintLen / pl)
        if (atEnd) {
          inked.push(split(piece, 0, cut))
          tints.push(split(piece, cut, 1))
        } else {
          tints.push(split(piece, 0, cut))
          inked.push(split(piece, cut, 1))
        }
      } else inked.push(piece)
      if (reach <= 0 || reach < w * 0.6) continue
      const tip = atEnd ? piece[3] : piece[0]
      const near = cubicPoint(piece, atEnd ? 0.99 : 0.01)
      const out = norm(sub(tip, near))
      // Turn toward gravity (+y): the side of the thread that faces down, or the same fixed side
      // when the end points straight up or down.
      const side = out.x > 1e-6 ? 1 : out.x < -1e-6 ? -1 : 1
      const across = { x: -out.y * side, y: out.x * side }
      for (const st of STRANDS[count - 1]) {
        const r = (side * st.angle * Math.PI) / 180
        const dir = {
          x: out.x * Math.cos(r) - out.y * Math.sin(r),
          y: out.x * Math.sin(r) + out.y * Math.cos(r),
        }
        // A tapered strand: its base is its share of the square cut, its point a strand's
        // length on. Bases tile the cut exactly, so the end has no step and no round cap.
        const mid = add(tip, across, (st.across * w) / 2)
        const halfBase = (st.share * w) / 2
        const b0 = add(mid, across, -halfBase),
          b1 = add(mid, across, halfBase)
        strands.push([b0, add(mid, dir, reach * st.length), b1])
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
    /** The pieces as drawn in ink: each snapped end short of its vermilion tint. */
    inked: inked.length ? inked : pieces,
    /** Tapered strand outlines (base corner, point, base corner), filled in ink. */
    strands,
    /** The vermilion tints on the broken tips; empty without `notch` or before a snap. */
    notch: tints,
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
      {g.inked.map((c, i) => (
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
      {g.notch.map((c, i) => (
        <path
          key={`t${i}`}
          d={cubicPath(c)}
          stroke={color.accent}
          strokeWidth={g.width}
          strokeLinecap="butt"
        />
      ))}
      {g.strands.length > 0 && (
        <path
          d={g.strands
            .map((pts) => "M" + pts.map((q) => `${n2(q.x)} ${n2(q.y)}`).join("L") + "Z")
            .join("")}
          // Strands continue their tip: vermilion where the break is marked, ink otherwise.
          fill={g.notch.length > 0 ? color.accent : color.ink}
          stroke="none"
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
