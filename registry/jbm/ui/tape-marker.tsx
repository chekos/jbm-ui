import type { CSSProperties } from "react"
import { color, font } from "../lib/tokens"
import { paperShadow } from "./paper"

/** Folded paper marker; usable without a tape. */
export function TapeMarker({
  label,
  style,
}: {
  label?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 20,
        height: 72,
        background: color.accent,
        borderRadius: 4,
        boxShadow: paperShadow,
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          height: 14,
          background: "rgba(0,0,0,.16)",
          borderRadius: "4px 4px 0 0",
        }}
      />
      {label && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: "100%",
            marginBottom: 8,
            transform: "translateX(-50%)",
            fontFamily: font.sans,
            fontWeight: 700,
            color: color.accent,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
