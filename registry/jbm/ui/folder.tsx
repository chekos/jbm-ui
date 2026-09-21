import * as React from "react"
import { color, font } from "../lib/tokens"

export type FolderProps = React.SVGProps<SVGSVGElement> & {
  label?: string
  open?: number
  tone?: "accent" | "ink"
}

/** Controlled illustration: open is 0–1; drive it with a slider or video timeline. */
export function Folder({
  label,
  open = 0,
  tone = "accent",
  style,
  ...props
}: FolderProps) {
  const p = Number.isFinite(open) ? Math.max(0, Math.min(1, open)) : 0
  const fill = tone === "accent" ? color.accent : color.ink
  return (
    <svg
      viewBox="0 0 260 220"
      width={260}
      height={220}
      role={label ? "img" : undefined}
      aria-label={
        label ? `${label}, ${p > 0.5 ? "open" : "closed"} folder` : undefined
      }
      aria-hidden={label ? undefined : true}
      {...props}
      style={{ display: "block", maxWidth: "100%", height: "auto", ...style }}
    >
      <path
        d="M25 82V55H91L108 72H230V199H25Z"
        fill={fill}
        stroke={color.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <g transform={`translate(0 ${-42 * p}) rotate(${-5 * p} 130 160)`}>
        <path
          d="M49 78H180L207 104V184H49Z"
          fill={color.card}
          stroke={color.ink}
          strokeWidth={2}
        />
        <path d="M180 78V104H207" fill={color.line} />
        <path d="M68 118H158" stroke={color.accent} strokeWidth={6} />
        <path d="M68 140H184M68 156H162" stroke={color.line} strokeWidth={4} />
      </g>
      <path
        d={`M25 ${95 + p * 35}H230L${230 + p * 15} 205H${25 - p * 15}Z`}
        fill={fill}
        stroke={color.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {label && (
        <text
          x={46}
          y={180}
          fontFamily={font.mono}
          fontSize={16}
          fontWeight={600}
          fill={color.bg}
        >
          {label.length > 16 ? `${label.slice(0, 15)}…` : label}
        </text>
      )}
    </svg>
  )
}
