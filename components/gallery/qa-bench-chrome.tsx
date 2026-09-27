"use client"

import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react"
import { useId } from "react"
import type { SceneLayout } from "@/registry/jbm/motion/spec"
import { stage, type Orientation } from "@/registry/jbm/lib/tokens"
import { ReplayButton } from "@/registry/jbm/ui/replay-button"
import { CopyBenchLink } from "./bench-url"
import { getGalleryItem } from "./item-meta"
import { InlineScript } from "./inline-script"

// Motion bench chrome without Remotion: the toolbar, orientation switch, frame stepper, scene
// options, and strip grid render both inside MotionBench (qa-bench-motion.tsx, loaded client-only
// with the Player) and in BenchSkeleton, the server-rendered placeholder that reserves the bench's
// exact size until the Player loads. Sharing the markup is what keeps the swap free of layout shift.

export type View = "single" | "strip"
export type BenchSafeArea = "full" | "social"

// timing.ts's fps; importing it would pull Remotion into the page bundle.
const fps = 30
const noop = () => {}

const orientationChoices: { value: Orientation; label: string }[] = [
  { value: "landscape", label: "Landscape 16:9" },
  { value: "vertical", label: "Portrait 9:16" },
]
const viewChoices: { value: View; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "strip", label: "Strip" },
]
const layouts: SceneLayout[] = ["hero", "headline-illustration", "illustration"]

export const orientationLabel: Record<Orientation, string> = {
  landscape: "Landscape 16:9",
  vertical: "Portrait 9:16",
}

/**
 * Zero-based frame index, padded to the digits of `last`. The bench passes the last frame of the
 * item's longest preview timeline (item-meta `frames`), so one item pads the same in every layout,
 * view, and placeholder: 00–42 on scene-spec, 000–154 on Propagate.
 */
export const padFrame = (frame: number, last: number) =>
  String(frame).padStart(String(last).length, "0")

/** Last frame of the item's longest preview timeline, the width frame numbers pad to. */
export const padLast = (name: string, fallback: number) =>
  Math.max(0, (getGalleryItem(name)?.frames ?? fallback + 1) - 1)

const seconds = (value: number) => `${(value / fps).toFixed(2)} s`

/** Stage size in composition pixels: 16:9 or 9:16 scene stages, or the 8:5 preview canvas. */
export const stageSize = (orientation: Orientation | undefined) =>
  orientation ? stage[orientation] : { w: 800, h: 500 }

/**
 * Bench state in the URL, so a reviewer can reload or share exactly what they see:
 *   ?view=strip  ?orientation=portrait  ?frame=21  ?layout=hero  ?safe=social  ?guides=1
 * `frame` is the zero-based frame index (0 … durationInFrames − 1), the same number the readout
 * and the strip show. Defaults are omitted, unknown values fall back to them, a frame past the end
 * clamps to the last frame, and scene options are read only on orientation-aware benches.
 */
export type BenchState = {
  view: View
  orientation: Orientation
  layout: SceneLayout
  safeArea: BenchSafeArea
  guides: boolean
  /** Null rests on the last frame. */
  frame: number | null
}

export const defaults: BenchState = {
  view: "single",
  orientation: "landscape",
  layout: "headline-illustration",
  safeArea: "full",
  guides: false,
  frame: null,
}

export function readBenchState(
  query: { get(key: string): string | null },
  orientationAware: boolean
): BenchState {
  const pick = <T extends string>(key: string, allowed: readonly T[]) => {
    const value = query.get(key) as T | null
    return value !== null && allowed.includes(value) ? value : undefined
  }
  const frameText = query.get("frame")
  const frame =
    frameText !== null && /^\d{1,6}$/.test(frameText) ? Number(frameText) : null
  const view = pick("view", ["single", "strip"]) ?? defaults.view
  if (!orientationAware) return { ...defaults, view, frame }
  const orientation = pick("orientation", ["landscape", "portrait", "vertical"])
  return {
    view,
    orientation:
      orientation === undefined
        ? defaults.orientation
        : orientation === "landscape"
          ? "landscape"
          : "vertical",
    layout: pick("layout", layouts) ?? defaults.layout,
    safeArea: pick("safe", ["full", "social"]) ?? defaults.safeArea,
    guides: query.get("guides") === "1",
    frame,
  }
}

/** The bench keys for a state: defaults, and scene options on other benches, are removed. */
export function benchParams(
  state: BenchState,
  last: number,
  orientationAware: boolean
): Record<string, string | null> {
  const scene = (value: string | null) => (orientationAware ? value : null)
  return {
    view: state.view !== defaults.view ? state.view : null,
    orientation: scene(
      state.orientation !== defaults.orientation ? "portrait" : null
    ),
    layout: scene(state.layout !== defaults.layout ? state.layout : null),
    safe: scene(state.safeArea !== defaults.safeArea ? state.safeArea : null),
    guides: scene(state.guides ? "1" : null),
    frame:
      state.frame !== null && state.frame !== last ? String(state.frame) : null,
  }
}

