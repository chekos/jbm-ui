"use client"

import { useEffect, useRef, useState } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import { RotateCw } from "lucide-react"
import { Scene } from "@/registry/jbm/motion/scene"
import { Pop, Stagger } from "@/registry/jbm/motion/pop"
import { Counter } from "@/registry/jbm/motion/counter"
import { ProbBar } from "@/registry/jbm/motion/prob-bar"
import { CodeCard } from "@/registry/jbm/motion/code-card"
import { Captions } from "@/registry/jbm/motion/captions"
import {
  useSec,
  useIn,
  useFade,
  useProgress,
} from "@/registry/jbm/motion/hooks"
import { Big } from "@/registry/jbm/ui/big"
import { Chip } from "@/registry/jbm/ui/chip"
import { color } from "@/registry/jbm/lib/tokens"

function HooksDemo() {
  const seconds = useSec()
  const entrance = useIn(0.2)
  const opacity = useFade(0.2)
  const progress = useProgress(0.2, 100, 1.5)
  return (
    <div style={{ opacity, transform: `translateY(${(1 - entrance) * 30}px)` }}>
      <Big size={72}>{progress.toFixed(0)}%</Big>
      <p style={{ fontSize: 24 }}>useSec: {seconds.toFixed(2)}s</p>
    </div>
  )
}

function Composition({ name }: { name: string }) {
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
          <Stagger at={0.2} step={0.35} from="scale">
            {["Idea", "Datos", "Historia"].map((text) => (
              <Chip key={text}>{text}</Chip>
            ))}
          </Stagger>
        </div>
      )}
      {name === "counter" && <Counter n={1024} at={0.2} dur={1.5} />}
      {name === "prob-bar" && (
        <ProbBar label="Confianza" p={0.86} at={0.2} w={620} />
      )}
      {name === "code-card" && (
        <CodeCard
          w={620}
          h={280}
          title="hello.ts"
          lines={[
            { t: 'const idea = "simple";', at: 0.2 },
            { t: "const story = explain(idea);", at: 0.7 },
            { t: "render(story);", at: 1.2, color: color.soft },
          ]}
        />
      )}
      {name === "captions" && (
        <>
          <Pop at={0}>
            <Big size={52}>Cada palabra cuenta.</Big>
          </Pop>
          <Captions
            words={[
              { w: "Una", s: 0, e: 0.7 },
              { w: "idea", s: 0.7, e: 1.4, emph: true },
              { w: "a", s: 1.4, e: 1.8 },
              { w: "la", s: 1.8, e: 2.2 },
              { w: "vez.", s: 2.2, e: 3.5 },
            ]}
          />
        </>
      )}
      {name === "motion-hooks" && <HooksDemo />}
    </Scene>
  )
}

export default function MotionPreview({ name }: { name: string }) {
  const player = useRef<PlayerRef>(null)
  const [phase, setPhase] = useState<"ready" | "playing" | "paused">("ready")
  const [progress, setProgress] = useState(1)
  const charging = phase !== "ready"

  useEffect(() => {
    const current = player.current
    if (!current) return
    const onPlay = () => setPhase("playing")
    const onPause = () =>
      setPhase((value) => (value === "ready" ? value : "paused"))
    const onEnd = () => setPhase("ready")
    const onFrame = ({ detail }: { detail: { frame: number } }) => {
      setProgress(Math.min(1, Math.max(0, detail.frame / 149)))
    }
    current.addEventListener("play", onPlay)
    current.addEventListener("pause", onPause)
    current.addEventListener("ended", onEnd)
    current.addEventListener("error", onEnd)
    current.addEventListener("frameupdate", onFrame)
    return () => {
      current.removeEventListener("play", onPlay)
      current.removeEventListener("pause", onPause)
      current.removeEventListener("ended", onEnd)
      current.removeEventListener("error", onEnd)
      current.removeEventListener("frameupdate", onFrame)
    }
  }, [])

  return (
    <div className="motion-preview">
      <Player
        ref={player}
        component={Composition}
        inputProps={{ name }}
        durationInFrames={150}
        fps={30}
        compositionWidth={800}
        compositionHeight={500}
        style={{ width: "100%", aspectRatio: "8 / 5" }}
        controls={false}
        loop={false}
        moveToBeginningWhenEnded={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        initialFrame={45}
        autoPlay={false}
        aria-label={`${name} motion preview`}
      />
      <div className="motion-actions">
        {charging && (
          <button
            type="button"
            aria-label={`${phase === "playing" ? "Pause" : "Resume"} ${name} animation`}
            onClick={() =>
              phase === "playing"
                ? player.current?.pause()
                : player.current?.play()
            }
          >
            {phase === "playing" ? "Pause" : "Resume"}
          </button>
        )}
        <button
          type="button"
          className="replay-charge"
          aria-label={`Replay ${name} animation`}
          title={charging ? "Replay recharging" : "Replay"}
          disabled={charging}
          onClick={() => {
            if (charging || !player.current) return
            setProgress(0)
            setPhase("playing")
            player.current?.seekTo(0)
            player.current?.play()
          }}
        >
          <span className="replay-glyph" aria-hidden="true">
            <RotateCw className="replay-track" size={26} strokeWidth={3.5} />
            <RotateCw
              className="replay-fill"
              size={26}
              strokeWidth={3.5}
              style={{
                clipPath: `inset(${(1 - (charging ? progress : 1)) * 100}% 0 0 0)`,
              }}
            />
          </span>
        </button>
      </div>
    </div>
  )
}
