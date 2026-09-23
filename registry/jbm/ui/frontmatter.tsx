import type { CSSProperties, ReactNode } from "react"
import { color, font } from "../lib/tokens"
import { unit } from "../lib/geometry"

export type FrontmatterRow = {
  key: string
  value: ReactNode
  highlight?: boolean
  dim?: number
}
/** Metadata between literal YAML delimiters. Stacked mode gives values the full width. */
export function Frontmatter({
  rows,
  stacked = false,
  style,
}: {
  rows: FrontmatterRow[]
  stacked?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: color.bg,
        padding: 18,
        fontFamily: font.mono,
        fontSize: 14,
        minWidth: 0,
        ...style,
      }}
    >
      <div aria-hidden>---</div>
      <dl
        style={{
          margin: "12px 0",
          display: "grid",
          gridTemplateColumns: stacked
            ? "minmax(0, 1fr)"
            : "minmax(112px, 1fr) minmax(0, 2fr)",
          gap: stacked ? "6px" : "12px",
        }}
      >
        {rows.map((row) => (
          <div key={row.key} style={{ display: "contents" }}>
            <dt
              style={{
                borderLeft: `3px solid ${row.highlight ? color.accent : "transparent"}`,
                paddingLeft: 8,
                color: color.ink,
                opacity: 1 - unit(row.dim ?? 0) * 0.72,
                overflowWrap: "anywhere",
                fontWeight: 600,
              }}
            >
              {row.key}:
            </dt>
            <dd
              style={{
                margin: 0,
                paddingLeft: stacked ? 11 : 0,
                marginBottom: stacked ? 12 : 0,
                color: color.ink,
                opacity: 1 - unit(row.dim ?? 0) * 0.72,
                overflowWrap: "anywhere",
                minWidth: 0,
              }}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <div aria-hidden>---</div>
    </div>
  )
}
