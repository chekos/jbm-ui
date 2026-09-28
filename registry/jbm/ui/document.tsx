import * as React from "react"
import { color, font, stroke } from "../lib/tokens"

export type DocumentProps = React.SVGProps<SVGSVGElement> & {
  label?: string
  accent?: boolean
}

/** Folded paper illustration. Omit label for a decorative document. */
export function Document({
  label,
  accent = false,
  style,
  ...props
}: DocumentProps) {
  return (
    <svg
      viewBox="0 0 160 200"
      width={160}
      height={200}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
      style={{ display: "block", maxWidth: "100%", height: "auto", ...style }}
    >
      <path
        d="M8 2H118L152 36V198H8Z"
        fill={color.card}
        stroke={color.ink}
        strokeWidth={stroke.outline}
        strokeLinejoin="round"
      />
      <path
        d="M118 2V36H152"
        fill={color.line}
        stroke={color.ink}
        strokeWidth={stroke.outline}
        strokeLinejoin="round"
      />
      <path
        d="M28 65H112"
        stroke={accent ? color.accent : color.ink}
        strokeWidth={8}
        strokeLinecap="round"
      />
      {[98, 120, 142].map((y, i) => (
        <path
          key={y}
          d={`M28 ${y}H${128 - i * 12}`}
          stroke={color.line}
          strokeWidth={5}
          strokeLinecap="round"
        />
      ))}
      {label && (
        <text
          x={28}
          y={177}
          fontFamily={font.mono}
          fontSize={11}
          fill={color.dim}
        >
          {label.length > 16 ? `${label.slice(0, 15)}…` : label}
        </text>
      )}
    </svg>
  )
}
