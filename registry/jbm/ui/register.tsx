import { useId, type CSSProperties, type ReactNode } from "react"
import { Paper, frayReach, paperFill, type PaperTone } from "./paper"
import { color, font, outlineIn } from "../lib/tokens"
import { unit, type Box, type Pt } from "../lib/geometry"

/**
 * Drawn writing registers: what kind of reader a page is for, shown by the shape of its writing and
 * never by legible prose. `mono` is a prompt and a result box per step, `plain` short numbered
 * lists, `grid` ruled tables, `prose` a justified block with source ticks, and `mixed` stacks
 * several registers on one sheet. Geometry is a pure function of the props (registerLayout), so
 * threads, tears, and slips can attach to the same points the sheet draws. Pure React.
 */
export type RegisterKind = "mono" | "plain" | "grid" | "prose" | "mixed"
export type RegisterBand = {
  kind: Exclude<RegisterKind, "mixed">
  /** Steps, list groups, tables, or (prose) source ticks in this band. */
  n?: number
  /** Share of the page's writing height; defaults to the height its writing naturally runs. */
  weight?: number
}
export type RegisterSpec = {
  kind: RegisterKind
  /** Steps (mono), list groups (plain), tables (grid), source ticks (prose), or bands (mixed, 1–4). */
  n?: number
  /** Sheet width in stage px. */
  w: number
  /** Sheet height in stage px. */
  h: number
  /** Prose only: source ticks; overrides n. In mixed, the prose band's ticks. */
  sources?: number
  /** Mixed only: the stacked registers, top to bottom. */
  bands?: readonly RegisterBand[]
  /** Row index where a gap opens (bands for mixed). Rows from here down move to make room. */
  gapAt?: number
  /** Gap height in px when fully open; defaults to a quarter of the writing height. */
  gap?: number
  /** How open the gap is, 0–1: 1 on a source before its slip lifts, 0 after it closes. */
  reflow?: number
  /** Mark scale; defaults to w / 360, so a 360 px sheet draws 6 px prompt bars. */
  scale?: number
  /** Inset from the sheet edge to the writing, in px (default 20 × scale). */
  pad?: number
}
export type RegisterTone = "ink" | "dim" | "accent"
export type RegisterMark =
  /** Filled bar; r is the corner radius (default: fully rounded ends). */
  | { type: "bar"; x: number; y: number; w: number; h: number; tone: RegisterTone; r?: number }
  | { type: "box"; x: number; y: number; w: number; h: number; r: number; stroke: number }
  | { type: "rule"; x1: number; y1: number; x2: number; y2: number; stroke: number }
  | { type: "chevron"; x: number; y: number; size: number; stroke: number }
  | { type: "num"; x: number; y: number; size: number; text: string }
export type RegisterCell = {
  /** Reading order across the whole sheet; reveal and accent use it. */
  index: number
  band: number
  row: number
  kind: Exclude<RegisterKind, "mixed"> | "source"
  /** Everything the cell draws sits inside this box. */
  box: Box
  /** Right end of the cell's lead mark (prompt, heading, header, line): where a thread can start. */
  lead: Pt
  /** Source ticks only: the tick's centre. */
  anchor?: Pt
  marks: RegisterMark[]
}
export type RegisterLayout = {
  w: number
  h: number
  scale: number
  cells: RegisterCell[]
  /** Slot of every row (bands for mixed), in stacking order. */
  rows: Box[]
  /** Each band's writing box (one band unless mixed). */
  bands: Box[]
  /** Mixed only: y of each seam between bands, top to bottom. */
  seams: number[]
  /** Prose source tick centres, top to bottom. */
  anchors: Pt[]
  /** Where the gap is (height = gap × reflow), or null without gapAt. */
  gap: Box | null
}

const defaults = { mono: 7, plain: 10, grid: 7, prose: 8 } as const
const mixedBands: readonly RegisterBand[] = [
  { kind: "mono", n: 3 },
  { kind: "plain", n: 4 },
  { kind: "grid", n: 2 },
  { kind: "prose", n: 3 },
]
/** Natural row pitch in scale units: rows never grow past it. */
const rowMax = { mono: 56, plain: 72, grid: 96 } as const
/**
 * A band's default share of a mixed page, from how tall its writing naturally runs (one mono step =
 * 1): rows weigh their natural pitch, so on a page long enough every band gets its full row pitch
 * and no list or table is squeezed beside roomier steps.
 */
