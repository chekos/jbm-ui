import { color, font, sansWidth } from "../lib/tokens"
import { unit, type Box, type Pt } from "../lib/geometry"

export type Quadrant = "tl" | "tr" | "bl" | "br"
export type EjesSide = "top" | "bottom" | "left" | "right"
/** Half-plane names: top and bottom flank the horizontal axis, left and right the vertical one. */
export type EjesLabels = Record<EjesSide, string>
export type EjesFocusTone = "ink" | "fill" | "accent"
export type EjesProps = {
  /** Area the axes span, in parent SVG units. */
  box: Box
  /**
   * Where the axes cross. Defaults to the centre of box. Clamped to the range that keeps every
   * label inside box and clear of the other axis (see ejesLayout's `range`); a box too small for
   * the labels crosses at its centre.
   */
  center?: Pt
  /** Horizontal axis draw progress, 0–1. Clamped. */
  h: number
  /** Vertical axis draw progress, 0–1. Clamped. */
  v: number
  labels: EjesLabels
  /** Labels shrink to small text at the axis ends: false/0 full, true/1 quiet, between interpolates. */
  quiet?: boolean | number
  /** Per-label opacity 0–1. Omitted labels fade in as their axis reaches them. */
  reveal?: Partial<Record<EjesSide, number>>
  /** Axes grow out from the crossing (center) or from the left and top edges (start). */
  origin?: "center" | "start"
  /** Quadrant(s) called out: one, or several at once (all four for "cuatro"). */
  focus?: Quadrant | readonly Quadrant[]
  /**
   * ink outline (default), fill (light ink wash), or accent: a vermilion outline, opt-in, on the
   * first focused quadrant only (the others stay ink), so the set carries one stamp.
   */
  focusTone?: EjesFocusTone
  /** Focus outline draw / fill progress, 0–1. Defaults to 1. Clamped. */
  focusProgress?: number
  /** Gap between a focus outline and the axes and box edges, in parent units. */
  focusInset?: number
  /** Axis and outline stroke width, in parent units. Default 2, the desk's line weight. */
  weight?: number
}

export const quadrants = ["tl", "tr", "bl", "br"] as const
/** Label size in parent units: full, then quiet. */
export const EJES_TYPE = { full: 36, quiet: 22 } as const
const PAD = 14
const GAP = 12
const FADE = 60
/** A focus outline smaller than this on either side is not drawn: it would read as a pill. */
const FOCUS_MIN = 40

