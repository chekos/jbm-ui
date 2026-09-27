import { Hand, handWrist, type HandPose } from "../ui/hand"
import { type Box, type Pt } from "../lib/geometry"
import { color } from "../lib/tokens"
export { pointOn, pathTilt } from "../lib/geometry"
export type ManoArm = {
  /**
   * Where the sleeve starts: a point in parent units, or "edge" (default) to run straight out
   * of the wrist, along the forearm axis, until it leaves `frame`.
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
}
type Quad = [Pt, Pt, Pt, Pt]
export type ManoArmGeometry = {
  /** Wrist edge in parent units, thumb side first. */
  wrist: [Pt, Pt]
  /** Unit vector from the wrist into the sleeve. */
  axis: Pt
  /** Sleeve outline: wrist end (thumb side, far side), then the far end. */
  sleeve: Quad
  /** Cuff band at the wrist end, when `cuff` is set. */
  cuff: Quad | null
  /** Outline stroke width in parent units (the Hand's 1.234 viewBox units). */
  stroke: number
}
const OUTLINE = 1.234
const far = 8
const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k })
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
  const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
  const u = unitVec({ x: B.x - A.x, y: B.y - A.y })
  // Wrist normal pointing away from the fingers (thumb side first, so it is u turned clockwise).
  const n = { x: -u.y, y: u.x }
  const w = spec.width ?? Math.hypot(B.x - A.x, B.y - A.y) * 1.15
  const from = spec.from ?? "edge"
  const F =
    from === "edge"
      ? add(M, n, spec.frame ? exitDistance(M, n, spec.frame) + w : far * size)
      : from
  const d = unitVec({ x: F.x - M.x, y: F.y - M.y })
  let q = { x: -d.y, y: d.x }
  if (q.x * u.x + q.y * u.y > 0) q = { x: -q.x, y: -q.y }
  // q points to the thumb side of the far end.
  const sleeve: Quad = [
    add(M, u, -w / 2),
    add(M, u, w / 2),
    add(F, q, -w / 2),
    add(F, q, w / 2),
  ]
  const band = (k: number): Quad => {
    const along = (p: Pt, t: Pt) => {
      const l = Math.hypot(t.x - p.x, t.y - p.y) || 1
      return add(p, { x: t.x - p.x, y: t.y - p.y }, Math.min(1, k / l))
    }
    return [sleeve[0], sleeve[1], along(sleeve[1], sleeve[2]), along(sleeve[0], sleeve[3])]
  }
  return {
    wrist: [A, B],
    axis: d,
    sleeve,
    cuff: cuff ? band(w * 0.45) : null,
    stroke: (OUTLINE * size) / 30,
  }
}
const points = (q: Quad) => q.map((p) => `${+p.x.toFixed(2)},${+p.y.toFixed(2)}`).join(" ")
/** Placement wrapper; Hand owns the artwork and pose, callers own movement. */
export function Mano({
  at,
  pose = "point",
  size = 180,
  angle = 0,
  anchor,
  arm,
  cuff,
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
            width={size}
            height={(size * (anchor ? 29 : 44)) / 30}
            style={{ height: (size * (anchor ? 29 : 44)) / 30 }}
          />
        </g>
      </g>
    </>
  )
}
