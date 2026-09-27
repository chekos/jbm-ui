"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import { SceneFromSpec } from "@/registry/jbm/motion/compile"
import type { SceneLayout, SafeArea } from "@/registry/jbm/motion/spec"
import { stage, type Orientation } from "@/registry/jbm/lib/tokens"
import { Scene } from "@/registry/jbm/motion/scene"
import { Pop, Stagger } from "@/registry/jbm/motion/pop"
import { Counter } from "@/registry/jbm/motion/counter"
import { ProbBar } from "@/registry/jbm/motion/prob-bar"
import { CodeCard } from "@/registry/jbm/motion/code-card"
import { Captions } from "@/registry/jbm/motion/captions"
import { RebuildScreens } from "@/registry/jbm/motion/rebuild-screens"
import { Catalog } from "@/registry/jbm/motion/catalog"
import { Propagate } from "@/registry/jbm/motion/propagate"
import { Shelf, Twice } from "@/registry/jbm/motion/shelf"
import {
  useSec,
  useIn,
  useFade,
  useProgress,
} from "@/registry/jbm/motion/hooks"
import { Big } from "@/registry/jbm/ui/big"
import { ReplayButton } from "@/registry/jbm/ui/replay-button"
import { useBenchCompact } from "./bench-compact"
import { Chip } from "@/registry/jbm/ui/chip"
import { color } from "@/registry/jbm/lib/tokens"

import {
  fps,
  springFrames,
  timing,
  popItems,
  durationFor,
  previewProps,
  referenceSpec,
} from "./timing"

