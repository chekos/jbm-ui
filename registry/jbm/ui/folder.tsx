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

/** Folder fills: vermilion, ink, or plain cream card. */
export const folderTones = {
  accent: { fill: color.accent, text: color.bg },
  ink: { fill: color.ink, text: color.bg },
  card: { fill: color.card, text: color.ink },
} as const
export type FolderTone = keyof typeof folderTones

/**
 * Affine placement for text printed on the front panel at closed-folder point (u, v): the panel
 * widens at its upper edge and leans toward the viewer as open goes 0 → 1, bottom edge anchored.
 */
export function frontPlane(u: number, v: number, open: number) {
  const t = (205 - v) / 110
  const sx = 1 + (t * 30 * open) / 205
  const shear = ((127.5 - u) * 30 * open) / (205 * 110)
  const sy = 1 - (35 * open) / 110
  return `matrix(${sx} 0 ${shear} ${sy} ${127.5 + (u - 127.5) * sx} ${205 - t * (110 - 35 * open)})`
}

const TAB_LABEL = 14
export type FolderProps = React.SVGProps<SVGSVGElement> & {
  label?: string
  open?: number
  tone?: FolderTone
  /** Short line printed on the front panel: under the label, or near the panel top when the label is on the tab. */
  sublabel?: string
  /** Where the label prints. Defaults to the tab for the card tone, the front panel otherwise. */
  labelOn?: "front" | "tab"
  /** SVG contents in the 260×220 folder space, drawn behind its front panel. */
  children?: React.ReactNode
}

/** Controlled illustration: open is 0–1; drive it with a slider or video timeline. */
export function Folder({
  label,
  open = 0,
  tone = "accent",
  sublabel,
  labelOn = tone === "card" ? "tab" : "front",
  style,
  children,
  ...props
}: FolderProps) {
  const p = Number.isFinite(open) ? Math.max(0, Math.min(1, open)) : 0
  const { fill, text } = folderTones[tone] ?? folderTones.accent
  // On the tab, the label is never truncated: the tab widens to fit it (up to the body width),
  // then the name compresses horizontally.
  const onTab = Boolean(label) && labelOn === "tab"
  const tabText = onTab ? 0.6 * TAB_LABEL * Array.from(label ?? "").length : 0
  const tabWidth = onTab ? Math.min(205, Math.max(83, tabText + 16 + 17)) : 83
  const tabScale = tabText > 0 ? Math.min(1, (tabWidth - 16 - 17) / tabText) : 1
  // Turn the landscape sheet from 180° to 90°, keeping its size fixed.
  const paperAngle = 180 - 90 * p
  // Lift enough to clear the lower corner's sweep, then keep that clearance.
  // The grip follows a shallow sideways arc as the sheet is pulled upright.
  const clearanceAngle = Math.min((90 * p * Math.PI) / 180, Math.atan2(79, 44))
  const paperLift =
    79 * Math.sin(clearanceAngle) + 44 * Math.cos(clearanceAngle) - 44
  const paperDrift = 8 * Math.sin(Math.PI * p) - 18 * p
  // The front label sits on its baseline at y 180, or higher when a sublabel prints under it.
  const frontBaseline = sublabel ? 172 : 180
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
      <FolderOutline fill={fill} tabWidth={tabWidth} />
      {onTab && (
        <text
          transform={`translate(33 73) scale(${tabScale} 1)`}
          fontFamily={font.mono}
          fontSize={TAB_LABEL}
          fontWeight={600}
          fill={text}
        >
          {label}
        </text>
      )}
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
      {label && !onTab && (
        <text
          transform={frontPlane(46, frontBaseline, p)}
          fontFamily={font.mono}
          fontSize={16}
          fontWeight={600}
          fill={text}
        >
          {label.length > 16 ? `${label.slice(0, 15)}…` : label}
        </text>
      )}
      {sublabel && (
        <text
          transform={frontPlane(onTab ? 37 : 46, onTab ? 114 : 192, p)}
          fontFamily={font.mono}
          fontSize={onTab ? 12 : 11}
          fill={text}
          textLength={
            0.6 * (onTab ? 12 : 11) * Array.from(sublabel).length >
            (onTab ? 181 : 172)
              ? onTab
                ? 181
                : 172
              : undefined
          }
          lengthAdjust="spacingAndGlyphs"
        >
          {sublabel}
        </text>
      )}
    </svg>
  )
}
