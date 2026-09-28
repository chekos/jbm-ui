import { color, stroke } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

/**
 * keycap, keyboard, and mug are seen from above, like the desk they sit on; mug-side is the same
 * mug seen from the side, standing upright, for a hand that holds it.
 */
export type DeskPropKind = "keycap" | "keyboard" | "mug" | "mug-side"
export type DeskPropProps = {
  kind: DeskPropKind
  /** Centre of the prop's footprint, in parent SVG units. */
  x: number
  y: number
  /** Uniform size multiplier; the ink stroke stays `weight` parent units. Defaults to 1. */
  scale?: number
  /** Ink stroke width in parent units at any scale. Default stroke.outline (3), the shared outline. A small keyboard draws its key outlines at no more than half the gap between keys. */
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
  keyboard: { w: 314, h: 100 },
  mug: { w: 90, h: 78 },
  "mug-side": { w: 90, h: 78 },
} as const satisfies Record<DeskPropKind, { w: number; h: number }>

type Key = { x: number; y: number; w: number; h: number }
/** Keyboard key pitch (one key unit) and the gap between neighbouring keys, in local units. */
const PITCH = 20,
  GAP = 6
/**
 * A compact keyboard's four rows in key units (15 to a row): letter rows offset by their
 * modifiers (tab, caps, shift) so no column lines up, and a modifier row around the space bar.
 */
const KEY_ROWS: readonly (readonly number[])[] = [
  [1.5, ...Array(12).fill(1), 1.5], // tab, 12 letters, backslash
  [1.75, ...Array(11).fill(1), 2.25], // caps, 11 letters, return
  [2.25, ...Array(10).fill(1), 2.75], // shift, 10 letters, shift
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25], // ctrl, alt, cmd, space, cmd, alt, fn, ctrl
]
/**
 * Keyboard keys in local units (centre origin), row by row from the top left: 14 on the top row,
 * 13 on the home row, 12 on the shift row, then 8 modifiers around the space bar (index 42).
 */
export const deskPropKeys: readonly Key[] = (() => {
  const { w, h } = deskPropSize.keyboard
  const left = -w / 2 + (w - (15 * PITCH - GAP)) / 2
  const top = -h / 2 + (h - (KEY_ROWS.length * PITCH - GAP)) / 2
  const keys: Key[] = []
  KEY_ROWS.forEach((row, r) => {
    let x = left
    for (const units of row) {
      keys.push({ x, y: top + r * PITCH, w: units * PITCH - GAP, h: PITCH - GAP })
      x += units * PITCH
    }
  })
  return keys
})()
/** The keyboard's home-row key nearest its centre (H), where deskPropLayout's contact lands. */
export const deskPropHomeKey = 20

// Mug from above, like the keycap and keyboard: a round body with its rim, the handle to the right.
const MUG = { cx: -8, r: 36, rim: 28, handle: { x0: 20, x1: 44, half: 8 } }
/**
 * Mug from the side, standing upright: a body a little taller than wide with rounded bottom
 * corners, the rim's ellipse across its top (filled like the top-down mug's), and a C-shaped
 * handle to the right whose ends run under the body.
 */
const MUG_SIDE = {
  left: -40,
  right: 20,
  top: -31,
  bottom: 36,
  corner: 10,
  rim: 6,
  handle: { cy: -2, outer: 19, inner: 11 },
}
/** Ink wash on a pressed key face at full travel: the visual language's deepest light, 0.72. */
const PRESS_WASH = 0.28