/** View switch and Copy link. They lead the bench (the rail on wide scene-spec benches). */
export function BenchToolbar({
  view,
  onView,
  showViews,
  href,
}: {
  view: View
  onView: (view: View) => void
  showViews: boolean
  href: string
}) {
  return (
    <div className="bench-toolbar">
      {showViews && (
        <div className="bench-segmented" role="group" aria-label="Bench view">
          {viewChoices.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={view === option.value}
              onClick={() => onView(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      <CopyBenchLink href={href} />
    </div>
  )
}

export function OrientSwitch({
  orientation,
  onChange,
}: {
  orientation: Orientation
  onChange: (orientation: Orientation) => void
}) {
  return (
    <div
      className="bench-segmented bench-orient"
      role="group"
      aria-label="Stage orientation"
    >
      {orientationChoices.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={orientation === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SceneOptions({
  layout,
  safeArea,
  guides,
  onLayout,
  onSafeArea,
  onGuides,
  slot,
}: {
  layout: SceneLayout
  safeArea: BenchSafeArea
  guides: boolean
  onLayout: (layout: SceneLayout) => void
  onSafeArea: (safeArea: BenchSafeArea) => void
  onGuides: (guides: boolean) => void
  /** Skeleton only: which view this copy of the options belongs to. */
  slot?: View
}) {
  return (
    <div
      className="bench-options"
      role="group"
      aria-label="Scene options"
      data-slot={slot}
    >
      <label>
        Layout
        <select
          value={layout}
          onChange={(e) => onLayout(e.target.value as SceneLayout)}
        >
          <option value="hero">Centered hero</option>
          <option value="headline-illustration">Headline + illustration</option>
          <option value="illustration">Illustration</option>
        </select>
      </label>
      <label>
        Safe area
        <select
          value={safeArea}
          onChange={(e) => onSafeArea(e.target.value as BenchSafeArea)}
        >
          <option value="full">Full frame</option>
          <option value="social">Social</option>
        </select>
      </label>
      <label className="bench-check">
        <input
          type="checkbox"
          checked={guides}
          onChange={(e) => onGuides(e.target.checked)}
        />
        Safe-area guides
      </label>
    </div>
  )
}

/** Begin / Middle / End, the frame scrubber, the readout, and replay, under the single stage. */
export function FrameStepper({
  title,
  durationInFrames,
  frame,
  charging,
  progress,
  seek,
  replay,
  scrubRef,
  padTo,
}: {
  title: string
  durationInFrames: number
  frame: number
  charging: boolean
  progress: number
  seek: (frame: number) => void
  replay: () => void
  scrubRef?: RefObject<HTMLInputElement | null>
  /** Pad frame numbers to this frame's digits (the item's longest timeline); defaults to last. */
  padTo?: number
}) {
  const id = useId()
  const last = Math.max(0, durationInFrames - 1)
  const middle = Math.round(last / 2)
  const width = padTo ?? last
  // Screen readers hear the zero-based frame out of the last one, then the time: "Frame 15 of 45, 0.50 s".
  const readout = `Frame ${frame} of ${last}, ${seconds(frame)}`
  function stepBy(delta: number, event: KeyboardEvent<HTMLInputElement>) {
    event.preventDefault()
    seek(frame + delta)
  }
  if (last === 0)
    return (
      <p className="bench-note">
        Static layout: one frame, nothing to step or replay.
      </p>
    )
  return (
    <div className="bench-frames" role="group" aria-label="Frame stepper">
      <div className="bench-steps">
        {(
          [
            ["Begin", 0],
            ["Middle", middle],
            ["End", last],
          ] as const
        ).map(([label, target]) => (
          <button
            key={label}
            type="button"
            aria-current={frame === target && !charging ? "step" : undefined}
            onClick={() => seek(target)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="bench-scrub">
        <label className="sr-only" htmlFor={`${id}-frame`}>
          Frame
        </label>
        <input
          ref={scrubRef}
          id={`${id}-frame`}
          type="range"
          min={0}
          max={last}
          step={1}
          value={frame}
          aria-valuetext={readout}
          aria-describedby={`${id}-keys`}
          onChange={(e) => seek(Number(e.target.value))}
          onKeyDown={(event) => {
            // Arrow keys step one frame natively; PageUp/PageDown step a fixed five frames
            // (browsers otherwise pick a tenth of the range).
            if (event.key === "PageUp") stepBy(5, event)
            else if (event.key === "PageDown") stepBy(-5, event)
          }}
        />
        <p className="bench-keys" aria-hidden="true">
          0–{last} · ← → 1 · PgUp PgDn 5 · Home End
        </p>
        <span className="sr-only" id={`${id}-keys`}>
          {durationInFrames} frames, numbered 0 to {last}. Arrow keys step one
          frame, Page Up and Page Down step five, Home and End jump to the first
          and last frame.
        </span>
      </div>
      <output className="bench-readout" htmlFor={`${id}-frame`}>
        <span>
          {padFrame(frame, width)}/{padFrame(last, width)}
        </span>
        <span>{seconds(frame)}</span>
      </output>
      <ReplayButton
        progress={progress}
        charging={charging}
        label={`Replay ${title} animation`}
        onReplay={replay}
      />
    </div>
  )
}

/**
 * Strip cells per row. Every item's cells keep one size (about 295 × 184 at 1440×900), so a
 * category pager walk compares like with like; four or more cells wrap into a second row, which
 * still fits the first viewport because a bar bench's stage is 1.6× as wide as it is tall. Two
 * rows hold Begin, End, and the contract's (at most four) cues.
 */
const stripColumns = 3

export type StripStep = { label: string; frame: number }

/**
 * The strip's frames: frame 0 (captioned by the contract's `start`, "Begin" by default; items
 * whose elements all enter later say "Empty stage"), the item's cues (from its contract, see
 * contracts/schema.ts `cues`), then End. Cues outside this timeline are dropped (the scene-spec hero layout is shorter than the
 * default one); an item without cues inside it gets a Middle frame instead.
 */
export function stripSteps(
  durationInFrames: number,
  cues: readonly StripStep[] = [],
  start = "Begin"
): StripStep[] {
  const last = Math.max(0, durationInFrames - 1)
  const inside = cues.filter((cue) => cue.frame > 0 && cue.frame < last)
  return [
    { label: start, frame: 0 },
    ...(inside.length
      ? inside
      : [{ label: "Middle", frame: Math.round(last / 2) }]),
    { label: "End", frame: last },
  ]
}

/** Grid for `cells` strip cells in rows of three (4 → 3 + 1, 5 → 3 + 2, 6 → 3 + 3). */
export function stripGrid(cells: number) {
  return {
    rows: Math.max(1, Math.ceil(cells / stripColumns)),
    columns: stripColumns,
  }
}

/**
 * Strip view: Begin, each cue, and End side by side, so states are compared by eye rather than
 * from memory. Orientation-aware items get one list per orientation. `frame` draws each cell's
 * picture (a Remotion Thumbnail in the bench, nothing in the skeleton); choosing a cell opens that
 * frame in the single view. Captions say what happens; the frame number is in mono.
 */
export function StripLayout({
  title,
  orientationAware,
  durationInFrames,
  cues,
  start,
  padTo,
  onOpen,
  frame,
}: {
  title: string
  orientationAware: boolean
  durationInFrames: number
  /** The item's contract cues; without them the strip shows Begin, Middle, and End. */
  cues?: readonly StripStep[]
  /** Caption of the frame-0 cell (the contract's `start`); "Begin" by default. */
  start?: string
  /** Pad frame numbers to this frame's digits (the item's longest timeline). */
  padTo: number
  onOpen: (frame: number, orientation?: Orientation) => void
  frame: (frame: number, orientation: Orientation | undefined) => ReactNode
}) {
  const steps = stripSteps(durationInFrames, cues, start)
  const grid = stripGrid(steps.length)
  const rows: (Orientation | undefined)[] = orientationAware
    ? ["landscape", "vertical"]
    : [undefined]

  return (
    <div
      className="bench-strip"
      role="group"
      aria-label={`${title} frame strip`}
      data-cells={steps.length}
      style={
        {
          "--strip-n": steps.length,
          "--strip-cols": grid.columns,
          "--strip-rows": grid.rows,
        } as CSSProperties
      }
    >
      {rows.map((orientation) => {
        const size = stageSize(orientation)
        return (
          <ul
            key={orientation ?? "preview"}
            className="bench-strip-row"
            data-orientation={orientation ?? "preview"}
            aria-label={orientation ? orientationLabel[orientation] : undefined}
          >
            {steps.map(({ label, frame: target }) => (
              <li key={`${label}-${target}`}>
                <figure className="bench-strip-cell">
                  <div
                    className="bench-strip-frame"
                    style={{ aspectRatio: `${size.w} / ${size.h}` }}
                  >
                    {frame(target, orientation)}
                  </div>
                  <figcaption>
                    <button
                      type="button"
                      aria-label={`${label}, frame ${target}${
                        orientation ? `, ${orientationLabel[orientation]}` : ""
                      }. Open in single view`}
                      onClick={() => onOpen(target, orientation)}
                    >
                      <span className="bench-strip-label">{label}</span>
                      <span className="bench-strip-frame-no">
                        {padFrame(target, padTo)}
                      </span>
                    </button>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}

// Runs while the HTML is parsed, before first paint, as the last child of the bench host:
// publishes --bench-top (the bench's distance from the top of the document, see `.bench` in
// globals.css) and points the skeleton at the view and orientation in the query, the only bench
// state that changes its size; the prerendered HTML cannot know the query. The header above
// reflows when each web font swaps in (the description can lose a line), so the script measures
// again as soon as each face loads, before the next rendering update lays the page out with it (a
// ResizeObserver alone reacts one layout late, which Chrome counts as a layout shift), and on any
// later body resize. useBenchTop takes over after hydration; the observer stops once its host
// leaves the page.
const benchTopScript = `(function(s){var h=s&&s.parentElement;if(!h)return;var o=new ResizeObserver(m);function m(){if(!h.isConnected)return o.disconnect();h.style.setProperty("--bench-top",Math.round(h.getBoundingClientRect().top+scrollY)+"px")}m();o.observe(document.body);var f=document.fonts;if(f){f.forEach(function(x){x.loaded.then(m,m)});f.ready.then(m)}var k=h.querySelector(":scope>.bench-skeleton");if(!k)return;var q=new URLSearchParams(location.search);if(q.get("view")==="strip")k.setAttribute("data-view","strip");var p=q.get("orientation");if(k.getAttribute("data-layout")==="rail"&&(p==="portrait"||p==="vertical"))k.style.setProperty("--stage-ratio","${
  stage.vertical.w / stage.vertical.h
}")})(document.currentScript)`

export function BenchHostScript() {
  return <InlineScript html={benchTopScript} />
}

/**
 * The bench before the Player loads: the same toolbar, stage or strip cells, stepper, and scene
 * options as MotionBench at their defaults, laid out by the same CSS, so it holds the bench's exact
 * size. It carries both views; BenchHostScript sets data-view (and the portrait stage ratio) from
 * the query before first paint, and CSS shows the matching parts (`.bench-skeleton` in
 * globals.css). Controls stay invisible and inert; only the frames and "Loading preview…" show.
 */
export function BenchSkeleton({
  name,
  title,
  orientationAware,
}: {
  name: string
  title: string
  orientationAware: boolean
}) {
  // The strip reserves one cell per cue (plus Begin and End), so it matches the loaded strip.
  const meta = getGalleryItem(name)
  const cues = meta?.cues
  // The default timeline's length (the longest one) from the contract, so hidden captions and the
  // readout hold the loaded bench's digits.
  const durationInFrames =
    meta?.frames ?? Math.max(100, (cues?.at(-1)?.frame ?? 0) + 2)
  const last = Math.max(0, durationInFrames - 1)
  const size = stageSize(orientationAware ? defaults.orientation : undefined)
  const options = (slot: View) =>
    orientationAware && (
      <SceneOptions
        slot={slot}
        layout={defaults.layout}
        safeArea={defaults.safeArea}
        guides={defaults.guides}
        onLayout={noop}
        onSafeArea={noop}
        onGuides={noop}
      />
    )
  return (
    <div
      className="bench bench-skeleton"
      data-layout={orientationAware ? "rail" : "bar"}
      data-view="single"
      style={{ "--stage-ratio": size.w / size.h } as CSSProperties}
      aria-hidden="true"
      inert
      // BenchHostScript may set data-view and --stage-ratio before hydration.
      suppressHydrationWarning
    >
      <BenchToolbar view="single" onView={noop} showViews={last > 0} href="" />
      {options("strip")}
      {orientationAware && (
        <OrientSwitch orientation={defaults.orientation} onChange={noop} />
      )}
      <div
        className="bench-stage"
        style={{ aspectRatio: "var(--stage-ratio)" }}
      >
        <p className="loading bench-loading">Loading preview…</p>
      </div>
      <StripLayout
        title={title}
        orientationAware={orientationAware}
        durationInFrames={durationInFrames}
        cues={cues}
        start={meta?.start}
        padTo={last}
        onOpen={noop}
        frame={() => null}
      />
      <FrameStepper
        title={title}
        durationInFrames={durationInFrames}
        frame={last}
        charging={false}
        progress={1}
        seek={noop}
        replay={noop}
      />
      {options("single")}
    </div>
  )
}
