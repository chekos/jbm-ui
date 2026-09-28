import { color, outlineIn } from "../lib/tokens"
export type ToolCaddyProps = { x?: number; y?: number; w?: number }
/** Empty divided desktop organizer. Tools are separate objects. */
export function ToolCaddy({ x = 0, y = 0, w = 240 }: ToolCaddyProps) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${w / 240})`}
      role="img"
      aria-label="Empty tool caddy"
      stroke={color.ink}
      strokeWidth={outlineIn(240 / w)}
      strokeLinejoin="round"
    >
      <path d="M28 0H240V132L212 164H0V32Z" fill={color.bg} />
      <path d="M28 0H240L212 32H0Z" fill={color.card} />
      <path d="M34 9H222L207 24H20Z" fill={color.ink} />
      <path
        d="M118 24V-23Q118-36 131-36H157Q170-36 170-23V9H158V-20Q158-24 154-24H134Q130-24 130-20V24Z"
        fill={color.card}
      />
      <path d="M137 9L123 24H133L147 9Z" fill={color.card} />
      <path d="M0 32H212V164H0Z" fill={color.card} />
      <path d="M212 32L240 0V132L212 164Z" fill={color.bg} />
    </g>
  )
}
