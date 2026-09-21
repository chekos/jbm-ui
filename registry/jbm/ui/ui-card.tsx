import type * as React from "react"
import { color } from "../lib/tokens"
import { Paper } from "./paper"
/** Card with a picture slot (line-art hills and sun) and two text bars. */
export function UiCard({
  w = 220,
  h = 170,
  style,
}: {
  w?: number
  h?: number
  style?: React.CSSProperties
}) {
  const pad = Math.round(w * 0.07)
  const imgH = Math.round(h * 0.5)
  const iw = w - pad * 2
  return (
    <Paper
      tone="paper"
      w={w}
      h={h}
      radius={Math.round(w * 0.08)}
      style={{
        padding: pad,
        display: "flex",
        flexDirection: "column",
        gap: Math.round(h * 0.07),
        ...style,
      }}
    >
      <svg
        width={iw}
        height={imgH}
        viewBox={`0 0 ${iw} ${imgH}`}
        style={{ display: "block" }}
      >
        <rect
          x={2}
          y={2}
          width={iw - 4}
          height={imgH - 4}
          rx={Math.round(w * 0.04)}
          fill="none"
          stroke={color.ink}
          strokeWidth={3}
        />
        <circle
          cx={iw * 0.72}
          cy={imgH * 0.32}
          r={imgH * 0.11}
          fill={color.accent}
        />
        <path
          d={`M ${iw * 0.08} ${imgH * 0.86} L ${iw * 0.36} ${imgH * 0.42} L ${iw * 0.52} ${imgH * 0.66} L ${iw * 0.62} ${imgH * 0.54} L ${iw * 0.92} ${imgH * 0.86}`}
          fill="none"
          stroke={color.ink}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          width: iw * 0.72,
          height: Math.max(6, h * 0.075),
          borderRadius: 99,
          background: color.ink,
        }}
      />
      <div
        style={{
          width: iw * 0.48,
          height: Math.max(5, h * 0.06),
          borderRadius: 99,
          background: color.line,
        }}
      />
    </Paper>
  )
}
