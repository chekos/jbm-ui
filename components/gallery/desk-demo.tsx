"use client"

import { useBenchParam } from "./bench-url"
import { useBenchCompact } from "./bench-compact"
import { Cajon, cajonLayout, type DrawerFolder } from "@/registry/jbm/motion/cajon"
import { Hand, handPoses, type HandPose } from "@/registry/jbm/ui/hand"
import { Mano } from "@/registry/jbm/motion/mano"
import { DeskProp } from "@/registry/jbm/ui/desk-prop"
import { Pluma, plumaCaretGap, plumaNib } from "@/registry/jbm/motion/pluma"
import { FileCabinet } from "@/registry/jbm/ui/file-cabinet"
import { Bandeja } from "@/registry/jbm/motion/bandeja"
import { ToolCaddy } from "@/registry/jbm/motion/tool-caddy"
import { Escritorio } from "@/registry/jbm/motion/escritorio"
import { Burbuja } from "@/registry/jbm/motion/burbuja"
import { PaperLine } from "@/registry/jbm/ui/paper-line"
import { color } from "@/registry/jbm/lib/tokens"
import {
  degrees,
  ProgressControl,
  RangeControl,
  StepperControl,
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
const poseLabels: Record<HandPose, string> = {
  open: "Open palm",
  point: "Point",
  pinch: "Pinch (pen grip)",
  grip: "Grip",
  type: "Type",
  hold: "Hold",
}
/**
 * Hold in context: a side-view mug behind a Hand drawn 180 wide, scaled so its body fills the
 * pocket and runs on under the fingers, its rim's near end (deskPropLayout(...).rim, 93 34) just
 * under the thumb and its handle clear of the knuckles. The viewBox widens to fit the handle.
 */
const heldMug = { kind: "mug-side", x: 149, y: 77.4, scale: 1.4 } as const
const line = { x: 40, y: 262, w: 270 }
/**
 * Pluma writes a PaperLine: mono glyphs advance exactly 0.6 em, so the nib's x follows `write`
 * along the text and the line's `reveal` shows every grapheme the nib has reached.
 */
const written = "trabajo bien hecho"
const writtenSize = 24
const writtenGlyphs = Array.from(
  new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(written)
).length
const writtenAdvance = writtenSize * 0.6
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
  // Top-down pieces keep their own controls; the rest share the ones below.
  return deskSurfaceNames.includes(name) ? (
    <DeskSurfaceDemo name={name} />
  ) : name === "cajon" ? (
    <CajonDemo />
  ) : (
    <DeskObjectDemo name={name} />
  )
}

const riseOptions = [0, 24, 36, 46, 60] as const
/**
 * Mano's Position slider: 0 and 1 put the hand's box as far left and right as the 500-unit stage
 * allows with ±30° of rotation about its top-left corner, so Left, Center, and Right span the
 * stage instead of a fifth of it.
 */
const manoTravel = { from: 84, span: 212, y: 70 }
/**
 * The drawer bench: every DrawerFolder value can be aimed at one folder (or all), and the
 * viewBox fits the drawer's own bounds, so few folders fill the preview instead of floating.
 */
