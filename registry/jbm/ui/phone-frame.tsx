import type * as React from "react"
import { color } from "../lib/tokens"
import { paperShadow } from "./paper"
/** Phone silhouette: thick ink edge, cream screen, a small speaker slot. Children lay out as a column inside the screen. */
export function PhoneFrame({
  w = 420,
  h = 780,
  rotate = 0,
  children,
  style,
  gap = 26,
}: {
  w?: number
  h?: number
  rotate?: number
  children?: React.ReactNode
  style?: React.CSSProperties
  gap?: number
}) {
  const edge = Math.max(5, Math.round(w * 0.016))
  const pad = Math.round(w * 0.1)
  return (
    <div
      style={{
        width: w,
        height: h,
        boxSizing: "border-box",
        background: color.card,
        border: `${edge}px solid ${color.ink}`,
        borderRadius: Math.round(w * 0.13),
        boxShadow: paperShadow,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        position: "relative",
        padding: `${pad + Math.round(w * 0.08)}px ${pad}px ${pad}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        gap,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: Math.round(w * 0.06),
          left: "50%",
          transform: "translateX(-50%)",
          width: w * 0.26,
          height: Math.max(5, w * 0.018),
          borderRadius: 99,
          background: color.ink,
        }}
      />
      {children}
    </div>
  )
}
