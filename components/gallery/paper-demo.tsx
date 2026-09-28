"use client"

import { useBenchParam } from "./bench-url"
import { useBenchCompact } from "./bench-compact"
import { StageFit } from "./stage-fit"
import { Paper, frayReach, type PaperCorner } from "@/registry/jbm/ui/paper"
import { Tear, tearBounds, tearSeams } from "@/registry/jbm/ui/tear"
import {
  RegisterInk,
  registerLayout,
  registerSeams,
  sheetRadius,
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

/** The long mixed page: a Register with four bands (steps, lists, tables, prose) on a 520 × 760 sheet. */
const pageSpec: RegisterSpec = { kind: "mixed", n: 4, w: 520, h: 760 }
/** Top edge, the page's three register seams, bottom edge: where Paper's tear starts and Tear cuts. */
export const pageBands = [0, ...registerSeams(pageSpec), pageSpec.h]
/**
 * A seam through writing, to show the tear cuts ink: through the middle of the second step's
 * result box, so the notch cuts the box's side and opens a hole in it, clear of its top and bottom
 * edges.
 */
const pageLayout = registerLayout(pageSpec)
const resultBox = pageLayout.cells.filter((c) => c.kind === "mono")[1].marks.find((m) => m.type === "box")!
const seamThroughWriting = Math.round(resultBox.y + resultBox.h / 2)

/**
 * The page's writing in sheet px. Tear lays children on the whole sheet (inset 0); Paper lays them
 * inside its 2px edge, so `inset` shifts the ink back onto the sheet's outer coordinates. On ink
 * stock the writing is card-coloured.
 */
function MixedPage({ inset = 0, ink = false }: { inset?: number; ink?: boolean }) {
  return (
    <svg
      width={pageSpec.w}
      height={pageSpec.h}
      viewBox={`0 0 ${pageSpec.w} ${pageSpec.h}`}
      aria-hidden
      style={{ position: "absolute", left: -inset, top: -inset, overflow: "visible" }}
    >
      <RegisterInk {...pageSpec} tone={ink ? "ink" : "paper"} />
    </svg>
  )
}

const cornerSets: Record<string, PaperCorner[]> = {
  all: ["tl", "tr", "br", "bl"],
  diagonal: ["tl", "br"],
  top: ["tl", "tr"],
}

function PaperBench() {
  const compact = useBenchCompact()
  const unit = { clamp: [0, 1] } as const
  const [tension, setTension] = useBenchParam("tension", 0.7, unit)
  const [reveal, setReveal] = useBenchParam("tab", 1, unit)
  const [showTab, setShowTab] = useBenchParam("label", true)
  const [corners, setCorners] = useBenchParam("pull", "all", {
    allowed: ["all", "diagonal", "top"],
  })
  const [right, setRight] = useBenchParam("right", false)
  const [ink, setInk] = useBenchParam("ink", false)
  const [across, setAcross] = useBenchParam("across", false)
  return (
    <>
      <StageFit w={640} h={900} maxScale={0.6}>
        <div style={{ position: "absolute", left: 60, top: 90 }}>
          <Paper
            w={520}
            h={760}
            radius={sheetRadius(pageSpec.w)}
            tone={ink ? "ink" : "paper"}
            tension={tension}
            pull={cornerSets[corners]}
            seam={across ? seamThroughWriting : pageBands[2]}
            seamSide={right ? "right" : "left"}
            tab={showTab ? { label: "Tutorial", reveal } : undefined}
          >
            <MixedPage inset={2} ink={ink} />
          </Paper>
        </div>
      </StageFit>
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
        {!compact && (
          <>
            <Toggle label="Tab" value={showTab} onChange={setShowTab} />
            <Toggle label="Tear from the right edge" value={right} onChange={setRight} />
            <Toggle label="Ink stock" value={ink} onChange={setInk} />
            <Toggle label="Tear through the writing" value={across} onChange={setAcross} />
          </>
        )}
      </div>
    </>
  )
}

/**
 * The rows of the page where a seam can run: a full fray reach from every filled mark (bars, table
 * headers, headings, numerals, chevrons), so a torn edge never cuts a header or a bar into a black
 * zig-zag, and 8px from every thin line (box edges, table rules), so it never grazes one. A row next
 * to a register seam snaps to it.
 */
/** Shortest strip the bench cuts, in sheet px. */
const MIN_STRIP = 40
/** Clearance from a thin line: past the fray's usual wander and grain. */
const THIN = 8
const clearRows = (() => {
  const reach = frayReach() + 2
  // Each mark's vertical span, grown by the clearance it needs.
  const spans: [number, number][] = []
  const add = (y0: number, y1: number, pad: number) => spans.push([y0 - pad, y1 + pad])
  for (const cell of pageLayout.cells)
    for (const m of cell.marks) {
      if (m.type === "bar") add(m.y, m.y + m.h, m.h > 3 ? reach : THIN)
      else if (m.type === "chevron") add(m.y - m.size, m.y + m.size, reach)
      else if (m.type === "num") add(m.y - m.size * 0.8, m.y + m.size * 0.1, reach)
      else if (m.type === "box") {
        add(m.y, m.y + m.stroke, THIN)
        add(m.y + m.h - m.stroke, m.y + m.h, THIN)
      } else if (m.type === "rule" && m.y1 === m.y2) add(m.y1 - m.stroke / 2, m.y1 + m.stroke / 2, THIN)
    }
  spans.sort((p, q) => p[0] - q[0])
  const rows: number[] = []
  let clear = -Infinity
  for (const [top, bottom] of spans) {
    if (clear > -Infinity && top > clear) {
      const mid = (clear + top) / 2
      const seam = pageBands.find((y) => Math.abs(y - mid) < 6)
      rows.push(seam ?? Math.round(mid))
    }
    clear = Math.max(clear, bottom)
  }
  return tearSeams(pageSpec.h, rows).filter((y) => y >= MIN_STRIP && y <= pageSpec.h - MIN_STRIP)
})()
const cost = (y: number, target: number) => Math.abs(y - target) + (pageBands.includes(y) ? 0 : 40)
/** Most seams the bench offers: one per clear row. */
export const tearBenchMaxSeams = clearRows.length

/**
 * Where the Seams stepper cuts the page: the register's own seams for three, otherwise the clear
 * rows nearest an even spacing.
 */
export function tearBenchSeams(count: number): number[] {
  if (count === 3) return pageBands.slice(1, -1)
  const usable = clearRows
  const picked: number[] = []
  for (let i = 0; i < count; i++) {
    const target = (pageSpec.h * (i + 1)) / (count + 1)
    const best = usable
      .filter((y) => picked.every((p) => Math.abs(p - y) >= MIN_STRIP))
      // The register's own seams win ties by up to 40px: whole bands tear apart first.
      .sort((a, b) => cost(a, target) - cost(b, target))[0]
    if (best !== undefined) picked.push(best)
  }
  return tearSeams(pageSpec.h, picked)
}

/**
 * The board's hojas beat: the page parts into strips in a loose column, each nudged and turned (the
 * next beat moves them to their readers). Only the last strip moves down; every other one moves up,
 * the higher the further, so with any stagger a strip never slides back into its neighbour, and each
 * turn is small beside the gap it opens, so two torn edges never cross once they part.
 */
export function tearBenchPieces(strips: number) {
  const step = strips > 2 ? Math.min(34, 110 / (strips - 2)) : 34
  return Array.from({ length: strips }, (_, i) => {
    const last = i === strips - 1
    const side = i % 2 ? 1 : -1
    return {
      to: {
        x: side * (18 + 4 * (i % 3)),
        y: last ? 30 : -Math.round(16 + step * (strips - 2 - i)),
        rotate: last ? 2.5 : i === strips - 2 ? side * 1.5 : side * (2 + (i % 2)),
      },
    }
  })
}

/** One stage for every seam count: the union of each layout's tearBounds, so nothing clips or jumps. */
export const tearStage = (() => {
  let x0 = 0,
    y0 = 0,
    x1 = pageSpec.w,
    y1 = pageSpec.h
  for (let count = 1; count <= tearBenchMaxSeams; count++) {
    const seams = tearBenchSeams(count)
    const b = tearBounds({
      w: pageSpec.w,
      h: pageSpec.h,
      seams,
      pieces: tearBenchPieces(seams.length + 1),
    })
    x0 = Math.min(x0, b.x)
    y0 = Math.min(y0, b.y)
    x1 = Math.max(x1, b.x + b.w)
    y1 = Math.max(y1, b.y + b.h)
  }
  const margin = 12
  return {
    w: x1 - x0 + 2 * margin,
    h: y1 - y0 + 2 * margin,
    left: margin - x0,
    top: margin - y0,
  }
})()

function TearBench() {
  const compact = useBenchCompact()
  const [progress, setProgress] = useBenchParam("progress", 0.6, {
    clamp: [0, 1],
  })
  const [stagger, setStagger] = useBenchParam("stagger", 0.1, {
    clamp: [0, 0.3],
  })
  const [seamCount, setSeamCount] = useBenchParam("seams", 3, {
    clamp: [1, tearBenchMaxSeams],
  })
  const [seed, setSeed] = useBenchParam("seed", 1, { clamp: [1, 9] })
  const seams = tearBenchSeams(seamCount)
  return (
    <>
      <StageFit w={tearStage.w} h={tearStage.h} maxScale={0.6}>
        <div style={{ position: "absolute", left: tearStage.left, top: tearStage.top }}>
          <Tear
            w={520}
            h={760}
            seams={seams}
            progress={progress}
            stagger={stagger}
            seed={seed}
            pieces={tearBenchPieces(seams.length + 1)}
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
        {!compact && (
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
        )}
        <StepperControl
          label="Seams"
          value={seamCount}
          onChange={setSeamCount}
          min={1}
          max={tearBenchMaxSeams}
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
