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

/** How far past the sheet a strip's clip reaches, so it never trims a shadow or a turned corner. */
const FAR = 2000
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
 * Where a strip is at its own progress p toward `to`: it parts along the seam first (y follows p)
 * and drifts and turns as it travels (x and rotate follow p²), so neighbouring torn edges separate
 * as parallel copies before they shift, and never cross while they are close.
 */
export function tearMotion(to: TearDestination = {}, progress: number) {
  const p = clamp01(progress)
  return {
    x: finite(to.x ?? 0) * p * p,
    y: finite(to.y ?? 0) * p,
    rotate: finite(to.rotate ?? 0) * p * p,
  }
}

/** Room the shadows take around a strip: the sheet's and each strip's drop shadow fall down. */
const SHADOW_ROOM = { top: 8, side: 16, bottom: 34 }

/**
 * The box, in the sheet's px (origin at its top-left, so x and y can be negative), that every strip
 * stays inside at every progress: Tear's root is only w × h, and strips travel past it by their
 * destinations. With `shadow` (default true) it includes the room the shadows take. Reserve this box
 * (or give the stage at least this much room) so no strip or shadow is clipped.
 */
export function tearBounds({
  w,
  h,
  seams,
  pieces = [],
  fray = FRAY,
  shadow = true,
}: Pick<TearProps, "w" | "h" | "seams" | "pieces" | "fray" | "shadow">) {
  const W = Math.max(0, finite(w)),
    H = Math.max(0, finite(h))
  const bounds = [0, ...tearSeams(H, seams, fray), H]
  const reach = frayReach(fray)
  let x0 = 0,
    y0 = 0,
    x1 = W,
    y1 = H
  bounds.slice(0, -1).forEach((top, i) => {
    const bottom = bounds[i + 1]
    const t = i > 0 ? top - reach : 0
    const b = i < bounds.length - 2 ? bottom + reach : H
    const cx = W / 2,
      cy = (top + bottom) / 2
    const to = pieces[i]?.to ?? {}
    // Translation and turn are both linear in the strip's own progress: sample the path.
    for (let k = 0; k <= 32; k++) {
      const p = k / 32
      const m = tearMotion(to, p)
      const a = (m.rotate * Math.PI) / 180
      const dx = m.x,
        dy = m.y
      for (const [x, y] of [
        [0, t],
        [W, t],
        [W, b],
        [0, b],
      ]) {
        const px = cx + dx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a)
        const py = cy + dy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)
        x0 = Math.min(x0, px)
        x1 = Math.max(x1, px)
        y0 = Math.min(y0, py)
        y1 = Math.max(y1, py)
      }
    }
  })
  const pad = shadow === false ? { top: 0, side: 0, bottom: 0 } : SHADOW_ROOM
  x0 = Math.floor(x0 - pad.side)
  y0 = Math.floor(y0 - pad.top)
  x1 = Math.ceil(x1 + pad.side)
  y1 = Math.ceil(y1 + pad.bottom)
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/**
 * A sheet torn into horizontal strips along seams. At progress 0 the strips tile the sheet exactly
 * and no seam shows; as progress rises each strip travels to its own destination and its torn edges
 * appear, frayed and deterministic. Pure React and controlled: the caller owns timing. The root is
 * w × h; strips move past it, so reserve tearBounds() around it.
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
        const { x, y, rotate: rot } = tearMotion(to, p)
        const openAbove = i > 0 ? clamp01(Math.max(p, local[i - 1]) / 0.05) : 0
        const openBelow =
          i < strips.length - 1 ? clamp01(Math.max(p, local[i + 1]) / 0.05) : 0
        const info: TearPieceInfo = { index: i, top: s.top, bottom: s.bottom, progress: p }
        // While a seam is closed, the strips' shadows must not show along it (a line where no tear
        // shows yet): clip the shadowed fill at the seam, 1px inside the strip below (the
        // under-band covers that row), and let the clip recede 60px as the seam opens. Beside the
        // sheet both strips' side shadows are cut on the same line, so they meet without a gap.
        const run = (d: string | null, shift: number, lift: number) => {
          const pts = d ? [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]) : []
          if (!pts.length) return []
          const [x0, y0] = pts[0]
          const [x1, y1] = pts[pts.length - 1]
          return [
            `-${FAR}px ${r2(y0 + lift)}px`,
            `${x0}px ${r2(y0 + lift)}px`,
            ...pts.map(([x, y]) => `${x}px ${r2(y + shift + lift)}px`),
            `${x1}px ${r2(y1 + lift)}px`,
            `${W + FAR}px ${r2(y1 + lift)}px`,
          ]
        }
        const clipAbove = shadow && ramp > 0 && s.seamAbove !== null && openAbove < 1
        const clipBelow = shadow && ramp > 0 && s.seamBelow !== null && openBelow < 1
        const shadowClip =
          clipAbove || clipBelow
            ? `polygon(${[
                ...(clipAbove ? run(s.seamAbove, 1, -61 * openAbove) : [`-${FAR}px -${FAR}px`, `${W + FAR}px -${FAR}px`]),
                ...(clipBelow ? run(s.seamBelow, 0, 61 * openBelow).reverse() : [`${W + FAR}px ${H + FAR}px`, `-${FAR}px ${H + FAR}px`]),
              ].join(", ")})`
            : undefined
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
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                filter:
                  shadow && ramp > 0
                    ? `drop-shadow(0 1px 1px rgba(32,36,31,${r2(0.1 * ramp)})) drop-shadow(0 8px 10px rgba(32,36,31,${r2(0.14 * ramp)}))`
                    : undefined,
                clipPath: shadowClip,
              }}
            >
            <svg
              width={W}
              height={H}
              aria-hidden
              style={{ position: "absolute", inset: 0, overflow: "visible" }}
            >
              <path d={s.outline} fill={paperFill(tone)} />
            </svg>
            </div>
            {/* While the seam is closed, a band of stock from half a pixel above the seam to 3px
                below it runs under the next strip, so no antialiasing hairline shows where the two
                fills (and the clipped shadows) meet. It sits outside the shadowed layer, so it
                casts no shadow of its own. */}
            {s.seamBelow && openBelow < 1 && (
              <svg
                width={W}
                height={H}
                aria-hidden
                style={{ position: "absolute", inset: 0, overflow: "visible" }}
              >
                <path
                  d={s.seamBelow}
                  fill="none"
                  stroke={paperFill(tone)}
                  strokeOpacity={r2(1 - openBelow)}
                  strokeWidth={3.5}
                  transform="translate(0 1.25)"
                />
              </svg>
            )}
            {/* The writing, clipped to the strip, over the fill and the under-band. */}
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
            {/* The ink edges draw last. Like the writing they sit outside the clipped shadow layer,
                so a closed seam never nicks the sheet's straight sides or its writing. */}
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
