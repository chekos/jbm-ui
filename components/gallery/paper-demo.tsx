"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useBenchParam } from "./bench-url"
import {
  Caption,
  Paper,
  Sticker,
  type PaperCorner,
} from "@/registry/jbm/ui/paper"
import { Tear } from "@/registry/jbm/ui/tear"
import {
  RegisterInk,
  registerSeams,
  type RegisterSpec,
} from "@/registry/jbm/ui/register"
import {
  ProgressControl,
  RangeControl,
  StepperControl,
} from "./progress-control"

/** Sheet pieces previewed by PaperDemo: Paper's tension and tab, and Tear. */
export { paperNames } from "./demo-data"

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

/**
 * Renders a stage-pixel box (sizes as on a 1080 stage) scaled down to the preview's width, so the
 * tab's 32px label and the fray keep their video proportions.
 */
function StageFit({
  w,
  h,
  children,
}: {
  w: number
  h: number
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.4)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setScale(Math.min(0.6, el.clientWidth / w))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [w])
  return (
    <div ref={ref} style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
      <div
        style={{
          width: w * scale,
          height: h * scale,
          margin: "0 auto",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: w,
            height: h,
            transform: `scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/** The long mixed page: a Register with four bands (steps, lists, tables, prose) on a 520 × 760 sheet. */
const pageSpec: RegisterSpec = { kind: "mixed", n: 4, w: 520, h: 760 }
/** Top edge, the page's three register seams, bottom edge: where Paper's tear starts and Tear cuts. */
export const pageBands = [0, ...registerSeams(pageSpec), pageSpec.h]

/**
 * The page's writing in sheet px. Tear lays children on the whole sheet (inset 0); Paper lays them
 * inside its 2px edge, so `inset` shifts the ink back onto the sheet's outer coordinates.
 */
function MixedPage({ inset = 0 }: { inset?: number }) {
  return (
    <svg
      width={pageSpec.w}
      height={pageSpec.h}
      viewBox={`0 0 ${pageSpec.w} ${pageSpec.h}`}
      aria-hidden
      style={{ position: "absolute", left: -inset, top: -inset, overflow: "visible" }}
    >
      <RegisterInk {...pageSpec} />
    </svg>
  )
}

const cornerSets: Record<string, PaperCorner[]> = {
  all: ["tl", "tr", "br", "bl"],
  diagonal: ["tl", "br"],
  top: ["tl", "tr"],
}

function PaperBench() {
  const unit = { clamp: [0, 1] } as const
  const [tension, setTension] = useBenchParam("tension", 0.7, unit)
  const [reveal, setReveal] = useBenchParam("tab", 1, unit)
  const [showTab, setShowTab] = useBenchParam("label", true)
  const [corners, setCorners] = useBenchParam("pull", "all", {
    allowed: ["all", "diagonal", "top"],
  })
  const [right, setRight] = useBenchParam("right", false)
  const [ink, setInk] = useBenchParam("ink", false)
  return (
    <>
      <StageFit w={640} h={900}>
        <div style={{ position: "absolute", left: 60, top: 90 }}>
          <Paper
            w={520}
            h={760}
            radius={10}
            tone={ink ? "ink" : "paper"}
            tension={tension}
            pull={cornerSets[corners]}
            seam={pageBands[2]}
            seamSide={right ? "right" : "left"}
            tab={showTab ? { label: "Tutorial", reveal } : undefined}
          >
            {!ink && <MixedPage inset={2} />}
          </Paper>
        </div>
      </StageFit>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sticker size={28} rotate={-5}>
          ¿otra vez?
        </Sticker>
        <Sticker tone="ink" size={20} rotate={2}>
          catálogo
        </Sticker>
        <Caption size={18}>papel</Caption>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <ProgressControl
          label="Tension"
          ariaLabel="paper Tension"
          value={tension}
          onChange={setTension}
          presets={["Flat", "Creased", "Tearing"]}
        />
        <ProgressControl
          label="Tab reveal"
          ariaLabel="paper Tab reveal"
          value={reveal}
          onChange={setReveal}
          presets={["Hidden", "Half", "Out"]}
        />
        <div
          className="progress-control"
          role="group"
          aria-label="paper Pulled corners"
        >
          <div className="progress-control-head">
            <span>Pulled corners</span>
          </div>
          <div className="progress-presets">
            {(["all", "diagonal", "top"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={corners === c}
                onClick={() => setCorners(c)}
              >
                {c === "all" ? "All four" : c === "diagonal" ? "Diagonal" : "Top pair"}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Tab" value={showTab} onChange={setShowTab} />
        <Toggle label="Tear from the right edge" value={right} onChange={setRight} />
        <Toggle label="Ink stock" value={ink} onChange={setInk} />
      </div>
    </>
  )
}

/**
 * The board's hojas beat for three seams: the page parts into four strips in a loose column, each
 * nudged and turned (the next beat moves them to their readers).
 */
const boardDestinations = [
  { x: -40, y: -70, rotate: -5 },
  { x: 36, y: -24, rotate: 3 },
  { x: -30, y: 24, rotate: -2 },
  { x: 34, y: 72, rotate: 3 },
]
const destinationsFor = (count: number) =>
  count === 4
    ? boardDestinations
    : Array.from({ length: count }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * 34,
        y: Math.round((i - (count - 1) / 2) * (150 / Math.max(1, count - 1))),
        rotate: (i % 2 ? 1 : -1) * (2 + (i % 3)),
      }))

function TearBench() {
  const [progress, setProgress] = useBenchParam("progress", 0.6, {
    clamp: [0, 1],
  })
  const [stagger, setStagger] = useBenchParam("stagger", 0.1, {
    clamp: [0, 0.3],
  })
  const [seamCount, setSeamCount] = useBenchParam("seams", 3, {
    clamp: [1, 6],
  })
  const [seed, setSeed] = useBenchParam("seed", 1, { clamp: [1, 9] })
  const seams =
    seamCount === 3
      ? pageBands.slice(1, -1)
      : Array.from({ length: seamCount }, (_, i) =>
          Math.round((760 * (i + 1)) / (seamCount + 1))
        )
  return (
    <>
      <StageFit w={760} h={960}>
        <div style={{ position: "absolute", left: 120, top: 100 }}>
          <Tear
            w={520}
            h={760}
            radius={10}
            seams={seams}
            progress={progress}
            stagger={stagger}
            seed={seed}
            pieces={destinationsFor(seams.length + 1).map((to) => ({ to }))}
          >
            <MixedPage />
          </Tear>
        </div>
      </StageFit>
      <div style={{ display: "grid", gap: 12 }}>
        <ProgressControl
          label="Tear"
          ariaLabel="tear Tear"
          value={progress}
          onChange={setProgress}
          presets={["Whole", "Parting", "Apart"]}
        />
        <RangeControl
          label="Stagger"
          ariaLabel="tear Stagger"
          value={stagger}
          onChange={setStagger}
          min={0}
          max={0.3}
          step={0.01}
          format={(n) => n.toFixed(2)}
        />
        <StepperControl
          label="Seams"
          value={seamCount}
          onChange={setSeamCount}
          min={1}
          max={6}
          noun="seams"
          format={(n) =>
            `${n} ${n === 1 ? "seam" : "seams"} · ${n + 1} strips${n === 3 ? " · the register's seams" : ""}`
          }
        />
        <StepperControl
          label="Fray seed"
          value={seed}
          onChange={setSeed}
          min={1}
          max={9}
          noun="seeds"
          format={(n) => `seed ${n}`}
        />
      </div>
    </>
  )
}

export function PaperDemo({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        padding: 24,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 16,
      }}
    >
      {name === "tear" ? <TearBench /> : <PaperBench />}
    </div>
  )
}
