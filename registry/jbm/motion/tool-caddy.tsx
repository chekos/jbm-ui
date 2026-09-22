import { color, font } from "../lib/tokens"
import { unit } from "../lib/geometry"

export type DeskTool = {
  name: string
  kind?: "ruler" | "stamp" | "knife"
  pulled?: number
}
export type ToolCaddyProps = {
  x?: number
  y?: number
  tools: readonly DeskTool[]
}
export function toolCaddyLayout({ x = 0, y = 0, tools }: ToolCaddyProps) {
  return {
    x,
    y,
    w: Math.max(100, tools.length * 60 + 24),
    tools: tools.map((tool, i) => ({
      x: x + 42 + i * 60,
      y: y - 104 - unit(tool.pulled ?? 0) * 90,
    })),
  }
}
export function ToolCaddy(props: ToolCaddyProps) {
  const l = toolCaddyLayout(props)
  return (
    <g
      role="img"
      aria-label={`Tool caddy: ${props.tools.map((t) => t.name).join(", ")}`}
      stroke={color.ink}
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <path
        d={`M${l.x} ${l.y}q${l.w / 2} -20 ${l.w} 0v54H${l.x}Z`}
        fill={color.bg}
      />
      {props.tools.map((tool, i) => {
        const p = l.tools[i]
        const kind = tool.kind ?? (["ruler", "stamp", "knife"] as const)[i % 3]
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`} fill={color.card}>
            {kind === "ruler" ? (
              <>
                <rect x={-18} y={0} width={36} height={150} rx={2} />
                {Array.from({ length: 12 }, (_, j) => (
                  <path key={j} d={`M-18 ${12 + j * 10}h${j % 2 ? 5 : 9}`} />
                ))}
              </>
            ) : kind === "stamp" ? (
              <>
                <path d="M-11 114V36C-34 11 -15 -5 0 -5S34 11 11 36V114Z" />
                <rect x={-24} y={114} width={48} height={22} rx={3} />
                <path d="M-24 130h48" />
              </>
            ) : (
              <>
                <path d="M-12 38L12 0V140H-12Z" />
                <path d="M-12 48H12M-12 53H12" />
                <circle cy={125} r={3} />
              </>
            )}
            <text
              transform="translate(5 102) rotate(-90)"
              stroke="none"
              fill={color.ink}
              fontFamily={font.mono}
              fontSize={13}
            >
              {tool.name}
            </text>
          </g>
        )
      })}
      <path
        d={`M${l.x} ${l.y + 8}q${l.w / 2} 14 ${l.w} 0v48q-${l.w / 2} 12 -${l.w} 0Z`}
        fill={color.card}
      />
    </g>
  )
}
