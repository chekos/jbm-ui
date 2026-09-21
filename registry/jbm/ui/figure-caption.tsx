import * as React from "react"
import { color, font } from "../lib/tokens"

export type FigureCaptionProps = React.ComponentPropsWithRef<"figcaption"> & {
  index?: React.ReactNode
  provenance?: React.ReactNode
  layout?: "inline" | "stacked"
}

/** Place as the first or last child of a figure, alongside any visual content. */
export function FigureCaption({
  index,
  provenance,
  layout = "inline",
  children,
  style,
  ...props
}: FigureCaptionProps) {
  return (
    <figcaption
      {...props}
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: layout === "stacked" ? "column" : "row",
        alignItems: "baseline",
        gap: "10px 20px",
        paddingTop: 18,
        borderTop: `1px solid ${color.line}`,
        fontFamily: font.sans,
        color: color.ink,
        ...style,
      }}
    >
      {index != null && (
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: color.accent,
          }}
        >
          Fig. {index}
        </span>
      )}
      <div
        style={{
          flex: layout === "inline" ? "1 1 180px" : undefined,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>
          {children}
        </div>
        {provenance && (
          <div
            style={{
              marginTop: 8,
              fontFamily: font.mono,
              fontSize: 12,
              lineHeight: 1.6,
              color: color.dim,
            }}
          >
            {provenance}
          </div>
        )}
      </div>
    </figcaption>
  )
}
