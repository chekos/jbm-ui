import { color } from "../lib/tokens"
import { type Box } from "../lib/geometry"
import { type DrawerFolder, cajonLayout } from "./cajon"
import { FileCabinet } from "../ui/file-cabinet"

export type DeskSpec = {
  finish?: "paper" | "wood"
  drawerSide?: "start" | "end"
}
export type EscritorioProps = {
  box: Box
  spec?: DeskSpec
  cabinet?: boolean
  folders?: readonly DrawerFolder[]
  open?: number
}
export function escritorioLayout({
  box,
  spec = {},
  folders = [],
  open = 0,
}: EscritorioProps) {
  const top = box.y + 20
  const cabinet = {
    x: spec.drawerSide === "end" ? box.x + box.w - 290 : box.x + 38,
    y: top + 40,
    w: 250,
    h: box.h - 65,
    folders,
    open,
  }
  const drawer = {
    ...cabinet,
    x: cabinet.x + 10,
    y: cabinet.y + 32,
    w: cabinet.w - 20,
  }
  return {
    box,
    top,
    cabinet,
    drawer,
    anchors: { folders: cajonLayout(drawer).folders.map((f) => f.anchor) },
  }
}
export { escritorioLayout as layout }
/** Empty desktop, with an optional independently reusable file cabinet. */
export function Escritorio(props: EscritorioProps) {
  const l = escritorioLayout(props),
    { x, y, w, h } = l.box
  const wood = props.spec?.finish === "wood"
  return (
    <g role="img" aria-label={`${wood ? "Wood" : "Paper"} desk`}>
      <g
        fill={wood ? color.bg : color.card}
        stroke={color.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      >
        <path
          d={`M${x + 24} ${l.top + 20}V${y + h}h18V${l.top + 20}ZM${x + w - 42} ${l.top + 20}V${y + h}h18V${l.top + 20}Z`}
        />
        <rect x={x + 42} y={l.top + 22} width={w - 84} height={25} />
        <path
          d={`M${x + 18} ${l.top - 18}H${x + w - 18}L${x + w} ${l.top + 5}H${x}ZM${x} ${l.top + 5}H${x + w}v17H${x}Z`}
        />
        {wood && (
          <path
            d={`M${x + 35} ${l.top - 7}q90 -5 180 0t180 0M${x + 20} ${l.top + 13}h${w - 40}`}
            fill="none"
            strokeWidth={1}
          />
        )}
      </g>
      {props.cabinet && <FileCabinet {...l.cabinet} />}
    </g>
  )
}
