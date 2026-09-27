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
          // A dl group div may hold only dt/dd, so the decorative bar lives in the dd.
          // `display: contents` lets the value and bar join the row's flex-wrap layout.
          <div
            key={i}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "4px 16px",
              overflowWrap: "anywhere",
            }}
          >
            <dt style={{ fontSize: 15, fontWeight: 600 }}>{item.label}</dt>
            <dd style={{ margin: 0, display: "contents" }}>
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 14,
                  fontWeight: 600,
                  color: item.highlight ? color.accent : color.dim,
                }}
              >
                {formatValue(item.value)}
              </span>
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  flexBasis: "100%",
                  minWidth: 0,
                  height: 14,
                  marginTop: 4,
                  borderRadius: 7,
                  background: color.line,
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: `${(item.value / ceiling) * 100}%`,
                    height: "100%",
                    borderRadius: 7,
                    background: item.highlight ? color.accent : color.ink,
                  }}
                />
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