const natural = (kind: Exclude<RegisterKind, "mixed">, n: number) =>
  kind === "mono"
    ? n
    : kind === "plain"
      ? (Math.ceil(n / 2) * rowMax.plain) / rowMax.mono
      : kind === "grid"
        ? (Math.ceil(n / Math.min(3, Math.max(1, Math.ceil(n / 4)))) * rowMax.grid) / rowMax.mono
        : 2.6 + n * 0.3
const endWidths = [0.45, 0.62, 0.38, 0.54]
/**
 * Source tick pitch in scale units: roomy enough that a ring drawn around each tick (a thread's
 * anchor) clears the next one.
 */
const SOURCE_PITCH = 14
/** Extra separator height on a mixed page, so Paper's starting notch at a seam clears the writing. */
const NOTCH_ROOM = 8
const count = (n: number | undefined, fallback: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(Number.isFinite(n) ? (n as number) : fallback)))

type Slot = { y: number; h: number; size: number }
/**
 * Stacks weighted slots from `top` within `height`; a gap before `gapAt` compresses the pitch, never
 * the marks. The pitch never exceeds `maxK` px per weight unit: a few rows keep their natural size and
 * leave the rest of the sheet blank instead of ballooning.
 */
function stack(weights: number[], top: number, height: number, gapAt: number | undefined, gapPx: number, reflow: number, maxK = Infinity) {
  const total = weights.reduce((a, b) => a + b, 0) || 1
  const open = gapAt === undefined ? 0 : gapPx * reflow
  const k = Math.min(maxK, (height - open) / total)
  const kSize = Math.min(maxK, (height - (gapAt === undefined ? 0 : gapPx)) / total)
  let cum = 0
  const slots: Slot[] = weights.map((wt, i) => {
    const y = top + cum * k + (gapAt !== undefined && i >= gapAt ? open : 0)
    cum += wt
    return { y, h: wt * k, size: wt * kSize }
  })
  let before = 0
  for (let i = 0; i < Math.min(gapAt ?? 0, weights.length); i++) before += weights[i]
  const gap = gapAt === undefined ? null : { y: top + before * k, h: open }
  return { slots, gap }
}

