import type { CSSProperties, ReactNode } from "react"
import { color } from "../lib/tokens"
import {
  FRAY,
  frayEdge,
  frayReach,
  paperFill,
  paperShadow,
  type PaperTone,
} from "./paper"

/** Where one strip goes: an offset from its place in the whole sheet (stage px) and a turn (degrees). */
export type TearDestination = { x?: number; y?: number; rotate?: number }
export type TearPiece = { to?: TearDestination }
/** What a render-prop child receives for each strip. Coordinates are the whole sheet's. */
export type TearPieceInfo = {
  index: number
  /** The seam above the strip (0 for the first). */
  top: number
  /** The seam below the strip (h for the last). */
  bottom: number
  /** This strip's own 0–1 travel after stagger. */
  progress: number
}
export type TearProps = {
  /** Sheet width in stage px. */
  w: number
  /** Sheet height in stage px. */
  h: number
  /** Seam y positions in stage px from the top edge; n seams make n + 1 strips. */
  seams: number[]
  /** 0 = the whole sheet, 1 = every strip at its destination. Linear; ease it yourself. */
  progress: number
  /** Per-strip destinations, top to bottom. A missing entry stays put. */
  pieces?: TearPiece[]
  /** Delay between strips as a share of progress: strip i starts at i × stagger. */
  stagger?: number
  /** Fray pattern; Paper's starting tear with the same seed and seam continues the same edge. */
  seed?: number
  /** Fray amplitude in stage px. */
  fray?: number
  tone?: PaperTone
  radius?: number
  edge?: boolean
  shadow?: boolean
  /**
   * The sheet's writing, laid out on the whole w × h sheet and clipped to each strip. A function is
   * called once per strip with that strip's info; a node is repeated in every strip.
   */
  children?: ReactNode | ((piece: TearPieceInfo) => ReactNode)
  /** Styles for the w × h content layer each strip clips (padding, layout). */
  contentStyle?: CSSProperties
  style?: CSSProperties
}

const finite = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback)
const clamp01 = (n: number) => Math.min(1, Math.max(0, finite(n)))
const r2 = (n: number) => Math.round(n * 100) / 100

/**
 * The seams Tear actually uses: finite, sorted, at least one fray reach plus 4px inside the sheet,
 * and far enough apart that neighbouring frayed edges never cross.
 */
export function tearSeams(h: number, seams: number[], fray = FRAY) {
  const margin = frayReach(fray) + 4
  const out: number[] = []
  for (const y of [...seams].filter(Number.isFinite).sort((a, b) => a - b)) {
    if (y < margin || y > h - margin) continue
    if (out.length && y - out[out.length - 1] < 2 * margin) continue
    out.push(y)
  }
  return out
}

/** Strip i's own 0–1 travel: it starts at i × stagger and ends at progress 1. */
export function tearPieceProgress(
  progress: number,
  index: number,
  count: number,
  stagger = 0
) {
  const s = count > 1 ? Math.min(clamp01(stagger), 0.9 / (count - 1)) : 0
  return clamp01((clamp01(progress) - index * s) / (1 - s * (count - 1)))
}

type Pt = { x: number; y: number }
export type TearGeometry = {
  index: number
  top: number
  bottom: number
  /** Closed outline of the strip in sheet coordinates: straight sheet edges, frayed seams. */
  outline: string
  /** The straight (uncut) edges of the strip. */
  edges: string
  /** Frayed seam edges: above (null for the first strip) and below (null for the last). */
  seamAbove: string | null
  seamBelow: string | null
  /** Rotation centre of the strip in sheet coordinates. */
  center: Pt
}

/**
 * Outlines for every strip. Neighbouring strips share the identical frayed polyline at their seam, so
 * together the outlines cover the sheet exactly. Stroke-centred: with an edge, the uncut sides sit
 * 1px inside the box like Paper's 2px border.
 */
export function tearGeometry({
  w,
  h,
  seams,
  seed = 1,
  fray = FRAY,
  radius = 22,
  edge = true,
}: {
  w: number
  h: number
  seams: number[]
  seed?: number
  fray?: number
  radius?: number
  edge?: boolean
}): TearGeometry[] {
  const W = Math.max(0, finite(w)),
    H = Math.max(0, finite(h))
  const e = edge ? 1 : 0
  const cuts = tearSeams(H, seams, fray)
  const lines = cuts.map((y) =>
    frayEdge({ width: W, y, seed, amplitude: fray }).map((p) => ({
      x: Math.min(W - e, Math.max(e, p.x)),
      y: p.y,
    }))
  )
  const bounds = [0, ...cuts, H]
  const poly = (pts: Pt[]) => pts.map((p) => `L${r2(p.x)} ${r2(p.y)}`).join("")
  return bounds.slice(0, -1).map((top, i) => {
    const bottom = bounds[i + 1]
    const above = i > 0 ? lines[i - 1] : null
    const below = i < cuts.length ? lines[i] : null
    const span = (above ? top : e) - (below ? bottom : H - e)
    const r = Math.max(
      0,
      Math.min(finite(radius) - e, W / 2 - e, Math.abs(span) / (above || below ? 1 : 2))
    )
    const arc = (x: number, y: number) => `A${r2(r)} ${r2(r)} 0 0 1 ${r2(x)} ${r2(y)}`
    const topRun = above
      ? `M${r2(above[0].x)} ${r2(above[0].y)}${poly(above.slice(1))}`
      : `M${e} ${r2(e + r)}${arc(e + r, e)}H${r2(W - e - r)}${arc(W - e, e + r)}`
    const bottomRun = below
      ? `L${r2(below[below.length - 1].x)} ${r2(below[below.length - 1].y)}${poly([...below].reverse().slice(1))}`
      : `V${r2(H - e - r)}${arc(W - e - r, H - e)}H${r2(e + r)}${arc(e, H - e - r)}`
    const tL = above ? above[0].y : e + r,
      tR = above ? above[above.length - 1].y : e + r
    const bL = below ? below[0].y : H - e - r,
      bR = below ? below[below.length - 1].y : H - e - r
    let edges: string
    if (!above && !below) edges = `${topRun}${bottomRun}Z`
    else if (!above)
      edges = `M${e} ${r2(bL)}V${r2(e + r)}${arc(e + r, e)}H${r2(W - e - r)}${arc(W - e, e + r)}V${r2(bR)}`
    else if (!below)
      edges = `M${r2(W - e)} ${r2(tR)}V${r2(H - e - r)}${arc(W - e - r, H - e)}H${r2(e + r)}${arc(e, H - e - r)}V${r2(tL)}`
    else edges = `M${e} ${r2(tL)}V${r2(bL)}M${r2(W - e)} ${r2(tR)}V${r2(bR)}`
    const line = (pts: Pt[] | null) =>
      pts ? `M${r2(pts[0].x)} ${r2(pts[0].y)}${poly(pts.slice(1))}` : null
    return {
      index: i,
      top,
      bottom,
      outline: `${topRun}${bottomRun}Z`,
      edges,
      seamAbove: line(above),
      seamBelow: line(below),
      center: { x: r2(W / 2), y: r2((top + bottom) / 2) },
    }
  })
}

