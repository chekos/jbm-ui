"use client"

import { Thumbnail } from "@remotion/player"
import type { SceneLayout } from "@/registry/jbm/motion/spec"
import { sceneGeometry } from "@/registry/jbm/motion/compile"
import { stage, type Orientation } from "@/registry/jbm/lib/tokens"
import { fps } from "./timing"
import { Composition } from "./motion-preview"

export type BenchSafeArea = "full" | "social"

/** Safe-area guides drawn over a stage, never inside the composition, so renders stay clean. */
export function SafeAreaGuides({
  orientation,
  safeArea,
}: {
  orientation: Orientation
  safeArea: BenchSafeArea
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

/** Zero-based frame index, padded to the width of the last index so columns line up. */
export const padFrame = (frame: number, last: number) =>
  String(frame).padStart(String(last).length, "0")

const orientationLabel: Record<Orientation, string> = {
  landscape: "Landscape 16:9",
  vertical: "Portrait 9:16",
}

/**
 * Strip view: Begin, Middle and End side by side, so states are compared by eye rather than from
 * memory. Each cell is a Remotion Thumbnail (one still frame, no timeline or audio), which renders
 * exactly `frameToDisplay` and costs far less than a paused Player per cell. Orientation-aware
 * items get one row per orientation. Choosing a cell opens that frame in the single view.
 */
export function BenchStrip({
  name,
  title,
  layout,
  safeArea,
  guides,
  orientationAware,
  durationInFrames,
  onOpen,
}: {
  name: string
  title: string
  layout: SceneLayout
  safeArea: BenchSafeArea
  guides: boolean
  orientationAware: boolean
  durationInFrames: number
  onOpen: (frame: number, orientation?: Orientation) => void
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
    <div className="bench-strip" role="group" aria-label={`${title} frame strip`}>
      {rows.map((orientation) => {
        const size = orientation ? stage[orientation] : { w: 800, h: 500 }
        return (
          <ul
            key={orientation ?? "preview"}
            className="bench-strip-row"
            data-orientation={orientation ?? "preview"}
            aria-label={orientation ? orientationLabel[orientation] : undefined}
          >
            {steps.map(([label, frame]) => (
              <li key={label}>
                <figure className="bench-strip-cell">
                  <div
                    className="bench-strip-frame"
                    style={{ aspectRatio: `${size.w} / ${size.h}` }}
                  >
                    <Thumbnail
                      component={Composition}
                      inputProps={{ name, layout, safeArea, orientation }}
                      frameToDisplay={frame}
                      durationInFrames={durationInFrames}
                      fps={fps}
                      compositionWidth={size.w}
                      compositionHeight={size.h}
                      style={{ width: "100%", height: "100%" }}
                    />
                    {orientation && guides && (
                      <SafeAreaGuides
                        orientation={orientation}
                        safeArea={safeArea}
                      />
                    )}
                  </div>
                  <figcaption>
                    <button
                      type="button"
                      aria-label={`${label}, frame ${frame}${
                        orientation ? `, ${orientationLabel[orientation]}` : ""
                      }. Open in single view`}
                      onClick={() => onOpen(frame, orientation)}
                    >
                      <span>{label}</span>
                      <span className="bench-strip-frame-no">
                        {padFrame(frame, last)}
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
