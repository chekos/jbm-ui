import type { CSSProperties, ReactNode } from "react"
import { color } from "../lib/tokens"
import { paperShadow } from "./paper"
import { TapeMarker } from "./tape-marker"

const positive = (n: number) =>
  Number.isFinite(n) ? Math.min(Number.MAX_SAFE_INTEGER / 2, Math.max(0, n)) : 0
/** Paper coordinate to screen coordinate. Attachments use the same origin as the printed marks. */
export const paperAt = (length: number, coordinate: number) =>
  positive(length) - coordinate
export type TapeAttachment = { id: string; at: number; content: ReactNode }
export type PaperTapeProps = {
  length: number
  window?: number
  thickness?: number
  direction?: "horizontal" | "vertical"
  markers?: { id: string; at: number; label?: string }[]
  attachments?: TapeAttachment[]
  style?: CSSProperties
}
/** A feeding strip. Only marks inside the visible window are rendered, even for very long runs. */
export function PaperTape({
  length,
  window = 400,
  thickness = 48,
  direction = "horizontal",
  markers = [],
  attachments = [],
  style,
}: PaperTapeProps) {
  const len = positive(length),
    visible = Math.min(len, positive(window)),
    thick = Math.max(16, positive(thickness))
  const horizontal = direction === "horizontal"
  const marks: ReactNode[] = []
  const first = Math.max(0, Math.floor((len - visible - 52) / 72))
  const last = Math.floor((len - 24) / 72)
  for (let i = first; i <= last; i++) {
    const x = len - (i * 72 + 24)
    if (x <= 16) continue
    for (const row of [0.36, 0.64])
      marks.push(
        <line
          key={`${i}-${row}`}
          x1={horizontal ? Math.max(16, x - 40) : thick * row}
          y1={horizontal ? thick * row : Math.max(16, x - 40)}
          x2={horizontal ? x : thick * row}
          y2={horizontal ? thick * row : x}
          stroke={color.ink}
          strokeWidth={3}
          strokeLinecap="round"
        />
      )
  }
  const placed = [
    ...markers.map((m) => ({
      ...m,
      marker: true,
      content: <TapeMarker label={m.label} />,
    })),
    ...attachments.map((a) => ({ ...a, marker: false })),
  ]
  return (
    <div
      style={{
        position: "relative",
        width: horizontal ? positive(window) : thick + 180,
        height: horizontal ? thick + 150 : positive(window),
        maxWidth: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: horizontal ? 0 : 70,
          top: horizontal ? 48 : 0,
          width: horizontal ? visible : thick,
          height: horizontal ? thick : visible,
          boxSizing: "border-box",
          background: color.card,
          border: visible > 0 ? `2px solid ${color.ink}` : undefined,
          boxShadow: paperShadow,
        }}
      >
        <svg
          width="100%"
          height="100%"
          aria-hidden
          style={{ position: "absolute", inset: 0, overflow: "hidden" }}
        >
          {marks}
        </svg>
        {placed
          .filter(
            (a) =>
              Number.isFinite(a.at) &&
              a.at >= 0 &&
              a.at <= len &&
              paperAt(len, a.at) <= visible
          )
          .map((a) => (
            <div
              key={a.id}
              style={{
                position: "absolute",
                left: horizontal
                  ? paperAt(len, a.at)
                  : a.marker
                    ? thick / 2
                    : thick - 8,
                top: horizontal
                  ? a.marker
                    ? -12
                    : thick - 8
                  : paperAt(len, a.at),
                transform: horizontal
                  ? "translateX(-50%)"
                  : a.marker
                    ? "translate(-50%, -50%) rotate(90deg)"
                    : "translateY(-50%)",
              }}
            >
              {a.content}
            </div>
          ))}
      </div>
    </div>
  )
}
