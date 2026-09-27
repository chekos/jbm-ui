"use client"

import { useBenchParam } from "./bench-url"
import { StageFit } from "./stage-fit"
import { ProgressControl, StepperControl, type Presets } from "./progress-control"
import {
  Register,
  registerGap,
  registerLayout,
  type RegisterKind,
  type RegisterSpec,
} from "@/registry/jbm/ui/register"
import { Slip, slipGrip } from "@/registry/jbm/ui/slip"
import { Mano } from "@/registry/jbm/motion/mano"
import { color } from "@/registry/jbm/lib/tokens"
import { pointOn } from "@/registry/jbm/lib/geometry"

export { registerNames } from "./demo-data"

const kinds: RegisterKind[] = ["mono", "plain", "grid", "prose", "mixed"]
const kindNames: Record<RegisterKind, string> = {
  mono: "Mono: steps with results",
  plain: "Plain: numbered lists",
  grid: "Grid: ruled tables",
  prose: "Prose with sources",
  mixed: "Mixed: one long page",
}
const countNoun: Record<RegisterKind, [string, string]> = {
  mono: ["step", "steps"],
  plain: ["list", "lists"],
  grid: ["table", "tables"],
  prose: ["source", "sources"],
  mixed: ["band", "bands"],
}
const countMax: Record<RegisterKind, number> = { mono: 12, plain: 12, grid: 8, prose: 12, mixed: 4 }
const countDefault: Record<RegisterKind, number> = { mono: 7, plain: 10, grid: 7, prose: 8, mixed: 4 }

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function RegisterDemo({ name }: { name: string }) {
  return name === "slip" ? <SlipDemo /> : <RegisterBench />
}

function RegisterBench() {
  const unit = { clamp: [0, 1] } as const
  const [kind, setKind] = useBenchParam<RegisterKind>("kind", "mono", { allowed: kinds })
  // -1 is "the kind's default count"; 0 is a real count (prose with no sources).
  const [n, setN] = useBenchParam("n", -1, { clamp: [-1, 12] })
  const [reveal, setReveal] = useBenchParam("reveal", 1, unit)
  const [gapOn, setGapOn] = useBenchParam("gap", false)
  const [reflow, setReflow] = useBenchParam("reflow", 1, unit)
  const [accent, setAccent] = useBenchParam("accent", false)
  const [guides, setGuides] = useBenchParam("guides", false)
  const count = n < 0 ? countDefault[kind] : Math.max(kind === "prose" ? 0 : 1, Math.min(countMax[kind], n))
  const w = 300,
    h = kind === "mixed" ? 440 : 380
  const spec: RegisterSpec = {
    kind,
    n: count,
    w,
    h,
    ...(gapOn ? { gapAt: kind === "mixed" ? 2 : Math.max(1, Math.floor(count / 2)), gap: 70, reflow } : {}),
  }
  const layout = registerLayout(spec)
  const range = (label: string, value: number, set: (v: number) => void, presets: Presets) => (
    <ProgressControl label={label} ariaLabel={`register ${label}`} value={value} onChange={set} presets={presets} />
  )
  return (
    <div style={{ width: "100%" }}>
      <div style={{ padding: "28px 24px 12px" }}>
        <StageFit w={w + 40} h={h + 40}>
          <div style={{ position: "absolute", left: 20, top: 20 }}>
            <Register {...spec} reveal={reveal} accent={accent ? [0] : []}>
              {guides && (
                <svg width={w} height={h} aria-hidden style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                  {layout.seams.map((y) => (
                    <line key={y} x1={-10} x2={w + 10} y1={y} y2={y} stroke={color.dim} strokeDasharray="4 4" />
                  ))}
                  {layout.anchors.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={5} fill="none" stroke={color.dim} />
                  ))}
                  {layout.gap && layout.gap.h > 0 && (
                    <rect
                      x={layout.gap.x}
                      y={layout.gap.y}
                      width={layout.gap.w}
                      height={layout.gap.h}
                      fill="none"
                      stroke={color.dim}
                      strokeDasharray="4 4"
                    />
                  )}
                </svg>
              )}
            </Register>
          </div>
        </StageFit>
      </div>
      <div className="composition-options" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "16px 24px" }}>
        <label>
          Kind{" "}
          <select
            aria-label="register kind"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as RegisterKind)
              setN(-1)
            }}
          >
            {kinds.map((k) => (
              <option key={k} value={k}>
                {kindNames[k]}
              </option>
            ))}
          </select>
        </label>
        <StepperControl
          label={kind === "prose" ? "Sources" : kind === "mixed" ? "Bands" : "Count"}
          value={count}
          onChange={setN}
          min={kind === "prose" ? 0 : 1}
          max={countMax[kind]}
          noun={countNoun[kind][1]}
          format={(v) => `${v} ${countNoun[kind][v === 1 ? 0 : 1]}`}
        />
        {range("Reveal", reveal, setReveal, ["Blank", "Half", "Written"])}
        <Toggle label="Gap" value={gapOn} onChange={setGapOn} />
        {gapOn && range("Reflow", reflow, setReflow, ["Closed", "Half", "Open"])}
        <Toggle label="Accent first mark" value={accent} onChange={setAccent} />
        <Toggle label="Show seams, anchors, gap" value={guides} onChange={setGuides} />
      </div>
    </div>
  )
}

