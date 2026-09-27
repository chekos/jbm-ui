import { color } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

export type DeskPropKind = "keycap" | "keyboard" | "mug"
export type DeskPropProps = {
  kind: DeskPropKind
  /** Centre of the prop's footprint, in parent SVG units. */
  x: number
  y: number
  /** Uniform size multiplier; the ink stroke stays `weight` parent units. Defaults to 1. */
  scale?: number
  /** Ink stroke width in parent units at any scale. Default 2, the desk's line weight. */
  weight?: number
  /** Rotation in degrees around the centre. Defaults to 0. */
  rotate?: number
  /** Key travel, 0–1: the keycap sinks, or the keyboard keys listed in `keys` do. Clamped. */
  press?: number
  /** Keyboard only: indices of the keys `press` applies to, row by row (see deskPropKeys). */
  keys?: readonly number[]
}

/** Footprint at scale 1, in parent units (width × height, centred on x, y). */
export const deskPropSize = {
  keycap: { w: 56, h: 56 },
  keyboard: { w: 270, h: 130 },
  mug: { w: 90, h: 78 },
} as const satisfies Record<DeskPropKind, { w: number; h: number }>

type Key = { x: number; y: number; w: number; h: number }
const KEY = 22,
  PITCH = 28
/** Keyboard keys in local units (centre origin): four rows of nine, the last with a space bar. */
export const deskPropKeys: readonly Key[] = (() => {
  const left = -deskPropSize.keyboard.w / 2 + 12
  const top = -deskPropSize.keyboard.h / 2 + 12
  const keys: Key[] = []
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 9; i++)
      keys.push({ x: left + i * PITCH, y: top + row * PITCH, w: KEY, h: KEY })
  const y = top + 3 * PITCH
  const space = 9 * KEY + 8 * 6 - 4 * KEY - 4 * 6
  keys.push({ x: left, y, w: KEY, h: KEY })
  keys.push({ x: left + PITCH, y, w: KEY, h: KEY })
  keys.push({ x: left + 2 * PITCH, y, w: space, h: KEY })
  keys.push({ x: left + 2 * PITCH + space + 6, y, w: KEY, h: KEY })
  keys.push({ x: left + 3 * PITCH + space + 6, y, w: KEY, h: KEY })
  return keys
})()

// Mug from above, like the keycap and keyboard: a round body with its rim, the handle to the right.
const MUG = { cx: -8, r: 36, rim: 28, handle: { x0: 20, x1: 44, half: 8 } }
/** Ink wash on a pressed key face at full travel: the visual language's deepest light, 0.72. */
const PRESS_WASH = 0.28

/** Placement, footprint corners, and contact points in parent units. */
export function deskPropLayout({
  kind,
  x,
  y,
  scale = 1,
  rotate = 0,
  press = 0,
}: DeskPropProps) {
  const a = (rotate * Math.PI) / 180,
    cos = Math.cos(a),
    sin = Math.sin(a)
  const toParent = (p: Pt): Pt => ({
    x: x + scale * (p.x * cos - p.y * sin),
    y: y + scale * (p.x * sin + p.y * cos),
  })
  const { w, h } = deskPropSize[kind]
  const corners = [
    { x: -w / 2, y: -h / 2 },
    { x: w / 2, y: -h / 2 },
    { x: w / 2, y: h / 2 },
    { x: -w / 2, y: h / 2 },
  ].map(toParent)
  const sink = 3 * unit(press)
  const keyCenters = deskPropKeys.map((k) =>
    toParent({ x: k.x + k.w / 2, y: k.y + k.h / 2 })
  )
  const contact =
    kind === "keycap"
      ? toParent({ x: 0, y: -3 + sink })
      : kind === "keyboard"
        ? keyCenters[13] // the middle key of the home row
        : toParent({ x: (MUG.cx + MUG.r + MUG.handle.x1) / 2, y: 0 }) // on the handle
  return {
    kind,
    center: { x, y } satisfies Pt,
    size: { w: w * scale, h: h * scale },
    corners,
    /** Where a fingertip or grip meets the prop. */
    contact,
    /** Keyboard key centres, in the order of deskPropKeys; empty for the other kinds. */
    keys: kind === "keyboard" ? keyCenters : [],
    transform: `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`,
  }
}

/** A small free-standing desk object: a keycap, a keyboard, or a mug. Hands are separate. */
export function DeskProp({
  scale = 1,
  rotate = 0,
  press = 0,
  keys = [],
  weight = 2,
  ...props
}: DeskPropProps) {
  const { kind } = props
  const l = deskPropLayout({ ...props, scale, rotate, press })
  const p = unit(press)
  // The group is scaled, so the stroke is divided by scale to stay `weight` parent units.
  const stroke = weight / (scale || 1)
  return (
    <g
      transform={l.transform}
      role="img"
      aria-label={kind === "keycap" ? "Keycap" : kind === "keyboard" ? "Keyboard" : "Mug"}
      stroke={color.ink}
      strokeWidth={stroke}
      strokeLinejoin="round"
      fill={color.card}
    >
      {kind === "keycap" && (
        <>
          <rect x={-28} y={-28} width={56} height={56} rx={8} />
          {/* The dished top: set back toward the far wall, centred and shrinking as the key
              sinks, with a light ink wash so a pressed key reads at normal size. */}
          <rect
            x={-19 + 4 * p}
            y={-22 + 7 * p}
            width={38 - 8 * p}
            height={38 - 8 * p}
            rx={5}
            fill={p > 0 ? color.bg : color.card}
          />
          {p > 0 && (
            <rect
              x={-19 + 4 * p}
              y={-22 + 7 * p}
              width={38 - 8 * p}
              height={38 - 8 * p}
              rx={5}
              fill={color.ink}
              fillOpacity={+(PRESS_WASH * p).toFixed(3)}
              stroke="none"
            />
          )}
        </>
      )}
      {kind === "keyboard" && (
        <>
          <rect x={-135} y={-65} width={270} height={130} rx={12} />
          {deskPropKeys.map((k, i) => {
            // A pressed key sinks 3 units on every side and takes a light ink wash.
            const down = keys.includes(i) ? p : 0
            const inset = 3 * down
            const face = {
              x: k.x + inset,
              y: k.y + inset,
              width: k.w - 2 * inset,
              height: k.h - 2 * inset,
              rx: 4,
            }
            return (
              <g key={i} data-key={i}>
                <rect {...face} fill={down > 0 ? color.bg : color.card} />
                {down > 0 && (
                  <rect
                    {...face}
                    fill={color.ink}
                    fillOpacity={+(PRESS_WASH * down).toFixed(3)}
                    stroke="none"
                  />
                )}
              </g>
            )
          })}
        </>
      )}
      {kind === "mug" && (
        <>
          {/* The handle runs under the body, so only its free end shows. */}
          <rect
            x={MUG.handle.x0}
            y={-MUG.handle.half}
            width={MUG.handle.x1 - MUG.handle.x0}
            height={2 * MUG.handle.half}
            rx={MUG.handle.half}
          />
          <circle cx={MUG.cx} cy={0} r={MUG.r} />
          <circle cx={MUG.cx} cy={0} r={MUG.rim} fill={color.line} />
        </>
      )}
    </g>
  )
}