const r2 = (n: number) => Math.round(n * 100) / 100

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
  const S = MUG_SIDE
  const contact =
    kind === "keycap"
      ? toParent({ x: 0, y: -3 + sink })
      : kind === "keyboard"
        ? keyCenters[deskPropHomeKey] // the home-row key nearest the middle
        : kind === "mug"
          ? toParent({ x: (MUG.cx + MUG.r + MUG.handle.x1) / 2, y: 0 }) // on the handle
          : toParent({ x: S.left, y: (S.top + S.bottom) / 2 }) // the body's free side
  return {
    kind,
    center: { x, y } satisfies Pt,
    size: { w: w * scale, h: h * scale },
    corners,
    /** Where a fingertip or grip meets the prop. */
    contact,
    /** mug-side only: the rim's near (left) end, where a thumb crosses over the top. Null otherwise. */
    rim: kind === "mug-side" ? toParent({ x: S.left, y: S.top }) : null,
    /** Keyboard key centres, in the order of deskPropKeys; empty for the other kinds. */
    keys: kind === "keyboard" ? keyCenters : [],
    transform: `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`,
  }
}

const labels: Record<DeskPropKind, string> = {
  keycap: "Keycap",
  keyboard: "Keyboard",
  mug: "Mug",
  "mug-side": "Mug, side view",
}

/** A small free-standing desk object: a keycap, a keyboard, or a mug (from above or the side). Hands are separate. */
export function DeskProp({
  scale = 1,
  rotate = 0,
  press = 0,
  keys = [],
  weight = stroke.outline,
  ...props
}: DeskPropProps) {
  const { kind } = props
  const l = deskPropLayout({ ...props, scale, rotate, press })
  const p = unit(press)
  // The group is scaled, so the stroke is divided by scale to stay `weight` parent units.
  const line = weight / (scale || 1)
  // Key outlines never take more than half the gap between keys, so a small keyboard keeps
  // cream between its keys instead of fusing into an ink grid. The case keeps the full weight.
  const keyLine = Math.min(line, GAP / 2)
  const S = MUG_SIDE
  const H = S.handle
  return (
    <g
      transform={l.transform}
      role="img"
      aria-label={labels[kind]}
      stroke={color.ink}
      strokeWidth={line}
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
          <rect
            x={-deskPropSize.keyboard.w / 2}
            y={-deskPropSize.keyboard.h / 2}
            width={deskPropSize.keyboard.w}
            height={deskPropSize.keyboard.h}
            rx={10}
          />
          {deskPropKeys.map((k, i) => {
            // A pressed key sinks a tenth of its short side (at most 3 units) on every side and
            // takes a light ink wash, so it keeps the shape of its neighbours.
            const down = keys.includes(i) ? p : 0
            const inset = Math.min(3, 0.1 * Math.min(k.w, k.h)) * down
            const face = {
              x: r2(k.x + inset),
              y: r2(k.y + inset),
              width: r2(k.w - 2 * inset),
              height: r2(k.h - 2 * inset),
              rx: 3,
            }
            return (
              <g key={i} data-key={i}>
                <rect {...face} strokeWidth={keyLine < line ? r2(keyLine) : undefined} fill={down > 0 ? color.bg : color.card} />
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
      {kind === "mug-side" && (
        <>
          {/* One C-shaped handle: a band between two concentric half circles, its ends tucked
              under the body so only the loop shows. */}
          <path
            data-part="handle"
            d={`M${S.right - 6} ${H.cy - H.outer}H${S.right}A${H.outer} ${H.outer} 0 0 1 ${S.right} ${H.cy + H.outer}H${S.right - 6}V${H.cy + H.inner}H${S.right}A${H.inner} ${H.inner} 0 0 0 ${S.right} ${H.cy - H.inner}H${S.right - 6}Z`}
          />
          <path
            data-part="body"
            d={`M${S.left} ${S.top}V${S.bottom - S.corner}A${S.corner} ${S.corner} 0 0 0 ${S.left + S.corner} ${S.bottom}H${S.right - S.corner}A${S.corner} ${S.corner} 0 0 0 ${S.right} ${S.bottom - S.corner}V${S.top}Z`}
          />
          {/* The rim: the mouth seen slightly from above, meeting the sides at its ends. */}
          <ellipse
            data-part="rim"
            cx={(S.left + S.right) / 2}
            cy={S.top}
            rx={(S.right - S.left) / 2}
            ry={S.rim}
            fill={color.line}
          />
        </>
      )}
    </g>
  )
}
