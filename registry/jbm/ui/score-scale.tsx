import { Meter } from "@ui-sdk/react/meter"
import { useId } from "react"
import type * as React from "react"
import { color, font } from "../lib/tokens"

export type ScoreScaleProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number
  min?: number
  max?: number
  label: string
  labels?: [string, string]
  formatValue?: (value: number) => string
}

/** Read-only score meter, not an input slider. Finite values clamp to the displayed range. */
export function ScoreScale({
  value,
  min = 0,
  max = 10,
  label,
  labels,
  formatValue = String,
  style,
  ...props
}: ScoreScaleProps) {
  const labelId = useId()
  if (![value, min, max].every(Number.isFinite) || max <= min)
    throw new RangeError("ScoreScale requires finite values and max > min")
  const v = Math.max(min, Math.min(max, value))
  const text = formatValue(v)
  return (
    <div
      {...props}
      style={{ fontFamily: font.sans, color: color.ink, minWidth: 0, ...style }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 22,
          overflowWrap: "anywhere",
        }}
      >
        <span id={labelId} style={{ fontSize: 16, fontWeight: 600 }}>
          {label}
        </span>
        <strong style={{ fontFamily: font.mono, color: color.accent }}>
          {text}
        </strong>
      </div>
      <Meter
        render={<div aria-labelledby={labelId} aria-valuetext={text} />}
        min={min}
        max={max}
        value={v}
        style={{ paddingInline: 12 }}
      >
        <div style={{ position: "relative", height: 24 }}>
          <div
            style={{
              position: "absolute",
              top: 10,
              width: "100%",
              height: 4,
              borderRadius: 4,
              background: color.line,
            }}
          />
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <span
              key={tick}
              style={{
                position: "absolute",
                top: 8,
                left: `${tick * 100}%`,
                width: 8,
                height: 8,
                borderRadius: "50%",
                transform: "translateX(-50%)",
                background: color.dim,
              }}
            />
          ))}
          <span
            style={{
              position: "absolute",
              left: "var(--meter-value)",
              top: 0,
              width: 24,
              height: 24,
              boxSizing: "border-box",
              border: `3px solid ${color.bg}`,
              borderRadius: "50%",
              background: color.accent,
              transform: "translateX(-50%)",
            }}
          />
        </div>
      </Meter>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          fontFamily: font.mono,
          fontSize: 12,
          color: color.dim,
          marginTop: 10,
          overflowWrap: "anywhere",
        }}
      >
        <span style={{ flex: 1 }}>{labels?.[0] ?? min}</span>
        <span style={{ flex: 1, textAlign: "end" }}>{labels?.[1] ?? max}</span>
      </div>
    </div>
  )
}
