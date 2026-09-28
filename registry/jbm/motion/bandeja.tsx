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
    stackTop: { x: x + w / 2, y: y + 41 - count * PITCH } satisfies Pt,
  }
}

/** Shallow tray. layers is the settled count; landing adds one incoming sheet. */
export function Bandeja(props: BandejaProps) {
  const { landing = 0 } = props
  const l = bandejaLayout(props)
  const sheet = (y: number, key: number) => (
    <path
      key={key}
      d={`M${l.x + 30} ${y}H${l.x + l.w - 30}L${l.x + l.w - 13} ${y + 26}H${l.x + 13}Z`}
      fill={color.card}
    />
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
      {Array.from({ length: l.count }, (_, i) => sheet(l.y + 24 - i * PITCH, i))}
      {unit(landing) > 0 && (
        <g opacity={unit(landing)}>
          {sheet(l.y + 24 - l.count * PITCH - (1 - unit(landing)) * 90, -1)}
        </g>
      )}
      <path
        d={`M${l.x + 22} ${l.y + 16}L${l.x} ${l.y + 50}V${l.y + 68}H${l.x + l.w}V${l.y + 50}L${l.x + l.w - 22} ${l.y + 16}V${l.y + 29}L${l.x + l.w - 9} ${l.y + 54.5}H${l.x + 9}L${l.x + 22} ${l.y + 29}Z`}
        fill={color.card}
      />
      {/* The finger notch shows three edges, 4.5 units apart so they stay apart at the shared
          outline: the bottom sheet's (y + 50), the tray floor's front (y + 54.5), and its own. */}
      <path
        d={`M${l.x} ${l.y + 47}h${l.w * 0.34}l10 12h${l.w * 0.32 - 20}l10 -12H${l.x + l.w}v21H${l.x}Z`}
        fill={color.card}
      />
    </g>
  )
}
