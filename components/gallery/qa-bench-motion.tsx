"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react"
import { Player } from "@remotion/player"
import type { SceneLayout } from "@/registry/jbm/motion/spec"
import { stage, type Orientation } from "@/registry/jbm/lib/tokens"
import { ReplayButton } from "@/registry/jbm/ui/replay-button"
import { fps } from "./timing"
import { CopyButton } from "./code-block"
import {
  Composition,
  playerChrome,
  previewDuration,
  usePlayback,
} from "./motion-preview"
import {
  BenchStrip,
  SafeAreaGuides,
  padFrame,
  type BenchSafeArea,
} from "./qa-bench-strip"

type View = "single" | "strip"

const orientations: { value: Orientation; label: string }[] = [
  { value: "landscape", label: "Landscape 16:9" },
  { value: "vertical", label: "Portrait 9:16" },
]
const views: { value: View; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "strip", label: "Strip" },
]
const layouts: SceneLayout[] = ["hero", "headline-illustration", "illustration"]

/**
 * Bench state in the URL, so a reviewer can reload or share exactly what they see:
 *   ?view=strip  ?orientation=portrait  ?frame=21  ?layout=hero  ?safe=social  ?guides=1
 * `frame` is the zero-based frame index (0 … durationInFrames − 1), the same number the readout
 * and the strip show. Defaults are omitted, unknown values fall back to them, a frame past the end
 * clamps to the last frame, and scene options are read only on orientation-aware benches.
 */
type BenchState = {
  view: View
  orientation: Orientation
  layout: SceneLayout
  safeArea: BenchSafeArea
  guides: boolean
  /** Null rests on the last frame. */
  frame: number | null
}

const defaults: BenchState = {
  view: "single",
  orientation: "landscape",
  layout: "headline-illustration",
  safeArea: "full",
  guides: false,
  frame: null,
}
const benchKeys = ["view", "orientation", "frame", "layout", "safe", "guides"]