/** Fit a stage-sized illustrated block (authored at 936 px wide) into the 800×500 preview. */
function Fit({
  w,
  h,
  children,
}: {
  w: number
  h: number
  children: ReactNode
}) {
  const k = Math.min(680 / w, 380 / h)
  return (
    <div style={{ width: w * k, height: h * k }}>
      <div
        style={{
          width: w,
          height: h,
          transform: `scale(${k})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function HooksDemo() {
  const seconds = useSec()
  const entrance = useIn(timing.counter.at)
  const opacity = useFade(timing.counter.at)
  const progress = useProgress(timing.counter.at, 100, timing.counter.dur)
  return (
    <div style={{ opacity, transform: `translateY(${(1 - entrance) * 30}px)` }}>
      <Big size={72}>{progress.toFixed(0)}%</Big>
      <p style={{ fontSize: 24 }}>useSec: {seconds.toFixed(2)}s</p>
    </div>
  )
}

/** Timeline length for a preview; the scene-spec hero layout has a single entrance. */
export function previewDuration(name: string, layout: SceneLayout) {
  return name === "scene-spec" && layout === "hero"
    ? springFrames + 1
    : durationFor(name)
}

export function Composition({
  name,
  layout = "headline-illustration",
  safeArea = "full",
  guides = false,
  orientation,
}: {
  name: string
  layout?: SceneLayout
  safeArea?: SafeArea
  guides?: boolean
  /** Bench only: render one full-size stage instead of both orientations side by side. */
  orientation?: Orientation
}) {
  if (name === "scene-spec" && orientation) {
    // Guides stay out of the composition; the bench draws them as a DOM overlay.
    return (
      <SceneFromSpec
        spec={referenceSpec(layout, safeArea)}
        orientation={orientation}
        host={{ resolve: () => 0 }}
      />
    )
  }
  if (name === "scene-spec") {
    const spec = referenceSpec(layout, safeArea)
    return (
      <Scene>
        {(["landscape", "vertical"] as const).map((orientation) => {
          const vertical = orientation === "vertical"
          return (
            <div
              key={orientation}
              style={{
                position: "absolute",
                left: vertical ? 540 : 12,
                top: vertical ? 30 : 110,
                width: stage[orientation].w,
                height: stage[orientation].h,
                transform: `scale(${vertical ? 0.22 : 0.25})`,
                transformOrigin: "top left",
                border: `2px solid ${color.line}`,
              }}
            >
              <SceneFromSpec
                spec={spec}
                showSafeArea={guides}
                orientation={orientation}
                host={{ resolve: () => 0 }}
              />
            </div>
          )
        })}
      </Scene>
    )
  }
  return (
    <Scene
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      {name === "scene" && (
        <Big size={64}>
          Una idea
          <br />
          <span style={{ color: color.accent }}>a la vez.</span>
        </Big>
      )}
      {name === "pop" && (
        <div style={{ display: "flex", gap: 20 }}>
          <Stagger {...previewProps.pop}>
            {popItems.map((text) => (
              <Chip key={text}>{text}</Chip>
            ))}
          </Stagger>
        </div>
      )}
      {name === "counter" && <Counter {...previewProps.counter} />}
      {name === "prob-bar" && <ProbBar {...previewProps.probBar} />}
      {name === "code-card" && <CodeCard {...previewProps.codeCard} />}
      {name === "captions" && (
        <>
          <Pop at={0}>
            <Big size={52}>Cada palabra cuenta.</Big>
          </Pop>
          <Captions {...previewProps.captions} />
        </>
      )}
      {name === "motion-hooks" && <HooksDemo />}
      {name === "rebuild-screens" && (
        <Fit w={936} h={620}>
          <RebuildScreens {...previewProps.rebuildScreens} />
        </Fit>
      )}
      {name === "catalog" && (
        <Fit w={936} h={820}>
          <div style={{ paddingTop: 40 }}>
            <Catalog {...previewProps.catalog} />
          </div>
        </Fit>
      )}
      {name === "propagate" && (
        <Fit w={936} h={640}>
          <Propagate {...previewProps.propagate} />
        </Fit>
      )}
      {name === "shelf" && (
        <Fit w={936} h={820}>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <Shelf {...previewProps.shelf} />
            <Twice {...previewProps.twice} />
          </div>
        </Fit>
      )}
    </Scene>
  )
}

/**
 * Player state shared by the gallery card and the QA bench. Previews rest on their final frame
 * (the finished state), replay is explicit, and playback start/end is announced politely.
 */
export function usePlayback(durationInFrames: number, label: string) {
  const player = useRef<PlayerRef>(null)
  const last = Math.max(0, durationInFrames - 1)
  const [frame, setFrame] = useState(last)
  const [phase, setPhase] = useState<"ready" | "playing">("ready")
  const [status, setStatus] = useState("")
  // A different timeline (scene-spec layouts) returns to its own final frame.
  const [restingOn, setRestingOn] = useState(last)
  if (restingOn !== last) {
    setRestingOn(last)
    setFrame(last)
    setPhase("ready")
  }
  useEffect(() => {
    player.current?.pause()
    player.current?.seekTo(last)
  }, [last])

  useEffect(() => {
    const current = player.current
    if (!current) return
    const onPlay = () => {
      setPhase("playing")
      setStatus(`Playing ${label}`)
    }
    const onPause = () => setPhase("ready")
    const onEnd = () => {
      setPhase("ready")
      setStatus(`${label} done`)
    }
    const onError = () => {
      setPhase("ready")
      setStatus(`${label} could not play`)
    }
    const onFrame = ({ detail }: { detail: { frame: number } }) =>
      setFrame(detail.frame)
    current.addEventListener("play", onPlay)
    current.addEventListener("pause", onPause)
    current.addEventListener("ended", onEnd)
    current.addEventListener("error", onError)
    current.addEventListener("frameupdate", onFrame)
    current.addEventListener("seeked", onFrame)
    return () => {
      current.removeEventListener("play", onPlay)
      current.removeEventListener("pause", onPause)
      current.removeEventListener("ended", onEnd)
      current.removeEventListener("error", onError)
      current.removeEventListener("frameupdate", onFrame)
      current.removeEventListener("seeked", onFrame)
    }
  }, [label])

  return {
    player,
    last,
    frame: Math.min(frame, last),
    progress: last ? Math.min(1, Math.max(0, frame / last)) : 1,
    charging: phase === "playing",
    status,
    replay() {
      if (!player.current) return
      setFrame(0)
      setPhase("playing")
      player.current.seekTo(0)
      player.current.play()
    },
    /** Pause and show one frame (bench stepper and scrubber). */
    seek(next: number) {
      const target = Math.min(last, Math.max(0, Math.round(next)))
      player.current?.pause()
      player.current?.seekTo(target)
      setFrame(target)
      setPhase("ready")
      setStatus("")
    },
  }
}

export const playerChrome = {
  // The owner uses Remotion under its free license (issue #114); this silences the per-page notice.
  acknowledgeRemotionLicense: true,
  controls: false,
  loop: false,
  moveToBeginningWhenEnded: false,
  spaceKeyToPlayOrPause: false,
  clickToPlay: false,
  doubleClickToFullscreen: false,
  autoPlay: false,
} as const

export default function MotionPreview({ name }: { name: string }) {
  const [layout, setLayout] = useState<SceneLayout>("headline-illustration")
  const [safeArea, setSafeArea] = useState<"full" | "social">("full")
  const [guides, setGuides] = useState(false)
  // Index cards keep layout, safe area, and Replay; /c/scene-spec adds the safe-area guides.
  const compact = useBenchCompact()
  const durationInFrames = previewDuration(name, layout)
  const { player, last, progress, charging, status, replay } = usePlayback(
    durationInFrames,
    name
  )

  return (
    <div className="motion-preview">
      {name === "scene-spec" && (
        <div className="composition-options">
          <label>
            Layout{" "}
            <select
              aria-label="Scene layout"
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
            Safe area{" "}
            <select
              aria-label="Scene safe area"
              value={safeArea}
              onChange={(e) => setSafeArea(e.target.value as "full" | "social")}
            >
              <option value="full">Full frame</option>
              <option value="social">Social</option>
            </select>
          </label>
          {!compact && (
            <label>
              <input
                type="checkbox"
                checked={guides}
                onChange={(e) => setGuides(e.target.checked)}
              />{" "}
              Show safe area
            </label>
          )}
        </div>
      )}
      <Player
        ref={player}
        component={Composition}
        inputProps={{ name, layout, safeArea, guides }}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={800}
        compositionHeight={500}
        style={{ width: "100%", aspectRatio: "8 / 5" }}
        {...playerChrome}
        // Rest on the finished state; the first frame of most demos is an empty stage.
        initialFrame={last}
        aria-label={`${name} motion preview`}
      />
      {durationInFrames > 1 && (
        <div className="motion-actions">
          <ReplayButton
            progress={progress}
            charging={charging}
            label={`Replay ${name} animation`}
            onReplay={replay}
          />
        </div>
      )}
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  )
}
