import { color, stroke } from "../lib/tokens"
import { unit, type Box, type Pt } from "../lib/geometry"

export type DeskTopDrawerSide = "start" | "end" | "top" | "bottom"
export type DeskTopProps = {
  /** Desk footprint in parent SVG units, front edge band and drawer region included. */
  box: Box
  /**
   * Light on the whole desk, 0–1 (1 = full cream). Fills mix toward the palette's line token,
   * reaching it at 0.72, then toward ink. Clamped.
   */
  light?: number
  /** Camera tilt, 0–1: reveals the front edge band along the bottom (0 = straight down). Clamped. */
  edge?: number
  /** Edge that holds an open drawer, its front and pull on that edge; omit for no drawer. */
  drawer?: DeskTopDrawerSide
  /**
   * Drawer region depth across its edge, in parent units: along the width for start/end, along
   * the height for top/bottom. Defaults to 40% of that dimension.
   */
  drawerSize?: number
}

/** Front band height at full tilt, in parent units. */
export const DESK_EDGE = 22
const SEAM = 6
/** The drawer's side and back walls; its front is thicker and carries the pull. */
const WALL = 10
const FRONT = { min: 16, max: 34 }
/** The deepest light the visual language uses (the back folder): the desk is line-grey there. */
const DEEP = 0.72

type Lab = [number, number, number]
const srgbToLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
function toLab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    srgbToLinear(c / 255)
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
function toHex([L, A, B]: Lab): string {
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
const mix = (a: Lab, b: Lab, t: number): Lab =>
  [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as Lab

/** Scale a #rrggbb colour's OKLab lightness by k, keeping its chroma. Clamped. */
export function deskShade(hex: string, k: number): string {
  const [L, A, B] = toLab(hex)
  return toHex([L * unit(k), A, B])
}

/**
 * A token colour under light k, on the palette: mixed in OKLab from the colour toward the line
 * token as k falls from 1 to 0.72 (the visual language's deepest folder), then from line toward
 * ink. 1 returns the colour; lower is always darker.
 */
export function deskLight(hex: string, k: number): string {
  const c = unit(k)
  const line = toLab(color.line)
  if (c >= DEEP) return toHex(mix(toLab(hex), line, (1 - c) / (1 - DEEP)))
  return toHex(mix(line, toLab(color.ink), (DEEP - c) / DEEP))
}

/**
/**
 * Top-down desk geometry. The box never changes: tilt takes the front band out of the surface's
 * depth, and a drawer takes its side of the box, pulled out past the desk's edge (the seam).
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
        SEAM + WALL + FRONT.min + 12,
        Math.min(across * 0.8, drawerSize ?? across * 0.4)
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
  // Drawer parts in local units: u runs out from the seam's centre line to the region's outer
  // edge, v along the edge. The drawer box is narrower than the desk, so it reads as pulled out.
  const vertical = drawer === "start" || drawer === "end"
  const U = depth - SEAM / 2
  const V = vertical ? plan.h : plan.w
  const seamAt = !drawer
    ? 0
    : drawer === "end"
      ? surface.x + surface.w + SEAM / 2
      : drawer === "start"
        ? surface.x - SEAM / 2
        : drawer === "bottom"
          ? surface.y + surface.h + SEAM / 2
          : surface.y - SEAM / 2
  const out = drawer === "start" || drawer === "top" ? -1 : 1
  const local = (u0: number, u1: number, v0: number, v1: number): Box => {
    const a = seamAt + out * u0,
      b = seamAt + out * u1
    const lo = Math.min(a, b),
      len = Math.abs(b - a)
    return vertical
      ? { x: lo, y: plan.y + v0, w: len, h: v1 - v0 }
      : { x: plan.x + v0, y: lo, w: v1 - v0, h: len }
  }
  const inset = Math.min(V * 0.12, 48)
  const thick = Math.min(FRONT.max, Math.max(FRONT.min, (depth - SEAM) * 0.16))
  const t = thick * 0.56
  const len = Math.min(t * 2.9, (V - 2 * inset) * 0.5)
  const parts = drawer
    ? {
        /** The drawer box as drawn, from the seam line to its front. */
        drawn: local(0, U, inset, V - inset),
        /** Its opening as drawn: open toward the seam, where it runs on under the desk. */
        opening: local(0, U - thick, inset + WALL, V - inset - WALL),
        body: local(SEAM / 2, U, inset, V - inset),
        well: local(SEAM / 2, U - thick, inset + WALL, V - inset - WALL),
        front: local(U - thick, U, inset, V - inset),
        pull: local(U - thick / 2 - t / 2, U - thick / 2 + t / 2, V / 2 - len / 2, V / 2 + len / 2),
      }
    : null
  // The desk slab: the surface out to the seam line.
  const slab: Box = !drawer
    ? plan
    : vertical
      ? drawer === "end"
        ? { ...plan, w: seamAt - plan.x }
        : { ...plan, x: seamAt, w: plan.x + plan.w - seamAt }
      : drawer === "bottom"
        ? { ...plan, h: seamAt - plan.y }
        : { ...plan, y: seamAt, h: plan.y + plan.h - seamAt }
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
    /**
     * The drawer: its region (panel), the pulled-out box inside it (body), the recessed opening
     * (well), the thicker front wall on the outer edge (front), and the pull plate on it; or null.
     */
    drawer:
      region && parts
        ? {
            panel: region,
            body: parts.body,
            well: parts.well,
            front: parts.front,
            pull: parts.pull,
          }
        : null,
    /** The front edge band revealed by tilt; h is 0 when edge is 0. */
    front: { x: box.x, y: box.y + box.h - band, w: box.w, h: band },
    /** The whole plan (surface, seam, and drawer region) above the band. */
    plan,
    /** The desk top as drawn: the surface out to the seam line. */
    slab,
    /** Drawing geometry for DeskTop; not part of the documented layout. */
    drawn: parts && { body: parts.drawn, opening: parts.opening },
    fill: {
      surface: deskLight(color.bg, k),
      handle: deskLight(color.card, k),
      front: deskLight(color.bg, k - 0.1),
      panel: deskLight(color.card, k),
      well: deskLight(color.bg, k - 0.16),
    },
  }
}

