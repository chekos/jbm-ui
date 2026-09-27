"use client"

import { useBenchParam } from "./bench-url"
import { Cajon, type DrawerFolder } from "@/registry/jbm/motion/cajon"
import { Hand, handPoses, type HandPose } from "@/registry/jbm/ui/hand"
import { Mano } from "@/registry/jbm/motion/mano"
import { Pluma, plumaNib } from "@/registry/jbm/motion/pluma"
import { FileCabinet } from "@/registry/jbm/ui/file-cabinet"
import { Bandeja } from "@/registry/jbm/motion/bandeja"
import { ToolCaddy } from "@/registry/jbm/motion/tool-caddy"
import { Escritorio } from "@/registry/jbm/motion/escritorio"
import { Burbuja } from "@/registry/jbm/motion/burbuja"
import { color } from "@/registry/jbm/lib/tokens"
import {
  degrees,
  ProgressControl,
  RangeControl,
  type Presets,
} from "./progress-control"

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
const poseLabels: Record<HandPose, string> = {
  open: "Open palm",
  point: "Point",
  pinch: "Pinch (pen grip)",
  grip: "Grip",
  type: "Type",
  hold: "Hold",
}
type Cuff = "none" | "ink" | "accent"
// The Mano and Pluma previews draw into a 500 × 340 viewBox; the sleeve runs to its edge.
const frame = { x: 0, y: 0, w: 500, h: 340 }
const line = { x: 90, y: 262, w: 320 }
/** Cajon previews sources by age, front (newest) to back (oldest), each with a title. */
const sources: readonly (readonly [string, string])[] = [
  ["Anthropic 2024", "Building effective agents"],
  ["Procida 2017", "Diátaxis"],
  ["Grove 1983", "High Output Management"],
  ["Mintzberg 1979", "Structuring of Organizations"],
  ["Simon 1947", "Administrative Behavior"],
  ["Training Within Industry 1940s", "Job Instruction"],
  ["Taylor 1911", "Principles of Scientific Management"],
  ["Gilbreth 1909", "Bricklaying System"],
  ["Smith 1776", "The Wealth of Nations"],
  ["Babbage 1832", "On the Economy of Machinery"],
  ["Fayol 1916", "Administration industrielle"],
  ["Follett 1924", "Creative Experience"],
]
export function DeskDemo({ name }: { name: string }) {
  // On /c/<name> benches each value lives in the URL (?open=0.5&pose=pinch); see bench-url.tsx.
  const unit = { clamp: [0, 1] } as const
  const [count, setCount] = useBenchParam(
    "count",
    3,
    name === "bandeja" ? { clamp: [0, 12] } : { allowed: [0, 1, 3, 6, 8, 12] }
  )
  const [open, setOpen] = useBenchParam("open", 1, unit)
  const [pull, setPull] = useBenchParam("lift", 0, unit)
  const [pose, setPose] = useBenchParam<HandPose>("pose", "point", {
    allowed: handPoses,
  })
  const [arm, setArm] = useBenchParam("arm", name === "pluma")
  const [cardSleeve, setCardSleeve] = useBenchParam("card", false)
  const [cuff, setCuff] = useBenchParam<Cuff>("cuff", "none", {
    allowed: ["none", "ink", "accent"],
  })
  const [write, setWrite] = useBenchParam("write", 0.6, unit)
  const [showHand, setShowHand] = useBenchParam("hand", true)
  const [wood, setWood] = useBenchParam("wood", false)
  const [right, setRight] = useBenchParam("right", false)
  const [cabinet, setCabinet] = useBenchParam("cabinet", false)
  const [progress, setProgress] = useBenchParam("highlight", 1, unit)
  const [angle, setAngle] = useBenchParam("angle", 0, { clamp: [-30, 30] })
  const [position, setPosition] = useBenchParam("position", 0, unit)
  const [titles, setTitles] = useBenchParam("titles", true)
  const [stagger, setStagger] = useBenchParam("stagger", false)
  const [reveal, setReveal] = useBenchParam("reveal", 1, unit)
  const [ajar, setAjar] = useBenchParam("ajar", 0, unit)
  const [accent, setAccent] = useBenchParam("accent", name !== "cajon")
  const folders: DrawerFolder[] =
    name === "cajon"
      ? sources.slice(0, count).map(([source, title], i) => ({
          name: source,
          sublabel: titles ? title : undefined,
          accent: accent && i === 0,
          pulled: i === 0 ? pull : 0,
          open: i === 0 ? ajar : 0,
          reveal,
        }))
      : names.slice(0, count).map((name, i) => ({
          name,
          accent: accent && i === 0,
          pulled: i === 0 ? pull : 0,
        }))
  const sleeve = arm
    ? { arm: { frame, tone: cardSleeve ? "card" : "ink" } as const, cuff: cuff === "none" ? undefined : cuff }
    : {}
  // Pluma: solve the grip point from where the nib should be, so the ink ends under the nib.
  const nib = { x: line.x + line.w * write, y: line.y }
  const offset = plumaNib({ x: 0, y: 0 }, angle, undefined, 150)
  const grip = { x: nib.x - offset.x, y: nib.y - offset.y }
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
                : name === "cajon"
                  ? "0 -400 500 840"
                  : name === "file-cabinet"
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
              <Cajon
                x={40}
                y={10}
                folders={folders}
                open={open}
                tabLayout={stagger ? "stagger3" : "stair"}
              />
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
            {((name === "mano" && arm) || name === "pluma") && (
              // The stage edge the sleeve leaves through, so it never reads as a cut-off stump.
              <rect
                x={1}
                y={1}
                width={frame.w - 2}
                height={frame.h - 2}
                fill="none"
                stroke={color.line}
                strokeWidth={2}
              />
            )}
            {name === "mano" && (
              <Mano
                at={{ x: 145 + position * 100, y: 35 }}
                pose={pose}
                size={155}
                angle={angle}
                {...sleeve}
              />
            )}
            {name === "pluma" && (
              <>
                <line
                  x1={line.x}
                  y1={line.y}
                  x2={line.x + line.w}
                  y2={line.y}
                  stroke={color.line}
                  strokeWidth={2}
                />
                {write > 0 && (
                  <line
                    x1={line.x}
                    y1={line.y}
                    x2={nib.x}
                    y2={nib.y}
                    stroke={color.ink}
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                )}
                <Pluma
                  at={grip}
                  angle={angle}
                  size={150}
                  hand={showHand}
                  {...(showHand ? sleeve : {})}
                />
              </>
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
                {[0, 1, 3, 6, 8, 12].map((n) => (
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
        {name === "cajon" && (
          <>
            {range("Name reveal", reveal, setReveal, ["Blank", "Half", "Named"])}
            {count > 0 &&
              range("Front flap ajar", ajar, setAjar, ["Shut", "Half", "Ajar"])}
            <label>
              <input
                type="checkbox"
                checked={titles}
                onChange={(e) => setTitles(e.target.checked)}
              />{" "}
              Titles
            </label>
            <label>
              <input
                type="checkbox"
                checked={stagger}
                onChange={(e) => setStagger(e.target.checked)}
              />{" "}
              Staggered tabs
            </label>
            <label>
              <input
                type="checkbox"
                checked={accent}
                onChange={(e) => setAccent(e.target.checked)}
              />{" "}
              Vermilion front folder
            </label>
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
              {handPoses.map((p) => (
                <option key={p} value={p}>
                  {poseLabels[p]}
                </option>
              ))}
            </select>
          </label>
        )}
        {name === "pluma" && (
          <>
            {range("Write", write, setWrite, ["Start", "Half", "End"])}
            <label>
              <input
                type="checkbox"
                checked={showHand}
                onChange={(e) => setShowHand(e.target.checked)}
              />{" "}
              Hand
            </label>
          </>
        )}
        {(name === "mano" || (name === "pluma" && showHand)) && (
          <>
            <label>
              <input
                type="checkbox"
                checked={arm}
                onChange={(e) => setArm(e.target.checked)}
              />{" "}
              Arm
            </label>
            {arm && (
              <>
                <label>
                  <input
                    type="checkbox"
                    checked={cardSleeve}
                    onChange={(e) => setCardSleeve(e.target.checked)}
                  />{" "}
                  Card sleeve
                </label>
                <label>
                  Cuff{" "}
                  <select
                    aria-label={`${name} cuff`}
                    value={cuff}
                    onChange={(e) => setCuff(e.target.value as Cuff)}
                  >
                    <option value="none">None</option>
                    <option value="ink">Ink</option>
                    <option value="accent">Accent (yours)</option>
                  </select>
                </label>
              </>
            )}
          </>
        )}
        {(name === "mano" || name === "pluma") && (
          <>
            {name === "mano" &&
              range("Position", position, setPosition, [
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