type Draft = Omit<RegisterCell, "index" | "band">
/** One band of a single kind, laid out in `box`; rows stack with the optional gap. */
function band(kind: Exclude<RegisterKind, "mixed">, n: number, box: Box, u: number, gapAt?: number, gapPx = 0, reflow = 0, mixed = false) {
  const cells: Draft[] = []
  const x = box.x,
    w = box.w
  if (kind === "prose") {
    const src = n
    const srcH = src * SOURCE_PITCH * u
    const spacer = src > 0 ? 10 * u : 0
    const lines = Math.max(2, Math.floor((box.h - (gapAt === undefined ? 0 : gapPx) - srcH - spacer) / (12 * u)))
    const weights = [
      ...Array(lines).fill(12),
      ...(src > 0 ? [10] : []),
      ...Array(src).fill(SOURCE_PITCH),
    ]
    const { slots, gap } = stack(weights, box.y, box.h, gapAt, gapPx, reflow, 1.25 * u)
    let paragraph = 0
    for (let i = 0; i < lines; i++) {
      const s = slots[i]
      const bh = Math.min(5 * u, s.size * 0.45)
      const y = s.y + (s.h - bh) / 2
      // Paragraphs end every fifth line and on the last, but never twice in a row (the line before
      // the last) and never on the first line after a gap, where a short line reads as a heading.
      const end =
        i === lines - 1 || (i % 5 === 4 && i !== lines - 2 && i !== gapAt)
      const bw = end ? w * endWidths[paragraph++ % endWidths.length] : w
      cells.push({
        row: i,
        kind: "prose",
        box: { x, y, w: bw, h: bh },
        lead: { x: x + bw, y: y + bh / 2 },
        marks: [{ type: "bar", x, y, w: bw, h: bh, tone: "ink" }],
      })
    }
    for (let j = 0; j < src; j++) {
      const s = slots[lines + 1 + j]
      const th = Math.min(4 * u, s.size * 0.5)
      const y = s.y + (s.h - th) / 2
      const tw = Math.min(7 * u, w * 0.05)
      const bw = w * 0.5
      cells.push({
        row: lines + 1 + j,
        kind: "source",
        box: { x, y, w: tw + 5 * u + bw, h: th },
        lead: { x: x + tw + 5 * u + bw, y: y + th / 2 },
        anchor: { x: x + tw / 2, y: y + th / 2 },
        marks: [
          { type: "bar", x, y, w: tw, h: th, tone: "ink", r: 0 },
          { type: "bar", x: x + tw + 5 * u, y, w: bw, h: th, tone: "dim" },
        ],
      })
    }
    return { cells, rows: slots.map((s) => ({ x, y: s.y, w, h: s.h })), gap }
  }
  if (n <= 0) return { cells, rows: [] as Box[], gap: gapAt === undefined ? null : { y: box.y, h: gapPx * reflow } }
  const cols = kind === "mono" ? 1 : kind === "plain" ? 2 : Math.min(3, Math.ceil(n / 4))
  const rowCount = Math.ceil(n / cols)
  const gutter = 16 * u
  const cw = (w - gutter * (cols - 1)) / cols
  const { slots, gap } = stack(Array(rowCount).fill(1), box.y, box.h, gapAt, gapPx, reflow, rowMax[kind] * u)
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols)
    const s = slots[r]
    const cx = x + (i % cols) * (cw + gutter)
    const ch = s.size
    const cy = s.y + (s.h - ch) / 2
    if (kind === "mono") {
      const indent = 14 * u
      const bh = Math.max(1, Math.min(6 * u, ch * 0.13))
      const by = cy + ch * 0.14
      const bw = (cw - indent) * 0.55
      const rh = ch * 0.4
      const stroke = Math.min(1.5 * u, rh / 4)
      const cv = Math.min(3 * u, ch * 0.12)
      cells.push({
        row: r,
        kind,
        box: { x: cx, y: cy, w: cw * 0.72 + indent * 0.28 + stroke, h: ch * 0.82 },
        lead: { x: cx + indent + bw, y: by + bh / 2 },
        marks: [
          { type: "chevron", x: cx + stroke, y: by + bh / 2, size: cv, stroke },
          { type: "bar", x: cx + indent, y: by, w: bw, h: bh, tone: "ink" },
          { type: "box", x: cx + indent, y: cy + ch * 0.4, w: (cw - indent) * 0.72, h: rh, r: Math.min(3 * u, rh / 2), stroke },
        ],
      })
    } else if (kind === "plain") {
      const bh = Math.max(1, Math.min(6 * u, ch * 0.11))
      // Numerals set at 12 × scale (15 px on the board's 460 px page), so they read as numbers.
      const fs = Math.min(12 * u, ch * 0.18)
      const ih = Math.max(0.75, Math.min(3 * u, ch * 0.07))
      const marks: RegisterMark[] = [
        { type: "bar", x: cx, y: cy + ch * 0.06, w: cw * 0.8, h: bh, tone: "ink" },
      ]
      // On a mixed page (a long sheet shown small) or below 8 px a numeral is a speck, not a
      // number: the list marks its items with small ink squares instead, like the prose bullets.
      const numerals = !mixed && fs >= 8
      const dot = Math.max(2, Math.min(fs * 0.7, ih * 2))
      for (let j = 0; j < 3; j++) {
        const my = cy + ch * (0.36 + 0.2 * j)
        marks.push(
          numerals
            ? { type: "num", x: cx, y: my + fs * 0.36, size: fs, text: `${j + 1}.` }
            : { type: "bar", x: cx, y: my - dot / 2, w: dot, h: dot, tone: "ink", r: 0 },
          {
            type: "bar",
            x: cx + (numerals ? fs * 1.35 : dot * 2.2),
            y: my - ih / 2,
            w: cw * 0.5,
            h: ih,
            tone: "dim",
          }
        )
      }
      cells.push({
        row: r,
        kind,
        box: { x: cx, y: cy, w: cw * 0.8, h: ch * 0.78 + ih },
        lead: { x: cx + cw * 0.8, y: cy + ch * 0.06 + bh / 2 },
        marks,
      })
    } else {
      const th = ch * 0.86
      const stroke = Math.min(1.5 * u, th / 12)
      const head = th * 0.22
      const marks: RegisterMark[] = [
        { type: "bar", x: cx, y: cy, w: cw, h: head, tone: "ink", r: 0 },
      ]
      for (let k = 1; k < 4; k++) {
        const ry = cy + head + ((th - head) * k) / 4
        marks.push({ type: "rule", x1: cx, y1: ry, x2: cx + cw, y2: ry, stroke: stroke * 0.66 })
      }
      marks.push(
        { type: "rule", x1: cx + cw * 0.4, y1: cy + head, x2: cx + cw * 0.4, y2: cy + th, stroke: stroke * 0.66 },
        { type: "box", x: cx, y: cy, w: cw, h: th, r: 0, stroke }
      )
      cells.push({
        row: r,
        kind,
        box: { x: cx, y: cy, w: cw, h: th },
        lead: { x: cx + cw, y: cy + head / 2 },
        marks,
      })
    }
  }
  return { cells, rows: slots.map((s) => ({ x, y: s.y, w, h: s.h })), gap }
}

