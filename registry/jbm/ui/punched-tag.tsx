import type { CSSProperties, ReactNode } from "react"
import { color, font, stroke } from "../lib/tokens"
import { paperFill, paperInk, paperShadow, type PaperTone } from "./paper"

const r2 = (n: number) => Math.round(n * 100) / 100
/** The fill's cut inside an edge `t` thick around a 45° cut `c` deep, so the edge keeps its width along the cut. */
const innerCut = (c: number, t: number) => Math.max(0, c - t * (2 - Math.SQRT2))
/** The tag's outline: the two corners at the hole end cut off at 45°, `c` deep. */
const tagClip = (c: number) =>
  `polygon(${r2(c)}px 0, 100% 0, 100% 100%, ${r2(c)}px 100%, 0 calc(100% - ${r2(c)}px), 0 ${r2(c)}px)`

/**
 * A card-stock luggage tag: the two corners at the hole end cut off, a punched hole, and one line
 * of bold content that ends in an ellipsis past `maxWidth`. It carries no string: Hilo is the one
 * connector, tied at the hole. Pure React.
 */
export function PunchedTag({
  children,
  tone = "paper",
  scale = 1,
  cut = 14,
  maxWidth = "100%",
  labelStyle,
  style,
}: {
  children: ReactNode
  tone?: PaperTone
  /** Size multiplier for the tag's own geometry: hole, ring, corner cuts, radii, gap, padding, and type. Default 1. */
  scale?: number
  /** Depth of the hole end's 45° corner cuts in px before `scale` (default 14); keep it under half the tag's height. */
  cut?: number
  /** Widest the tag gets, as px or a CSS length (default 100%): longer content stays on one line and ends in an ellipsis. */
  maxWidth?: number | string
  /** Styles merged onto the one-line label (type family, size, weight, line height). */
  labelStyle?: CSSProperties
  /** Styles merged onto the tag's box, e.g. padding or gap. */
  style?: CSSProperties
}) {
  const k = Number.isFinite(scale) && scale > 0 ? scale : 1
  const t = stroke.outline
  const c = Math.max(0, Number.isFinite(cut) ? cut : 14) * k
  const r = 12 * k
  // As on Paper: an ink edge on card stock; on vermilion or ink stock the edge is the stock itself.
  const edge = tone === "paper" ? color.ink : paperFill(tone)
  const layer: CSSProperties = { position: "absolute", pointerEvents: "none" }
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        gap: 18 * k,
        alignItems: "center",
        boxSizing: "border-box",
        // A transparent border holds the edge's room, like Paper's; the layers below draw it.
        border: `${t}px solid transparent`,
        padding: `${16 * k}px ${24 * k}px ${16 * k}px ${16 * k}px`,
        maxWidth: typeof maxWidth === "number" ? r2(maxWidth) : maxWidth,
        ...style,
      }}
    >
      {/* Paper's shadow, on a box set in past the cut corners so no square corner shows under them,
          and 1px inside the edge so no antialiased seam opens between the ink and its shadow. */}
      <span
        aria-hidden
        style={{
          ...layer,
          top: 1 - t,
          right: 1 - t,
          bottom: 1 - t,
          left: r2(c * 0.7 - t),
          borderRadius: `${r2(c)}px ${r2(r)}px ${r2(r)}px ${r2(c)}px`,
          boxShadow: paperShadow,
        }}
      />
      {/* The edge, then the stock inset by it: one outline that keeps its width along the cuts. */}
      <span
        aria-hidden
        style={{
          ...layer,
          inset: -t,
          background: edge,
          borderRadius: `0 ${r2(r)}px ${r2(r)}px 0`,
          clipPath: tagClip(c),
        }}
      />
      <span
        aria-hidden
        style={{
          ...layer,
          inset: 0,
          background: paperFill(tone),
          borderRadius: `0 ${r2(Math.max(0, r - t))}px ${r2(Math.max(0, r - t))}px 0`,
          clipPath: tagClip(innerCut(c, t)),
        }}
      />
      <span
        aria-hidden
        data-hole=""
        style={{
          position: "relative",
          flex: `0 0 ${14 * k}px`,
          height: 14 * k,
          borderRadius: "50%",
          background: color.bg,
          // The hole's ring: the shared outline, thinner only on a tag scaled below 1.
          border: `${Math.min(t, Math.max(1, t * k))}px solid ${color.ink}`,
        }}
      />
      <span
        style={{
          position: "relative",
          fontFamily: font.sans,
          fontWeight: 800,
          fontSize: 28 * k,
          color: paperInk(tone),
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          ...labelStyle,
        }}
      >
        {children}
      </span>
    </div>
  )
}