/** A cream desk seen from above: an empty surface, an optional open drawer, and a front edge. */
export function DeskTop({ light = 1, edge = 0, ...props }: DeskTopProps) {
  const l = deskTopLayout({ ...props, light, edge })
  const { front, slab, drawer, drawn, fill } = l
  const side = props.drawer
  const R = 4
  const banded = front.h > 0
  // A band thinner than two lines would merge into one heavy edge: it fades in over its first
  // 6 units while the corners it squares off lose their radius, so small tilts stay continuous.
  const fade = Math.min(1, front.h / 6)
  const square = R * (1 - fade)
  // The band is the desk's front face under the slab; under a side drawer it is the drawer box's
  // own near face, and a drawer pulled toward the camera shows only its own.
  const slabOnBand = banded && side !== "bottom"
  const slabR: Corners = {
    tl: R,
    tr: R,
    br: slabOnBand ? square : R,
    bl: slabOnBand ? square : R,
  }
  const deskBand: Box | null = slabOnBand ? { ...front, x: slab.x, w: slab.w } : null
  const body = drawn?.body
  const nearFace: Box | null =
    banded && body && side !== "top"
      ? side === "bottom"
        ? { ...front, x: body.x, w: body.w }
        : { x: body.x, y: body.y + body.h, w: body.w, h: front.h }
      : null
  // Drawer corners: square where the box runs on under the desk, rounded at its free end.
  const bodyR: Corners =
    side === "end"
      ? { tl: 0, tr: R, br: nearFace ? square : R, bl: 0 }
      : side === "start"
        ? { tl: R, tr: 0, br: 0, bl: nearFace ? square : R }
        : side === "top"
          ? { tl: R, tr: R, br: 0, bl: 0 }
          : { tl: 0, tr: 0, br: nearFace ? square : R, bl: nearFace ? square : R }
  const faceR: Corners =
    side === "end"
      ? { tl: 0, tr: 0, br: R, bl: 0 }
      : side === "start"
        ? { tl: 0, tr: 0, br: 0, bl: R }
        : { tl: 0, tr: 0, br: R, bl: R }
  const pull = drawer?.pull
  const bar =
    pull &&
    (pull.w >= pull.h
      ? { x: pull.x + pull.w * 0.125, y: pull.y + pull.h * 0.3, w: pull.w * 0.75, h: pull.h * 0.4 }
      : { x: pull.x + pull.w * 0.3, y: pull.y + pull.h * 0.125, w: pull.w * 0.4, h: pull.h * 0.75 })
  return (
    <g
      role="img"
      aria-label={`Desk seen from above${side ? ", with a drawer" : ""}`}
      stroke={color.ink}
      strokeWidth={stroke.outline}
      strokeLinejoin="round"
    >
      {/* The slab goes over the drawer, so its outline is the one seam line. */}
      {deskBand && (
        <path
          d={roundedRect(deskBand, { tl: 0, tr: 0, br: R, bl: R })}
          fill={fill.front}
          opacity={fade < 1 ? fade : undefined}
        />
      )}
      {drawer && body && drawn && (
        <>
          {nearFace && (
            <path
              d={roundedRect(nearFace, faceR)}
              fill={fill.front}
              opacity={fade < 1 ? fade : undefined}
            />
          )}
          <path d={roundedRect(body, bodyR)} fill={fill.panel} />
          <path d={openRect(drawn.opening, side!, 3)} fill={fill.well} />
        </>
      )}
      <path d={roundedRect(slab, slabR)} fill={fill.surface} />
      {pull && bar && (
        <>
          <rect {...rect(pull)} rx={Math.min(pull.w, pull.h) * 0.12} fill={fill.handle} />
          <rect {...rect(bar)} fill={color.ink} stroke="none" />
        </>
      )}
    </g>
  )
}

