import type { CSSProperties } from "react"
import { color, font, stroke } from "../lib/tokens"
import { unit, type Box, type Pt } from "../lib/geometry"
import { Paper } from "./paper"
import { PunchedTag } from "./punched-tag"

export type VideoPrintProps = {
  /** Playhead 0–1: how far the ink scrub rule has advanced along the print. */
  scrub: number
  /** Positions 0–1 along the scrub rule. Each leaves an ink tick once the rule passes it and exposes an anchor point (see videoPrintLayout). */
  marks?: readonly number[]
  /** The video's title, set in bold type under the rule (one line, ellipsis when long). */
  title: string
  /** The line under the title, usually source and date ("Video · 4 nov 2025"). */
  date: string
  /** A URL set in mono on a punched tag hanging from the bottom edge (one line, ellipsis past the print's width). Its presence means "this page was opened". */
  link?: string
  /** 0–1: the tag fades in and settles into place from just below its resting spot. Only used with `link`. */
  opened?: number
  /** Width in stage pixels; every measurement scales with it (the height is 0.765 × w). */
  w?: number
  /** Draw the Paper sheet. false renders only the print's contents, for nesting on a Paper you already have. */
  sheet?: boolean
  /** Inline styles for the outer box (position it with left/top or a transform). */
  style?: CSSProperties
}

const BASE = 480

