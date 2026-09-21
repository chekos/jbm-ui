import type * as React from "react"
import { color } from "../lib/tokens"
import { Paper, type PaperTone } from "./paper"
/** Rounded pill with a short label bar. `tone` ink (default), accent, or paper (outline). */
export function UiButton({
  w = 220,
  h = 70,
  tone = "ink",
  style,
}: {
  w?: number
  h?: number
  tone?: PaperTone
  style?: React.CSSProperties
}) {
  const bar = tone === "paper" ? color.ink : color.bg
  return (
    <Paper
      tone={tone}
      w={w}
      h={h}
      radius={h / 2}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      <div
        style={{
          width: w * 0.42,
          height: Math.max(6, h * 0.13),
          borderRadius: 99,
          background: bar,
        }}
      />
    </Paper>
  )
}
