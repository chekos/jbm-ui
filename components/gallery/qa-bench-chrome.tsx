"use client"

import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react"
import { useId } from "react"
import type { SceneLayout } from "@/registry/jbm/motion/spec"
import { stage, type Orientation } from "@/registry/jbm/lib/tokens"
import { ReplayButton } from "@/registry/jbm/ui/replay-button"
import { CopyBenchLink } from "./bench-url"

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

/** Zero-based frame index, padded to the width of the last index so columns line up. */
export const padFrame = (frame: number, last: number) =>
  String(frame).padStart(String(last).length, "0")

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
}: {
  title: string
  durationInFrames: number
  frame: number
  charging: boolean
  progress: number
  seek: (frame: number) => void
  replay: () => void
  scrubRef?: RefObject<HTMLInputElement | null>
}) {
  const id = useId()
  const last = Math.max(0, durationInFrames - 1)
  const middle = Math.round(last / 2)
  const readout = `Frame ${frame} of 0 to ${last}, ${seconds(frame)}`
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
          {padFrame(frame, last)}/{padFrame(last, last)}
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
 * Strip view: Begin, Middle and End side by side, so states are compared by eye rather than from
 * memory. Orientation-aware items get one list per orientation. `frame` draws each cell's picture
 * (a Remotion Thumbnail in the bench, nothing in the skeleton); choosing a cell opens that frame in
 * the single view.
 */
export function StripLayout({
  title,
  orientationAware,
  durationInFrames,
  onOpen,
  frame,
}: {
  title: string
  orientationAware: boolean
  durationInFrames: number
  onOpen: (frame: number, orientation?: Orientation) => void
  frame: (frame: number, orientation: Orientation | undefined) => ReactNode
}) {
  const last = Math.max(0, durationInFrames - 1)
  const steps = [
    ["Begin", 0],
    ["Middle", Math.round(last / 2)],
    ["End", last],
  ] as const
  const rows: (Orientation | undefined)[] = orientationAware
    ? ["landscape", "vertical"]
    : [undefined]

  return (
    <div
      className="bench-strip"
      role="group"
      aria-label={`${title} frame strip`}
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
            {steps.map(([label, target]) => (
              <li key={label}>
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
                      <span>{label}</span>
                      <span className="bench-strip-frame-no">
                        {padFrame(target, last)}
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

/**
 * Renders `html` as a parser-blocking inline script in the server HTML only. A script React
 * creates on the client never runs (and React warns about it), so client renders emit an inert
 * text/plain copy; suppressHydrationWarning covers the type difference.
 */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// Runs while the HTML is parsed, before first paint, as the last child of the bench host:
// publishes --bench-top (the bench's distance from the top of the document, see `.bench` in
// globals.css) and points the skeleton at the view and orientation in the query, the only bench
// state that changes its size; the prerendered HTML cannot know the query. The header above
// reflows when the web fonts swap in (the description can lose a line), so the script measures
// again as soon as they load, before the next rendering update lays the page out with them (a
// ResizeObserver alone reacts one layout late, which Chrome counts as a layout shift), and on any
// later body resize. useBenchTop takes over after hydration; the observer stops once its host
// leaves the page.
const benchTopScript = `(function(s){var h=s&&s.parentElement;if(!h)return;var o=new ResizeObserver(m);function m(){if(!h.isConnected)return o.disconnect();h.style.setProperty("--bench-top",Math.round(h.getBoundingClientRect().top+scrollY)+"px")}m();o.observe(document.body);var f=document.fonts;if(f){f.addEventListener("loadingdone",m);f.ready.then(m)}var k=h.querySelector(":scope>.bench-skeleton");if(!k)return;var q=new URLSearchParams(location.search);if(q.get("view")==="strip")k.setAttribute("data-view","strip");var p=q.get("orientation");if(k.getAttribute("data-layout")==="rail"&&(p==="portrait"||p==="vertical"))k.style.setProperty("--stage-ratio","${
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
  title,
  orientationAware,
}: {
  title: string
  orientationAware: boolean
}) {
  // A nominal timeline: the frame count only changes the width of hidden mono digits, never a
  // row's height (the scrubber flexes), and the Player's length is not known on the server.
  const durationInFrames = 100
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
