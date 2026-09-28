import * as React from "react"
import { color, font, radius, stroke } from "../lib/tokens"

export type ChatBubbleProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "start" | "end"
  tone?: "paper" | "ink" | "accent"
  tail?: boolean
  speaker?: React.ReactNode
}

/**
 * The tail, in px from the bubble's padding edge at its bottom (the top of the bottom edge),
 * TAIL.inset in from the aligned side: a wedge whose outer side drops from the bottom edge at `a`
 * (leaning out a little) to `tip`, and whose inner side climbs back to the edge at `b`. Both sides
 * leave the bottom edge through a small round fillet, so body and tail read as one outline.
 */
const TAIL = { inset: 22, a: 10, b: 30, tip: { x: 7, y: 14 }, fillet: 4, width: 40, drop: 16 }

/** The tail's outline and fill, drawn over the body's bottom edge so the two share one line. */
function Tail({ side, fill, edge }: { side: "start" | "end"; fill: string; edge: string }) {
  const t = stroke.outline
  const yc = t / 2 // the bottom edge's centreline
  const { a, b, tip, fillet: f } = TAIL
  const r = (n: number) => Math.round(n * 100) / 100
  const pt = (p: { x: number; y: number }) => `${r(p.x)} ${r(p.y)}`
  // Where a fillet ends on its side: f along the side from its corner on the bottom edge.
  const along = (x: number) => {
    const dx = tip.x - x,
      dy = tip.y - yc,
      d = Math.hypot(dx, dy)
    return { x: x + (dx / d) * f, y: yc + (dy / d) * f }
  }
  const outer = along(a),
    inner = along(b)
  const [inA, cornerA, cornerB, outB, point] = [
    { x: a - f, y: yc },
    { x: a, y: yc },
    { x: b, y: yc },
    { x: b + f, y: yc },
    tip,
  ].map(pt)
  // One stroke: off the bottom edge, round the fillet, down to the tip, and back up into the edge.
  const line = `M${inA}Q${cornerA} ${pt(outer)}L${point}L${pt(inner)}Q${cornerB} ${outB}`
  // The stock under it: the tail's inside plus the stretch of bottom edge it opens (from just
  // inside the body, so no antialiased ink row is left across the opening).
  const patch = `M${r(a - f)} ${r(-0.75)}H${r(b + f)}V${r(yc)}Q${cornerB} ${pt(inner)}L${point}L${pt(outer)}Q${cornerA} ${inA}Z`
  return (
    <svg
      aria-hidden="true"
      data-tail=""
      width={TAIL.width}
      height={TAIL.drop + t}
      viewBox={`0 -1 ${TAIL.width} ${TAIL.drop + t}`}
      style={{
        position: "absolute",
        top: "100%",
        marginTop: -1,
        ...(side === "start" ? { insetInlineStart: TAIL.inset } : { insetInlineEnd: TAIL.inset }),
        overflow: "visible",
        transform: side === "start" ? undefined : "scaleX(-1)",
      }}
    >
      <path d={patch} fill={fill} />
      <path d={line} fill="none" stroke={edge} strokeWidth={t} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** One message, without chat application state or simulated typing. */
export function ChatBubble({
  side = "start",
  tone = "paper",
  tail = true,
  speaker,
  children,
  style,
  ...props
}: ChatBubbleProps) {
  const fill =
    tone === "paper" ? color.card : tone === "ink" ? color.ink : color.accent
  // Card stock takes the shared ink outline; ink and vermilion bubbles are edged in their own fill,
  // so every tone keeps the same size and tail.
  const edge = tone === "paper" ? color.ink : fill
  const t = stroke.outline
  return (
    <div
      {...props}
      style={{
        position: "relative",
        width: "fit-content",
        // A short message still leaves the tail on the straight run of the bottom edge: it ends a
        // fillet clear of the far corner's curve, so it never hangs off or kinks into a rounded corner.
        minWidth: tail ? TAIL.inset + TAIL.b + 2 * TAIL.fillet + radius.card : undefined,
        maxWidth: "100%",
        boxSizing: "border-box",
        marginInlineStart: side === "end" ? "auto" : 0,
        marginInlineEnd: side === "start" ? "auto" : 0,
        marginBottom: tail ? TAIL.drop - t : 0,
        padding: `${16 - t}px ${20 - t}px`,
        border: `${t}px solid ${edge}`,
        borderRadius: radius.card,
        background: fill,
        color: tone === "paper" ? color.ink : color.bg,
        fontFamily: font.sans,
        fontSize: 18,
        lineHeight: 1.5,
        overflowWrap: "anywhere",
        ...style,
      }}
    >
      {speaker != null && (
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {speaker}
        </div>
      )}
      {children}
      {tail && <Tail side={side} fill={fill} edge={edge} />}
    </div>
  )
}
