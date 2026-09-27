"use client"

import { WorkOrderExample } from "./design-video-demo"

import { useBenchParam } from "./bench-url"
import { Ticket } from "@/registry/jbm/ui/ticket"
import { ChatBubble } from "@/registry/jbm/ui/chat-bubble"
import { Document } from "@/registry/jbm/ui/document"
import { Folder, type FolderTone } from "@/registry/jbm/ui/folder"
import { ScoreScale } from "@/registry/jbm/ui/score-scale"
import { ComparisonBars } from "@/registry/jbm/ui/comparison-bars"
import { Clock } from "@/registry/jbm/ui/clock"
import { color, font } from "@/registry/jbm/lib/tokens"
import { ProgressControl, RangeControl } from "./progress-control"

function TicketDemo() {
  const [accent, setAccent] = useBenchParam("accent", true)
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <Ticket
        tone={accent ? "accent" : "ink"}
        header="ADMIT ONE · UNA BUENA IDEA"
        stub="tacosdedatos · Nos vemos ahí."
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          Un lugar para crear.
        </div>
        <p
          style={{
            color: color.dim,
            margin: "12px 0 0",
            fontSize: 16,
            lineHeight: 1.5,
          }}
        >
          Trae tu curiosidad. Lo demás lo construimos juntos.
        </p>
      </Ticket>
      <label style={{ fontSize: 13 }}>
        <input
          type="checkbox"
          checked={accent}
          onChange={(event) => setAccent(event.target.checked)}
        />{" "}
        Vermilion header
      </label>
    </div>
  )
}
function FolderDemo() {
  const [open, setOpen] = useBenchParam("open", 0.5, { clamp: [0, 1] })
  const [tone, setTone] = useBenchParam<FolderTone>("tone", "accent", {
    allowed: ["accent", "ink", "card"],
  })
  const [place, setPlace] = useBenchParam<"auto" | "front" | "tab">(
    "label",
    "auto",
    { allowed: ["auto", "front", "tab"] }
  )
  const [sublabel, setSublabel] = useBenchParam("sublabel", false)
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <Folder
        open={open}
        tone={tone}
        label={tone === "card" ? "Doorways" : "Ideas"}
        labelOn={place === "auto" ? undefined : place}
        sublabel={sublabel ? "rigor · ir a la fuente" : undefined}
        style={{ margin: "auto", width: 250 }}
      />
      <ProgressControl
        label="Folder opening"
        ariaLabel="folder Folder opening"
        value={open}
        onChange={setOpen}
        presets={["Closed", "Half", "Open"]}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13 }}>
        <label>
          Tone{" "}
          <select
            aria-label="folder Tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as FolderTone)}
          >
            <option value="accent">Vermilion</option>
            <option value="ink">Ink</option>
            <option value="card">Card</option>
          </select>
        </label>
        <label>
          Label on{" "}
          <select
            aria-label="folder Label on"
            value={place}
            onChange={(e) => setPlace(e.target.value as typeof place)}
          >
            <option value="auto">Tone default</option>
            <option value="front">Front panel</option>
            <option value="tab">Tab</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            aria-label="folder Sublabel"
            checked={sublabel}
            onChange={(e) => setSublabel(e.target.checked)}
          />{" "}
          Sublabel
        </label>
      </div>
    </div>
  )
}
function ScoreDemo() {
  const [value, setValue] = useBenchParam("score", 6, { clamp: [0, 10] })
  return (
    <div style={{ display: "grid", gap: 32 }}>
      <ScoreScale
        value={value}
        label="Claridad de la idea"
        labels={["Por explorar", "Lista para compartir"]}
        formatValue={(v) => `${v} / 10`}
      />
      <RangeControl
        label="Adjust score"
        ariaLabel="Score value"
        value={value}
        onChange={setValue}
        min={0}
        max={10}
        step={0.5}
        format={(v) => `${v} / 10`}
      />
    </div>
  )
}
function ClockDemo() {
  const [minutes, setMinutes] = useBenchParam("minutes", 510, {
    clamp: [0, 1439],
  })
  return (
    <div style={{ display: "grid", justifyItems: "center", gap: 32 }}>
      <Clock hours={0} minutes={minutes} size={96} />
      <div style={{ width: "100%" }}>
        <RangeControl
          label="Time of day"
          ariaLabel="Clock time"
          value={minutes}
          onChange={setMinutes}
          min={0}
          max={1439}
          step={1}
          format={(m) =>
            `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
          }
        />
      </div>
    </div>
  )
}
export const videoPrimitiveExamples = {
  ticket: (
    <div style={{ display: "grid", gap: 32 }}>
      <TicketDemo />
      <WorkOrderExample />
    </div>
  ),
  "chat-bubble": (
    <div style={{ display: "grid", gap: 20 }}>
      <ChatBubble speaker="Tú" tone="ink">
        ¿Y si lo hacemos más sencillo?
      </ChatBubble>
      <ChatBubble speaker="La idea" side="end" tone="accent">
        Una pieza a la vez.
      </ChatBubble>
      <ChatBubble tail={false} speaker="Nota">
        El contenido siempre es tuyo.
      </ChatBubble>
    </div>
  ),
  document: (
    <div
      style={{
        display: "flex",
        gap: 24,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Document label="borrador.md" style={{ width: "42%" }} />
      <Document
        label="idea.md"
        accent
        style={{ width: "42%", transform: "rotate(4deg)" }}
      />
    </div>
  ),
  folder: <FolderDemo />,
  "score-scale": <ScoreDemo />,
  "comparison-bars": (
    <div>
      <ComparisonBars
        aria-label="Example reading counts"
        items={[
          { label: "Contexto", value: 42 },
          { label: "Una buena pregunta", value: 68 },
          { label: "Una idea que se entiende", value: 90, highlight: true },
        ]}
        max={100}
        formatValue={(value) => `${value} lecturas`}
      />
      <p
        style={{
          fontFamily: font.mono,
          color: color.dim,
          fontSize: 11,
          marginTop: 20,
        }}
      >
        Datos ilustrativos · escala 0–100
      </p>
    </div>
  ),
  clock: <ClockDemo />,
}