// MotionBench is client-only (next/dynamic with ssr: false), so it reads the URL during its first
// render: the bench mounts in its requested state with no second layout pass.
function readBenchState(orientationAware: boolean): BenchState {
  if (typeof window === "undefined") return defaults
  const query = new URLSearchParams(window.location.search)
  const pick = <T extends string>(key: string, allowed: readonly T[]) => {
    const value = query.get(key) as T | null
    return value !== null && allowed.includes(value) ? value : undefined
  }
  const frameText = query.get("frame")
  const frame =
    frameText !== null && /^\d{1,6}$/.test(frameText) ? Number(frameText) : null
  if (!orientationAware)
    return { ...defaults, view: pick("view", ["single", "strip"]) ?? "single", frame }
  const orientation = pick("orientation", ["landscape", "portrait", "vertical"])
  return {
    view: pick("view", ["single", "strip"]) ?? defaults.view,
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

/** The page URL for a bench state; other query parameters and the hash are kept. */
function benchHref(state: BenchState, last: number, orientationAware: boolean) {
  const query = new URLSearchParams(window.location.search)
  for (const key of benchKeys) query.delete(key)
  if (state.view !== defaults.view) query.set("view", state.view)
  if (orientationAware) {
    if (state.orientation !== defaults.orientation) query.set("orientation", "portrait")
    if (state.layout !== defaults.layout) query.set("layout", state.layout)
    if (state.safeArea !== defaults.safeArea) query.set("safe", state.safeArea)
    if (state.guides) query.set("guides", "1")
  }
  if (state.frame !== null && state.frame !== last)
    query.set("frame", String(state.frame))
  const search = query.toString()
  return `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`
}

/**
 * QA bench for one Remotion Player item. Single view: a large preview resting on its final frame,
 * a frame stepper and scrubber, and replay. Strip view: Begin, Middle and End side by side (both
 * orientations for orientation-aware items). Orientation-aware items add scene options and
 * safe-area guides. Every setting lives in the URL.
 */
export default function MotionBench({
  name,
  title,
  orientationAware,
}: {
  name: string
  title: string
  orientationAware: boolean
}) {
  const id = useId()
  const [initial] = useState(() => readBenchState(orientationAware))
  const [layout, setLayout] = useState<SceneLayout>(initial.layout)
  const [safeArea, setSafeArea] = useState<BenchSafeArea>(initial.safeArea)
  const [orientation, setOrientation] = useState<Orientation>(initial.orientation)
  const [guides, setGuides] = useState(initial.guides)
  const durationInFrames = previewDuration(name, layout)
  const { player, last, frame, progress, charging, status, replay, seek } =
    usePlayback(durationInFrames, title)
  // A static layout (one frame) has nothing to compare, so it only has the single view.
  const [view, setView] = useState<View>(last > 0 ? initial.view : "single")
  const [{ startFrame, startLast }] = useState(() => ({
    startFrame: initial.frame === null ? last : Math.min(initial.frame, last),
    startLast: last,
  }))

  // usePlayback rests on the last frame when it mounts; a frame from the URL replaces that. The
  // dependencies never change, so this runs once per mount, after usePlayback's own effect.
  const seekRef = useRef(seek)
  useEffect(() => {
    seekRef.current = seek
  })
  useEffect(() => {
    if (startFrame !== startLast) seekRef.current(startFrame)
  }, [startFrame, startLast])

  const href = benchHref(
    { view, orientation, layout, safeArea, guides, frame },
    last,
    orientationAware
  )
  // Mirror the state into the address bar once it settles: not while the timeline plays, and
  // debounced while scrubbing (Safari throttles rapid history updates).
  useEffect(() => {
    if (charging) return
    const timer = setTimeout(() => {
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (current === href) return
      try {
        window.history.replaceState(null, "", href)
      } catch {
        // History updates can be refused (throttled or sandboxed); the bench still works.
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [href, charging])

  const size = orientationAware ? stage[orientation] : { w: 800, h: 500 }
  const seconds = (value: number) => `${(value / fps).toFixed(2)} s`
  const middle = Math.round(last / 2)
  const readout = `Frame ${frame} of 0 to ${last}, ${seconds(frame)}`
  const strip = view === "strip"
  const showViews = last > 0

  function stepBy(delta: number, event: KeyboardEvent<HTMLInputElement>) {
    event.preventDefault()
    seek(frame + delta)
  }

  function openFrame(target: number, stripOrientation?: Orientation) {
    if (stripOrientation) setOrientation(stripOrientation)
    setView("single")
    seek(target)
  }

  return (
    <div
      className="bench"
      data-layout={orientationAware ? "rail" : "bar"}
      data-view={view}
      style={{ "--stage-ratio": size.w / size.h } as CSSProperties}
    >
      {/* View and link lead the bench (the rail on wide scene-spec benches), so switching views
          never moves the switch itself. */}
      <div className="bench-toolbar">
        {showViews && (
          <div className="bench-segmented" role="group" aria-label="Bench view">
            {views.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                onClick={() => setView(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="bench-link">
          <CopyButton
            text={`${window.location.origin}${href}`}
            label="Copy link to this bench state"
            copied="Link to this bench state copied"
          >
            Copy link
          </CopyButton>
        </div>
      </div>

      {/* The strip shows both orientations, so the switch only applies to the single view. */}
      {orientationAware && !strip && (
        <div
          className="bench-segmented bench-orient"
          role="group"
          aria-label="Stage orientation"
        >
          {orientations.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={orientation === option.value}
              onClick={() => setOrientation(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* The Player stays mounted in the strip view so playback state and listeners survive a
          round trip between views. */}
      <div
        className="bench-stage"
        hidden={strip}
        data-orientation={orientationAware ? orientation : "preview"}
        style={{ aspectRatio: `${size.w} / ${size.h}` }}
      >
        <Player
          ref={player}
          component={Composition}
          inputProps={{
            name,
            layout,
            safeArea,
            orientation: orientationAware ? orientation : undefined,
          }}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={size.w}
          compositionHeight={size.h}
          style={{ width: "100%", height: "100%" }}
          {...playerChrome}
          initialFrame={Math.min(startFrame, last)}
          aria-label={`${title} preview`}
        />
        {orientationAware && guides && (
          <SafeAreaGuides orientation={orientation} safeArea={safeArea} />
        )}
      </div>

      {strip && (
        <BenchStrip
          name={name}
          title={title}
          layout={layout}
          safeArea={safeArea}
          guides={guides}
          orientationAware={orientationAware}
          durationInFrames={durationInFrames}
          onOpen={openFrame}
        />
      )}

      {strip ? null : last > 0 ? (
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
              {durationInFrames} frames, numbered 0 to {last}. Arrow keys step
              one frame, Page Up and Page Down step five, Home and End jump to
              the first and last frame.
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
      ) : (
        <p className="bench-note">
          Static layout: one frame, nothing to step or replay.
        </p>
      )}

      {orientationAware && (
        <div className="bench-options" role="group" aria-label="Scene options">
          <label>
            Layout
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as SceneLayout)}
            >
              <option value="hero">Centered hero</option>
              <option value="headline-illustration">
                Headline + illustration
              </option>
              <option value="illustration">Illustration</option>
            </select>
          </label>
          <label>
            Safe area
            <select
              value={safeArea}
              onChange={(e) => setSafeArea(e.target.value as BenchSafeArea)}
            >
              <option value="full">Full frame</option>
              <option value="social">Social</option>
            </select>
          </label>
          <label className="bench-check">
            <input
              type="checkbox"
              checked={guides}
              onChange={(e) => setGuides(e.target.checked)}
            />
            Safe-area guides
          </label>
        </div>
      )}
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  )
}
