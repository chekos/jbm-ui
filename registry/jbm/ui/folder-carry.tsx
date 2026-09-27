import { FolderOutline, fitLine, labelInkOn } from "./folder"
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
export const tableFolderGeometry = (at: Pt, width: number): FolderGeometry => {
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
/** Render inside an SVG. Uses the same full silhouette as Folder and Cajon. */
export function FolderCarry({
  from,
  to,
  path,
  progress,
  label,
  fill = color.accent,
  labelColor = labelInkOn(fill),
  labelSize,
}: {
  from: FolderGeometry
  to: FolderGeometry
  path: readonly Pt[]
  progress: number
  label?: string
  /** Folder fill, passed to FolderOutline: a palette token or a drawer shade (drawerLight). */
  fill?: string
  /** Label color. Defaults to ink on light fills (OKLab lightness above 0.6), cream on dark. */
  labelColor?: string
  /**
   * Tab name size in the parent's units. Defaults to Cajon's ratio, 13/27 of the tab height, so a
   * folder lifted from a drawer keeps the drawer's type through the handoff.
   */
  labelSize?: number
}) {
  const g = carriedFolderGeometry(from, to, path, progress)
  const p = unit(progress),
    tabHeight = g.tabHeight ?? 27,
    k = tabHeight / 27
  const size =
    labelSize !== undefined && Number.isFinite(labelSize) && labelSize > 0
      ? labelSize
      : (tabHeight * 13) / 27
  // Cajon's tab rule: the name is drawn whole on the tab, compressed when the tab is too short.
  const pad = (size * 8) / 13
  const room = Math.max(1, g.tabWidth - 2 * pad - (g.tabSlope ?? 17))
  const tabText = label ? sansWidth(label, size) : 0
  const tabScale = tabText > room ? room / tabText : 1
  const front = label
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
      {label && front && (
        <g>
          <text
            transform={`translate(${g.tabX + pad} ${g.y + (tabHeight * 16) / 27}) scale(${+tabScale.toFixed(4)} 1)`}
            fontFamily={font.sans}
            fontWeight={800}
            fontSize={size}
            fill={labelColor}
            opacity={1 - p}
          >
            {label}
          </text>
          <text
            transform={`translate(${g.x + 21 * k} ${g.y + g.h - 25 * k}) scale(${+front.scale.toFixed(4)} 1)`}
            fontFamily={font.mono}
            fontSize={16 * k}
            fontWeight={600}
            fill={labelColor}
            opacity={p}
          >
            {front.text}
          </text>
        </g>
      )}
    </g>
  )
}