type Corners = { tl: number; tr: number; br: number; bl: number }
/** Closed rectangle path with a radius per corner. */
function roundedRect({ x, y, w, h }: Box, c: Corners) {
  const W = Math.max(0, w),
    H = Math.max(0, h)
  const [tl, tr, br, bl] = [c.tl, c.tr, c.br, c.bl].map((r) =>
    Math.min(r, W / 2, H / 2)
  )
  const arc = (r: number, ex: number, ey: number) =>
    r ? `A${r} ${r} 0 0 1 ${ex} ${ey}` : ""
  return `M${x + tl} ${y}H${x + W - tr}${arc(tr, x + W, y + tr)}V${y + H - br}${arc(br, x + W - br, y + H)}H${x + bl}${arc(bl, x, y + H - bl)}V${y + tl}${arc(tl, x + tl, y)}Z`
}

/**
 * The drawer's opening: rounded on its three drawn sides and open on the seam side, where it
 * runs on under the desk (the fill closes along the seam line, the stroke does not).
 */
function openRect({ x, y, w, h }: Box, side: DeskTopDrawerSide, r: number) {
  const W = Math.max(0, w),
    H = Math.max(0, h)
  const q = Math.min(r, W / 2, H / 2)
  const a = (ex: number, ey: number) => `A${q} ${q} 0 0 1 ${ex} ${ey}`
  // Start at the seam end of one side and walk the three drawn sides clockwise.
  if (side === "end")
    return `M${x} ${y}H${x + W - q}${a(x + W, y + q)}V${y + H - q}${a(x + W - q, y + H)}H${x}`
  if (side === "start")
    return `M${x + W} ${y + H}H${x + q}${a(x, y + H - q)}V${y + q}${a(x + q, y)}H${x + W}`
  if (side === "bottom")
    return `M${x + W} ${y}V${y + H - q}${a(x + W - q, y + H)}H${x + q}${a(x, y + H - q)}V${y}`
  return `M${x} ${y + H}V${y + q}${a(x + q, y)}H${x + W - q}${a(x + W, y + q)}V${y + H}`
}

function rect({ x, y, w, h }: Box) {
  return { x, y, width: Math.max(0, w), height: Math.max(0, h) }
}