/** `over` laid on `under` at `alpha`, as an opaque hex colour. */
function mix(under: string, over: string, alpha: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16)
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(channel(under, i) * (1 - alpha) + channel(over, i) * alpha)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`
}
/** The still's pale tint: 8% ink on card stock, opaque, so it reads the same with or without the sheet under it. */
const stillTint = mix(color.card, color.ink, 0.08)

/**
 * Where everything on the print sits, in pixels from the print's top-left corner (or from `at`,
 * the print's position on your stage). Use `marks` as Hilo anchors: each is the tick's point on the
 * scrub rule's centreline.
 */
export function videoPrintLayout(
  { w = BASE, marks = [], link }: Pick<VideoPrintProps, "w" | "marks" | "link">,
  at: Pt = { x: 0, y: 0 }
) {
  const s = (Number.isFinite(w) && w > 0 ? w : BASE) / BASE
  const pad = 22 * s
  const frame: Box = {
    x: at.x + pad,
    y: at.y + pad,
    w: BASE * s - 2 * pad,
    h: ((BASE * s - 2 * pad) * 9) / 16,
  }
  const ruleY = frame.y + frame.h + 12 * s
  const titleY = ruleY + 18 * s
  const dateY = titleY + 30 * s
  const h = dateY - at.y + 18 * s + pad
  const tagX = at.x + 2 * pad
  // The link tag straddles the bottom edge: half its height (a 14 × s line and 6 × s padding
  // above and below, inside the Paper edge on each side) hangs below the sheet.
  // Plus the 8 × s it settles up from while `opened` is below 1.
  const edge = stroke.outline
  const ring = Math.min(edge, Math.max(1, edge * s))
  const tagHang = link ? (14 * 1.3 * s + 12 * s + 2 * edge) / 2 + 8 * s : 0
  return {
    scale: s,
    w: BASE * s,
    h,
    pad,
    frame,
    rule: { x: frame.x, y: ruleY, w: frame.w },
    titleY,
    dateY,
    marks: marks.map((m) => ({ x: frame.x + unit(m) * frame.w, y: ruleY })),
    /** The punched hole of the link tag: where a thread would tie on. Null without a link. */
    // Sheet edge + left padding + the hole's radius and ring (PunchedTag's rule at scale s).
    tag: link ? { x: tagX + edge + 10 * s + 7 * s + ring, y: at.y + h } : null,
    tagX,
    /** The link tag's widest extent, from tagX: it ends a padding short of the sheet's right edge. */
    tagMaxW: BASE * s - 3 * pad,
    /** The box everything draws in, from `at`: the sheet plus, with a link, the tag hanging below it. */
    bounds: { w: BASE * s, h: h + tagHang },
  }
}

/**
 * A printed still of a video on a Paper sheet: a pale 16:9 frame sketched in ink line (head and
 * shoulders, not a solid block), an ink scrub rule that advances with `scrub` and leaves ticks at
 * `marks`, the title and date in type, and optionally a punched tag with the URL, meaning "this
 * page was opened". Pure React; controlled and deterministic.
 */
export function VideoPrint({
  scrub,
  marks = [],
  title,
  date,
  link,
  opened = 1,
  w = BASE,
  sheet = true,
  style,
}: VideoPrintProps) {
  const l = videoPrintLayout({ w, marks, link })
  const s = l.scale
  const p = unit(scrub)
  const { frame } = l
  const cx = frame.x + frame.w / 2
  const bottom = frame.y + frame.h
  const headR = frame.h * 0.14
  const headY = frame.y + frame.h * 0.42
  const shoulderA = frame.w * 0.18
  const shoulderB = frame.h * 0.21
  const tagIn = unit(opened)
  const r2 = (v: number) => Math.round(v * 100) / 100
  const text: CSSProperties = {
    position: "absolute",
    left: frame.x,
    width: frame.w,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    margin: 0,
  }
  return (
    <div
      style={{ position: "relative", width: l.w, height: l.h, flexShrink: 0, ...style }}
      data-video-print=""
    >
      {sheet && (
        <Paper radius={10 * s} style={{ position: "absolute", inset: 0 }} />
      )}
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${r2(l.w)} ${r2(l.h)}`}
        width={l.w}
        height={l.h}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <rect
          x={r2(frame.x)}
          y={r2(frame.y)}
          width={r2(frame.w)}
          height={r2(frame.h)}
          rx={2 * s}
          fill={stillTint}
          stroke="none"
        />
        <g
          fill="none"
          stroke={color.ink}
          strokeWidth={1.5 * s}
          strokeLinecap="round"
        >
          <circle cx={r2(cx)} cy={r2(headY)} r={r2(headR)} />
          <path
            d={`M${r2(cx - shoulderA)} ${r2(bottom)}A${r2(shoulderA)} ${r2(shoulderB)} 0 0 1 ${r2(cx + shoulderA)} ${r2(bottom)}`}
          />
        </g>
        <rect
          x={r2(frame.x)}
          y={r2(frame.y)}
          width={r2(frame.w)}
          height={r2(frame.h)}
          rx={2 * s}
          fill="none"
          stroke={color.ink}
          strokeWidth={stroke.outline}
        />
        <rect
          x={r2(l.rule.x)}
          y={r2(l.rule.y - 2 * s)}
          width={r2(l.rule.w)}
          height={r2(4 * s)}
          fill={color.line}
        />
        {p > 0 && (
          <rect
            data-scrub=""
            x={r2(l.rule.x)}
            y={r2(l.rule.y - 2 * s)}
            width={r2(l.rule.w * p)}
            height={r2(4 * s)}
            fill={color.ink}
          />
        )}
        {l.marks.map((m, i) =>
          unit(marks[i]) <= p && p > 0 ? (
            <path
              key={i}
              data-mark={i}
              d={`M${r2(m.x)} ${r2(m.y - 6 * s)}V${r2(m.y + 8 * s)}`}
              stroke={color.ink}
              strokeWidth={2 * s}
              strokeLinecap="round"
            />
          ) : null
        )}
      </svg>
      <p
        style={{
          ...text,
          top: l.titleY,
          fontFamily: font.sans,
          fontWeight: 700,
          fontSize: 22 * s,
          lineHeight: 1.2,
          letterSpacing: -0.3 * s,
          color: color.ink,
        }}
      >
        {title}
      </p>
      <p
        style={{
          ...text,
          top: l.dateY,
          fontFamily: font.sans,
          fontWeight: 400,
          fontSize: 14 * s,
          lineHeight: 1.3,
          color: color.dim,
        }}
      >
        {date}
      </p>
      {link && tagIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: l.tagX,
            top: l.h,
            // It settles into place from just below and never rises past its resting spot, so its
            // top edge never crosses the date line above it while it fades in.
            opacity: Math.min(1, tagIn / 0.5),
            transform: `translateY(calc(-50% + ${r2((1 - tagIn) * 8 * s)}px))`,
          }}
        >
          <PunchedTag
            scale={s}
            style={{
              gap: 10 * s,
              padding: `${6 * s}px ${14 * s}px ${6 * s}px ${10 * s}px`,
              maxWidth: r2(l.tagMaxW),
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: font.mono,
                fontWeight: 500,
                fontSize: 14 * s,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {link}
            </span>
          </PunchedTag>
        </div>
      )}
    </div>
  )
}
