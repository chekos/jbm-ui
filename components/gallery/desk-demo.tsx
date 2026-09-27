"use client"

import { useState } from "react"
import { Cajon } from "@/registry/jbm/motion/cajon"
import { Hand, type HandPose } from "@/registry/jbm/ui/hand"
import { Mano } from "@/registry/jbm/motion/mano"
import { FileCabinet } from "@/registry/jbm/ui/file-cabinet"
import { Bandeja } from "@/registry/jbm/motion/bandeja"
import { ToolCaddy } from "@/registry/jbm/motion/tool-caddy"
import { Escritorio } from "@/registry/jbm/motion/escritorio"
import { Burbuja } from "@/registry/jbm/motion/burbuja"

export const deskNames = [
  "cajon",
  "file-cabinet",
  "hand",
  "mano",
  "bandeja",
  "tool-caddy",
  "escritorio",
  "burbuja",
]
const names = [
  "análisis",
  "diseño",
  "pruebas",
  "datos",
  "notas",
  "estilo",
  "revisión",
  "video",
  "audio",
  "tablas",
  "texto",
  "archivo",
]
export function DeskDemo({ name }: { name: string }) {
  const [count, setCount] = useState(3)
  const [open, setOpen] = useState(1)
  const [pull, setPull] = useState(0)
  const [pose, setPose] = useState<HandPose>("point")
  const [wood, setWood] = useState(false)
  const [right, setRight] = useState(false)
  const [cabinet, setCabinet] = useState(false)
  const [progress, setProgress] = useState(1)
  const [angle, setAngle] = useState(0)
  const [position, setPosition] = useState(0)
  const folders = names
    .slice(0, count)
    .map((name, i) => ({ name, accent: i === 0, pulled: i === 0 ? pull : 0 }))
  const drawerControls =
    name === "cajon" ||
    name === "file-cabinet" ||
    (name === "escritorio" && cabinet)
  const range = (
    label: string,
    value: number,
    set: (n: number) => void,
    min = 0,
    max = 1,
    step = 0.01
  ) => (
    <label style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {label}
      <input
        aria-label={`${name} ${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
      />
    </label>
  )
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {name === "hand" ? (
          <Hand pose={pose} width={155} />
        ) : name === "burbuja" ? (
          <Burbuja
            speaker="Tú"
            words={["Podemos", "reutilizar", "estos", "componentes."]}
            highlight={[1]}
            progress={progress}
          />
        ) : (
          <svg
            viewBox={
              name === "escritorio"
                ? "0 0 820 530"
                : name === "cajon" || name === "file-cabinet"
                  ? "0 -260 500 700"
                  : "0 0 500 340"
            }
            style={{
              width: "100%",
              maxWidth: name === "escritorio" ? 640 : 420,
              height: "auto",
            }}
          >
            {name === "cajon" && (
              <Cajon x={40} y={10} folders={folders} open={open} />
            )}
            {name === "file-cabinet" && (
              <FileCabinet
                x={85}
                y={-20}
                w={330}
                h={350}
                folders={folders}
                open={open}
              />
            )}
            {name === "escritorio" && (
              <Escritorio
                box={{ x: 30, y: 65, w: 760, h: 420 }}
                spec={{
                  finish: wood ? "wood" : "paper",
                  drawerSide: right ? "end" : "start",
                }}
                cabinet={cabinet}
                folders={folders}
                open={open}
              />
            )}
            {name === "mano" && (
              <Mano
                at={{ x: 145 + position * 100, y: 35 }}
                pose={pose}
                size={155}
                angle={angle}
              />
            )}
            {name === "bandeja" && (
              <Bandeja x={70} y={160} w={360} layers={count} />
            )}
            {name === "tool-caddy" && <ToolCaddy x={100} y={90} w={300} />}
          </svg>
        )}
      </div>
      <div
        className="composition-options"
        style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: 16 }}
      >
        {drawerControls && (
          <>
            <label>
              Folders{" "}
              <select
                aria-label={`${name} folder count`}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[0, 1, 3, 6, 12].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            {range("Open", open, setOpen)}
            {name !== "escritorio" &&
              count > 0 &&
              range("Lift front folder", pull, setPull)}
          </>
        )}
        {name === "escritorio" && (
          <>
            <label>
              <input
                type="checkbox"
                checked={wood}
                onChange={(e) => setWood(e.target.checked)}
              />{" "}
              Wood finish
            </label>
            <label>
              <input
                type="checkbox"
                checked={cabinet}
                onChange={(e) => setCabinet(e.target.checked)}
              />{" "}
              File cabinet
            </label>
            {cabinet && (
              <label>
                <input
                  type="checkbox"
                  checked={right}
                  onChange={(e) => setRight(e.target.checked)}
                />{" "}
                Cabinet on right
              </label>
            )}
          </>
        )}
        {(name === "hand" || name === "mano") && (
          <label>
            Pose{" "}
            <select
              aria-label={`${name} pose`}
              value={pose}
              onChange={(e) => setPose(e.target.value as HandPose)}
            >
              <option value="open">Open palm</option>
              <option value="point">Point</option>
              <option value="pinch">Pinch</option>
            </select>
          </label>
        )}
        {name === "mano" && (
          <>
            {range("Position", position, setPosition)}
            {range("Rotation", angle, setAngle, -30, 30, 1)}
          </>
        )}
        {name === "bandeja" && range("Sheets", count, setCount, 0, 12, 1)}
        {name === "burbuja" && range("Highlight", progress, setProgress)}
      </div>
    </div>
  )
}
export const deskSnippets: Record<string, string> = {
  cajon:
    'import { Cajon } from "@/jbm/motion/cajon"\n\n<svg viewBox="0 -260 500 600">\n  <Cajon x={40} folders={[{name:"datos", pulled:0.5}]} open={1} />\n</svg>',
  "file-cabinet":
    'import { FileCabinet } from "@/jbm/ui/file-cabinet"\n\n<svg viewBox="0 -260 500 650">\n  <FileCabinet x={80} folders={[{name:"datos"}]} open={1} />\n</svg>',
  hand: 'import { Hand } from "@/jbm/ui/hand"\n\n<Hand pose="pinch" width={160} />',
  mano: 'import { Mano } from "@/jbm/motion/mano"\n\n<svg viewBox="0 0 500 340">\n  <Mano at={{x:160,y:30}} pose="point" angle={12} />\n</svg>',
  bandeja:
    'import { Bandeja } from "@/jbm/motion/bandeja"\n\n<svg viewBox="0 0 400 250">\n  <Bandeja x={60} y={120} layers={3} />\n</svg>',
  "tool-caddy":
    'import { ToolCaddy } from "@/jbm/motion/tool-caddy"\n\n<svg viewBox="0 0 400 250">\n  <ToolCaddy x={80} y={40} />\n</svg>',
  escritorio:
    'import { Escritorio } from "@/jbm/motion/escritorio"\n\n<svg viewBox="0 0 820 500">\n  <Escritorio box={{x:30,y:30,w:760,h:420}}\n    cabinet spec={{finish:"wood",drawerSide:"end"}}\n    folders={[{name:"datos"}]} open={1} />\n</svg>',
  burbuja:
    'import { Burbuja } from "@/jbm/motion/burbuja"\n\n<Burbuja words={["Podemos", "reutilizar", "componentes."]}\n  highlight={[1]} progress={1} speaker="Tú" />',
}
