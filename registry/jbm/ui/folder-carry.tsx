import { FolderOutline } from "./folder"
import { color, font } from "../lib/tokens"
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
}
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
  return {
    x,
    y: at.y - (tabHeight * 10) / 27,
    w: mix(from.w, to.w),
    h: mix(from.h, to.h),
    tabX: x + dx,
    tabWidth,
    tabHeight,
    tabSlope: mix(from.tabSlope ?? 17, to.tabSlope ?? 17),
  }
}
/** Render inside an SVG. Uses the same full silhouette as Folder and Cajon. */
export function FolderCarry({
  from,
  to,
  path,
  progress,
  label,
}: {
  from: FolderGeometry
  to: FolderGeometry
  path: readonly Pt[]
  progress: number
  label?: string
}) {
  const g = carriedFolderGeometry(from, to, path, progress)
  const p = unit(progress),
    k = (g.tabHeight ?? 27) / 27
  return (
    <g
      role={label ? "img" : undefined}
      aria-label={label ? `Carrying ${label}` : undefined}
    >
      <FolderOutline {...g} />
      <path
        d={`M${g.x} ${g.y + 40 * k}H${g.x + g.w}`}
        stroke={color.ink}
        strokeWidth={2}
      />
      {label && (
        <g>
          <text
            x={g.tabX + 8 * k}
            y={g.y + 15 * k}
            fontFamily={font.mono}
            fontSize={9 * k}
            fill={color.bg}
            opacity={1 - p}
          >
            {label.slice(0, 16)}
          </text>
          <text
            x={g.x + 21 * k}
            y={g.y + g.h - 25 * k}
            fontFamily={font.mono}
            fontSize={16 * k}
            fontWeight={600}
            fill={color.bg}
            opacity={p}
          >
            {label.slice(0, 16)}
          </text>
        </g>
      )}
    </g>
  )
}
