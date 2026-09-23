import type { CSSProperties, ReactNode } from "react"
import { color, font } from "../lib/tokens"
import { Paper, paperInk, type PaperTone } from "./paper"

export function PunchedTag({
  children,
  tone = "paper",
  style,
}: {
  children: ReactNode
  tone?: PaperTone
  style?: CSSProperties
}) {
  return (
    <Paper
      tone={tone}
      radius={12}
      style={{
        display: "flex",
        gap: 18,
        alignItems: "center",
        borderTopLeftRadius: 36,
        borderBottomLeftRadius: 36,
        padding: "16px 24px 16px 16px",
        maxWidth: "100%",
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          flex: "0 0 14px",
          height: 14,
          borderRadius: "50%",
          background: color.bg,
          border: `2px solid ${color.ink}`,
        }}
      />
      <span
        style={{
          fontFamily: font.sans,
          fontWeight: 800,
          fontSize: 28,
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
