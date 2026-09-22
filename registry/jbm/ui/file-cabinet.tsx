import { color } from "../lib/tokens"
import { Cajon, type CajonProps } from "../motion/cajon"

export type FileCabinetProps = CajonProps
/** The enclosing cabinet is independent of both its drawer and a desk. */
export function FileCabinet({
  x = 0,
  y = 0,
  w = 300,
  h = 360,
  ...props
}: FileCabinetProps) {
  return (
    <g role="img" aria-label="File cabinet">
      <g
        fill={color.card}
        stroke={color.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      >
        <path
          d={`M${x + 14} ${y}H${x + w - 14}L${x + w} ${y + 18}V${y + h}H${x}V${y + 18}Z`}
        />
        <path
          d={`M${x} ${y + 18}H${x + w}M${x + 10} ${y + h - 14}H${x + w - 10}`}
          fill="none"
        />
      </g>
      <Cajon {...props} x={x + 10} y={y + 32} w={w - 20} h={h - 44} />
    </g>
  )
}
