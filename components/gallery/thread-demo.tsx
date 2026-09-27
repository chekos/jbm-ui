"use client"

import { useId, type ReactNode } from "react"
import { BenchToolbarSlot, useBenchParam } from "./bench-url"
import { useBenchCompact } from "./bench-compact"
import { StageFit } from "./stage-fit"
import { Hilo, type HiloCurve } from "@/registry/jbm/ui/hilo"
import { VideoPrint, videoPrintLayout } from "@/registry/jbm/ui/video-print"
import {
  Register,
  registerLayout,
  type RegisterSpec,
} from "@/registry/jbm/ui/register"
import {
  Cajon,
  cajonLayout,
  type DrawerFolder,
} from "@/registry/jbm/motion/cajon"
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

const pct = (n: number) => `${Math.round(n * 100)}%`

// Thread to drawer (the raíces beat): a video print and a sourced page tie their marks to the
// folders they came from. Every endpoint is read from the pieces' own layouts: videoPrintLayout
// marks, registerLayout source leads, and cajonLayout tabs, all in one stage px space.
//
// Routing (#168): the print sits above the page, so its ticks tie down to the three oldest tabs,
// which stand above the drawer's rim, and the page's source lines tie across to the three newest.
// Threads that reach a tab below the rim cross the side wall's top edge (over the rim), never the
// drawer front, and the front hides whatever goes down behind it. Each set is nested (the
// leftmost tick to the lowest tab, the top source line to the highest), so no two threads cross.
// Knots sit just inside each tab's left edge, clear of its name.
const STAGE = { w: 960, h: 790 }
const PRINT = { x: 40, y: 40, w: 300 }
/** Right of the title and date, so a thread leaving a tick downward never crosses the type. */
const printMarks = [0.5, 0.68, 0.86] as const
const PAGE = { x: 40, y: 330 }
const pageSpec: RegisterSpec = { kind: "prose", n: 3, w: 300, h: 300 }
const DRAWER = { x: 600, y: 466, w: 320 }
/** Front (newest) to back (oldest). Print ticks tie to the three oldest, source lines to the newest. */
const drawerFolders: DrawerFolder[] = [
  { name: "Procida 2017" },
  { name: "Grove 1983" },
  { name: "Simon 1947" },
  { name: "TWI 1940s" },
  { name: "Taylor 1911" },
  { name: "Gilbreth 1909" },
]
/** The knot radius of a width-2 Hilo (1.4 × width). */
const KNOT = 2.8
const threadWindow = 0.5
const threadStep = (1 - threadWindow) / 5

