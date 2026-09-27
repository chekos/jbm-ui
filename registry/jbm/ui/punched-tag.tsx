import type { CSSProperties, ReactNode } from "react"
import { color, font } from "../lib/tokens"
import { Paper, paperInk, type PaperTone } from "./paper"

export function PunchedTag({
  children,
  tone = "paper",
  scale = 1,
  style,
}: {
  children: ReactNode
  tone?: PaperTone
  /** Size multiplier for the tag's own geometry: hole, ring, radii, gap, padding, and type. Default 1. */
  scale?: number
  style?: CSSProperties
}) {
  const k = Number.isFinite(scale) && scale > 0 ? scale : 1
  return (
    <Paper
      tone={tone}
      radius={12 * k}
      style={{
        display: "flex",
        gap: 18 * k,
        alignItems: "center",
        borderTopLeftRadius: 36 * k,
        borderBottomLeftRadius: 36 * k,
        padding: `${16 * k}px ${24 * k}px ${16 * k}px ${16 * k}px`,
        maxWidth: "100%",
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          flex: `0 0 ${14 * k}px`,
          height: 14 * k,
          borderRadius: "50%",
          background: color.bg,
          border: `${Math.max(1, 2 * k)}px solid ${color.ink}`,
        }}
      />
      <span
        style={{
          fontFamily: font.sans,
          fontWeight: 800,
          fontSize: 28 * k,
          color: paperInk(tone),
          overflowWrap: "anywhere",
          minWidth: 0,
        }}
      >
        {children}
      </span>
    </Paper>
  )
}
