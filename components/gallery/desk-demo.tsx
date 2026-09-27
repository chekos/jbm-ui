"use client"

import { useBenchParam } from "./bench-url"
import { Cajon } from "@/registry/jbm/motion/cajon"
import { Hand, type HandPose } from "@/registry/jbm/ui/hand"
import { Mano } from "@/registry/jbm/motion/mano"
import { FileCabinet } from "@/registry/jbm/ui/file-cabinet"
import { Bandeja } from "@/registry/jbm/motion/bandeja"
import { ToolCaddy } from "@/registry/jbm/motion/tool-caddy"
import { Escritorio } from "@/registry/jbm/motion/escritorio"
import { Burbuja } from "@/registry/jbm/motion/burbuja"
import {
  degrees,
  ProgressControl,
  RangeControl,
  type Presets,
} from "./progress-control"

import { deskSurfaceNames } from "./demo-data"
import { DeskSurfaceDemo } from "./desk-surface-demo"

export { deskNames } from "./demo-data"

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
  // Top-down pieces keep their own controls; the rest share the ones below.
  return deskSurfaceNames.includes(name) ? (
    <DeskSurfaceDemo name={name} />
  ) : (
    <DeskObjectDemo name={name} />
  )
}

function DeskObjectDemo({ name }: { name: string }) {
  // On /c/<name> benches each value lives in the URL (?open=0.5&pose=pinch); see bench-url.tsx.
  const unit = { clamp: [0, 1] } as const
  const [count, setCount] = useBenchParam(
    "count",
    3,
    name === "bandeja" ? { clamp: [0, 12] } : { allowed: [0, 1, 3, 6, 12] }
  )
  const [open, setOpen] = useBenchParam("open", 1, unit)
  const [pull, setPull] = useBenchParam("lift", 0, unit)
  const [pose, setPose] = useBenchParam<HandPose>("pose", "point", {
    allowed: ["open", "point", "pinch"],
  })
  const [wood, setWood] = useBenchParam("wood", false)
  const [right, setRight] = useBenchParam("right", false)
  const [cabinet, setCabinet] = useBenchParam("cabinet", false)
  const [progress, setProgress] = useBenchParam("highlight", 1, unit)
  const [angle, setAngle] = useBenchParam("angle", 0, { clamp: [-30, 30] })
  const [position, setPosition] = useBenchParam("position", 0, unit)
  const folders = names
    .slice(0, count)
    .map((name, i) => ({ name, accent: i === 0, pulled: i === 0 ? pull : 0 }))
  const drawerControls =
    name === "cajon" ||
    name === "file-cabinet" ||
    (name === "escritorio" && cabinet)
  // Card names prefix the accessible names so several cards on the index stay distinct.
  const range = (
    label: string,
    value: number,
    set: (n: number) => void,
    presets: Presets
  ) => (
    <ProgressControl
      label={label}
      ariaLabel={`${name} ${label}`}
      value={value}
      onChange={set}
      presets={presets}
    />
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
        // 24px sides, the other demos' control inset, so slider tracks line up across benches.
        style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "16px 24px" }}
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
            {range("Open", open, setOpen, ["Closed", "Half", "Open"])}
            {name !== "escritorio" &&
              count > 0 &&
              range("Lift front folder", pull, setPull, [
                "Filed",
                "Half",
                "Lifted",
              ])}
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
            {range("Position", position, setPosition, [
              "Left",
              "Center",
              "Right",
            ])}
            <RangeControl
              label="Rotation"
              ariaLabel={`${name} Rotation`}
              value={angle}
              onChange={setAngle}
              min={-30}
              max={30}
              step={1}
              format={degrees}
            />
          </>
        )}
        {name === "bandeja" && (
          <RangeControl
            label="Sheets"
            ariaLabel={`${name} Sheets`}
            value={count}
            onChange={setCount}
            min={0}
            max={12}
            step={1}
            format={(n) => `${n} ${n === 1 ? "sheet" : "sheets"}`}
          />
        )}
        {name === "burbuja" &&
          range("Highlight", progress, setProgress, ["None", "Half", "All"])}
      </div>
    </div>
  )
}
