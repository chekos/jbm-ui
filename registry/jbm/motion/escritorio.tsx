import { color } from "../lib/tokens"
import { type Box } from "../lib/geometry"
import { Cajon, cajonLayout, type DrawerFolder } from "./cajon"
import { Bandeja, bandejaLayout } from "./bandeja"
import { ToolCaddy, toolCaddyLayout, type DeskTool } from "./tool-caddy"

export type DeskSpec = {
  tools: readonly DeskTool[]
  runners?: readonly DeskTool[]
  finish?: "paper" | "wood"
  drawerSide?: "start" | "end"
}
export type EscritorioProps = {
  box: Box
  spec: DeskSpec
  folders: readonly DrawerFolder[]
  layers?: number
  open?: number
  landing?: number
}

/** Actual occupied bounds may grow for a deep drawer or wide tool collection. */
export function escritorioLayout({
  box,
  spec,
  folders,
  layers = 0,
  open = 1,
}: EscritorioProps) {
  const tools = [...spec.tools, ...(spec.runners ?? [])]
  const caddyWidth = toolCaddyLayout({ tools }).w
  const drawerWidth = cajonLayout({ folders, w: box.w * 0.43 }).w
  const w = Math.max(box.w, drawerWidth + 110, caddyWidth + 390)
  const top = box.y + 180
  const drawer = {
    x: spec.drawerSide === "end" ? box.x + w - drawerWidth - 40 : box.x + 40,
    y: top + 52,
    w: drawerWidth,
    h: 220,
    folders,
    open,
  }
  const tray = { x: box.x + 40, y: top - 70, w: 280, layers }
  const caddy = { x: box.x + w - caddyWidth - 40, y: top - 60, tools }
  const d = cajonLayout(drawer)
  return {
    box: { ...box, w, h: Math.max(box.h, 180 + 52 + d.h + 35) },
    top,
    drawer,
    tray,
    caddy,
    anchors: {
      drawer: { x: d.x + d.w / 2, y: d.front + 28 },
      folders: d.folders.map((f) => f.anchor),
      trayFloor: bandejaLayout(tray).floor,
      stackTop: bandejaLayout(tray).stackTop,
      tools: toolCaddyLayout(caddy).tools,
      bubbleSlot: { x: box.x + w - 32, y: top + 12 },
    },
  }
}
export { escritorioLayout as layout }

/** SVG group composed from individually installable drawer, tray and caddy. */
export function Escritorio(props: EscritorioProps) {
  const l = escritorioLayout(props)
  const { x, y, w, h } = l.box
  const wood = props.spec.finish === "wood"
  return (
    <g role="img" aria-label={`${wood ? "Wood" : "Paper"} desk`}>
      <g
        fill={wood ? color.bg : color.card}
        stroke={color.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      >
        <path
          d={`M${x + 22} ${l.top + 18}v${y + h - l.top - 18}h20V${l.top + 18}ZM${x + w - 42} ${l.top + 18}v${y + h - l.top - 18}h20V${l.top + 18}Z`}
        />
        <rect x={x + 42} y={l.top + 22} width={w - 84} height={30} />
        <rect
          x={l.drawer.x - 10}
          y={l.top + 52}
          width={l.drawer.w + 20}
          height={h - 232}
        />
        <path
          d={`M${x + 18} ${l.top - 15}H${x + w - 18}L${x + w} ${l.top + 7}H${x}ZM${x} ${l.top + 7}H${x + w}v15H${x}Z`}
        />
        {wood && (
          <g fill="none" strokeWidth={1}>
            <path
              d={`M${x + 35} ${l.top - 6}q85 -5 190 0t120 0M${x + 20} ${l.top + 14}h${w * 0.36}m70 0h${w * 0.36}M${x + 29} ${l.top + 60}v${h - 260}`}
            />
          </g>
        )}
        <path
          d={`M${l.anchors.bubbleSlot.x - 28} ${l.anchors.bubbleSlot.y}h42`}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
      <Cajon {...l.drawer} />
      <Bandeja {...l.tray} landing={props.landing} />
      <ToolCaddy {...l.caddy} />
    </g>
  )
}
