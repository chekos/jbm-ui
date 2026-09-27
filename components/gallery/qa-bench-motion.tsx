"use client"

import { useId, useState, type CSSProperties } from "react"
import { Player } from "@remotion/player"
import type { SceneLayout } from "@/registry/jbm/motion/spec"
import { sceneGeometry } from "@/registry/jbm/motion/compile"
import { stage, type Orientation } from "@/registry/jbm/lib/tokens"
import { ReplayButton } from "@/registry/jbm/ui/replay-button"
import { fps } from "./timing"
import {
  Composition,
  playerChrome,
  previewDuration,
  usePlayback,
} from "./motion-preview"

const orientations: { value: Orientation; label: string }[] = [
  { value: "landscape", label: "Landscape 16:9" },
  { value: "vertical", label: "Portrait 9:16" },
]

/** Safe-area guides drawn over the Player, never inside the composition, so renders stay clean. */
function SafeAreaGuides({
  orientation,
  safeArea,
}: {
  orientation: Orientation
  safeArea: "full" | "social"
}) {
  const { w, h } = stage[orientation]
  const area = sceneGeometry(orientation, safeArea)
  const pct = (value: number, of: number) => `${(value / of) * 100}%`
  return (
    <div className="bench-guides" aria-hidden="true">
      <div
        className="bench-guides-area"
        style={{
          left: pct(area.left, w),
          top: pct(area.top, h),
          width: pct(area.width, w),
          height: pct(area.height, h),
        }}
      >
        <span>
          {safeArea} · {area.width}×{area.height}
        </span>
      </div>
    </div>
  )
}

/**
 * QA bench for one Remotion Player item: a large preview resting on its final frame, a frame
 * stepper and scrubber, replay, and (for orientation-aware items) stage orientation and guides.
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
  const [layout, setLayout] = useState<SceneLayout>("headline-illustration")
  const [safeArea, setSafeArea] = useState<"full" | "social">("full")
  const [orientation, setOrientation] = useState<Orientation>("landscape")
  const [guides, setGuides] = useState(false)
  const durationInFrames = previewDuration(name, layout)
  const { player, last, frame, progress, charging, status, replay, seek } =
    usePlayback(durationInFrames, title)
  const size = orientationAware
    ? stage[orientation]
    : { w: 800, h: 500 }
  const seconds = (value: number) => `${(value / fps).toFixed(2)} s`
  const middle = Math.round(last / 2)
  const readout = `Frame ${frame} of ${last}, ${seconds(frame)}`

  return (
    <div
      className="bench"
      data-layout={orientationAware ? "rail" : "bar"}
      style={{ "--stage-ratio": size.w / size.h } as CSSProperties}
    >
      {/* Rail layout: the orientation switch leads the rail on wide screens and sits above the
          stage on narrow ones, so toggling never moves the switch itself. */}
      {orientationAware && (
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

      <div
        className="bench-stage"
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
          initialFrame={last}
          aria-label={`${title} preview`}
        />
        {orientationAware && guides && (
          <SafeAreaGuides orientation={orientation} safeArea={safeArea} />
        )}
      </div>

      {last > 0 ? (
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
          <label className="bench-scrub" htmlFor={`${id}-frame`}>
            <span className="sr-only">Frame</span>
            <input
              id={`${id}-frame`}
              type="range"
              min={0}
              max={last}
              step={1}
              value={frame}
              aria-valuetext={readout}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </label>
          <output className="bench-readout" htmlFor={`${id}-frame`}>
            <span>
              {String(frame).padStart(String(last).length, "0")}/{last}
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
              onChange={(e) => setSafeArea(e.target.value as "full" | "social")}
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
