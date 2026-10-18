import type { CSSProperties } from "react"
import { color as palette, stroke } from "../lib/tokens"

/** Original 24-unit silhouettes; interior marks remain unfilled in both treatments. */
export const iconPaths = {
  "arrow-right": { body: "", marks: "M4 12H20M14 6L20 12L14 18" },
  search: {
    body: "M17 10A7 7 0 1 1 3 10A7 7 0 1 1 17 10Z",
    marks: "M15 15L21 21",
  },
  close: { body: "", marks: "M6 6L18 18M18 6L6 18" },
  check: { body: "", marks: "M4 12L9 17L20 6" },
  play: { body: "M7 4L20 12L7 20Z", marks: "" },
  replay: { body: "", marks: "M4 10A8 8 0 1 1 6 18M4 4V10H10" },
  folder: { body: "M3 5H9L12 8H21V20H3Z", marks: "M3 11H21" },
  notebook: {
    body: "M5 3H20V21H5Z",
    marks: "M9 3V21M3 7H6M3 12H6M3 17H6M13 8H16",
  },
  dataset: { body: "M3 4H21V20H3Z", marks: "M3 9H21M3 14H21M9 4V20" },
  chart: { body: "M8 20V12H13V20ZM13 20V5H18V20Z", marks: "M3 4V20H21" },
  code: { body: "", marks: "M7 7L2 12L7 17M17 7L22 12L17 17M14 4L10 20" },
  agent: { body: "M4 7H20V20H4Z", marks: "M12 3V7M8 12V13M16 12V13M9 17H15" },
} as const

export type IconName = keyof typeof iconPaths
export type IconTreatment = "outline" | "paper"

export function JbmIcon({
  name,
  size = 24,
  color = "currentColor",
  treatment = "outline",
  paperColor = palette.bg,
  label,
  style,
}: {
  /** One of the twelve original icon names. */
  name: IconName
  /** Square size in CSS pixels; invalid values fall back to 24. */
  size?: number
  /** Outline and interior marks; inherits text color by default. */
  color?: string
  /** Outline is transparent; paper fills only enclosed silhouettes. */
  treatment?: IconTreatment
  /** Fill used by the paper treatment; set explicitly for dark surfaces. */
  paperColor?: string
  /** Accessible name for a meaningful standalone image; omit beside labeled controls. */
  label?: string
  /** Inline layout overrides, such as verticalAlign or margin. */
  style?: CSSProperties
}) {
  const geometry = iconPaths[name]
  const dimension = Number.isFinite(size) && size > 0 ? size : 24
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke.outline * (2 / 3)}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={{
        display: "inline-block",
        flexShrink: 0,
        verticalAlign: "middle",
        ...style,
      }}
    >
      {geometry.body && (
        <path
          d={geometry.body}
          fill={treatment === "paper" ? paperColor : "none"}
        />
      )}
      {geometry.marks && <path d={geometry.marks} />}
    </svg>
  )
}
