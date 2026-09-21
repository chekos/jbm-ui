import type * as React from "react"
import { color } from "../lib/tokens"
import { Paper } from "./paper"
/** Outlined field with a placeholder bar and a text cursor. `cursorOn` blinks it from the timeline. */
export function UiInput({
  w = 220,
  h = 70,
  cursorOn = true,
  style,
}: {
  w?: number
  h?: number
  cursorOn?: boolean
  style?: React.CSSProperties
}) {
  const pad = Math.round(h * 0.28)
  return (
    <Paper
      tone="paper"
      w={w}
      h={h}
      radius={Math.round(h * 0.22)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: Math.round(h * 0.14),
        padding: `0 ${pad}px`,
        ...style,
      }}
    >
      <div
        style={{
          width: 3,
          height: h * 0.5,
          background: color.ink,
          opacity: cursorOn ? 1 : 0,
          borderRadius: 2,
        }}
      />
      <div
        style={{
          width: w * 0.45,
          height: Math.max(6, h * 0.12),
          borderRadius: 99,
          background: color.line,
        }}
      />
    </Paper>
  )
}
