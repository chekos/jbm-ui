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
import { color } from "@/registry/jbm/lib/tokens"
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

/** Register bands of the long mixed page, top to bottom, in stage px on a 520 × 760 sheet. */
export const pageBands = [0, 190, 380, 570, 760]

/**
 * A long page drawn as four writing registers (steps with result boxes, numbered lists, tables,
 * prose) with plain bars: the demo stand-in for Register content.
 */
function MixedPage() {
  const ink = color.ink
  const bar = (x: number, y: number, w: number, h = 6, fill: string = ink) => (
    <rect key={`${x}-${y}-${w}`} x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />
  )
  const steps = [0, 1, 2].map((i) => {
    const y = 34 + i * 52
    return (
      <g key={`s${i}`}>
        <path d={`M40 ${y - 5}l7 5-7 5`} fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {bar(58, y - 3, 230)}
        <rect x={58} y={y + 12} width={290} height={18} rx={5} fill="none" stroke={ink} strokeWidth={2} />
      </g>
    )
  })
  const lists = [0, 1, 2, 3].map((i) => {
    const x = 40 + (i % 2) * 230,
      y = 214 + Math.floor(i / 2) * 84
    return (
      <g key={`l${i}`}>
        {bar(x, y, 170)}
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <circle cx={x + 4} cy={y + 22 + k * 14} r={2.5} fill={ink} />
            {bar(x + 14, y + 20 + k * 14, 110 - k * 12, 4, color.dim)}
          </g>
        ))}
      </g>
    )
  })
  const tables = [0, 1].map((t) => {
    const y = 402 + t * 82
    return (
      <g key={`t${t}`}>
        <rect x={40} y={y} width={440} height={16} fill={ink} />
        <rect x={40} y={y + 16} width={440} height={52} fill="none" stroke={ink} strokeWidth={2} />
        <path d={`M190 ${y + 16}V${y + 68}`} stroke={ink} strokeWidth={2} />
        {[1, 2, 3].map((r) => (
          <path key={r} d={`M40 ${y + 16 + r * 13}H480`} stroke={color.dim} strokeWidth={1.5} />
        ))}
      </g>
    )
  })
  const prose = [0, 1, 2, 3, 4, 5, 6].map((i) => bar(40, 596 + i * 16, i === 3 ? 200 : 440, 7))
  const sources = [0, 1].map((i) => (
    <g key={`f${i}`}>
      <circle cx={43} cy={722 + i * 12} r={2.5} fill={ink} />
      {bar(52, 720 + i * 12, 200, 4, color.dim)}
    </g>
  ))
  return (
    <svg width={520} height={760} viewBox="0 0 520 760" aria-hidden style={{ position: "absolute", inset: 0 }}>
      {steps}
      {lists}
      {tables}
      {prose}
      {sources}
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
            {!ink && <MixedPage />}
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
          format={(n) => `${n} ${n === 1 ? "seam" : "seams"} · ${n + 1} strips`}
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
