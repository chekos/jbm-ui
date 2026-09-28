import type { CSSProperties } from "react"
import { Paper, paperShadow } from "./paper"
import { RegisterInk, type RegisterKind } from "./register"
import { color } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

/**
 * An out-of-register block: a small paper strip carrying a few marks of one register, taped onto a
 * sheet where it does not belong. `lift` peels the tape and raises it; `offset` carries it. The
 * host owns the path, the hand, and the sheets' reflow (Register gapAt / reflow). Pure React.
 */
export type SlipProps = {
  /** 0 flat on a sheet, 1 held above it: the tape flap peels by 0.4, the shadow deepens, the slip rises and tilts. */
  lift?: number
  /** Translation from the slip's resting place, in px. */
  offset?: Pt
  /** Masking tape across the top edge. */
  tape?: boolean
  /** Dashed ink outline: the slip flagged as out of place. */
  dashed?: boolean
  /** Register drawn on the slip (default prose). */
  kind?: Exclude<RegisterKind, "mixed">
  /** Steps, groups, tables, or (prose) source ticks on the slip. */
  n?: number
  /** Slip width in px. */
  w?: number
  /** Slip height in px. */
  h?: number
  /** Resting rotation in degrees. */
  rotate?: number
  /** Mark scale; match the sheet it came from (Register uses w / 360). */
  scale?: number
  /** Writing drawn so far, 0–1. */
  reveal?: number
  /** Cell indices whose lead mark is vermilion. */
  accent?: readonly number[]
  style?: CSSProperties
}
type Geometry = Required<Pick<SlipProps, "lift" | "offset" | "w" | "h" | "rotate" | "scale">>
const resolve = (p: SlipProps): Geometry => ({
  lift: unit(p.lift ?? 0),
  offset: p.offset ?? { x: 0, y: 0 },
  w: p.w ?? 240,
  h: p.h ?? 72,
  rotate: p.rotate ?? -2,
  scale: p.scale ?? 1,
})
const pose = (g: Geometry) => ({
  rise: 10 * g.scale * g.lift,
  angle: g.rotate + 3 * g.lift,
  zoom: 1 + 0.04 * g.lift,
})

/** A point on the slip (local px from its top-left) in the host's px, after lift and offset. */
export function slipPoint(props: SlipProps, local: Pt): Pt {
  const g = resolve(props)
  const { rise, angle, zoom } = pose(g)
  const cx = g.w / 2,
    cy = g.h / 2
  const a = (angle * Math.PI) / 180
  const dx = (local.x - cx) * zoom,
    dy = (local.y - cy) * zoom
  return {
    x: g.offset.x + cx + dx * Math.cos(a) - dy * Math.sin(a),
    y: g.offset.y - rise + cy + dx * Math.sin(a) + dy * Math.cos(a),
  }
}
/** Where a pinch holds the slip: the middle of its bottom (default) or top edge, in host px. */
export const slipGrip = (props: SlipProps, edge: "top" | "bottom" = "bottom"): Pt => {
  const g = resolve(props)
  return slipPoint(props, { x: g.w * 0.5, y: edge === "top" ? 0 : g.h })
}

/**
 * Torn masking tape: a body on the slip and a flap that peels up about the fold. The flap stays
 * hinged along the whole fold line: as it lifts off the slip it foreshortens and its free end
 * rises (a shear about the fold), so no wedge ever opens between flap and body.
 */