/**
 * A sheet torn into horizontal strips along seams. At progress 0 the strips tile the sheet exactly
 * and no seam shows; as progress rises each strip travels to its own destination and its torn edges
 * appear, frayed and deterministic. Pure React and controlled: the caller owns timing.
 */
export function Tear({
  w,
  h,
  seams,
  progress,
  pieces = [],
  stagger = 0,
  seed = 1,
  fray = FRAY,
  tone = "paper",
  radius = 22,
  edge = true,
  shadow = true,
  children,
  contentStyle,
  style,
}: TearProps) {
  const W = Math.max(0, finite(w)),
    H = Math.max(0, finite(h))
  const strips = tearGeometry({ w: W, h: H, seams, seed, fray, radius, edge })
  const local = strips.map((_, i) =>
    tearPieceProgress(progress, i, strips.length, stagger)
  )
  // Shadows hand over from the whole sheet to the strips over the first 8% of travel.
  const ramp = clamp01(Math.max(0, ...local) / 0.08)
  const edgeColor = tone === "paper" ? color.ink : paperFill(tone)
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        ...style,
      }}
    >
      {shadow && ramp < 1 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow: paperShadow,
            opacity: 1 - ramp,
          }}
        />
      )}
      {strips.map((s, i) => {
        const p = local[i]
        const to = pieces[i]?.to ?? {}
        const x = finite(to.x ?? 0) * p,
          y = finite(to.y ?? 0) * p,
          rot = finite(to.rotate ?? 0) * p
        const openAbove = i > 0 ? clamp01(Math.max(p, local[i - 1]) / 0.05) : 0
        const openBelow =
          i < strips.length - 1 ? clamp01(Math.max(p, local[i + 1]) / 0.05) : 0
        const info: TearPieceInfo = { index: i, top: s.top, bottom: s.bottom, progress: p }
        const content = typeof children === "function" ? children(info) : children
        return (
          <div
            key={i}
            data-piece={i}
            aria-hidden={i > 0 || undefined}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height: H,
              transform:
                x || y || rot
                  ? `translate(${r2(x)}px, ${r2(y)}px) rotate(${r2(rot)}deg)`
                  : undefined,
              transformOrigin: `${s.center.x}px ${s.center.y}px`,
              filter:
                shadow && ramp > 0
                  ? `drop-shadow(0 1px 1px rgba(32,36,31,${r2(0.1 * ramp)})) drop-shadow(0 8px 10px rgba(32,36,31,${r2(0.14 * ramp)}))`
                  : undefined,
              pointerEvents: "none",
            }}
          >
            <svg
              width={W}
              height={H}
              aria-hidden
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
            >
              <path d={s.outline} fill={paperFill(tone)} />
              {/* While the seam is closed, a 3px band of stock runs under the next strip so no
                  antialiasing hairline shows where the two fills meet. */}
              {s.seamBelow && openBelow < 1 && (
                <path
                  d={s.seamBelow}
                  fill="none"
                  stroke={paperFill(tone)}
                  strokeOpacity={r2(1 - openBelow)}
                  strokeWidth={3}
                  transform="translate(0 1.5)"
                />
              )}
            </svg>
            {content != null && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  boxSizing: "border-box",
                  clipPath: `path("${s.outline}")`,
                  pointerEvents: "auto",
                  ...contentStyle,
                }}
              >
                {content}
              </div>
            )}
            {edge && (
              <svg
                width={W}
                height={H}
                aria-hidden
                style={{ position: "absolute", inset: 0, overflow: "visible" }}
              >
                <path
                  d={s.edges}
                  fill="none"
                  stroke={edgeColor}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {[
                  [s.seamAbove, openAbove],
                  [s.seamBelow, openBelow],
                ].map(([d, open], k) =>
                  d && (open as number) > 0 ? (
                    <path
                      key={k}
                      d={d as string}
                      fill="none"
                      stroke={edgeColor}
                      strokeOpacity={r2(open as number)}
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ) : null
                )}
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}
