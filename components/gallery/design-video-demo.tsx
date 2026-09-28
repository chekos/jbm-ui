"use client"

import type { ReactNode } from "react"
import { useBenchParam } from "./bench-url"
import { useBenchCompact } from "./bench-compact"
import { PaperTape } from "@/registry/jbm/ui/paper-tape"
import { TapeMarker } from "@/registry/jbm/ui/tape-marker"
import { PaperClip } from "@/registry/jbm/ui/paper-clip"
import { ClippedNote } from "@/registry/jbm/ui/clipped-note"
import { PunchedTag } from "@/registry/jbm/ui/punched-tag"
import { PaperLine } from "@/registry/jbm/ui/paper-line"
import { Stamp } from "@/registry/jbm/ui/stamp"
import { Frontmatter } from "@/registry/jbm/ui/frontmatter"
import { FolderContents } from "@/registry/jbm/ui/folder-contents"
import {
  FolderCarry,
  folderCarryHand,
  carriedFolderGeometry,
  folderGrip,
  tableFolderGeometry,
} from "@/registry/jbm/ui/folder-carry"
import { Mano } from "@/registry/jbm/motion/mano"
import { pointOn } from "@/registry/jbm/lib/geometry"
import { Ticket } from "@/registry/jbm/ui/ticket"
import { color } from "@/registry/jbm/lib/tokens"
import {
  degrees,
  ProgressControl,
  RangeControl,
  StepperControl,
} from "./progress-control"

export { designNames } from "./demo-data"

const Range = ProgressControl