function ThreadToDrawer() {
  const compact = useBenchCompact()
  const unit = { clamp: [0, 1] } as const
  const [lay, setLay] = useBenchParam("lay", 1, unit)
  const [scrub, setScrub] = useBenchParam("scrub", 1, unit)
  const [open, setOpen] = useBenchParam("open", 1, unit)
  const [snap, setSnap] = useBenchParam("snap", false)
  const print = videoPrintLayout({ w: PRINT.w, marks: printMarks }, PRINT)
  // Source lines, top to bottom: each thread leaves from the right end (lead) of its dim source
  // line, as on the board, so the line itself stays visible.
  const sources = registerLayout(pageSpec)
    .cells.filter((c) => c.kind === "source")
    .map((c) => ({ x: PAGE.x + c.lead.x + 4, y: PAGE.y + c.lead.y }))
  const drawer = cajonLayout({ ...DRAWER, folders: drawerFolders, open })
  const frontMask = `hilo-front-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  // At the tab's left edge on its name's midline, clear of the name. A tab that sinks into the
  // drawer keeps its thread: the drawer front hides the part behind it (the mask below), so the
  // thread goes over the rim and down behind the front, knot and all. As a name goes under,
  // the hidden end eases to its own spot behind the front, so threads into a closed drawer
  // disappear side by side, in the same nested order, instead of bunching at the corner.
  const tie = (folder: number) => {
    const f = drawer.folders[folder]
    const under = Math.max(
      0,
      Math.min(1, (f.label.mid - drawer.frontTop + 4) / (0.6 * f.tabHeight))
    )
    const hidden =
      folder < 3
        ? { x: DRAWER.x + 40, y: drawer.frontTop + 18 + 14 * (2 - folder) }
        : { x: DRAWER.x + 70 + 50 * (folder - 3), y: drawer.frontTop + 24 }
    // Just inside the tab's left edge (a knot's radius in), so the knot sits on the tab, never
    // half on the dark drawer back beside it, and still clear of the name.
    const x = f.tabX + KNOT
    return {
      x: x + (hidden.x - x) * under,
      y: f.label.mid + (hidden.y - f.label.mid) * under,
    }
  }
  const oldest = drawerFolders.length - 1
  const threads = [
    // Source lines, top to bottom, to the newest folders, highest tab first: level S curves.
    ...sources.map((from, j) => ({
      from,
      to: tie(2 - j),
      folder: 2 - j,
      curve: "s" as const,
      bend: 0.5,
      ready: 1,
    })),
    // Print ticks, left to right, to the oldest folders, lowest tab first. A thread ties on as
    // its tick appears: it lays out from the tick over the scrub that follows the mark, and
    // leaves the rule downward in a shallow arc so it never runs along the rule over the next
    // ticks.
    ...print.marks.map((from, j) => ({
      from,
      to: tie(3 + j),
      folder: 3 + j,
      curve: "arc" as const,
      // The leftmost tick's thread runs outermost, so the three stay apart as the tabs close up.
      bend: [-0.08, -0.05, -0.02][j],
      ready: Math.max(0, Math.min(1, (scrub - printMarks[j]) / 0.12)),
    })),
  ]
  const tied = threads.filter((t) => t.ready > 0).length
  return (
    <>
      <StageFit w={STAGE.w} h={STAGE.h}>
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
            title="Sample talk"
            date="Video · 4 nov 2025"
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
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            {/* The drawer front occludes whatever passes behind it. */}
            <mask id={frontMask} maskUnits="userSpaceOnUse">
              <rect
                x={-STAGE.w}
                y={-STAGE.h}
                width={3 * STAGE.w}
                height={3 * STAGE.h}
                fill="#fff"
              />
              <rect
                x={DRAWER.x}
                y={drawer.frontTop}
                width={DRAWER.w}
                height={drawer.frontHeight}
                fill="#000"
              />
            </mask>
          </defs>
          <g mask={`url(#${frontMask})`}>
            {threads.map((t, i) => {
              const snapped = snap && t.folder === oldest
              return t.ready > 0 ? (
                <Hilo
                  key={i}
                  from={t.from}
                  to={t.to}
                  curve={t.curve}
                  bend={t.bend}
                  width={2}
                  // The front hides a tab's knot with its tab; the tick's knot always shows.
                  knots
                  draw={
                    snapped
                      ? 1
                      : t.ready *
                        Math.max(
                          0,
                          Math.min(1, (lay - i * threadStep) / threadWindow)
                        )
                  }
                  snapAt={snapped ? 0 : undefined}
                  breakAt={0.55}
                  fray={0.6}
                  slack={snapped ? 0.3 : 0}
                  notch={snapped}
                />
              ) : null
            })}
          </g>
        </svg>
      </StageFit>
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
        {!compact && (
          <Toggle
            label="Snap the oldest thread"
            value={snap}
            onChange={setSnap}
          />
        )}
      </Controls>
    </>
  )
}

function HiloDemo() {
  const compact = useBenchCompact()
  const unit = { clamp: [0, 1] } as const
  const [draw, setDraw] = useBenchParam("draw", 1, unit)
  const [snaps, setSnaps] = useBenchParam("snaps", true)
  const [notch, setNotch] = useBenchParam("notch", true)
  // A little slack by default, so the snapped ends hang apart and the break reads at a glance.
  const [slack, setSlack] = useBenchParam("slack", 0.35, unit)
  const [fray, setFray] = useBenchParam("fray", 0.6, unit)
  const [breakAt, setBreakAt] = useBenchParam("break", 0.5, {
    clamp: [0.05, 0.95],
  })
  const [bend, setBend] = useBenchParam("bend", 0.5, { clamp: [-0.5, 1] })
  const [curve, setCurve] = useBenchParam<HiloCurve>("curve", "s", {
    allowed: ["s", "arc"],
  })
  const [width, setWidth] = useBenchParam("width", 2, { clamp: [1, 6] })
  // An arc bows by bend × the distance: past ±0.3 it would leave the stage. An S takes 0–1
  // (outside it the thread hooks around its own knots).
  const bendMin = curve === "arc" ? -0.3 : 0,
    bendMax = curve === "arc" ? 0.3 : 1
  const shownBend = Math.min(bendMax, Math.max(bendMin, bend))
  const from = { x: 40, y: 150 },
    to = { x: 460, y: 230 }
  return (
    <>
      <svg
        viewBox="0 0 500 440"
        role="img"
        aria-label={`Ink thread, ${snaps && draw > 0.5 ? "snapped" : draw >= 1 || (snaps && draw >= 0.5) ? "tied" : "being laid"}`}
        style={{
          width: "100%",
          maxWidth: 640,
          height: "auto",
          display: "block",
        }}
      >
        <Hilo
          from={from}
          to={to}
          curve={curve}
          bend={shownBend}
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
          presets={
            snaps ? ["Empty", "Tied", "Snapped"] : ["Empty", "Half", "Tied"]
          }
        />
        {!compact && (
          <>
            <Toggle
              label="Snaps at 50% of draw"
              value={snaps}
              onChange={setSnaps}
            />
            <Toggle label="Vermilion notch" value={notch} onChange={setNotch} />
          </>
        )}
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
        {!compact && (
          <>
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
              value={shownBend}
              onChange={setBend}
              min={bendMin}
              max={bendMax}
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
          </>
        )}
      </Controls>
    </>
  )
}