function Tape({ w, u, peel }: { w: number; u: number; peel: number }) {
  const L = Math.min(w * 0.8, Math.max(56 * u, w * 0.34))
  const T = 14 * u
  const d = 2.5 * u
  const fold = L * 0.64
  const x0 = w * 0.56 - L / 2
  // Torn ends: seven points down each end, alternating flush and `d` inward.
  const torn = (x: number, dir: 1 | -1, down: boolean) =>
    Array.from({ length: 7 }, (_, k) => {
      const y = (k * T) / 6
      return `L${x + (k % 2 ? dir * d : 0)} ${down ? y : T - y}`
    }).join(" ")
  // Outlines stop at the fold, so flat tape reads as one strip; the crease inks in as the flap bends.
  const body = `M${fold} ${T}H0${torn(0, 1, false)}L${fold} 0`
  const flap = `M${fold} 0H${L}${torn(L, -1, true)}H${fold}`
  const stroke = Math.max(1, 1.25 * u)
  const line = { fill: "none", stroke: color.ink, strokeWidth: stroke, strokeLinejoin: "round", strokeLinecap: "round" } as const
  return (
    <svg
      aria-hidden
      width={L + 4 * u}
      height={T * 3}
      viewBox={`${-2 * u} ${-T * 2} ${L + 4 * u} ${T * 3}`}
      style={{ position: "absolute", left: x0 - 2 * u, top: -T / 2 - T * 2, overflow: "visible", transform: "rotate(-3deg)" }}
    >
      <path d={`${body}H${fold + (peel > 0 ? 0 : 0.75 * u)}V${T}Z`} fill={color.line} />
      <path d={body} {...line} />
      {peel > 0 && <path d={`M${fold} 0V${T}`} {...line} strokeOpacity={Math.min(1, peel * 8)} />}
      <g transform={flapMatrix(peel, fold, L, T)}>
        <path d={`${flap}Z`} fill={color.line} />
        <path d={flap} {...line} />
        {peel > 0 && <path d={`M${fold} 0V${T}`} {...line} strokeOpacity={Math.min(1, peel * 8)} />}
      </g>
    </svg>
  )
}

/** The flap's peel as an affine map that keeps the fold line (x = fold) fixed. */
function flapMatrix(peel: number, fold: number, L: number, T: number) {
  const k = 1 - 0.42 * peel
  const rise = (0.95 * T * peel) / Math.max(1, L - fold)
  const r = (n: number) => Math.round(n * 1000) / 1000
  return `matrix(${r(k)} ${r(-rise)} 0 1 ${r(fold * (1 - k))} ${r(rise * fold)})`
}

/** A taped paper slip carrying a few marks of one register; lift and offset are controlled. */
export function Slip(props: SlipProps) {
  const { tape = true, dashed = false, kind = "prose", n, reveal = 1, accent, style } = props
  const g = resolve(props)
  const { rise, angle, zoom } = pose(g)
  const peel = unit(g.lift / 0.4)
  const u = g.scale
  const lift = g.lift
  const shadow = lift
    ? `${paperShadow}, 0 ${6 + 22 * lift}px ${10 + 30 * lift}px -${6 + 4 * lift}px rgba(32,36,31,${(0.1 + 0.12 * lift).toFixed(3)})`
    : paperShadow
  return (
    <div
      style={{
        width: g.w,
        height: g.h,
        transform: `translate(${g.offset.x}px, ${g.offset.y - rise}px) rotate(${angle}deg) scale(${zoom})`,
        transformOrigin: "50% 50%",
        position: "relative",
        flexShrink: 0,
        ...style,
      }}
    >
      <Paper w={g.w} h={g.h} radius={Math.max(2, 3 * u)} edge={false} style={{ boxShadow: shadow, position: "absolute", left: 0, top: 0 }}>
        <svg width={g.w} height={g.h} viewBox={`0 0 ${g.w} ${g.h}`} role="img" aria-label={`Slip of ${kind} writing`} style={{ display: "block", overflow: "visible" }}>
          <RegisterInk kind={kind} n={n ?? (kind === "prose" ? 2 : kind === "mono" ? 1 : 2)} w={g.w} h={g.h} scale={u} pad={10 * u} reveal={reveal} accent={accent} />
          <rect
            x={1}
            y={1}
            width={g.w - 2}
            height={g.h - 2}
            rx={Math.max(1, 3 * u - 1)}
            fill="none"
            stroke={color.ink}
            strokeWidth={2}
            strokeDasharray={dashed ? `${8 * u} ${5 * u}` : undefined}
          />
        </svg>
      </Paper>
      {tape && <Tape w={g.w} u={u} peel={peel} />}
    </div>
  )
}