/** A 0–1 control that maps to an angle: the readout and aria-valuetext speak degrees. */
function Angle({
  label,
  value,
  onChange,
  from,
  span,
  ariaLabel,
}: {
  ariaLabel?: string
  label: string
  value: number
  onChange: (n: number) => void
  /** Degrees at 0. */
  from: number
  /** Degrees covered from 0 to 1. */
  span: number
}) {
  return (
    <RangeControl
      label={label}
      ariaLabel={ariaLabel}
      value={value}
      onChange={onChange}
      min={0}
      max={1}
      step={0.01}
      format={(n) => degrees(from + n * span)}
    />
  )
}
function Toggle({
  label,
  value,
  onChange,
  ariaLabel,
}: {
  ariaLabel?: string
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}
    >
      <input
        type="checkbox"
        aria-label={ariaLabel}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
/** URL keys on /c/<name> benches: each piece names its shared state slots after its controls. */
const slotKeys: Record<string, Record<string, string>> = {
  "paper-tape": { progress: "feed", flag: "vertical", other: "marker" },
  "paper-line": {
    progress: "reveal",
    secondary: "lift",
    third: "strike",
    flag: "dotted",
    other: "accent",
  },
  stamp: { progress: "press", secondary: "angle" },
  "folder-contents": {
    progress: "open",
    secondary: "extract",
    third: "lift",
    other: "reveal",
    count: "folders",
  },
  "folder-carry": { progress: "carry", secondary: "angle", other: "hand" },
  frontmatter: { flag: "stacked", other: "highlight", secondary: "dim" },
  "clipped-note": { other: "clip", flag: "accent", secondary: "rotation" },
  "punched-tag": { flag: "ink" },
  "tape-marker": { other: "label" },
}

/** The carry bench's floor line and resting places: both folders stand on the floor. */
const carryFloor = 248
const onCarryFloor = (x: number, width: number) =>
  tableFolderGeometry({ x, y: carryFloor - (205 * width) / 260 }, width)
const carryFrom = onCarryFloor(50, 100),
  carryTo = onCarryFloor(230, 190)
const carryPath = [folderGrip(carryFrom), { x: 175, y: 80 }, folderGrip(carryTo)]

export function DesignVideoDemo({ name }: { name: string }) {
  // Index cards show at most three controls; /c pages keep them all.
  const compact = useBenchCompact()
  const key = (slot: string) => slotKeys[name]?.[slot] ?? slot
  const unit = { clamp: [0, 1] } as const
  const [progress, setProgress] = useBenchParam(key("progress"), 0.7, unit)
  // The carry's hand tilt is centred (0°) at 0.5; every other secondary control starts at 0.
  const [secondary, setSecondary] = useBenchParam(
    key("secondary"),
    name === "folder-carry" ? 0.5 : 0,
    unit
  )
  const [third, setThird] = useBenchParam(key("third"), 0, unit)
  const [flag, setFlag] = useBenchParam(key("flag"), false)
  const [other, setOther] = useBenchParam(key("other"), true)
  const [count, setCount] = useBenchParam(key("count"), 3, { clamp: [0, 8] })
  // PunchedTag: a long URL shows the one-line rule (ellipsis at the tag's max width).
  const [long, setLong] = useBenchParam("long", false)
  const [fill, setFill] = useBenchParam<"accent" | "ink" | "card">(
    "fill",
    "accent",
    { allowed: ["accent", "ink", "card"] }
  )
  let art: ReactNode, controls: ReactNode
  if (name === "paper-tape") {
    art = (
      <PaperTape
        length={progress * 1000}
        window={280}
        direction={flag ? "vertical" : "horizontal"}
        markers={other ? [{ id: "stop", at: 520, label: "revisar" }] : []}
        attachments={[
          {
            id: "note",
            at: 650,
            content: (
              <ClippedNote style={{ width: 108, fontSize: 12, padding: 10 }}>
                12 de 30 rutas
              </ClippedNote>
            ),
          },
        ]}
      />
    )
    controls = (
      <>
        <Range label="Feed" value={progress} onChange={setProgress} presets={["Start", "Half", "End"]} />
        <Toggle label="Vertical tape" value={flag} onChange={setFlag} />
        <Toggle label="Checkpoint marker" value={other} onChange={setOther} />
      </>
    )
  } else if (name === "paper-line") {
    art = (
      <div
        style={{
          minHeight: 100,
          paddingTop: 32,
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        <PaperLine
          text="Una idea, bien explicada."
          reveal={progress}
          lift={secondary}
          strike={third}
          dotted={flag}
          accent={other}
        />
      </div>
    )
    controls = (
      <>
        <Range label="Reveal" value={progress} onChange={setProgress} presets={["Hidden", "Half", "Written"]} />
        <Range label="Lift ink" value={secondary} onChange={setSecondary} presets={["Flat", "Half", "Lifted"]} />
        <Range label="Strike" value={third} onChange={setThird} presets={["None", "Half", "Struck"]} />
        {!compact && <Toggle label="Dotted underline" value={flag} onChange={setFlag} />}
        {!compact && <Toggle label="Accent ink" value={other} onChange={setOther} />}
      </>
    )
  } else if (name === "stamp") {
    art = (
      <div style={{ padding: "70px 18px 32px" }}>
        <Stamp text="REVISADO" press={progress} angle={secondary * 30 - 7} />
      </div>
    )
    controls = (
      <>
        <Range label="Press" value={progress} onChange={setProgress} presets={["Lifted", "Half", "Pressed"]} />
        <Angle label="Stamp angle" value={secondary} onChange={setSecondary} from={-7} span={30} />
      </>
    )
  } else if (name === "folder-contents") {
    art = (
      <FolderContents
        label="proyecto"
        open={progress}
        lift={third}
        sheet="README.md"
        entries={Array.from({ length: count }, (_, i) => ({
          id: String(i),
          label: ["scripts/", "references/", "assets/"][i % 3],
          reveal: other ? 1 : 0,
          document: "notas.md",
          documentReveal: secondary,
        }))}
        width={320}
        style={{ overflow: "visible" }}
      />
    )
    controls = (
      <>
        <Range label="Open folder" value={progress} onChange={setProgress} presets={["Closed", "Half", "Open"]} />
        <Range
          label="Extract documents"
          value={secondary}
          onChange={setSecondary}
          presets={["Inside", "Half", "Out"]}
        />
        {!compact && (
          <Range label="Lift contents" value={third} onChange={setThird} presets={["Inside", "Half", "Lifted"]} />
        )}
        <StepperControl
          label="Nested folders"
          value={count}
          onChange={setCount}
          min={0}
          max={8}
          noun="folders"
          format={(n) => `${n} ${n === 1 ? "folder" : "folders"}`}
        />
        {!compact && (
          <Toggle
            label="Reveal nested folders"
            value={other}
            onChange={setOther}
          />
        )}
      </>
    )
  } else if (name === "folder-carry") {
    art = (
      <svg
        viewBox="0 0 450 270"
        width="100%"
        role="img"
        aria-label="Hand carrying a folder between two sizes"
      >
        <path d={`M10 ${carryFloor}H440`} stroke={color.line} />
        {/* The hand holds the tab, so the name prints on the front for every fill. */}
        <FolderCarry
          from={carryFrom}
          to={carryTo}
          path={carryPath}
          progress={progress}
          label="proyecto"
          fill={color[fill]}
          labelOn="front"
        />
        {other && (
          <Mano
            at={pointOn(carryPath, progress)}
            // The hand scales with the folder it carries (0.45 × the folder's full width), so it
            // never swamps the small folder at Start or shrinks beside the large one.
            size={
              0.45 *
              (carriedFolderGeometry(carryFrom, carryTo, carryPath, progress).w * 260) /
              205
            }
            {...folderCarryHand}
            angle={folderCarryHand.angle + secondary * 30 - 15}
          />
        )}
      </svg>
    )
    controls = (
      <>
        <Range label="Carry progress" ariaLabel="folder-carry Carry progress" value={progress} onChange={setProgress} presets={["Start", "Midway", "Arrived"]} />
        <Angle label="Hand tilt" ariaLabel="folder-carry Hand tilt" value={secondary} onChange={setSecondary} from={-15} span={30} />
        <Toggle label="Show hand" ariaLabel="folder-carry Show hand" value={other} onChange={setOther} />
        {!compact && (
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
            Folder fill
            <select
              aria-label="folder-carry Folder fill"
              value={fill}
              onChange={(e) => setFill(e.target.value as typeof fill)}
            >
              <option value="accent">Vermilion</option>
              <option value="ink">Ink</option>
              <option value="card">Card</option>
            </select>
          </label>
        )}
      </>
    )
  } else if (name === "frontmatter") {
    art = (
      <Frontmatter
        stacked={flag}
        rows={[
          { key: "name", value: "pdf-processing", highlight: other },
          {
            key: "description",
            value: "Extrae tablas de archivos PDF.",
            highlight: other,
          },
          { key: "license", value: "Apache-2.0", dim: secondary },
        ]}
      />
    )
    controls = (
      <>
        <Toggle label="Stack fields" value={flag} onChange={setFlag} />
        <Toggle label="Highlight fields" value={other} onChange={setOther} />
        <Range
          label="Dim optional field"
          value={secondary}
          onChange={setSecondary}
          presets={["Full", "Half", "Dimmed"]}
        />
      </>
    )
  } else if (name === "clipped-note") {
    art = (
      <ClippedNote
        clip={other}
        tone={flag ? "accent" : "paper"}
        rotate={secondary * 16 - 4}
      >
        Lo que necesita de ti, arriba.
      </ClippedNote>
    )
    controls = (
      <>
        <Toggle label="Paper clip" value={other} onChange={setOther} />
        <Toggle label="Accent paper" value={flag} onChange={setFlag} />
        <Angle
          label="Note rotation"
          value={secondary}
          onChange={setSecondary}
          from={-4}
          span={16}
        />
      </>
    )
  } else if (name === "punched-tag") {
    art = (
      <PunchedTag tone={flag ? "ink" : "paper"}>
        {long ? "jbm-ui.bns.studio/catalog/punched-tag.json?long=1&tone=ink&view=strip&frame=12" : "Opus 5.5"}
      </PunchedTag>
    )
    controls = (
      <>
        <Toggle label="Ink stock" value={flag} onChange={setFlag} />
        <Toggle label="Long URL (one line, ellipsis)" value={long} onChange={setLong} />
      </>
    )
  } else if (name === "tape-marker") {
    art = <TapeMarker label={other ? "parar aquí" : undefined} />
    controls = <Toggle label="Marker label" value={other} onChange={setOther} />
  } else {
    art = <PaperClip width={50} height={92} />
  }
  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          minHeight: 190,
          display: "grid",
          // A column that never grows past the card, so one-line pieces (a long tag) end in an ellipsis.
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "center",
          justifyItems: name === "frontmatter" ? "stretch" : "center",
          padding: "36px 0 24px",
        }}
      >
        {art}
      </div>
      <div style={{ display: "grid", gap: 12 }}>{controls}</div>
    </div>
  )
}

export function WorkOrderExample() {
  return (
    <Ticket
      header="orden de trabajo"
      stub={
        <>
          <strong style={{ color: color.accent }}>Hecho es:</strong>
          <br />
          Las pruebas pasan.
          <br />
          El cliente viejo se elimina.
        </>
      }
      style={{ width: "100%", maxWidth: 380 }}
    >
      <strong style={{ fontSize: 24 }}>Migrar los pagos</strong>
      <p>Del cliente anterior al nuevo.</p>
    </Ticket>
  )
}

