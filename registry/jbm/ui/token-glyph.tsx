import type * as React from "react"
import { color, font } from "../lib/tokens"
import { paperShadow } from "./paper"
export type TokenKind = "color" | "type" | "space"
/** Token glyphs: two overlapping swatches (color), "Aa" (type), a dimension line between two blocks (spacing). */
export function TokenGlyph({
  kind,
  size = 150,
  style,
}: {
  kind: TokenKind
  size?: number
  style?: React.CSSProperties
}) {
  const s = size
  if (kind === "color")
    return (
      <div style={{ width: s, height: s, position: "relative", ...style }}>
        <div
          style={{
            position: "absolute",
            left: s * 0.06,
            top: s * 0.2,
            width: s * 0.56,
            height: s * 0.56,
            borderRadius: "50%",
            background: color.ink,
            boxShadow: paperShadow,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: s * 0.4,
            top: s * 0.3,
            width: s * 0.56,
            height: s * 0.56,
            borderRadius: "50%",
            background: color.accent,
            boxShadow: paperShadow,
          }}
        />
      </div>
    )
  if (kind === "type")
    return (
      <div
        style={{
          width: s,
          height: s,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
      >
        <div
          style={{
            fontFamily: font.sans,
            fontSize: s * 0.7,
            fontWeight: 800,
            letterSpacing: -s * 0.03,
            color: color.ink,
            lineHeight: 1,
          }}
        >
          A<span style={{ color: color.accent }}>a</span>
        </div>
      </div>
    )
  const bw = s * 0.26
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={style}>
      <rect
        x={s * 0.06}
        y={s * 0.3}
        width={bw}
        height={s * 0.44}
        rx={s * 0.05}
        fill={color.ink}
      />
      <rect
        x={s * 0.68}
        y={s * 0.3}
        width={bw}
        height={s * 0.44}
        rx={s * 0.05}
        fill={color.ink}
      />
      <line
        x1={s * 0.35}
        y1={s * 0.52}
        x2={s * 0.65}
        y2={s * 0.52}
        stroke={color.accent}
        strokeWidth={s * 0.035}
        strokeLinecap="round"
      />
      <path
        d={`M ${s * 0.42} ${s * 0.44} L ${s * 0.35} ${s * 0.52} L ${s * 0.42} ${s * 0.6}`}
        fill="none"
        stroke={color.accent}
        strokeWidth={s * 0.035}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${s * 0.58} ${s * 0.44} L ${s * 0.65} ${s * 0.52} L ${s * 0.58} ${s * 0.6}`}
        fill="none"
        stroke={color.accent}
        strokeWidth={s * 0.035}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
