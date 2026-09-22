import { color, font } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

export type BandejaProps = {
  x?: number
  y?: number
  w?: number
  layers?: number
  landing?: number
  costLine?: number
  label?: string
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
    stackTop: { x: x + w / 2, y: y + 41 - count * 4 } satisfies Pt,
  }
}

/** Shallow tray. layers is the settled count; landing adds one incoming sheet. */
export function Bandeja(props: BandejaProps) {
  const { landing = 0, costLine = 52, label = "línea de carga" } = props
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
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <path
        d={`M${l.x + 22} ${l.y + 16}H${l.x + l.w - 22}L${l.x + l.w} ${l.y + 56}H${l.x}Z`}
        fill={color.bg}
      />
      {Array.from({ length: l.count }, (_, i) => sheet(l.y + 24 - i * 4, i))}
      {unit(landing) > 0 && (
        <g opacity={unit(landing)}>
          {sheet(l.y + 24 - l.count * 4 - (1 - unit(landing)) * 90, -1)}
        </g>
      )}
      <path
        d={`M${l.x + 22} ${l.y + 16}L${l.x} ${l.y + 50}V${l.y + 68}H${l.x + l.w}V${l.y + 50}L${l.x + l.w - 22} ${l.y + 16}V${l.y + 29}L${l.x + l.w - 9} ${l.y + 53}H${l.x + 9}L${l.x + 22} ${l.y + 29}Z`}
        fill={color.card}
      />
      <path
        d={`M${l.x} ${l.y + 47}h${l.w * 0.34}l10 9h${l.w * 0.32 - 20}l10 -9H${l.x + l.w}v21H${l.x}Z`}
        fill={color.card}
      />
      <path
        d={`M${l.x - 12} ${l.y - costLine}H${l.x + l.w + 12}`}
        stroke={color.accent}
        strokeDasharray="7 6"
      />
      {label && (
        <text
          x={l.x}
          y={l.y - costLine - 12}
          fontFamily={font.mono}
          fontSize={13}
          fill={color.accent}
          stroke="none"
        >
          {label}
        </text>
      )}
    </g>
  )
}
