import * as React from "react"
import { color, font } from "../lib/tokens"

export type RuleProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string
  strong?: boolean
  accent?: boolean
}

/** A semantic separator with an optional editorial label. */
export function Rule({
  label,
  strong = false,
  accent = false,
  style,
  ...props
}: RuleProps) {
  const ink = accent ? color.accent : strong ? color.ink : color.line
  return (
    <div
      role="separator"
      aria-label={label}
      {...props}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        width: "100%",
        color: ink,
        ...style,
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: accent ? color.accent : color.dim,
            overflowWrap: "anywhere",
          }}
        >
          {label}
        </span>
      )}
      <span
        aria-hidden="true"
        style={{
          flex: 1,
          minWidth: 24,
          borderTop: `${strong ? 3 : 1}px solid currentColor`,
        }}
      />
    </div>
  )
}
