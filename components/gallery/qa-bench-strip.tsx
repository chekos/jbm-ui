"use client"

import { Thumbnail } from "@remotion/player"
import type { SceneLayout } from "@/registry/jbm/motion/spec"
import { sceneGeometry } from "@/registry/jbm/motion/compile"
import { stage, type Orientation } from "@/registry/jbm/lib/tokens"
import { fps } from "./timing"
import { Composition } from "./motion-preview"
import { StripLayout, stageSize, type BenchSafeArea } from "./qa-bench-chrome"

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

/**
 * The strip with its pictures: each cell is a Remotion Thumbnail (one still frame, no timeline or
 * audio), which renders exactly `frameToDisplay` and costs far less than a paused Player per cell.
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
  return (
    <StripLayout
      title={title}
      orientationAware={orientationAware}
      durationInFrames={durationInFrames}
      onOpen={onOpen}
      frame={(frame, orientation) => {
        const size = stageSize(orientation)
        return (
          <>
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
              <SafeAreaGuides orientation={orientation} safeArea={safeArea} />
            )}
          </>
        )
      }}
    />
  )
}