function CajonDemo() {
  const name = "cajon"
  // Index cards keep Folders, Open, and Lift; /c/cajon shows every control.
  const compact = useBenchCompact()
  const unit = { clamp: [0, 1] } as const
  const [count, setCount] = useBenchParam("count", 3, { clamp: [0, 12] })
  const [open, setOpen] = useBenchParam("open", 1, unit)
  // -1 aims the folder controls at every folder.
  const [target, setTarget] = useBenchParam("target", 0, { clamp: [-1, 11] })
  const [pull, setPull] = useBenchParam("lift", 0, unit)
  const [ajar, setAjar] = useBenchParam("ajar", 0, unit)
  const [reveal, setReveal] = useBenchParam("reveal", 1, unit)
  const [setLight, setSetLight] = useBenchParam("setk", false)
  const [k, setK] = useBenchParam("k", 0.86, { clamp: [0.72, 1] })
  const [labelSize, setLabelSize] = useBenchParam("size", 13, { clamp: [10, 36] })
  const [rise, setRise] = useBenchParam("rise", 0, { allowed: riseOptions })
  const [titles, setTitles] = useBenchParam("titles", true)
  const [stagger, setStagger] = useBenchParam("stagger", false)
  const [accent, setAccent] = useBenchParam("accent", false)
  const aimed = (i: number) => target === -1 || i === target
  const folders: DrawerFolder[] = sources.slice(0, count).map(([source, title], i) => ({
    name: source,
    sublabel: titles ? title : undefined,
    accent: accent && aimed(i),
    pulled: aimed(i) ? pull : 0,
    open: aimed(i) ? ajar : 0,
    reveal: aimed(i) ? reveal : 1,
    k: setLight && aimed(i) ? k : undefined,
  }))
  const props = {
    x: 40,
    y: 10,
    folders,
    open,
    labelSize,
    depthSpacing: rise === 0 ? undefined : rise,
    tabLayout: stagger ? ("stagger3" as const) : ("stair" as const),
  }
  // Fit the drawer fully open, with room for a lift or an ajar flap once one is in use, so the
  // preview does not rescale while a slider moves.
  const extent = cajonLayout({
    ...props,
    open: 1,
    folders: folders.map((f) => ({
      ...f,
      pulled: (f.pulled ?? 0) > 0 ? 1 : 0,
      open: (f.open ?? 0) > 0 ? 1 : 0,
    })),
  })
  const top = Math.min(extent.y, ...extent.folders.map((f) => f.y)) - 14
  const bottom = extent.frontTop + extent.frontHeight + 14
  const targetName = target === -1 ? "all folders" : (sources[target]?.[0] ?? "")
  const range = (label: string, value: number, set: (n: number) => void, presets: Presets) => (
    <ProgressControl
      label={label}
      ariaLabel={`${name} ${label}`}
      value={value}
      onChange={set}
      presets={presets}
    />
  )
  const check = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label>
      <input
        type="checkbox"
        aria-label={`${name} ${label}`}
        checked={value}
        onChange={(e) => set(e.target.checked)}
      />{" "}
      {label}
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
        <svg
          viewBox={`0 ${+top.toFixed(1)} 500 ${+(bottom - top).toFixed(1)}`}
          style={{ width: "100%", maxWidth: 460, height: "auto" }}
        >
          <Cajon {...props} />
        </svg>
      </div>
      <div
        className="composition-options"
        style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "16px 24px" }}
      >
        <StepperControl
          label="Folders"
          value={count}
          onChange={(n) => {
            setCount(n)
            if (target >= n) setTarget(n > 0 ? n - 1 : 0)
          }}
          min={0}
          max={12}
          noun="folders"
          format={(n) => `${n} ${n === 1 ? "folder" : "folders"}`}
        />
        {range("Open", open, setOpen, ["Closed", "Half", "Open"])}
        {count > 0 && compact &&
          range(`Lift (${targetName})`, pull, setPull, ["Filed", "Half", "Lifted"])}
        {count > 0 && !compact && (
          <>
            <label>
              Target{" "}
              <select
                aria-label={`${name} target folder`}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              >
                <option value={-1}>All folders</option>
                {sources.slice(0, count).map(([source], i) => (
                  <option key={source} value={i}>
                    {i + 1}. {source}
                  </option>
                ))}
              </select>
            </label>
            {range(`Lift (${targetName})`, pull, setPull, ["Filed", "Half", "Lifted"])}
            {range(`Flap ajar (${targetName})`, ajar, setAjar, ["Shut", "Half", "Ajar"])}
          </>
        )}
        {!compact && (
          // Secondary controls fold away so the stage and the main controls fit a 1280×800 screen.
          <details className="bench-more">
            <summary>More options</summary>
            <div>
            {count > 0 && (
              <>
                {range(`Name reveal (${targetName})`, reveal, setReveal, ["Blank", "Half", "Named"])}
                {check("Set light", setLight, setSetLight)}
                {setLight && (
                  <RangeControl
                    label={`Light (${targetName})`}
                    ariaLabel={`${name} Light`}
                    value={k}
                    onChange={setK}
                    min={0.72}
                    max={1}
                    step={0.01}
                    format={(n) => `${Math.round(n * 100)}%`}
                  />
                )}
                {check("Vermilion target", accent, setAccent)}
              </>
            )}
            <RangeControl
              label="Name size"
              ariaLabel={`${name} Name size`}
              value={labelSize}
              onChange={setLabelSize}
              min={10}
              max={36}
              step={1}
              format={(n) => `${n} units`}
            />
            <label>
              Folder spacing{" "}
              <select
                aria-label={`${name} folder spacing`}
                value={rise}
                onChange={(e) => setRise(Number(e.target.value) as (typeof riseOptions)[number])}
              >
                {riseOptions.map((r) => (
                  <option key={r} value={r}>
                    {r === 0 ? "Auto" : `${r} units apart`}
                  </option>
                ))}
              </select>
            </label>
            {check("Titles", titles, setTitles)}
            {check("Staggered tabs", stagger, setStagger)}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}


function DeskObjectDemo({ name }: { name: string }) {
  // Index cards show at most three controls; /c pages keep them all.
  const compact = useBenchCompact()
  // On /c/<name> benches each value lives in the URL (?open=0.5&pose=pinch); see bench-url.tsx.
  const unit = { clamp: [0, 1] } as const
  const [count, setCount] = useBenchParam(
    "count",
    3,
    { clamp: [0, 12] }
  )
  const [open, setOpen] = useBenchParam("open", 1, unit)
  const [pull, setPull] = useBenchParam("lift", 0, unit)
  const [pose, setPose] = useBenchParam<HandPose>("pose", "point", {
    allowed: handPoses,
  })
  const [write, setWrite] = useBenchParam("write", 0.6, unit)
  const [showHand, setShowHand] = useBenchParam("hand", true)
  const [mug, setMug] = useBenchParam("mug", true)
  const [wood, setWood] = useBenchParam("wood", false)
  const [right, setRight] = useBenchParam("right", false)
  const [cabinet, setCabinet] = useBenchParam("cabinet", false)
  const [progress, setProgress] = useBenchParam("highlight", 1, unit)
  const [angle, setAngle] = useBenchParam("angle", 0, { clamp: [-30, 30] })
  const [position, setPosition] = useBenchParam("position", 0.5, unit)
  const folders: DrawerFolder[] = names.slice(0, count).map((name, i) => ({
    name,
    accent: i === 0,
    pulled: i === 0 ? pull : 0,
  }))
  // Pluma: solve the grip point from where the nib should be, so the ink ends under the nib.
  // The nib sits a clear gap past the caret, measured after rotation, so the pen never covers
  // the last glyph at any angle; 16 units spans the ascenders above the nib.
  const nib = {
    x:
      line.x +
      writtenAdvance * writtenGlyphs * write +
      plumaCaretGap(angle, 16, undefined, 150) +
      2,
    y: line.y - 6,
  }
  const offset = plumaNib({ x: 0, y: 0 }, angle, undefined, 150)
  const grip = { x: nib.x - offset.x, y: nib.y - offset.y }
  const drawerControls =
    name === "file-cabinet" || (name === "escritorio" && cabinet)
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
        {name === "hand" && pose === "hold" && mug ? (
          // The held object: DeskProp's side-view mug behind the hand, at the shared outline.
          <svg
            viewBox="0 0 210 174"
            role="img"
            aria-label="Hand: hold, round a mug"
            style={{
              width: compact ? "min(100%, 257px)" : "min(100%, 420px)",
              flex: "none",
              height: "auto",
            }}
          >
            <DeskProp {...heldMug} />
            <Hand pose="hold" width={180} height={174} style={{ height: 174 }} />
          </svg>
        ) : name === "hand" ? (
          // Up to 360px wide and never stretched into a tall letterbox, centred in the stage.
          <Hand
            pose={pose}
            width={155}
            style={{
              width: compact ? "min(100%, 220px)" : "min(100%, 360px)",
              flex: "none",
              maxHeight: "100%",
            }}
          />
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
                : name === "file-cabinet"
                  ? "0 -260 500 700"
                  : "0 0 500 340"
            }
            style={{
              width: "100%",
              // Mano and Pluma fill the stage: the hand is drawn about 220px wide on a bench.
              maxWidth:
                name === "escritorio" ? 640 : name === "mano" || name === "pluma" ? 720 : 420,
              height: "auto",
            }}
          >
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
                at={{ x: manoTravel.from + position * manoTravel.span, y: manoTravel.y }}
                pose={pose}
                size={155}
                angle={angle}
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
                <foreignObject
                  x={line.x}
                  y={line.y - writtenSize * 1.4}
                  width={line.w}
                  height={writtenSize * 1.4 + 4}
                >
                  <PaperLine
                    text={written}
                    reveal={write}
                    mono
                    style={{
                      display: "block",
                      fontSize: writtenSize,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  />
                </foreignObject>
                <Pluma
                  at={grip}
                  angle={angle}
                  size={150}
                  hand={showHand}
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
            {/* The desk's index card keeps Wood finish, File cabinet, and Open. */}
            {!(compact && name === "escritorio") && (
              // Folder count is the same −/+ stepper as Cajon's.
              <StepperControl
                label="Folders"
                value={count}
                onChange={setCount}
                min={0}
                max={12}
                noun="folders"
                format={(n) => `${n} ${n === 1 ? "folder" : "folders"}`}
              />
            )}
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
            {cabinet && !compact && (
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
        {name === "hand" && pose === "hold" && (
          <label>
            <input
              type="checkbox"
              checked={mug}
              onChange={(e) => setMug(e.target.checked)}
            />{" "}
            Mug
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
