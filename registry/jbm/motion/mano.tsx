import { Hand, handWrist, type HandPose } from "../ui/hand"
import { type Box, type Pt } from "../lib/geometry"
import { color } from "../lib/tokens"
export { pointOn, pathTilt } from "../lib/geometry"
export type ManoArm = {
  /**
   * Where the sleeve starts: a point in parent units, or "edge" (default) to run straight out
   * of the wrist, along the forearm axis, until it leaves `frame`. With a point, the sleeve
   * leaves the wrist straight for a short forearm stub (cuff depth + width) and then bends,
   * at constant width, toward the point.
   */
  from?: Pt | "edge"
  /** Sleeve width in parent units. Defaults to 1.15 × the pose's wrist. */
  width?: number
  /** Frame box in parent units for `from: "edge"`. Without it the sleeve runs 8 × size. */
  frame?: Box
  /** Sleeve fill: solid ink (default, the storyboard's sleeve) or card with an ink outline. */
  tone?: "ink" | "card"
}
export type ManoProps = {
  at: Pt
  pose?: HandPose
  size?: number
  angle?: number
  /** Local point in the Hand's 30×29 viewBox held at `at`, including during rotation. */
  anchor?: Pt
  /** Draw a sleeve from the frame edge (or a point) to the wrist. `true` uses every default. */
  arm?: boolean | ManoArm
  /** Band the sleeve's wrist end: ink, or vermilion to mark the viewer's own hand. Needs `arm`. */
  cuff?: "ink" | "accent"
  /** Card knock-out ring around the hand's contour, for ink art passing behind it (see Hand). */
  halo?: boolean
}
type Quad = [Pt, Pt, Pt, Pt]
export type ManoArmGeometry = {
  /** Wrist edge in parent units, thumb side first. */
  wrist: [Pt, Pt]
  /** Unit vector from the wrist into the sleeve (the forearm stub's direction). */
  axis: Pt
  /**
   * Sleeve centreline in parent units: the wrist-end centre, then (for a point `from`) the
   * stub's end where the sleeve bends, then the far end.
   */
  spine: Pt[]
  /** Sleeve width in parent units, constant along the spine. */
  width: number
  /**
   * Sleeve outline polygon: the wrist end (thumb side, far side), down the far side to the far
   * end, and back up the thumb side. The bend's outer corner is rounded.
   */
  sleeve: Pt[]
  /** Cuff band on the straight stub at the wrist end, when `cuff` is set. */
  cuff: Quad | null
  /** Outline stroke width in parent units (the Hand's 1.234 viewBox units). */
  stroke: number
}
const OUTLINE = 1.234
const far = 8
/**
 * Share of a wider-than-wrist sleeve's overhang on the thumb side. The open-palm family (open,
 * type) steps in to its wrist corner on the thumb side, so its sleeve keeps that corner on the
 * hand contour and overhangs only the far side.
 */
const thumbOverhang: Record<HandPose, number> = {
  open: 0,
  point: 0.5,
  pinch: 0.5,
  grip: 0.5,
  type: 0,
  hold: 0.5,
}
const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k })
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
const unitVec = (v: Pt): Pt => {
  const l = Math.hypot(v.x, v.y) || 1
  return { x: v.x / l, y: v.y / l }
}
/** Hand-viewBox point → parent units, following Mano's own transform chain. */
function toParent(p: Pt, at: Pt, size: number, angle: number, anchor?: Pt): Pt {
  const s = size / 30
  const x = anchor ? (p.x - anchor.x) * s : p.x * s
  const y = anchor ? (p.y - anchor.y) * s : p.y * s + 7.5 * s
  const r = (angle * Math.PI) / 180
  return {
    x: at.x + x * Math.cos(r) - y * Math.sin(r),
    y: at.y + x * Math.sin(r) + y * Math.cos(r),
  }
}
/** Distance along `d` from `p` to where the ray leaves `box` (0 when p is outside). */
function exitDistance(p: Pt, d: Pt, box: Box): number {
  const ts: number[] = []
  if (d.x > 1e-9) ts.push((box.x + box.w - p.x) / d.x)
  if (d.x < -1e-9) ts.push((box.x - p.x) / d.x)
  if (d.y > 1e-9) ts.push((box.y + box.h - p.y) / d.y)
  if (d.y < -1e-9) ts.push((box.y - p.y) / d.y)
  return Math.max(0, Math.min(...ts))
}
/**
 * One side of a constant-width stroke along `spine`, offset by `side × w/2`: straight segments,
 * a rounded outer corner, and a mitred inner corner at each bend.
 */
