import * as React from "react"
import { color, font, radius, shadow, surfaceBorder } from "../lib/tokens"

export type TicketProps = React.HTMLAttributes<HTMLDivElement> & {
  header?: React.ReactNode
  stub?: React.ReactNode
  tone?: "ink" | "accent"
}

/** Admission-style surface with a perforated stub. Content and semantics belong to the caller. */
export function Ticket({
  header,
  stub,
  tone = "ink",
  children,
  style,
  ...props
}: TicketProps) {
  return (
    <div
      {...props}
      style={{
        background: color.card,
        color: color.ink,
        fontFamily: font.sans,
        border: surfaceBorder.card,
        borderRadius: radius.card,
        boxShadow: shadow.card,
        overflow: "hidden",
        minWidth: 0,
        overflowWrap: "anywhere",
        ...style,
      }}
    >
      {header != null && (
        <div
          style={{
            padding: "14px 24px",
            background: tone === "accent" ? color.accent : color.ink,
            color: color.bg,
            fontFamily: font.mono,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          {header}
        </div>
      )}
      <div style={{ padding: 24 }}>{children}</div>
      {stub != null && (
        <div
          style={{
            borderTop: `1px dashed ${color.line}`,
            padding: "16px 24px",
            fontFamily: font.mono,
            fontSize: 12,
            lineHeight: 1.5,
            color: color.dim,
          }}
        >
          {stub}
        </div>
      )}
    </div>
  )
}
