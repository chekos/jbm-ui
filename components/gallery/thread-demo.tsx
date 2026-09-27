"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useBenchParam } from "./bench-url"
import { Hilo, type HiloCurve } from "@/registry/jbm/ui/hilo"
import { VideoPrint } from "@/registry/jbm/ui/video-print"
import { ProgressControl, RangeControl } from "./progress-control"

export { threadNames } from "./demo-data"

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

/** Width available to the print, so the stage-pixel illustration fits a phone card too. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

const pct = (n: number) => `${Math.round(n * 100)}%`

function HiloDemo() {
  const unit = { clamp: [0, 1] } as const
  const [draw, setDraw] = useBenchParam("draw", 1, unit)
  const [snaps, setSnaps] = useBenchParam("snaps", true)
  const [notch, setNotch] = useBenchParam("notch", true)
  const [slack, setSlack] = useBenchParam("slack", 0, unit)
  const [fray, setFray] = useBenchParam("fray", 0.6, unit)
  const [breakAt, setBreakAt] = useBenchParam("break", 0.5, {
    clamp: [0.05, 0.95],
  })
  const [bend, setBend] = useBenchParam("bend", 0.5, { clamp: [-0.5, 1] })
  const [curve, setCurve] = useBenchParam<HiloCurve>("curve", "s", {
    allowed: ["s", "arc"],
  })
  const [width, setWidth] = useBenchParam("width", 2, { clamp: [1, 6] })
  const from = { x: 40, y: 90 },
    to = { x: 460, y: 170 }
  return (
    <>
      <svg
        viewBox="0 0 500 300"
        role="img"
        aria-label={`Ink thread, ${snaps && draw > 0.5 ? "snapped" : draw >= 1 || (snaps && draw >= 0.5) ? "tied" : "being laid"}`}
        style={{ width: "100%", maxWidth: 640, height: "auto", display: "block" }}
      >
        <Hilo
          from={from}
          to={to}
          curve={curve}
          bend={bend}
          draw={draw}
          width={width}
          snapAt={snaps ? 0.5 : undefined}
          breakAt={breakAt}
          fray={fray}
          slack={slack}
          notch={notch}
        />
      </svg>
      <Controls>
        <ProgressControl
          label="Draw"
          ariaLabel="hilo Draw"
          value={draw}
          onChange={setDraw}
          presets={snaps ? ["Empty", "Tied", "Snapped"] : ["Empty", "Half", "Tied"]}
        />
        <Toggle label="Snaps at 50% of draw" value={snaps} onChange={setSnaps} />
        <Toggle label="Vermilion notch" value={notch} onChange={setNotch} />
        <ProgressControl
          label="Slack"
          ariaLabel="hilo Slack"
          value={slack}
          onChange={setSlack}
          presets={["Taut", "Loose", "Limp"]}
        />
        <ProgressControl
          label="Fray"
          ariaLabel="hilo Fray"
          value={fray}
          onChange={setFray}
          presets={["Clean", "Half", "Frayed"]}
        />
        <RangeControl
          label="Break point"
          ariaLabel="hilo Break point"
          value={breakAt}
          onChange={setBreakAt}
          min={0.05}
          max={0.95}
          step={0.01}
          format={(n) => `${pct(n)} along`}
        />
        <RangeControl
          label="Bend"
          ariaLabel="hilo Bend"
          value={bend}
          onChange={setBend}
          min={-0.5}
          max={1}
          step={0.01}
          format={(n) => `${n < 0 ? "−" : ""}${Math.abs(n).toFixed(2)}`}
        />
        <RangeControl
          label="Width"
          ariaLabel="hilo Width"
          value={width}
          onChange={setWidth}
          min={1}
          max={6}
          step={0.5}
          format={(n) => `${n} px`}
        />
        <label style={{ fontSize: 12 }}>
          Curve{" "}
          <select
            aria-label="hilo curve"
            value={curve}
            onChange={(e) => setCurve(e.target.value as HiloCurve)}
          >
            <option value="s">Level ends (S)</option>
            <option value="arc">Arc</option>
          </select>
        </label>
      </Controls>
    </>
  )
}

function VideoPrintDemo() {
  const unit = { clamp: [0, 1] } as const
  const [scrub, setScrub] = useBenchParam("scrub", 0.62, unit)
  const [marks, setMarks] = useBenchParam("marks", true)
  const [link, setLink] = useBenchParam("link", true)
  const [opened, setOpened] = useBenchParam("opened", 1, unit)
  const [sheet, setSheet] = useBenchParam("sheet", true)
  const [ref, available] = useWidth()
  const w = Math.max(220, Math.min(420, available - 24))
  return (
    <>
      <div
        ref={ref}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          paddingBottom: link ? 28 : 0,
        }}
      >
        {available > 0 && (
          <VideoPrint
            w={w}
            scrub={scrub}
            marks={marks ? [0.12, 0.3, 0.46, 0.62] : []}
            title="Alex Hormozi"
            date="YouTube · 4 nov 2025"
            link={link ? "youtube.com/watch?v=mr4Pw66_498" : undefined}
            opened={opened}
            sheet={sheet}
          />
        )}
      </div>
      <Controls>
        <ProgressControl
          label="Scrub"
          ariaLabel="video-print Scrub"
          value={scrub}
          onChange={setScrub}
          presets={["Start", "Half", "End"]}
        />
        <Toggle label="Marks at 12, 30, 46, 62%" value={marks} onChange={setMarks} />
        <Toggle label="Opened: link tag" value={link} onChange={setLink} />
        {link && (
          <ProgressControl
            label="Tag drops in"
            ariaLabel="video-print Tag drops in"
            value={opened}
            onChange={setOpened}
            presets={["Hidden", "Half", "Attached"]}
          />
        )}
        <Toggle label="Paper sheet" value={sheet} onChange={setSheet} />
      </Controls>
    </>
  )
}

function Controls({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: 12, width: "100%" }}>{children}</div>
}

export function ThreadDemo({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        padding: 24,
        boxSizing: "border-box",
        display: "grid",
        gap: 20,
        justifyItems: "center",
      }}
    >
      {name === "hilo" ? <HiloDemo /> : <VideoPrintDemo />}
    </div>
  )
}
