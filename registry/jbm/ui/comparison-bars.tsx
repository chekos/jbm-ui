import * as React from "react"
import { color, font } from "../lib/tokens"

export type ComparisonBarsProps = React.HTMLAttributes<HTMLDivElement> & {
  items: { label: string; value: number; highlight?: boolean }[]
  max?: number
  formatValue?: (value: number) => string
}

/** Nonnegative values on a shared zero-based scale. Values remain readable without the bars. */
export function ComparisonBars({
  items,
  max,
  formatValue = String,
  style,
  ...props
}: ComparisonBarsProps) {
  if (items.some((item) => !Number.isFinite(item.value) || item.value < 0))
    throw new RangeError("ComparisonBars requires finite nonnegative values")
  const ceiling = max ?? Math.max(1, ...items.map((item) => item.value))
  if (
    !Number.isFinite(ceiling) ||
    ceiling <= 0 ||
    items.some((item) => item.value > ceiling)
  )
    throw new RangeError(
      "ComparisonBars max must be positive and cover every value"
    )
  return (
    <div
      {...props}
      style={{ fontFamily: font.sans, color: color.ink, minWidth: 0, ...style }}
    >
      <dl style={{ margin: 0, display: "grid", gap: 20 }}>
        {items.map((item, i) => (
          <div key={i}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: "4px 16px",
                marginBottom: 8,
                overflowWrap: "anywhere",
              }}
            >
              <dt style={{ fontSize: 15, fontWeight: 600 }}>{item.label}</dt>
              <dd
                style={{
                  margin: 0,
                  fontFamily: font.mono,
                  fontSize: 14,
                  fontWeight: 600,
                  color: item.highlight ? color.accent : color.dim,
                }}
              >
                {formatValue(item.value)}
              </dd>
            </div>
            <div
              aria-hidden="true"
              style={{
                height: 14,
                borderRadius: 7,
                background: color.line,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(item.value / ceiling) * 100}%`,
                  height: "100%",
                  borderRadius: 7,
                  background: item.highlight ? color.accent : color.ink,
                }}
              />
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}
