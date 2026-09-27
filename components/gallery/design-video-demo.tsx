"use client"

import { useState, type ReactNode } from "react"
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
  folderGrip,
  tableFolderGeometry,
} from "@/registry/jbm/ui/folder-carry"
import { Mano } from "@/registry/jbm/motion/mano"
import { pointOn } from "@/registry/jbm/lib/geometry"
import { Ticket } from "@/registry/jbm/ui/ticket"
import { color } from "@/registry/jbm/lib/tokens"

export const designNames = [
  "paper-tape",
  "tape-marker",
  "paper-clip",
  "clipped-note",
  "punched-tag",
  "paper-line",
  "stamp",
  "frontmatter",
  "folder-contents",
  "folder-carry",
]

function Range({
  label,
  value,
  onChange,
  max = 1,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  max?: number
}) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
      {label}{" "}
      <input
        aria-label={label}
        type="range"
        min={0}
        max={max}
        step={max / 100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
function Toggle({
  label,
  value,
  onChange,
}: {
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
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}
export function DesignVideoDemo({ name }: { name: string }) {
  const [progress, setProgress] = useState(0.7)
  const [secondary, setSecondary] = useState(0)
  const [third, setThird] = useState(0)
  const [flag, setFlag] = useState(false)
  const [other, setOther] = useState(true)
  const [count, setCount] = useState(3)
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
        <Range label="Feed" value={progress} onChange={setProgress} />
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
        <Range label="Reveal" value={progress} onChange={setProgress} />
        <Range label="Lift ink" value={secondary} onChange={setSecondary} />
        <Range label="Strike" value={third} onChange={setThird} />
        <Toggle label="Dotted underline" value={flag} onChange={setFlag} />
        <Toggle label="Accent ink" value={other} onChange={setOther} />
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
        <Range label="Press" value={progress} onChange={setProgress} />
        <Range label="Stamp angle" value={secondary} onChange={setSecondary} />
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
        <Range label="Open folder" value={progress} onChange={setProgress} />
        <Range
          label="Extract documents"
          value={secondary}
          onChange={setSecondary}
        />
        <Range label="Lift contents" value={third} onChange={setThird} />
        <label style={{ fontSize: 12 }}>
          Nested folders{" "}
          <input
            aria-label="Nested folders"
            type="number"
            min={0}
            max={8}
            value={count}
            onChange={(e) =>
              setCount(Math.max(0, Math.min(8, Number(e.target.value))))
            }
          />
        </label>
        <Toggle
          label="Reveal nested folders"
          value={other}
          onChange={setOther}
        />
      </>
    )
  } else if (name === "folder-carry") {
    const from = tableFolderGeometry({ x: 5, y: 65 }, 100),
      to = tableFolderGeometry({ x: 225, y: 60 }, 190)
    const path = [folderGrip(from), { x: 200, y: 45 }, folderGrip(to)]
    art = (
      <svg
        viewBox="0 0 450 270"
        width="100%"
        role="img"
        aria-label="Hand carrying a folder between two sizes"
      >
        <path d="M10 248H440" stroke={color.line} />
        <FolderCarry
          from={from}
          to={to}
          path={path}
          progress={progress}
          label="proyecto"
        />
        {other && (
          <Mano
            at={pointOn(path, progress)}
            pose="pinch"
            size={70}
            angle={secondary * 60 - 30}
            anchor={{ x: 6, y: 10 }}
          />
        )}
      </svg>
    )
    controls = (
      <>
        <Range label="Carry progress" value={progress} onChange={setProgress} />
        <Range label="Hand angle" value={secondary} onChange={setSecondary} />
        <Toggle label="Show hand" value={other} onChange={setOther} />
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
        <Range
          label="Note rotation"
          value={secondary}
          onChange={setSecondary}
        />
      </>
    )
  } else if (name === "punched-tag") {
    art = <PunchedTag tone={flag ? "ink" : "paper"}>Opus 5.5</PunchedTag>
    controls = <Toggle label="Ink stock" value={flag} onChange={setFlag} />
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

export const designSnippets: Record<string, string> = {
  "paper-tape": `import { PaperTape, paperAt } from "@/jbm/ui/paper-tape"\n\n<PaperTape length={700} window={320} markers={[{ id: "review", at: 520, label: "revisar" }]} />\n// paperAt(700, 520) === 180: marks and attachments share this origin.`,
  "tape-marker": `import { TapeMarker } from "@/jbm/ui/tape-marker"\n\n<TapeMarker label="parar aquí" />`,
  "paper-clip": `import { PaperClip } from "@/jbm/ui/paper-clip"\n\n<PaperClip width={26} height={48} />`,
  "clipped-note": `import { ClippedNote } from "@/jbm/ui/clipped-note"\n\n<ClippedNote clip rotate={-3}>Revisar el resultado.</ClippedNote>`,
  "punched-tag": `import { PunchedTag } from "@/jbm/ui/punched-tag"\n\n<PunchedTag tone="ink">Modelo</PunchedTag>`,
  "paper-line": `import { PaperLine } from "@/jbm/ui/paper-line"\n\n<PaperLine text="Una idea clara." reveal={0.7} lift={0} strike={0} />`,
  stamp: `import { Stamp } from "@/jbm/ui/stamp"\n\n<Stamp text="REVISADO" press={0.9} angle={-7} />`,
  frontmatter: `import { Frontmatter } from "@/jbm/ui/frontmatter"\n\n<Frontmatter stacked rows={[{ key: "name", value: "pdf-processing", highlight: true }]} />`,
  "folder-contents": `import { FolderContents } from "@/jbm/ui/folder-contents"\n\n<FolderContents open={1} sheet="README.md" label="proyecto" entries={[{ id: "assets", label: "assets/", document: "notas.md", documentReveal: 1 }]} />`,
  "folder-carry": `import { FolderCarry, folderGrip, tableFolderGeometry } from "@/jbm/ui/folder-carry"\n\nconst from = tableFolderGeometry({ x: 0, y: 80 }, 100)\nconst to = tableFolderGeometry({ x: 200, y: 80 }, 180)\nconst path = [folderGrip(from), { x: 180, y: 40 }, folderGrip(to)]\n<svg viewBox="0 0 440 300"><FolderCarry from={from} to={to} path={path} progress={0.5} label="proyecto" /></svg>`,
}