/** Axis, label, and quadrant geometry; everything follows from box, center, and progress. */
export function ejesLayout({
  box,
  center,
  h,
  v,
  quiet = false,
  reveal = {},
  origin = "center",
  focusInset = 16,
  labels,
}: Pick<
  EjesProps,
  "box" | "center" | "h" | "v" | "quiet" | "reveal" | "origin" | "focusInset"
> & { labels?: Partial<EjesLabels> }) {
  const q = unit(typeof quiet === "boolean" ? Number(quiet) : quiet)
  const size = EJES_TYPE.full + (EJES_TYPE.quiet - EJES_TYPE.full) * q
  // The crossing's valid range: the left label (right-aligned at the vertical axis) and the top
  // and bottom labels (from the left edge) must end before the vertical axis, the right label
  // must fit after it; the top label sits below the left and right labels and above the axis,
  // the bottom label below it. Widths are Geist 800 estimates, so they err wide.
  const tw = (side: EjesSide) => (labels?.[side] ? sansWidth(labels[side] as string, size) : 0)
  const range = {
    x: [
      box.x + Math.max(PAD + Math.max(tw("top"), tw("bottom")) + GAP, GAP + tw("left")),
      box.x + box.w - GAP - tw("right"),
    ],
    y: [box.y + PAD + size + 4 + size + GAP, box.y + box.h - GAP - size],
  } as const
  const pick = (want: number, [lo, hi]: readonly [number, number], mid: number) =>
    lo <= hi ? Math.min(hi, Math.max(lo, want)) : mid
  const c = {
    x: pick(center?.x ?? box.x + box.w / 2, range.x, box.x + box.w / 2),
    y: pick(center?.y ?? box.y + box.h / 2, range.y, box.y + box.h / 2),
  }
  const ph = unit(h),
    pv = unit(v)
  const right = box.x + box.w,
    bottom = box.y + box.h
  const horizontal =
    origin === "start"
      ? { x1: box.x, x2: box.x + ph * box.w }
      : { x1: c.x - ph * (c.x - box.x), x2: c.x + ph * (right - c.x) }
  const vertical =
    origin === "start"
      ? { y1: box.y, y2: box.y + pv * box.h }
      : { y1: c.y - pv * (c.y - box.y), y2: c.y + pv * (bottom - c.y) }
  // Labels sit at the left end of the horizontal axis and the top end of the vertical one.
  const hx = box.x + PAD,
    vy = box.y + PAD
  // Labels arrive with the line: growing from the crossing, over the last FADE units before the
  // tip reaches their end; growing from the edge, over the first FADE units drawn.
  const hPast =
    origin === "start"
      ? horizontal.x2 - box.x
      : box.x + FADE - horizontal.x1
  const vPast =
    origin === "start" ? vertical.y2 - box.y : box.y + FADE - vertical.y1
  const arrived = (past: number, p: number) => (p > 0 ? unit(past / FADE) : 0)
  const opacity = (side: EjesSide) =>
    unit(
      reveal[side] ??
        (side === "top" || side === "bottom"
          ? arrived(hPast, ph)
          : arrived(vPast, pv))
    )
  const anchors = {
    top: { x: hx, y: c.y - GAP, anchor: "start", baseline: "auto" },
    bottom: { x: hx, y: c.y + GAP, anchor: "start", baseline: "hanging" },
    left: { x: c.x - GAP, y: vy, anchor: "end", baseline: "hanging" },
    right: { x: c.x + GAP, y: vy, anchor: "start", baseline: "hanging" },
  } as const
  const quad = {
    tl: { x: box.x, y: box.y, w: c.x - box.x, h: c.y - box.y },
    tr: { x: c.x, y: box.y, w: right - c.x, h: c.y - box.y },
    bl: { x: box.x, y: c.y, w: c.x - box.x, h: bottom - c.y },
    br: { x: c.x, y: c.y, w: right - c.x, h: bottom - c.y },
  } satisfies Record<Quadrant, Box>
  // Focus outlines keep clear of the labels, and stay one aligned set: both top quadrants give up
  // the strip the left/right labels need, both give up the strip above the horizontal axis that
  // the top label needs, and both bottom quadrants the strip below it for the bottom label.
  const has = (side: EjesSide) => !labels || Boolean(labels[side])
  const hStrip = (side: EjesSide) =>
    has(side) ? Math.max(focusInset, GAP + size + 6) : focusInset
  const vStrip = (side: EjesSide) =>
    has(side) ? Math.max(focusInset, PAD + size + 6) : focusInset
  const topStrip = Math.max(vStrip("left"), vStrip("right"))
  // All four outlines are one size: as tall as the shorter row allows and as wide as the narrower
  // column, each hugging the axes' crossing, so the set is symmetric about both axes.
  const rowH = Math.max(
    0,
    Math.min(
      c.y - box.y - topStrip - hStrip("top"),
      bottom - c.y - hStrip("bottom") - focusInset
    )
  )
  const colW = Math.max(
    0,
    Math.min(c.x - box.x, right - c.x) - 2 * focusInset
  )
  const focusBox = (q: Quadrant): Box => ({
    x: q === "tl" || q === "bl" ? c.x - focusInset - colW : c.x + focusInset,
    y: q === "tl" || q === "tr" ? c.y - hStrip("top") - rowH : c.y + hStrip("bottom"),
    w: colW,
    h: rowH,
  })
  return {
    box,
    center: c,
    horizontal: { ...horizontal, y: c.y },
    vertical: { ...vertical, x: c.x },
    type: { size, quiet: q },
    labels: Object.fromEntries(
      (Object.keys(anchors) as EjesSide[]).map((side) => [
        side,
        { ...anchors[side], opacity: opacity(side) },
      ])
    ) as Record<EjesSide, (typeof anchors)[EjesSide] & { opacity: number }>,
    /** Each quadrant's full box between the axes and the edges. */
    quadrants: quad,
    /** The crossing's valid range, [min, max] per axis; center is clamped into it. */
    range,
    /** The rounded focus outline box for each quadrant (w and h 0 when too small to draw). */
    focus: Object.fromEntries(
      quadrants.map((k) => {
        const b = focusBox(k)
        return [k, b.w < FOCUS_MIN || b.h < FOCUS_MIN ? { ...b, w: 0, h: 0 } : b]
      })
    ) as Record<Quadrant, Box>,
  }
}

