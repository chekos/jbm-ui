import * as React from "react"
import { color, font, sansWidth } from "../lib/tokens"

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

type Lab = [number, number, number]
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const toSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
/** A #RRGGBB colour in OKLab: [lightness 0–1, a, b]. */
export function oklab(hex: string): Lab {
  const [r, g, b] = [1, 3, 5].map((i) =>
    toLinear(parseInt(hex.slice(i, i + 2), 16) / 255)
  )
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
/** An OKLab triple back to #RRGGBB, clamped to sRGB. */
export function oklabHex(lab: readonly [number, number, number]): string {
  const [L, a, b] = lab
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return (
    "#" +
    [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ]
      .map((c) =>
        Math.round(255 * Math.max(0, Math.min(1, toSrgb(c))))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
      .toUpperCase()
  )
}
/** Ink text on light fills (OKLab lightness above 0.6), cream on dark ones. */
export function labelInkOn(fill: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(fill)) return color.bg
  return oklab(fill)[0] > 0.6 ? color.ink : color.bg
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
/**
 * One overflow rule for a line of text in `room` units: draw it whole when it fits, compress it
 * horizontally down to 0.8 when that is enough, else compress to 0.8 and end with an ellipsis.
 */
export function fitLine(
  text: string,
  width: (t: string) => number,
  room: number
): { text: string; scale: number } {
  const full = width(text)
  if (full <= room) return { text, scale: 1 }
  if (full * 0.8 <= room) return { text, scale: room / full }
  const g = Array.from(segmenter.segment(text), (x) => x.segment)
  let n = g.length
  while (n > 1 && width(g.slice(0, n - 1).join("").trimEnd() + "…") * 0.8 > room) n--
  return { text: g.slice(0, n - 1).join("").trimEnd() + "…", scale: 0.8 }
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

/**
 * Placement for type on the front panel: the anchor follows frontPlane, but the glyphs keep their
 * proportions (one uniform scale that shrinks with the panel's foreshortening) instead of being
 * squashed and sheared by the tilt.
 */
export function frontType(u: number, v: number, open: number) {
  const t = (205 - v) / 110
  const sx = 1 + (t * 30 * open) / 205
  const k = +Math.sqrt(1 - (35 * open) / 110).toFixed(4)
  const e = +(127.5 + (u - 127.5) * sx).toFixed(3)
  const f = +(205 - t * (110 - 35 * open)).toFixed(3)
  return `matrix(${k} 0 0 ${k} ${e} ${f})`
}

const TAB_LABEL = 14
export type FolderProps = React.SVGProps<SVGSVGElement> & {
  label?: string
  open?: number
  tone?: FolderTone
  /** Short line printed on the front panel: under the label, or near the panel top when the label is on the tab. */
  sublabel?: string
  /**
   * Where the label prints while the folder is closed. Defaults to the tab for the card tone, the
   * front panel otherwise. Once open is above 0 the sheet stands in front of the tab, so the label
   * prints on the front panel.
   */
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
  const known: FolderTone = tone in folderTones ? tone : "accent"
  const { fill, text } = folderTones[known]
  // On the tab, the label is never truncated: the tab widens to fit it (up to the body width),
  // then the name compresses horizontally.
  // The tab is on the back panel, so a raised sheet stands in front of it: once the folder opens
  // the name moves to the front panel instead of showing as a fragment beside the sheet. The tab
  // keeps the width it was given for the name, so the silhouette never changes with open.
  const tabbed = Boolean(label) && labelOn === "tab"
  const onTab = tabbed && p === 0
  const tabText = tabbed ? sansWidth(label ?? "", TAB_LABEL) : 0
  const tabWidth = tabbed ? Math.min(205, Math.max(83, tabText + 16 + 17)) : 83
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
  // Front-panel lines share one overflow rule: compress to 0.8, then ellipsis.
  const mono = (size: number) => (t: string) =>
    0.6 * size * Array.from(segmenter.segment(t)).length
  const front = label && !onTab ? fitLine(label, mono(16), 172) : null
  const sub = sublabel
    ? fitLine(sublabel, mono(onTab ? 12 : 11), onTab ? 181 : 172)
    : null
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
      {/* The tab name is printed on the back panel: a rising sheet passes in front of it. */}
      {onTab && (
        <text
          transform={`translate(33 73) scale(${tabScale} 1)`}
          fontFamily={font.sans}
          fontSize={TAB_LABEL}
          fontWeight={800}
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
          {/* The sheet's heading bar: vermilion only on the accent folder. */}
          <path
            d="M158 106V164"
            stroke={known === "accent" ? color.accent : color.ink}
            strokeWidth={6}
          />
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
      {front && (
        <text
          transform={`${frontType(46, frontBaseline, p)} scale(${+front.scale.toFixed(4)} 1)`}
          fontFamily={font.mono}
          fontSize={16}
          fontWeight={600}
          fill={text}
        >
          {front.text}
        </text>
      )}
      {sub && (
        <text
          transform={`${frontType(onTab ? 37 : 46, onTab ? 114 : 192, p)} scale(${+sub.scale.toFixed(4)} 1)`}
          fontFamily={font.mono}
          fontSize={onTab ? 12 : 11}
          fill={text}
        >
          {sub.text}
        </text>
      )}
    </svg>
  )
}