/** Every cell, row, seam, anchor, and the gap for a register, in sheet px (origin at the sheet's outer corner). */
export function registerLayout(spec: RegisterSpec): RegisterLayout {
  const w = Math.max(1, spec.w),
    h = Math.max(1, spec.h)
  const u = spec.scale ?? Math.max(0.4, Math.min(4, w / 360))
  const pad = spec.pad ?? 20 * u
  const inner: Box = { x: pad, y: pad, w: Math.max(1, w - 2 * pad), h: Math.max(1, h - 2 * pad) }
  const gapPx = Math.max(0, Math.min(inner.h * 0.6, spec.gap ?? inner.h * 0.25))
  const reflow = unit(spec.reflow ?? 1)
  const kind = spec.kind
  const out: RegisterLayout = { w, h, scale: u, cells: [], rows: [], bands: [], seams: [], anchors: [], gap: null }
  const push = (drafts: Draft[], b: number) => {
    for (const d of drafts) out.cells.push({ ...d, index: out.cells.length, band: b })
  }
  if (kind !== "mixed") {
    const n =
      kind === "prose"
        ? count(spec.sources ?? spec.n, defaults.prose, 0, 16)
        : count(spec.n, defaults[kind], 0, kind === "grid" ? 12 : 24)
    const gapAt = spec.gapAt === undefined ? undefined : Math.max(0, Math.round(spec.gapAt))
    const l = band(kind, n, inner, u, gapAt, gapPx, reflow)
    push(l.cells, 0)
    out.rows = l.rows
    out.bands = [inner]
    if (l.gap) out.gap = { x: inner.x, y: l.gap.y, w: inner.w, h: l.gap.h }
  } else {
    const list = (spec.bands ?? mixedBands.slice(0, count(spec.n, 4, 0, 4))).slice(0, 8)
    const counts = list.map((b) =>
      b.kind === "prose"
        ? count(spec.sources ?? b.n, 3, 0, 16)
        : count(b.n, mixedBands.find((m) => m.kind === b.kind)?.n ?? 3, 1, 24)
    )
    const weights: number[] = []
    list.forEach((b, i) => {
      if (i) weights.push(0.14)
      weights.push(Math.max(0.1, b.weight ?? natural(b.kind, counts[i])))
    })
    const bandGap = spec.gapAt === undefined ? undefined : Math.max(0, Math.min(list.length, Math.round(spec.gapAt)))
    const gapAt = bandGap === undefined ? undefined : bandGap * 2
    const { slots } = stack(weights, inner.y, inner.h, gapAt, gapPx, reflow)
    // First pass: each band in its weighted slot. Row pitches are capped, so a band may use less
    // than its slot; measure what it uses.
    const first = list.map((b, i) => {
      const s = slots[i * 2]
      const box = { x: inner.x, y: s.y + (s.h - s.size) / 2, w: inner.w, h: s.size }
      const l = band(b.kind, counts[i], box, u, undefined, 0, 0, true)
      const bottom = Math.max(box.y, ...l.rows.map((r) => r.y + r.h))
      return { box, used: Math.min(box.h, bottom - box.y) }
    })
    // Second pass: stack the bands at the heights they use, with even separators wide enough that
    // a Tear's fray at a seam, or Paper's starting notch, stays clear of the writing on both sides
    // (NOTCH_ROOM); leftover height collects at
    // the foot of the page. When the bands need more than the page, they share what is left.
    const sep = Math.max(2 * (frayReach() + 2) + NOTCH_ROOM, slots.length > 1 ? slots[1].h : 0)
    const open = bandGap === undefined ? 0 : gapPx * reflow
    const used = first.reduce((a, f) => a + f.used, 0)
    // Sized for the fully open gap, so reflowing moves the writing and never resizes a mark.
    const room = Math.max(1, inner.h - sep * (list.length - 1) - (bandGap === undefined ? 0 : gapPx))
    const fit = used > room ? room / used : 1
    let y = inner.y
    let prevBottom = inner.y
    let gapBox: { y: number; h: number } | null = null
    list.forEach((b, i) => {
      if (bandGap === i) {
        gapBox = { y, h: open }
        y += open
      }
      const box = { x: inner.x, y, w: inner.w, h: first[i].used * fit }
      push(band(b.kind, counts[i], box, u, undefined, 0, 0, true).cells, i)
      out.bands.push(box)
      out.rows.push({ ...box })
      if (i) out.seams.push(prevBottom + sep / 2)
      prevBottom = box.y + box.h
      y = prevBottom + sep
    })
    if (bandGap === list.length) gapBox = { y: prevBottom, h: open }
    const gapOut = gapBox as { y: number; h: number } | null
    if (gapOut) out.gap = { x: inner.x, y: gapOut.y, w: inner.w, h: gapOut.h }
  }
  out.anchors = out.cells.flatMap((c) => (c.anchor ? [c.anchor] : []))
  return out
}

