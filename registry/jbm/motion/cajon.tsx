import { color, font } from "../lib/tokens"
import { unit, type Box } from "../lib/geometry"

export type DrawerFolder = { name: string; accent?: boolean; pulled?: number }
export type CajonProps = Partial<Box> & {
  folders: readonly DrawerFolder[]
  open?: number
}

/** h is a minimum: a full drawer grows deeper instead of shrinking its labels. */
export function cajonLayout({
  x = 0,
  y = 0,
  w = 420,
  h = 260,
  folders,
  open = 1,
}: CajonProps) {
  if (folders.length > 12)
    throw new Error("Cajon supports up to twelve folders")
  const width = Math.max(
    w,
    ...folders.map((f) => Array.from(f.name).length * 10 + 88)
  )
  const depth = Math.max(h - 100, folders.length * 30 + 30)
  const p = unit(open)
  const front = y - 16 + (depth + 52) * p
  return {
    x,
    y,
    w: width,
    h: depth + 152,
    front,
    folders: folders.map((f, i) => {
      const tabWidth = Array.from(f.name).length * 10 + 30
      const left = x + 26
      const top = y + 26 + i * 30 * p - unit(f.pulled ?? 0) * (110 + i * 30 * p)
      const tabX = left + ((i % 3) * (width - 52 - tabWidth)) / 2
      return {
        x: left,
        y: top,
        w: width - 52,
        tabX,
        tabWidth,
        anchor: { x: tabX + tabWidth / 2, y: top + 13 },
      }
    }),
  }
}

/** SVG group; place inside a scene SVG. All anchor coordinates are scene-local. */
export function Cajon(props: CajonProps) {
  const { folders, open = 1 } = props
  const l = cajonLayout(props)
  const p = unit(open)
  const drawFolder = (f: DrawerFolder, i: number) => {
    const q = l.folders[i]
    return (
      <g key={i}>
        <path
          d={`M${q.x} ${q.y + 25}H${q.tabX}V${q.y}H${q.tabX + q.tabWidth - 16}L${q.tabX + q.tabWidth} ${q.y + 18}H${q.x + q.w}V${q.y + 104}H${q.x}Z`}
          fill={f.accent ? color.accent : color.card}
        />
        <path
          d={`M${q.x + 5} ${q.y + 36}H${q.x + q.w - 5}M${q.x + 5} ${q.y + 40}V${q.y + 98}`}
          fill="none"
        />
        <text
          x={q.tabX + 9}
          y={q.y + 17}
          stroke="none"
          fill={f.accent ? color.card : color.ink}
          fontFamily={font.mono}
          fontSize={16}
        >
          {f.name}
        </text>
      </g>
    )
  }
  return (
    <g
      role="img"
      aria-label={`Filing drawer, ${folders.length} folders`}
      stroke={color.ink}
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <rect
        x={l.x + 13}
        y={l.y + 12}
        width={l.w - 26}
        height={118}
        fill={color.card}
      />
      <path
        d={`M${l.x + 22} ${l.y + 30}H${l.x + l.w - 22}L${l.x + l.w} ${l.front + 28}H${l.x}Z`}
        fill={color.ink}
      />
      <g opacity={p}>
        {folders.map((f, i) =>
          unit(f.pulled ?? 0) === 0 ? drawFolder(f, i) : null
        )}
        {folders.map((f, i) =>
          unit(f.pulled ?? 0) > 0 ? drawFolder(f, i) : null
        )}
      </g>
      <path
        d={`M${l.x + 22} ${l.y + 30}L${l.x} ${l.front + 28}V${l.front + 116}L${l.x + 22} ${l.y + 116}ZM${l.x + l.w - 22} ${l.y + 30}L${l.x + l.w} ${l.front + 28}V${l.front + 116}L${l.x + l.w - 22} ${l.y + 116}Z`}
        fill={color.bg}
      />
      <rect
        x={l.x}
        y={l.front + 28}
        width={l.w}
        height={88}
        rx={2}
        fill={color.card}
      />
      <rect
        x={l.x + l.w / 2 - 49}
        y={l.front + 57}
        width={10}
        height={14}
        rx={2}
        fill={color.bg}
      />
      <rect
        x={l.x + l.w / 2 + 39}
        y={l.front + 57}
        width={10}
        height={14}
        rx={2}
        fill={color.bg}
      />
      <path
        d={`M${l.x + l.w / 2 - 44} ${l.front + 63}v13q0 5 6 5h76q6 0 6 -5v-13`}
        fill="none"
        strokeWidth={6}
        stroke={color.ink}
      />
      <path
        d={`M${l.x + l.w / 2 - 44} ${l.front + 63}v13q0 5 6 5h76q6 0 6 -5v-13`}
        fill="none"
        strokeWidth={2}
        stroke={color.card}
      />
    </g>
  )
}
