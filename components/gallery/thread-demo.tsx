"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useBenchParam } from "./bench-url"
import { Hilo, type HiloCurve } from "@/registry/jbm/ui/hilo"
import { VideoPrint, videoPrintLayout } from "@/registry/jbm/ui/video-print"
import { Register, registerAnchors, type RegisterSpec } from "@/registry/jbm/ui/register"
import { Cajon, cajonLayout, type DrawerFolder } from "@/registry/jbm/motion/cajon"
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

/** A fixed-size stage in px, scaled down to its container on narrow screens. */
function Fit({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [k, setK] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setK(Math.min(1, entry.contentRect.width / w))
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [w])
  return (
    <div ref={ref} style={{ width: "100%", maxWidth: w, height: h * k, margin: "0 auto" }}>
      <div
        style={{
          width: w,
          height: h,
          position: "relative",
          transform: `scale(${k})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Thread to drawer (the raíces beat): a video print and a sourced page tie their marks to the
// folders they came from. Every endpoint is read from the pieces' own layouts: videoPrintLayout
// marks, registerAnchors source ticks, and cajonLayout tab anchors, all in one stage px space.
const STAGE = { w: 960, h: 790 }
const PAGE = { x: 40, y: 40 }
const pageSpec: RegisterSpec = { kind: "prose", n: 3, w: 300, h: 300 }
const PRINT = { x: 40, y: 400, w: 300 }
const printMarks = [0.22, 0.5, 0.78] as const
const DRAWER = { x: 560, y: 420, w: 360 }
/** Front (newest) to back (oldest). Source ticks tie to the three oldest, print marks to the newest. */
const drawerFolders: DrawerFolder[] = [
  { name: "Procida 2017" },
  { name: "Grove 1983" },
  { name: "Simon 1947" },
  { name: "TWI 1940s" },
  { name: "Taylor 1911" },
  { name: "Gilbreth 1909" },
]
const threadWindow = 0.5
const threadStep = (1 - threadWindow) / 5

function ThreadToDrawer() {
  const unit = { clamp: [0, 1] } as const
  const [lay, setLay] = useBenchParam("lay", 1, unit)
  const [scrub, setScrub] = useBenchParam("scrub", 1, unit)
  const [open, setOpen] = useBenchParam("open", 1, unit)
  const [snap, setSnap] = useBenchParam("snap", false)
  const print = videoPrintLayout({ w: PRINT.w, marks: printMarks }, PRINT)
  const ticks = registerAnchors(pageSpec).map((p) => ({ x: PAGE.x + p.x, y: PAGE.y + p.y }))
  const drawer = cajonLayout({ ...DRAWER, folders: drawerFolders, open })
  const tie = (folder: number) => drawer.anchors(folder, 1)[0]
  const threads = [
    // Source ticks, top to bottom, to the back folders: each leaves level along its source line.
    ...ticks.map((from, j) => ({
      from,
      to: tie(5 - j),
      curve: "s" as const,
      bend: 0.5,
      ready: true,
    })),
    // Print marks, left to right, to the front folders: a mark exists once the scrub passes it.
    ...print.marks.map((from, j) => ({
      from,
      to: tie(2 - j),
      curve: "arc" as const,
      bend: -0.08,
      ready: scrub >= printMarks[j],
    })),
  ]
  const tied = threads.filter((t) => t.ready).length
  return (
    <>
      <Fit w={STAGE.w} h={STAGE.h}>
        <svg
          aria-hidden
          width={STAGE.w}
          height={STAGE.h}
          viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <Cajon {...DRAWER} folders={drawerFolders} open={open} />
        </svg>
        <div style={{ position: "absolute", left: PRINT.x, top: PRINT.y }}>
          <VideoPrint
            w={PRINT.w}
            scrub={scrub}
            marks={printMarks}
            title="Alex Hormozi"
            date="YouTube · 4 nov 2025"
          />
        </div>
        <div style={{ position: "absolute", left: PAGE.x, top: PAGE.y }}>
          <Register {...pageSpec} label="Page of sourced prose" />
        </div>
        <svg
          role="img"
          aria-label={`Threads tied from the print and the page to the drawer: ${tied} of ${threads.length}${snap ? ", the oldest snapped" : ""}`}
          width={STAGE.w}
          height={STAGE.h}
          viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
          style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
        >
          {threads.map((t, i) =>
            t.ready ? (
              <Hilo
                key={i}
                from={t.from}
                to={t.to}
                curve={t.curve}
                bend={t.bend}
                width={2}
                knots
                draw={
                  i === 0 && snap
                    ? 1
                    : Math.max(0, Math.min(1, (lay - i * threadStep) / threadWindow))
                }
                snapAt={i === 0 && snap ? 0 : undefined}
                breakAt={0.55}
                fray={0.6}
                notch={i === 0 && snap}
              />
            ) : null
          )}
        </svg>
      </Fit>
      <Controls>
        <ProgressControl
          label="Lay threads"
          ariaLabel="thread to drawer Lay threads"
          value={lay}
          onChange={setLay}
          presets={["None", "Half", "Tied"]}
        />
        <ProgressControl
          label="Scrub"
          ariaLabel="thread to drawer Scrub"
          value={scrub}
          onChange={setScrub}
          presets={["Start", "Half", "End"]}
        />
        <ProgressControl
          label="Drawer open"
          ariaLabel="thread to drawer Drawer open"
          value={open}
          onChange={setOpen}
          presets={["Closed", "Half", "Open"]}
        />
        <Toggle label="Snap the oldest thread" value={snap} onChange={setSnap} />
      </Controls>
    </>
  )
}

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

type HiloScene = "bench" | "drawer"
/** The Hilo bench, or the composed thread-to-drawer scene (print marks and source ticks to folder tabs). */
function HiloScenes() {
  const [scene, setScene] = useBenchParam<HiloScene>("scene", "bench", {
    allowed: ["bench", "drawer"],
  })
  return (
    <>
      <div className="progress-control" role="group" aria-label="hilo Scene" style={{ width: "100%" }}>
        <div className="progress-presets">
          {(
            [
              ["bench", "Thread"],
              ["drawer", "Thread to drawer"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={scene === value}
              onClick={() => setScene(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {scene === "drawer" ? <ThreadToDrawer /> : <HiloDemo />}
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
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 20,
        justifyItems: "center",
      }}
    >
      {name === "hilo" ? <HiloScenes /> : <VideoPrintDemo />}
    </div>
  )
}