/** Prose source tick centres, in sheet px: where threads leave the sheet. */
export const registerAnchors = (spec: RegisterSpec): Pt[] => registerLayout(spec).anchors
/** Mixed only: y of each seam between bands, in sheet px (tear lines). Empty for other kinds. */
export const registerSeams = (spec: RegisterSpec): number[] => registerLayout(spec).seams
/** The open gap's box in sheet px (where a slip lands or lifted from), or null without gapAt. */
export const registerGap = (spec: RegisterSpec): Box | null => registerLayout(spec).gap

/** Writing colours on a stock: ink, dim, and the vermilion accent, plus the stock's own fill. */
type Inks = { ink: string; dim: string; accent: string; stock: string }
const inksFor = (stock: PaperTone): Inks =>
  stock === "paper"
    ? { ink: color.ink, dim: color.dim, accent: color.accent, stock: paperFill(stock) }
    : // On ink or vermilion stock the writing is card-coloured, its muted marks cream at 62%.
      { ink: color.card, dim: color.dimOnDark, accent: stock === "ink" ? color.accent : color.ink, stock: paperFill(stock) }

function Mark({ m, accent, inks }: { m: RegisterMark; accent: boolean; inks: Inks }) {
  switch (m.type) {
    case "bar":
      return <rect x={m.x} y={m.y} width={Math.max(0, m.w)} height={m.h} rx={m.r ?? m.h / 2} fill={inks[accent && m.tone === "ink" ? "accent" : m.tone]} />
    case "box":
      return (
        <rect
          x={m.x + m.stroke / 2}
          y={m.y + m.stroke / 2}
          width={Math.max(0, m.w - m.stroke)}
          height={Math.max(0, m.h - m.stroke)}
          rx={m.r}
          fill="none"
          stroke={inks.ink}
          strokeWidth={m.stroke}
        />
      )
    case "rule":
      return <line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={inks.ink} strokeWidth={m.stroke} />
    case "chevron":
      return (
        <path
          d={`M${m.x} ${m.y - m.size}L${m.x + m.size * 1.4} ${m.y}L${m.x} ${m.y + m.size}`}
          fill="none"
          stroke={inks.ink}
          strokeWidth={m.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case "num":
      return (
        <text x={m.x} y={m.y} fontFamily={font.mono} fontSize={m.size} fontWeight={700} fill={inks.ink}>
          {m.text}
        </text>
      )
  }
}

export type RegisterInkProps = RegisterSpec & {
  /** Writing drawn so far, 0–1, cell by cell in reading order; each cell inks left to right. */
  reveal?: number
  /** The stock the writing sits on (Paper's tone): ink writing on paper, card-coloured on ink or vermilion. Result boxes and tables are filled with the stock. */
  tone?: PaperTone
  /** Cell indices (reading order) whose lead mark is vermilion. */
  accent?: readonly number[]
}
/** The writing alone, as an SVG <g> in sheet px. Render inside an <svg>; the sheet is the caller's. */
export function RegisterInk({ reveal = 1, accent = [], tone = "paper", ...spec }: RegisterInkProps) {
  const clip = `jbm-register-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const layout = registerLayout(spec)
  const inks = inksFor(tone)
  const total = layout.cells.length
  const shown = unit(reveal) * total
  return (
    <g aria-hidden>
      {layout.cells.map((cell) => {
        const f = Math.max(0, Math.min(1, shown - cell.index))
        if (f <= 0) return null
        const hot = accent.includes(cell.index)
        // Boxes (result boxes, tables) are filled with the stock first, so what lies under the
        // writing, such as Paper's creases, never shows inside them.
        const marks = [
          ...cell.marks.flatMap((m, i) =>
            m.type === "box" ? [<rect key={`f${i}`} x={m.x} y={m.y} width={Math.max(0, m.w)} height={Math.max(0, m.h)} rx={m.r} fill={inks.stock} />] : []
          ),
          ...cell.marks.map((m, i) => <Mark key={i} m={m} inks={inks} accent={hot && i === (cell.kind === "mono" ? 1 : 0)} />),
        ]
        if (f >= 1) return <g key={cell.index}>{marks}</g>
        const pad = layout.scale * 2
        return (
          <g key={cell.index}>
            <clipPath id={clip}>
              <rect x={cell.box.x - pad} y={cell.box.y - pad} width={(cell.box.w + pad * 2) * f} height={cell.box.h + pad * 2} />
            </clipPath>
            <g clipPath={`url(#${clip})`}>{marks}</g>
          </g>
        )
      })}
    </g>
  )
}

