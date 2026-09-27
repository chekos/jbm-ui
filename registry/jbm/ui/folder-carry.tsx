import { FolderOutline, fitLine, oklab } from "./folder"
import { color, font, sansWidth } from "../lib/tokens"
import { pointOn, unit, type Pt } from "../lib/geometry"

export type FolderGeometry = {
  x: number
  y: number
  w: number
  h: number
  tabX: number
  tabWidth: number
  tabHeight?: number
  tabSlope?: number
  /**
   * Absolute y of the front flap's top edge (the fold line). Defaults to 40/27 of the tab height
   * below the body top; cajonLayout().folders[i] carries its own, so a drawer folder keeps it.
   */
  flap?: number
}
/** The fold line's offset below the folder's top edge. */
const flapOffset = (g: FolderGeometry) =>
  g.flap !== undefined && Number.isFinite(g.flap)
    ? g.flap - g.y
    : ((g.tabHeight ?? 27) * 40) / 27
export const folderGrip = (g: FolderGeometry): Pt => ({
  x: g.tabX + g.tabWidth / 2,
  y: g.y + ((g.tabHeight ?? 27) * 10) / 27,
})
/**
 * Mano placement that holds a folder by its tab from above: the pinch pose turned so the wrist is
 * up and left, the pocket between index and thumb (Hand viewBox 6.4, 12.1) on the grip point, so
 * the tab's top edge runs through the pinch and its stepped silhouette stays in view. Spread it into
 * a Mano at pointOn(path, progress); add up to ±15° to `angle` for a tilt that still reads as a
 * pinch (further round, the hand reads as pointing).
 */
export const folderCarryHand = {
  pose: "pinch",
  angle: 155,
  anchor: { x: 6.4, y: 12.1 },
} as const
export const tableFolderGeometry =(at: Pt, width: number): FolderGeometry => {
  const k = width / 260
  return {
    x: at.x + 25 * k,
    y: at.y + 55 * k,
    w: 205 * k,
    h: 150 * k,
    tabX: at.x + 25 * k,
    tabWidth: 83 * k,
    tabHeight: 27 * k,
    tabSlope: 17 * k,
    // Folder's front panel starts 40 below its body top (y 95 in the 260 frame).
    flap: at.y + 95 * k,
  }
}
/** Shared geometry for the object and its hand. A caller can supply drawer geometry directly. */
export function carriedFolderGeometry(
  from: FolderGeometry,
  to: FolderGeometry,
  path: readonly Pt[],
  progress: number
): FolderGeometry {
  const p = unit(progress),
    at = pointOn(path, p)
  const mix = (a: number, b: number) => a + (b - a) * p
  const tabWidth = mix(from.tabWidth, to.tabWidth)
  const tabHeight = mix(from.tabHeight ?? 27, to.tabHeight ?? 27)
  const dx = mix(from.tabX - from.x, to.tabX - to.x)
  const x = at.x - tabWidth / 2 - dx
  const y = at.y - (tabHeight * 10) / 27
  return {
    x,
    y,
    w: mix(from.w, to.w),
    h: mix(from.h, to.h),
    tabX: x + dx,
    tabWidth,
    tabHeight,
    tabSlope: mix(from.tabSlope ?? 17, to.tabSlope ?? 17),
    flap: y + mix(flapOffset(from), flapOffset(to)),
  }
}
const luminance = (hex: string) =>
  [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0)
/** WCAG contrast ratio between two #RRGGBB colours, 1–21. */
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const isHex = (c: string) => /^#[0-9a-f]{6}$/i.test(c)
/**
 * Cajon's name rule for any fill: ink or card, whichever contrasts more with it. Every palette fill
 * and drawer shade clears 4.5:1 (card on vermilion 5.0:1, ink on the card and drawerLight shades).
 */
const nameInkOn = (fill: string) =>
  isHex(fill) && contrast(color.ink, fill) >= contrast(color.card, fill) ? color.ink : color.card
/** Folder's placement rule: the name on the tab for light fills (card, drawer shades), the front panel for dark ones. */
const lightFill = (fill: string) => !isHex(fill) || oklab(fill)[0] > 0.6

/** Render inside an SVG. Uses the same full silhouette as Folder and Cajon. */
export function FolderCarry({
  from,
  to,
  path,
  progress,
  label,
  fill = color.accent,
  labelOn = lightFill(fill) ? "tab" : "front",
  labelColor = nameInkOn(fill),
  labelSize,
}: {
  from: FolderGeometry
  to: FolderGeometry
  path: readonly Pt[]
  progress: number
  label?: string
  /** Folder fill, passed to FolderOutline: a palette token or a drawer shade (drawerLight). */
  fill?: string
  /**
   * Where the name prints, for the whole carry: one place, never both. Defaults to Folder's rule:
   * the tab on light fills (card, drawer shades, as in a Cajon), the front panel on vermilion and
   * ink, where it stays clear of the hand on the tab.
   */
  labelOn?: "tab" | "front"
  /** Label color. Defaults to ink or card, whichever contrasts more with the fill (at least 4.5:1 on every palette fill). */
  labelColor?: string
  /**
   * Tab name size in the parent's units. Defaults to Cajon's ratio, 13/27 of the tab height, so a
   * folder lifted from a drawer keeps the drawer's type through the handoff.
   */
  labelSize?: number
}) {
  const g = carriedFolderGeometry(from, to, path, progress)
  const tabHeight = g.tabHeight ?? 27,
    k = tabHeight / 27
  const size =
    labelSize !== undefined && Number.isFinite(labelSize) && labelSize > 0
      ? labelSize
      : (tabHeight * 13) / 27
  // Cajon's tab rule: the name is drawn whole on the tab, compressed when the tab is too short.
  const pad = (size * 8) / 13
  const room = Math.max(1, g.tabWidth - 2 * pad - (g.tabSlope ?? 17))
  const onTab = Boolean(label) && labelOn !== "front"
  const tabText = onTab && label ? sansWidth(label, size) : 0
  const tabScale = tabText > room ? room / tabText : 1
  const front = label && !onTab
    ? fitLine(label, (t) => 0.6 * 16 * k * Array.from(t).length, g.w - 42 * k)
    : null
  const flap = g.flap ?? g.y + 40 * k
  return (
    <g
      role={label ? "img" : undefined}
      aria-label={label ? `Carrying ${label}` : undefined}
    >
      <FolderOutline {...g} fill={fill} />
      <path d={`M${g.x} ${flap}H${g.x + g.w}`} stroke={color.ink} strokeWidth={2} />
      {label && onTab && (
        <text
          transform={`translate(${g.tabX + pad} ${g.y + (tabHeight * 16) / 27}) scale(${+tabScale.toFixed(4)} 1)`}
          fontFamily={font.sans}
          fontWeight={800}
          fontSize={size}
          fill={labelColor}
        >
          {label}
        </text>
      )}
      {front && (
        <text
          transform={`translate(${g.x + 21 * k} ${g.y + g.h - 25 * k}) scale(${+front.scale.toFixed(4)} 1)`}
          fontFamily={font.mono}
          fontSize={16 * k}
          fontWeight={600}
          fill={labelColor}
        >
          {front.text}
        </text>
      )}
    </g>
  )
}
