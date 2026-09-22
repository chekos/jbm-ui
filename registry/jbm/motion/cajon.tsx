import { color, font } from "../lib/tokens"
import { unit, type Box } from "../lib/geometry"
import { FolderOutline } from "../ui/folder"

export type DrawerFolder = { name: string; accent?: boolean; pulled?: number }
export type CajonProps = Partial<Box> & {
  folders: readonly DrawerFolder[]
  open?: number
}

/** Fixed physical bounds. Index zero is nearest the drawer front. */
export function cajonLayout({
  x = 0,
  y = 0,
  w = 420,
  h = 420,
  folders,
  open = 1,
}: CajonProps) {
  const p = unit(open)
  const front = y - 22 + 104 * p
  const folderHeight = ((w - 52) * 150) / 205
  const spacing = 48 / Math.max(5, folders.length - 1)
  const frontHeight = folderHeight + 8
  return {
    x,
    y,
    w,
    h,
    front,
    frontHeight,
    folders: folders.map((f, i) => {
      const top =
        front +
        32 -
        62 * p -
        i * spacing * p -
        unit(f.pulled ?? 0) * p * (folderHeight + 24)
      const tabWidth = Math.min((w - 52) * 0.55, 28 + f.name.length * 9)
      const tabX = x + 26 + ((i % 3) * (w - 52 - tabWidth)) / 2
      return {
        x: x + 26,
        y: top,
        w: w - 52,
        h: folderHeight,
        tabX,
        tabWidth,
        anchor: { x: tabX + tabWidth / 2, y: top + 10 },
      }
    }),
  }
}

/** A drawer alone. Complete folders are occluded by its front, never shortened. */
export function Cajon(props: CajonProps) {
  const l = cajonLayout(props)
  return (
    <g
      role="img"
      aria-label={`Filing drawer, ${props.folders.length} folders`}
      stroke={color.ink}
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <path
        d={`M${l.x + 20} ${l.y + 10}H${l.x + l.w - 20}L${l.x + l.w} ${l.front + 32}H${l.x}Z`}
        fill={color.ink}
      />
      {[...props.folders.keys()].reverse().map((i) => {
        const f = props.folders[i],
          q = l.folders[i]
        return (
          <g key={i} data-folder-index={i}>
            <FolderOutline {...q} fill={f.accent ? color.accent : color.card} />
            <path d={`M${q.x + 5} ${q.y + 38}H${q.x + q.w - 5}`} fill="none" />
            <text
              x={q.tabX + 8}
              y={q.y + 16}
              fontFamily={font.mono}
              fontSize={13}
              stroke="none"
              fill={f.accent ? color.card : color.ink}
            >
              {f.name.length > 16 ? f.name.slice(0, 15) + "…" : f.name}
            </text>
          </g>
        )
      })}
      <path
        d={`M${l.x + 20} ${l.y + 10}L${l.x} ${l.front + 32}V${l.front + 32 + l.frontHeight}L${l.x + 20} ${l.y + 10 + l.frontHeight}ZM${l.x + l.w - 20} ${l.y + 10}L${l.x + l.w} ${l.front + 32}V${l.front + 32 + l.frontHeight}L${l.x + l.w - 20} ${l.y + 10 + l.frontHeight}Z`}
        fill={color.bg}
      />
      <rect
        x={l.x}
        y={l.front + 32}
        width={l.w}
        height={l.frontHeight}
        rx={2}
        fill={color.card}
      />
      <rect
        x={l.x + l.w / 2 - 36}
        y={l.front + 63}
        width={72}
        height={25}
        rx={3}
        fill={color.bg}
      />
      <path
        d={`M${l.x + l.w / 2 - 27} ${l.front + 72}h54v10h-54Z`}
        fill={color.ink}
      />
    </g>
  )
}
