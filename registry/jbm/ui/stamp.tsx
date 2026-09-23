import type { CSSProperties } from "react"
import { color, font } from "../lib/tokens"
import { unit } from "../lib/geometry"

/** An ink impression, not a validation verdict. press controls contact and settling. */
export function Stamp({
  text,
  press = 1,
  angle = -7,
  style,
}: {
  text: string
  press?: number
  angle?: number
  style?: CSSProperties
}) {
  const p = unit(press)
  const ink = unit((p - 0.5) / 0.3)
  const layer: CSSProperties = {
    border: `3px solid ${color.accent}`,
    borderRadius: 5,
    padding: "8px 16px",
    fontFamily: font.mono,
    fontSize: 24,
    fontWeight: 700,
    color: color.accent,
    overflowWrap: "anywhere",
  }
  return (
    <div
      style={{
        display: "inline-block",
        position: "relative",
        maxWidth: "100%",
        transform: `translateY(${-60 * (1 - unit(p / 0.62))}px) rotate(${angle}deg)`,
        opacity: ink,
        ...style,
      }}
    >
      <div style={layer}>{text}</div>
      <div
        aria-hidden
        style={{
          ...layer,
          position: "absolute",
          inset: 0,
          transform: "translate(2px, -1px)",
          opacity: 0.3,
        }}
      >
        {text}
      </div>
    </div>
  )
}