function VideoPrintDemo() {
  const compact = useBenchCompact()
  const unit = { clamp: [0, 1] } as const
  const [scrub, setScrub] = useBenchParam("scrub", 0.62, unit)
  const [marks, setMarks] = useBenchParam("marks", true)
  const [link, setLink] = useBenchParam("link", true)
  const [opened, setOpened] = useBenchParam("opened", 1, unit)
  const [sheet, setSheet] = useBenchParam("sheet", true)
  // One print size, scaled by CSS: the stage reserves the print plus room for the tag from the
  // first render, whether or not the tag is shown, so nothing below it moves.
  const PRINT_W = 420
  const bounds = videoPrintLayout({ w: PRINT_W, link: "reserve" }).bounds
  return (
    <>
      {/* The print and its tag, plus room for the paper shadow under both. */}
      <StageFit w={bounds.w + 24} h={bounds.h + 12 + 32}>
        <div style={{ position: "absolute", left: 12, top: 12 }}>
          <VideoPrint
            w={PRINT_W}
            scrub={scrub}
            marks={marks ? [0.12, 0.3, 0.46, 0.62] : []}
            title="Sample talk"
            date="Video · 4 nov 2025"
            link={link ? "example.com/watch?v=sample-talk" : undefined}
            opened={opened}
            sheet={sheet}
          />
        </div>
      </StageFit>
      <Controls>
        <ProgressControl
          label="Scrub"
          ariaLabel="video-print Scrub"
          value={scrub}
          onChange={setScrub}
          presets={["Start", "Half", "End"]}
        />
        {!compact && (
          <Toggle
            label="Marks at 12, 30, 46, 62%"
            value={marks}
            onChange={setMarks}
          />
        )}
        <Toggle label="Opened: link tag" value={link} onChange={setLink} />
        {link && !compact && (
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
const hiloScenes = [
  ["bench", "Thread"],
  ["drawer", "Thread to drawer"],
] as const

/**
 * Which Hilo scene the bench shows: the thread alone or the composed thread-to-drawer scene. It
 * shares the `scene` bench param, so it can sit in the bench toolbar or above the demo and stay in
 * sync; it is styled like the toolbar's segmented switches.
 */
export function HiloSceneSwitch() {
  const [scene, setScene] = useBenchParam<HiloScene>("scene", "bench", {
    allowed: ["bench", "drawer"],
  })
  return (
    <div className="bench-segmented" role="group" aria-label="Hilo scene">
      {hiloScenes.map(([value, label]) => (
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
  )
}

/** The Hilo bench, or the composed thread-to-drawer scene. Index cards show the thread alone. */
function HiloScenes({ sceneSwitch }: { sceneSwitch: boolean }) {
  const compact = useBenchCompact()
  const [scene] = useBenchParam<HiloScene>("scene", "bench", {
    allowed: ["bench", "drawer"],
  })
  return (
    <>
      {sceneSwitch && !compact && (
        <BenchToolbarSlot>
          <HiloSceneSwitch />
        </BenchToolbarSlot>
      )}
      {scene === "drawer" && !compact ? <ThreadToDrawer /> : <HiloDemo />}
    </>
  )
}

function Controls({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 12, width: "100%" }}>{children}</div>
  )
}

/**
 * `sceneSwitch={false}` leaves the Hilo scene switch out, for a host that places
 * HiloSceneSwitch in its own toolbar.
 */
export function ThreadDemo({
  name,
  sceneSwitch = true,
}: {
  name: string
  sceneSwitch?: boolean
}) {
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
      {name === "hilo" ? (
        <HiloScenes sceneSwitch={sceneSwitch} />
      ) : (
        <VideoPrintDemo />
      )}
    </div>
  )
}
