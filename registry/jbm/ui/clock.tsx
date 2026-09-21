import * as React from "react"
import { color, font } from "../lib/tokens"

export type ClockProps = React.HTMLAttributes<HTMLDivElement> & {
  hours: number
  minutes?: number
  size?: number
  label?: string
}

/** Deterministic analog clock. No timers: provide the time explicitly for web or video. */
export function Clock({
  hours,
  minutes = 0,
  size = 64,
  label,
  style,
  ...props
}: ClockProps) {
  if (![hours, minutes, size].every(Number.isFinite) || size <= 0)
    throw new RangeError(
      "Clock requires finite time values and a positive size"
    )
  const total = (((hours * 60 + minutes) % 1440) + 1440) % 1440
  const minute = total % 60
  const hour = total / 60
  const text =
    label ??
    `${Math.floor(hour).toString().padStart(2, "0")}:${Math.floor(minute).toString().padStart(2, "0")}`
  return (
    <div
      {...props}
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 16,
        color: color.ink,
        fontFamily: font.mono,
        fontSize: 22,
        fontWeight: 600,
        maxWidth: "100%",
        ...style,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <circle
          cx={32}
          cy={32}
          r={29}
          fill="none"
          stroke={color.dim}
          strokeWidth={3}
        />
        {[0, 90, 180, 270].map((angle) => (
          <path
            key={angle}
            d="M32 7V11"
            transform={`rotate(${angle} 32 32)`}
            stroke={color.line}
            strokeWidth={2}
          />
        ))}
        <path
          d="M32 32V17"
          transform={`rotate(${hour * 30} 32 32)`}
          stroke={color.ink}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <path
          d="M32 32V10"
          transform={`rotate(${minute * 6} 32 32)`}
          stroke={color.accent}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={32} cy={32} r={3} fill={color.ink} />
      </svg>
      <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{text}</span>
    </div>
  )
}
