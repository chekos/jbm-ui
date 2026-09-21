import type * as React from "react"
import { color } from "../lib/tokens"
import { paperShadow, type PaperTone } from "./paper"
/** Round vermilion badge with a check or a cross, for "fixed" / "broken" states on a piece. */
export function Badge({
  kind,
  size = 44,
  tone = "accent",
  style,
}: {
  kind: "check" | "x"
  size?: number
  tone?: PaperTone
  style?: React.CSSProperties
}) {
  const stroke = tone === "paper" ? color.ink : color.bg
  const bg =
    tone === "accent" ? color.accent : tone === "ink" ? color.ink : color.card
  const s = size
  return (
    <div
      style={{
        width: s,
        height: s,
        borderRadius: s / 2,
        background: bg,
        boxShadow: paperShadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: tone === "paper" ? `2px solid ${color.ink}` : "none",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <svg
        width={s * 0.55}
        height={s * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "check" ? (
          <path d="M4 12.5l5 5L20 6.5" />
        ) : (
          <path d="M6 6l12 12M18 6L6 18" />
        )}
      </svg>
    </div>
  )
}
