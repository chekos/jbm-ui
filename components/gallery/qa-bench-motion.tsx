"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Player } from "@remotion/player"
import type { SceneLayout } from "@/registry/jbm/motion/spec"
import type { Orientation } from "@/registry/jbm/lib/tokens"
import { fps } from "./timing"
import { stateHref, useMirrorUrl } from "./bench-url"
import {
  Composition,
  playerChrome,
  previewDuration,
  usePlayback,
} from "./motion-preview"
import { BenchStrip, SafeAreaGuides } from "./qa-bench-strip"
import {
  BenchToolbar,
  FrameStepper,
  OrientSwitch,
  SceneOptions,
  benchParams,
  padLast,
  readBenchState,
  stageSize,
  type BenchSafeArea,
  type BenchState,
  type View,
} from "./qa-bench-chrome"

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
  onMount,
}: {
  name: string
  title: string
  orientationAware: boolean
  /** Called before the first paint, so QaBench can drop its placeholder in the same frame. */
  onMount?: () => void
}) {
  const pathname = usePathname()
  const query = useSearchParams()
  const [initial] = useState(() => readBenchState(query, orientationAware))
  const [layout, setLayout] = useState<SceneLayout>(initial.layout)
  const [safeArea, setSafeArea] = useState<BenchSafeArea>(initial.safeArea)
  const [orientation, setOrientation] = useState<Orientation>(
    initial.orientation
  )
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

  // Built from the router's pathname and query, so the href always names this item.
  const state: BenchState = { view, orientation, layout, safeArea, guides, frame }
  const hrefFor = (next: BenchState) =>
    stateHref(pathname, query, benchParams(next, last, orientationAware))
  const href = hrefFor(state)
  // Mirror the state into the address bar once it settles: not while the timeline plays. Scrubbing,
  // stepping, orientation, and scene options replace the current entry.
  useMirrorUrl(href, pathname, charging)

  /**
   * Changing view (Single / Strip, or opening a strip cell) is a navigation: it adds a history
   * entry, so Back returns to the previous view on this item before it leaves the item. The
   * current entry first takes the state it shows (a debounced replace may still be pending).
   */
  function pushView(next: Partial<BenchState>) {
    const target = hrefFor({ ...state, ...next })
    if (target === href) return
    try {
      const { pathname: at, search, hash } = window.location
      if (at !== pathname) return
      if (at + search !== href) window.history.replaceState(null, "", href + hash)
      window.history.pushState(null, "", target + hash)
    } catch {
      // History updates can be refused (throttled or sandboxed); the bench still works.
    }
  }
  function changeView(next: View) {
    if (next === view) return
    pushView({ view: next })
    setView(next)
  }

  // Back and Forward within this item restore the entry's view, orientation, options, and frame.
  // Next.js keeps the page mounted (same item), so the bench reads the address bar itself. A
  // timeline change (another scene-spec layout) rests on its last frame first, so the entry's
  // frame is applied once that timeline is in place.
  const pendingFrame = useRef<{ frame: number | null; layout: SceneLayout } | null>(
    null
  )
  const layoutRef = useRef(layout)
  useEffect(() => {
    layoutRef.current = layout
  })
  useEffect(() => {
    function onPopState() {
      if (window.location.pathname !== pathname) return
      const next = readBenchState(
        new URLSearchParams(window.location.search),
        orientationAware
      )
      setView(next.view)
      setOrientation(next.orientation)
      setLayout(next.layout)
      setSafeArea(next.safeArea)
      setGuides(next.guides)
      if (next.layout === layoutRef.current) {
        const end = previewDuration(name, next.layout) - 1
        seekRef.current(next.frame === null ? end : Math.min(next.frame, end))
      } else pendingFrame.current = { frame: next.frame, layout: next.layout }
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [name, pathname, orientationAware])
  useEffect(() => {
    const pending = pendingFrame.current
    if (!pending || pending.layout !== layout) return
    pendingFrame.current = null
    if (pending.frame !== null) seekRef.current(Math.min(pending.frame, last))
  }, [layout, last])

  const onMountRef = useRef(onMount)
  useLayoutEffect(() => onMountRef.current?.(), [])

  const size = stageSize(orientationAware ? orientation : undefined)
  const strip = view === "strip"

  // Opening a strip cell unmounts the strip and the focused cell with it: focus moves to the frame
  // slider (which announces the opened frame) and the bench scrolls back into view, since on
  // phones the single stage sits far above the stacked strip.
  const bench = useRef<HTMLDivElement>(null)
  const scrub = useRef<HTMLInputElement>(null)
  const focusScrub = useRef(false)
  function openFrame(target: number, stripOrientation?: Orientation) {
    pushView({
      view: "single",
      frame: target,
      ...(stripOrientation ? { orientation: stripOrientation } : {}),
    })
    if (stripOrientation) setOrientation(stripOrientation)
    setView("single")
    seek(target)
    focusScrub.current = true
  }
  useEffect(() => {
    if (view !== "single" || !focusScrub.current) return
    focusScrub.current = false
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    bench.current?.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    })
    scrub.current?.focus({ preventScroll: true })
  }, [view])

  const sceneOptions = (
    <SceneOptions
      layout={layout}
      safeArea={safeArea}
      guides={guides}
      onLayout={setLayout}
      onSafeArea={setSafeArea}
      onGuides={setGuides}
    />
  )

  return (
    <div
      ref={bench}
      className="bench"
      data-layout={orientationAware ? "rail" : "bar"}
      data-view={view}
      style={{ "--stage-ratio": size.w / size.h } as CSSProperties}
    >
      {/* View and link lead the bench (the rail on wide scene-spec benches), so switching views
          never moves the switch itself. */}
      <BenchToolbar
        view={view}
        onView={changeView}
        showViews={last > 0}
        href={href}
      />

      {/* Strip view: the scene options come straight after the toolbar, above the frames (a phone
          strip runs about a screen long); the single view keeps them after the stepper. */}
      {orientationAware && strip && sceneOptions}

      {/* The strip shows both orientations, so the switch only applies to the single view. */}
      {orientationAware && !strip && (
        <OrientSwitch orientation={orientation} onChange={setOrientation} />
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

      {!strip && (
        <FrameStepper
          title={title}
          durationInFrames={durationInFrames}
          frame={frame}
          charging={charging}
          progress={progress}
          seek={seek}
          replay={replay}
          scrubRef={scrub}
          padTo={padLast(name, last)}
        />
      )}

      {orientationAware && !strip && sceneOptions}
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  )
}
