import { color, stroke } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

export type BandejaProps = {
  x?: number
  y?: number
  w?: number
  layers?: number
  landing?: number
}
/**
 * Rise from one settled sheet to the next: the shared outline plus 2 units, so stacked edges keep a
 * clear 2-unit gap at any outline weight instead of fusing into one ink bar.
 */
const PITCH = stroke.outline + 2
/** Tray lines the sheets must clear: the back rim (y + 16). */
const RIM = 16
/** Sheet depth: a whole number of pitches, so a lower sheet's edge that reaches the rim lies on it. */
const SHEET = 5 * PITCH
/**
 * Sheet footprint insets from the tray's sides: the far edge is narrower than the near one, and the
 * near corners stay PITCH + 1 inside the wall posts (x + 22) so the stack's sides never run
 * alongside a wall.
 */
const INSET = { far: 36, near: 22 + PITCH + 1 }
/**
 * Top edge of sheet `i` (0 is the bottom sheet), relative to y. The bottom sheet lies in the well
 * at y + 24; the next clears the whole rim band and sits a pitch above the rim, and the rest rise a
 * pitch at a time, so no top edge ever lands within a pitch of the back rim.
 */
function sheetTop(i: number) {
  return i === 0 ? 24 : RIM - i * PITCH
}
export function bandejaLayout({
  x = 0,
  y = 0,
  w = 280,
  layers = 0,
}: BandejaProps) {
  const count = Math.max(0, Math.floor(Number.isFinite(layers) ? layers : 0))
  return {
    x,
    y,
    w,
    count,
    floor: { x: x + w / 2, y: y + 41 } satisfies Pt,
    stackTop: { x: x + w / 2, y: y + sheetTop(count) + 17 } satisfies Pt,
  }
}

/** Shallow tray. layers is the settled count; landing adds one incoming sheet. */
export function Bandeja(props: BandejaProps) {
  const { landing = 0 } = props
  const l = bandejaLayout(props)
  const far = { l: l.x + INSET.far, r: l.x + l.w - INSET.far }
  const near = { l: l.x + INSET.near, r: l.x + l.w - INSET.near }
  // The top sheet shows its whole face; each sheet under it shows only its near edge, as a band
  // from the sheet above's near edge down to its own. The bands share straight upright sides, so the
  // stack reads as one ream instead of a comb of offset corners.
  const face = (top: number, key: number) => (
    <path
      key={key}
      d={`M${far.l} ${top}H${far.r}L${near.r} ${top + SHEET}H${near.l}Z`}
      fill={color.card}
    />
  )
  const band = (from: number, to: number, key: number) => (
    <path key={key} d={`M${near.l} ${from}H${near.r}V${to}H${near.l}Z`} fill={color.card} />
  )
  const settled = Array.from({ length: l.count }, (_, i) =>
    i === l.count - 1
      ? face(l.y + sheetTop(i), i)
      : band(l.y + sheetTop(i + 1) + SHEET, l.y + sheetTop(i) + SHEET, i),
  )
  return (
    <g
      role="img"
      aria-label={`Paper tray, ${l.count} sheets`}
      stroke={color.ink}
      strokeWidth={stroke.outline}
      strokeLinejoin="round"
    >
      <path
        d={`M${l.x + 22} ${l.y + 16}H${l.x + l.w - 22}L${l.x + l.w} ${l.y + 56}H${l.x}Z`}
        fill={color.bg}
      />
      {settled}
      {unit(landing) > 0 && (
        <g opacity={unit(landing)}>{face(l.y + sheetTop(l.count) - (1 - unit(landing)) * 90, -1)}</g>
      )}
      <path
        d={`M${l.x + 22} ${l.y + 16}L${l.x} ${l.y + 50}V${l.y + 68}H${l.x + l.w}V${l.y + 50}L${l.x + l.w - 22} ${l.y + 16}V${l.y + 29}L${l.x + l.w - 9} ${l.y + 54.5}H${l.x + 9}L${l.x + 22} ${l.y + 29}Z`}
        fill={color.card}
      />
      {/* The finger notch shows three edges, 4.5 units apart so they stay apart at the shared
          outline: the bottom sheet's (y + 49), the tray floor's front (y + 54.5), and its own. */}
      <path
        d={`M${l.x} ${l.y + 47}h${l.w * 0.34}l10 12h${l.w * 0.32 - 20}l10 -12H${l.x + l.w}v21H${l.x}Z`}
        fill={color.card}
      />
    </g>
  )
}
