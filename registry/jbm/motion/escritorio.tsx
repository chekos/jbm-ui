import { color } from "../lib/tokens"
import { type Box } from "../lib/geometry"
import { Cajon, type DrawerFolder, cajonLayout } from "./cajon"
import { FileCabinetBody, fileCabinetLayout } from "../ui/file-cabinet"

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
  // Legs, apron and cabinet share a front plane and a floor line.
  const legWidth = 18
  const legInset = 24
  const clearance = 12
  const innerLeft = box.x + legInset + legWidth
  const innerRight = box.x + box.w - legInset - legWidth
  const floor = box.y + box.h
  const cabinetTop = top + 47 + clearance
  const cabinetWidth = Math.min(250, innerRight - innerLeft - 2 * clearance)
  const cabinet = {
    x:
      spec.drawerSide === "end"
        ? innerRight - clearance - cabinetWidth
        : innerLeft + clearance,
    y: cabinetTop,
    w: cabinetWidth,
    h: floor - cabinetTop,
    folders,
    open,
  }
  const { drawer } = fileCabinetLayout(cabinet)
  return {
    box,
    top,
    cabinet,
    drawer,
    plane: { innerLeft, innerRight, floor, apronBottom: top + 47 },
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
      {props.cabinet && (
        <g role="img" aria-label="File cabinet">
          <FileCabinetBody {...l.cabinet} />
        </g>
      )}
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
      {props.cabinet && <Cajon {...l.drawer} />}
    </g>
  )
}
