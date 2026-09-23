import * as React from "react"
import { color, font } from "../lib/tokens"

/** Shared complete folder silhouette for standalone folders and filing drawers. */
export function FolderOutline({
  x = 25,
  y = 55,
  w = 205,
  h = 144,
  tabX = x,
  tabWidth = 83,
  tabHeight = 27,
  tabSlope = 17,
  fill = color.accent,
}: {
  x?: number
  y?: number
  w?: number
  h?: number
  tabX?: number
  tabWidth?: number
  tabHeight?: number
  tabSlope?: number
  fill?: string
}) {
  return (
    <path
      d={`M${x} ${y + tabHeight}H${tabX}V${y}H${tabX + tabWidth - tabSlope}L${tabX + tabWidth} ${y + tabSlope}H${x + w}V${y + h}H${x}Z`}
      fill={fill}
      stroke={color.ink}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  )
}

export type FolderProps = React.SVGProps<SVGSVGElement> & {
  label?: string
  open?: number
  tone?: "accent" | "ink"
  /** SVG contents in the 260×220 folder space, drawn behind its front panel. */
  children?: React.ReactNode
}

/** Controlled illustration: open is 0–1; drive it with a slider or video timeline. */
export function Folder({
  label,
  open = 0,
  tone = "accent",
  style,
  children,
  ...props
}: FolderProps) {
  const p = Number.isFinite(open) ? Math.max(0, Math.min(1, open)) : 0
  const fill = tone === "accent" ? color.accent : color.ink
  // Turn the landscape sheet from 180° to 90°, keeping its size fixed.
  const paperAngle = 180 - 90 * p
  // Lift enough to clear the lower corner's sweep, then keep that clearance.
  // The grip follows a shallow sideways arc as the sheet is pulled upright.
  const clearanceAngle = Math.min((90 * p * Math.PI) / 180, Math.atan2(79, 44))
  const paperLift =
    79 * Math.sin(clearanceAngle) + 44 * Math.cos(clearanceAngle) - 44
  const paperDrift = 8 * Math.sin(Math.PI * p) - 18 * p
  // Project the printed label onto the front plane, around its baseline.
  const labelWidth = 1 + (30 * p * 25) / (205 * 110)
  const labelShear = (81.5 * 30 * p) / (205 * 110)
  const labelHeight = 1 - (35 * p) / 110
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
      <FolderOutline fill={fill} />
      {children ?? (
        <g
          transform={`translate(${256 + paperDrift} ${-paperLift}) scale(-1 1) rotate(${paperAngle - 180} 128 140)`}
        >
          <path d="M49 78H180L207 104V184H49Z" fill={color.card} />
          <path
            d="M180 78H49V184H207V104"
            fill="none"
            stroke={color.ink}
            strokeWidth={2}
          />
          <path d="M180 78V104H207" fill={color.line} />
          <path d="M158 106V164" stroke={color.accent} strokeWidth={6} />
          <path
            d="M136 98V164M114 112V164M92 98V164"
            stroke={color.line}
            strokeWidth={4}
          />
        </g>
      )}
      <path
        d={`M${25 - p * 15} ${95 + p * 35}H${230 + p * 15}L230 205H25Z`}
        fill={fill}
        stroke={color.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {label && (
        <text
          transform={`matrix(${labelWidth} 0 ${labelShear} ${labelHeight} ${127.5 - 81.5 * labelWidth} ${205 - 25 * labelHeight})`}
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