function offsetSide(spine: Pt[], w: number, side: 1 | -1): Pt[] {
  const t = spine.slice(1).map((p, i) => unitVec(sub(p, spine[i])))
  const nrm = t.map((v) => ({ x: -v.y * side, y: v.x * side }))
  const out: Pt[] = [add(spine[0], nrm[0], w / 2)]
  for (let i = 1; i < spine.length - 1; i++) {
    const a = nrm[i - 1]
    const b = nrm[i]
    const turn = t[i - 1].x * t[i].y - t[i - 1].y * t[i].x
    // This side is outside the bend when it turns away from the offset direction.
    const outer = turn * side < 0
    if (outer) {
      const a0 = Math.atan2(a.y, a.x)
      let da = Math.atan2(b.y, b.x) - a0
      while (da > Math.PI) da -= 2 * Math.PI
      while (da < -Math.PI) da += 2 * Math.PI
      const steps = Math.max(1, Math.ceil(Math.abs(da) / (Math.PI / 12)))
      for (let k = 0; k <= steps; k++) {
        const ang = a0 + (da * k) / steps
        out.push(add(spine[i], { x: Math.cos(ang), y: Math.sin(ang) }, w / 2))
      }
    } else {
      // Mitre: where the two offset edges meet.
      const m = unitVec(add(a, b))
      const cos = m.x * a.x + m.y * a.y
      out.push(add(spine[i], m, w / 2 / Math.max(cos, 0.2)))
    }
  }
  out.push(add(spine[spine.length - 1], nrm[nrm.length - 1], w / 2))
  return out
}
/** Sleeve and cuff geometry in parent units; pure, so scenes can test or reuse it. */
export function manoArm({
  at,
  pose = "point",
  size = 180,
  angle = 0,
  anchor,
  arm = true,
  cuff,
}: ManoProps): ManoArmGeometry {
  const spec = arm === true || arm === false ? {} : arm
  const [a, b] = handWrist[pose]
  const A = toParent(a, at, size, angle, anchor)
  const B = toParent(b, at, size, angle, anchor)
  const L = Math.hypot(B.x - A.x, B.y - A.y)
  const u = unitVec(sub(B, A))
  // Wrist normal pointing away from the fingers (thumb side first, so it is u turned clockwise).
  const n = { x: -u.y, y: u.x }
  const w = spec.width ?? L * 1.15
  // Wrist-end corners: centred on the wrist edge, except that extra width on the open-palm
  // family goes to the far side so the thumb-side corner stays on the hand contour.
  const extra = w - L
  const thumbExtra = extra > 0 ? extra * thumbOverhang[pose] : extra / 2
  const P0 = add(A, u, -thumbExtra)
  const P1 = add(P0, u, w)
  const S0 = { x: (P0.x + P1.x) / 2, y: (P0.y + P1.y) / 2 }
  const depth = Math.max(w * 0.45, L * 0.6)
  const from = spec.from ?? "edge"
  let spine: Pt[]
  if (from === "edge") {
    const len = spec.frame ? exitDistance(S0, n, spec.frame) + w : far * size
    spine = [S0, add(S0, n, len)]
  } else {
    // A straight forearm stub (holding the cuff square), then bend toward the point.
    const stub = add(S0, n, depth + w)
    const toF = sub(from, stub)
    const ahead = toF.x * n.x + toF.y * n.y
    const aside = Math.abs(toF.x * n.y - toF.y * n.x)
    spine =
      Math.hypot(toF.x, toF.y) < w * 0.25 || (ahead > 0 && aside < ahead * 0.02)
        ? [S0, add(S0, n, Math.max(Math.hypot(from.x - S0.x, from.y - S0.y), 1))]
        : [S0, stub, from]
  }
  // Offsetting by +1 lands on the thumb side (−u at the wrist), −1 on the far side.
  const left = offsetSide(spine, w, 1)
  const right = offsetSide(spine, w, -1)
  const sleeve = [P0, P1, ...right.slice(1), ...left.slice(1).reverse()]
  return {
    wrist: [A, B],
    axis: n,
    spine,
    width: w,
    sleeve,
    cuff: cuff ? [P0, P1, add(P1, n, depth), add(P0, n, depth)] : null,
    stroke: (OUTLINE * size) / 30,
  }
}
const points = (q: readonly Pt[]) => q.map((p) => `${+p.x.toFixed(2)},${+p.y.toFixed(2)}`).join(" ")
/** Placement wrapper; Hand owns the artwork and pose, callers own movement. */
export function Mano({
  at,
  pose = "point",
  size = 180,
  angle = 0,
  anchor,
  arm,
  cuff,
  halo,
}: ManoProps) {
  const geo = arm
    ? manoArm({ at, pose, size, angle, anchor, arm, cuff })
    : null
  const tone = typeof arm === "object" ? (arm.tone ?? "ink") : "ink"
  const seam = geo?.cuff && cuff === "ink" && tone === "ink" ? geo.cuff : null
  return (
    <>
      {geo && (
        <g data-mano-arm="" strokeLinejoin="round">
          <polygon
            points={points(geo.sleeve)}
            fill={tone === "ink" ? color.ink : color.card}
            stroke={color.ink}
            strokeWidth={geo.stroke}
          />
          {geo.cuff && (
            <polygon
              points={points(geo.cuff)}
              fill={cuff === "accent" ? color.accent : color.ink}
              stroke={color.ink}
              strokeWidth={geo.stroke}
            />
          )}
          {seam && (
            // An ink cuff on an ink sleeve: a card seam, inset from the outline, marks the band.
            <line
              x1={seam[3].x + (seam[2].x - seam[3].x) * 0.12}
              y1={seam[3].y + (seam[2].y - seam[3].y) * 0.12}
              x2={seam[3].x + (seam[2].x - seam[3].x) * 0.88}
              y2={seam[3].y + (seam[2].y - seam[3].y) * 0.88}
              stroke={color.card}
              strokeWidth={geo.stroke * 0.6}
              strokeLinecap="round"
            />
          )}
        </g>
      )}
      <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`}>
        <g
          transform={
            anchor
              ? `translate(${(-anchor.x * size) / 30} ${(-anchor.y * size) / 30})`
              : undefined
          }
        >
          <Hand
            pose={pose}
            halo={halo}
            width={size}
            height={(size * (anchor ? 29 : 44)) / 30}
            style={{ height: (size * (anchor ? 29 : 44)) / 30 }}
          />
        </g>
      </g>
    </>
  )
}