// Slip bench: a prose slip taped into a Tutorial (mono) sheet travels to the Explicación (prose)
// sheet. The source closes its gap as the destination opens one; a pinch holds the slip's edge.
const SHEET = { w: 250, h: 300 }
const SRC = { x: 24, y: 24 }
const DST = { x: 326, y: 24 }
const SLIP = { w: 190, h: 52 }
const GAP = SLIP.h + 14
const stageW = 600,
  stageH = 380
const smooth = (t: number) => t * t * (3 - 2 * t)

function SlipDemo() {
  const unit = { clamp: [0, 1] } as const
  const [carry, setCarry] = useBenchParam("carry", 0, unit)
  const [lift, setLift] = useBenchParam("lift", 0, unit)
  const [tape, setTape] = useBenchParam("tape", true)
  const [dashed, setDashed] = useBenchParam("dashed", false)
  const [hand, setHand] = useBenchParam("hand", true)
  // The pinch enters on a sleeve from the stage edge by default: hands never float (#135).
  const [arm, setArm] = useBenchParam("arm", true)
  const src: RegisterSpec = { kind: "mono", n: 6, ...SHEET, gapAt: 3, gap: GAP, reflow: 1 - smooth(carry) }
  const dst: RegisterSpec = { kind: "prose", n: 3, ...SHEET, gapAt: 4, gap: GAP, reflow: smooth(carry) }
  // Resting places come from the fully open gaps, so the path does not move while the gaps animate.
  const g0 = registerGap({ ...src, reflow: 1 })!
  const g1 = registerGap({ ...dst, reflow: 1 })!
  const from = { x: SRC.x + g0.x + (g0.w - SLIP.w) / 2, y: SRC.y + g0.y + 7 }
  const to = { x: DST.x + g1.x + (g1.w - SLIP.w) / 2, y: DST.y + g1.y + 7 }
  const path = [from, { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 60 }, to]
  const at = pointOn(path, smooth(carry))
  const slip = { lift, offset: { x: at.x - from.x, y: at.y - from.y }, w: SLIP.w, h: SLIP.h, scale: 250 / 360, tape, dashed }
  const grip = slipGrip(slip)
  const range = (label: string, value: number, set: (v: number) => void, presets: Presets) => (
    <ProgressControl label={label} ariaLabel={`slip ${label}`} value={value} onChange={set} presets={presets} />
  )
  return (
    <div style={{ width: "100%" }}>
      <div style={{ padding: "20px 24px 8px" }}>
        <StageFit w={stageW} h={stageH}>
          <div style={{ position: "absolute", left: SRC.x, top: SRC.y }}>
            <Register {...src} label="Tutorial page, steps" />
          </div>
          <div style={{ position: "absolute", left: DST.x, top: DST.y }}>
            <Register {...dst} label="Explanation page, prose" />
          </div>
          <div style={{ position: "absolute", left: from.x, top: from.y }}>
            <Slip {...slip} />
          </div>
          {hand && (
            <svg
              aria-hidden
              width={stageW}
              height={stageH}
              viewBox={`0 0 ${stageW} ${stageH}`}
              style={{ position: "absolute", inset: 0, overflow: arm ? "hidden" : "visible", pointerEvents: "none" }}
            >
              {arm && (
                // The stage edge the sleeve leaves through, so it never reads as a cut-off stump.
                <rect x={1} y={1} width={stageW - 2} height={stageH - 2} fill="none" stroke={color.line} strokeWidth={2} />
              )}
              <Mano
                at={{ x: from.x + grip.x, y: from.y + grip.y }}
                pose="pinch"
                size={96}
                anchor={{ x: 6, y: 10 }}
                angle={-20}
                arm={arm ? { frame: { x: 0, y: 0, w: stageW, h: stageH } } : undefined}
              />
            </svg>
          )}
        </StageFit>
      </div>
      <div className="composition-options" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "16px 24px" }}>
        {range("Carry", carry, setCarry, ["Taped", "Half", "Landed"])}
        {range("Lift", lift, setLift, ["Flat", "Peeling", "Held"])}
        <Toggle label="Tape" value={tape} onChange={setTape} />
        <Toggle label="Dashed outline" value={dashed} onChange={setDashed} />
        <Toggle label="Hand" value={hand} onChange={setHand} />
        {hand && <Toggle label="Arm from the bottom edge" value={arm} onChange={setArm} />}
      </div>
    </div>
  )
}
