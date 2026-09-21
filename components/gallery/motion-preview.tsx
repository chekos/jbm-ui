"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import { SceneFromSpec } from "@/registry/jbm/motion/compile"
import type {
  SceneSpec,
  SceneLayout,
  SafeArea,
} from "@/registry/jbm/motion/spec"
import { stage } from "@/registry/jbm/lib/tokens"
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
import { Chip } from "@/registry/jbm/ui/chip"
import { color } from "@/registry/jbm/lib/tokens"

import {
  fps,
  springFrames,
  timing,
  popItems,
  codeLines,
  captionWords,
  illustrated,
  durationFor,
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

function Composition({
  name,
  layout = "headline-illustration",
  safeArea = "full",
  guides = false,
}: {
  name: string
  layout?: SceneLayout
  safeArea?: SafeArea
  guides?: boolean
}) {
  if (name === "scene-spec") {
    const subject = {
      type: "screens" as const,
      phoneScale: 1.5,
      pieces: [
        { kind: "card" as const, at: 0.2 },
        { kind: "input" as const, at: 0.5 },
        { kind: "button" as const, at: 0.8 },
      ],
    }
    const spec: SceneSpec = {
      id: "portrait-reference",
      composition: { safeArea, layout, subjectScale: 1.3 },
      blocks:
        layout === "illustration"
          ? [subject]
          : layout === "hero"
            ? [
                {
                  type: "big",
                  at: 0,
                  text: "Hazlo una vez.\nÚsalo siempre.",
                  align: "center",
                  size: 140,
                },
              ]
            : [
                {
                  type: "big",
                  at: 0,
                  text: "Una biblioteca.\nMuchas posibilidades.",
                  align: "center",
                  size: 90,
                },
                subject,
              ],
      variants: { vertical: { headlineRatio: 0.23, gap: 48 } },
    }
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
          <Stagger {...timing.pop} from="scale">
            {popItems.map((text) => (
              <Chip key={text}>{text}</Chip>
            ))}
          </Stagger>
        </div>
      )}
      {name === "counter" && <Counter n={1024} {...timing.counter} />}
      {name === "prob-bar" && (
        <ProbBar
          label="Confianza"
          p={0.86}
          at={timing.probability.at}
          w={620}
        />
      )}
      {name === "code-card" && (
        <CodeCard w={620} h={280} title="hello.ts" lines={codeLines} />
      )}
      {name === "captions" && (
        <>
          <Pop at={0}>
            <Big size={52}>Cada palabra cuenta.</Big>
          </Pop>
          <Captions words={captionWords} />
        </>
      )}
      {name === "motion-hooks" && <HooksDemo />}
      {name === "rebuild-screens" && (
        <Fit w={936} h={620}>
          <RebuildScreens
            w={936}
            h={620}
            pieces={[
              { kind: "button", at: illustrated.screens.pieces[0] },
              { kind: "input", at: illustrated.screens.pieces[1] },
              { kind: "card", at: illustrated.screens.pieces[2] },
            ]}
            again={illustrated.screens.again}
            sticker={{ text: "¿otra vez?", at: illustrated.screens.sticker }}
          />
        </Fit>
      )}
      {name === "catalog" && (
        <Fit w={936} h={820}>
          <div style={{ paddingTop: 40 }}>
            <Catalog
              w={936}
              at={illustrated.catalog.at}
              title="catálogo"
              items={[
                {
                  kind: "button",
                  label: "botón",
                  at: illustrated.catalog.items[0],
                },
                {
                  kind: "card",
                  label: "tarjeta",
                  at: illustrated.catalog.items[1],
                },
                {
                  kind: "input",
                  label: "input",
                  at: illustrated.catalog.items[2],
                },
              ]}
              tokensAt={illustrated.catalog.tokensAt}
              tokens={[
                {
                  kind: "color",
                  label: "color",
                  at: illustrated.catalog.tokens[0],
                },
                {
                  kind: "type",
                  label: "tipografía",
                  at: illustrated.catalog.tokens[1],
                },
                {
                  kind: "space",
                  label: "espaciado",
                  at: illustrated.catalog.tokens[2],
                },
              ]}
              stamp={{ text: "design tokens", at: illustrated.catalog.stamp }}
            />
          </div>
        </Fit>
      )}
      {name === "propagate" && (
        <Fit w={936} h={640}>
          <Propagate
            w={936}
            h={640}
            at={illustrated.propagate.at}
            label={{
              text: "una sola fuente de verdad",
              at: illustrated.propagate.label,
            }}
            targets={6}
            bug={illustrated.propagate.bug}
            fix={illustrated.propagate.fix}
            fixed={illustrated.propagate.fixed}
            recolor={illustrated.propagate.recolor}
            recolored={illustrated.propagate.recolored}
          />
        </Fit>
      )}
      {name === "shelf" && (
        <Fit w={936} h={820}>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <Shelf
              w={936}
              items={[
                { text: "shadcn/ui", at: illustrated.shelf.items[0] },
                { text: "Material UI", at: illustrated.shelf.items[1] },
                {
                  text: "jbm-ui",
                  at: illustrated.shelf.items[2],
                  tone: "accent",
                },
              ]}
            />
            <Twice
              w={936}
              at={illustrated.shelf.twice}
              second={illustrated.shelf.second}
              strike={illustrated.shelf.strike}
            />
          </div>
        </Fit>
      )}
    </Scene>
  )
}

export default function MotionPreview({ name }: { name: string }) {
  const [layout, setLayout] = useState<SceneLayout>("headline-illustration")
  const [safeArea, setSafeArea] = useState<"full" | "social">("full")
  const [guides, setGuides] = useState(false)
  const durationInFrames =
    name === "scene-spec" && layout === "hero"
      ? springFrames + 1
      : durationFor(name)
  const player = useRef<PlayerRef>(null)
  const [phase, setPhase] = useState<"ready" | "playing">("ready")
  const [progress, setProgress] = useState(1)
  const charging = phase !== "ready"

  useEffect(() => {
    const current = player.current
    if (!current) return
    const onPlay = () => setPhase("playing")
    const onEnd = () => setPhase("ready")
    const onFrame = ({ detail }: { detail: { frame: number } }) => {
      setProgress(
        Math.min(
          1,
          Math.max(0, detail.frame / Math.max(1, durationInFrames - 1))
        )
      )
    }
    current.addEventListener("play", onPlay)
    current.addEventListener("ended", onEnd)
    current.addEventListener("error", onEnd)
    current.addEventListener("frameupdate", onFrame)
    return () => {
      current.removeEventListener("play", onPlay)
      current.removeEventListener("ended", onEnd)
      current.removeEventListener("error", onEnd)
      current.removeEventListener("frameupdate", onFrame)
    }
  }, [durationInFrames])

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
          <label>
            <input
              type="checkbox"
              checked={guides}
              onChange={(e) => setGuides(e.target.checked)}
            />{" "}
            Show safe area
          </label>
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
        controls={false}
        loop={false}
        moveToBeginningWhenEnded={false}
        spaceKeyToPlayOrPause={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        initialFrame={Math.min(45, durationInFrames - 1)}
        autoPlay={false}
        aria-label={`${name} motion preview`}
      />
      {durationInFrames > 1 && (
        <div className="motion-actions">
          <ReplayButton
            progress={progress}
            charging={charging}
            label={`Replay ${name} animation`}
            onReplay={() => {
              if (!player.current) return
              setProgress(0)
              setPhase("playing")
              player.current.seekTo(0)
              player.current.play()
            }}
          />
        </div>
      )}
    </div>
  )
}