export type RegisterProps = RegisterInkProps & {
  /** Sheet rotation in degrees. */
  rotate?: number
  /** Accessible name; defaults to the register kind. */
  label?: string
  /** Laid over the sheet in sheet px (slips, tabs, pins). */
  children?: ReactNode
  style?: CSSProperties
}
/** Paper's edge: the shared outline. */
const EDGE = outlineIn()
/** A Paper sheet carrying one register of drawn writing. Anchors and gaps are in the sheet's px. */
export function Register({ rotate = 0, label, children, style, ...ink }: RegisterProps) {
  const u = ink.scale ?? Math.max(0.4, Math.min(4, ink.w / 360))
  return (
    <Paper w={ink.w} h={ink.h} tone={ink.tone} radius={Math.max(4, 6 * u)} rotate={rotate} style={{ flexShrink: 0, ...style }}>
      <svg
        width={ink.w}
        height={ink.h}
        viewBox={`0 0 ${ink.w} ${ink.h}`}
        role="img"
        aria-label={label ?? `Page of ${ink.kind} writing`}
        style={{ position: "absolute", left: -EDGE, top: -EDGE, overflow: "visible", display: "block" }}
      >
        <RegisterInk {...ink} />
      </svg>
      {children && <div style={{ position: "absolute", left: -EDGE, top: -EDGE, width: ink.w, height: ink.h }}>{children}</div>}
    </Paper>
  )
}