/** Two ink axes that split an area into four named quadrants, with an optional focus. */
export function Ejes({
  labels,
  focus,
  focusTone = "ink",
  focusProgress = 1,
  weight = 2,
  quiet = false,
  origin = "center",
  focusInset = 16,
  ...props
}: EjesProps) {
  const l = ejesLayout({ ...props, labels, quiet, origin, focusInset })
  const focused = (
    focus === undefined ? [] : typeof focus === "string" ? [focus] : focus
  ).filter((f, i, all) => quadrants.includes(f) && all.indexOf(f) === i)
  const fp = unit(focusProgress)
  // One stamp: accent marks only the first focused quadrant; any others keep the ink outline.
  const tone = (i: number) => (focusTone === "accent" && i === 0 ? color.accent : color.ink)
  // Geist is variable: the weight eases from 650 to 500 with the size, no mid-way jump.
  const weightText = Math.round(650 - 150 * l.type.quiet)
  return (
    <g
      role="img"
      aria-label={`Axes: ${labels.top} above, ${labels.bottom} below, ${labels.left} left, ${labels.right} right${focused.length ? `; focus ${focused.join(", ")}` : ""}`}
    >
      {fp > 0 &&
        focused.map((f, i) => {
          const b = l.focus[f]
          if (!(b.w > 0 && b.h > 0)) return null
          return focusTone === "fill" ? (
            <rect
              key={f}
              data-quadrant={f}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={12}
              fill={color.ink}
              fillOpacity={0.07 * fp}
            />
          ) : (
            <rect
              key={f}
              data-quadrant={f}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={12}
              fill="none"
              stroke={tone(i)}
              strokeWidth={weight}
              pathLength={1}
              strokeDasharray={fp < 1 ? `${fp} 1` : undefined}
            />
          )
        })}
      <g stroke={color.ink} strokeWidth={weight} strokeLinecap="butt">
        {l.horizontal.x2 > l.horizontal.x1 && (
          <line
            x1={l.horizontal.x1}
            x2={l.horizontal.x2}
            y1={l.horizontal.y}
            y2={l.horizontal.y}
          />
        )}
        {l.vertical.y2 > l.vertical.y1 && (
          <line
            x1={l.vertical.x}
            x2={l.vertical.x}
            y1={l.vertical.y1}
            y2={l.vertical.y2}
          />
        )}
      </g>
      <g
        fontFamily={font.sans}
        fontSize={l.type.size}
        fontWeight={weightText}
        fill={color.ink}
        aria-hidden="true"
      >
        {(Object.keys(l.labels) as EjesSide[]).map((side) => {
          const t = l.labels[side]
          return t.opacity > 0 && labels[side] ? (
            <text
              key={side}
              x={t.x}
              y={t.y}
              textAnchor={t.anchor}
              dominantBaseline={t.baseline}
              opacity={t.opacity}
            >
              {labels[side]}
            </text>
          ) : null
        })}
      </g>
    </g>
  )
}
