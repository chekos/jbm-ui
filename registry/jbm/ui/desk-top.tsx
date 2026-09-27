import { color } from "../lib/tokens"
import { unit, type Box, type Pt } from "../lib/geometry"

export type DeskTopDrawerSide = "start" | "end" | "top" | "bottom"
export type DeskTopProps = {
  /** Desk footprint in parent SVG units, front edge band and drawer region included. */
  box: Box
  /** Light on the whole desk, 0–1: OKLab lightness multiplier k (1 = full cream). Clamped. */
  light?: number
  /** Camera tilt, 0–1: reveals the front edge band along the bottom (0 = straight down). Clamped. */
  edge?: number
  /** Edge that holds an empty drawer region; omit for a desk with no drawer. */
  drawer?: DeskTopDrawerSide
  /** Drawer region depth across its edge, in parent units. Defaults to 40% of the box. */
  drawerSize?: number
}

/** Front band height at full tilt, in parent units. */
export const DESK_EDGE = 22
const SEAM = 6
const WELL = 14

/** Scale a token colour's OKLab lightness by k, the visual language's "depth as light". */
export function deskShade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    lin(c / 255)
  )
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = (0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s) * unit(k)
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const l2 = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m2 = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s2 = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  const out = [
    4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2,
    -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2,
    -0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2,
  ].map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    return Math.round(unit(v) * 255)
      .toString(16)
      .padStart(2, "0")
  })
  return `#${out.join("")}`
}

/**
 * Top-down desk geometry. The box never changes: tilt takes the front band out of the surface's
 * depth, and a drawer region takes its side of the box, separated from the surface by a seam.
 */
export function deskTopLayout({
  box,
  light = 1,
  edge = 0,
  drawer,
  drawerSize,
}: DeskTopProps) {
  const band = DESK_EDGE * unit(edge)
  // The plan view (surface plus drawer region) sits above the front band.
  const plan = { x: box.x, y: box.y, w: box.w, h: box.h - band }
  const across = drawer === "top" || drawer === "bottom" ? plan.h : plan.w
  const depth = drawer
    ? Math.max(
        SEAM + 2 * WELL + 8,
        Math.min(across * 0.8, drawerSize ?? box.w * 0.4)
      )
    : 0
  let surface: Box = plan
  let region: Box | null = null
  if (drawer === "start") {
    region = { ...plan, w: depth - SEAM }
    surface = { ...plan, x: plan.x + depth, w: plan.w - depth }
  } else if (drawer === "end") {
    region = { ...plan, x: plan.x + plan.w - depth + SEAM, w: depth - SEAM }
    surface = { ...plan, w: plan.w - depth }
  } else if (drawer === "top") {
    region = { ...plan, h: depth - SEAM }
    surface = { ...plan, y: plan.y + depth, h: plan.h - depth }
  } else if (drawer === "bottom") {
    region = { ...plan, y: plan.y + plan.h - depth + SEAM, h: depth - SEAM }
    surface = { ...plan, h: plan.h - depth }
  }
  const well = region && {
    x: region.x + WELL,
    y: region.y + WELL,
    w: region.w - 2 * WELL,
    h: region.h - 2 * WELL,
  }
  const k = unit(light)
  return {
    box,
    /** The flat top that sheets and axes lie on. */
    surface,
    /** Its centre, where Ejes cross by default. */
    center: {
      x: surface.x + surface.w / 2,
      y: surface.y + surface.h / 2,
    } satisfies Pt,
    /** The drawer region's outer panel and its recessed opening, or null. */
    drawer: region && well ? { panel: region, well } : null,
    /** The front edge band revealed by tilt; h is 0 when edge is 0. */
    front: { x: box.x, y: box.y + box.h - band, w: box.w, h: band },
    fill: {
      surface: deskShade(color.bg, k),
      front: deskShade(color.bg, k * 0.93),
      panel: deskShade(color.bg, k * 0.97),
      well: deskShade(color.bg, k * 0.9),
    },
  }
}

/** A cream desk seen from above: an empty surface, optional drawer region and front edge. */
export function DeskTop({ light = 1, edge = 0, ...props }: DeskTopProps) {
  const l = deskTopLayout({ ...props, light, edge })
  const { front, surface, drawer, fill } = l
  // The drawer front shows in the band under its region; a top drawer faces away.
  const handle =
    drawer && front.h >= 12 && props.drawer !== "top"
      ? {
          x: drawer.panel.x + drawer.panel.w / 2 - 22,
          y: front.y + front.h / 2 - 3,
        }
      : null
  // Corners that meet the band are square, so the contours share one edge.
  const r = (b: Box): [number, number] =>
    b.y + b.h >= front.y - 0.5 && front.h > 0 ? [4, 0] : [4, 4]
  return (
    <g
      role="img"
      aria-label={`Desk seen from above${props.drawer ? ", with a drawer" : ""}`}
      stroke={color.ink}
      strokeWidth={2}
      strokeLinejoin="round"
    >
      {front.h > 0 && (
        <path d={roundedRect(front, 0, 4)} fill={fill.front} />
      )}
      {drawer && (
        <>
          <path d={roundedRect(drawer.panel, ...r(drawer.panel))} fill={fill.panel} />
          <rect {...rect(drawer.well)} rx={3} fill={fill.well} />
        </>
      )}
      <path d={roundedRect(surface, ...r(surface))} fill={fill.surface} />
      {handle && (
        <rect
          x={handle.x}
          y={handle.y}
          width={44}
          height={6}
          rx={3}
          fill={color.card}
        />
      )}
    </g>
  )
}

/** Closed rectangle path with separate top and bottom corner radii. */
function roundedRect({ x, y, w, h }: Box, top: number, bottom: number) {
  const W = Math.max(0, w),
    H = Math.max(0, h)
  const t = Math.min(top, W / 2, H / 2),
    b = Math.min(bottom, W / 2, H / 2)
  return `M${x + t} ${y}H${x + W - t}${t ? `A${t} ${t} 0 0 1 ${x + W} ${y + t}` : ""}V${y + H - b}${b ? `A${b} ${b} 0 0 1 ${x + W - b} ${y + H}` : ""}H${x + b}${b ? `A${b} ${b} 0 0 1 ${x} ${y + H - b}` : ""}V${y + t}${t ? `A${t} ${t} 0 0 1 ${x + t} ${y}` : ""}Z`
}

function rect({ x, y, w, h }: Box) {
  return { x, y, width: Math.max(0, w), height: Math.max(0, h) }
}
