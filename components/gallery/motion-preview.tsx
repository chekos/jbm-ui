"use client"

import { useEffect, useRef, useState } from "react"
import { Player, type PlayerRef } from "@remotion/player"
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
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const current = player.current
    if (!current) return
    const onPlay = () => setPlaying(true)
    const onStop = () => setPlaying(false)
    current.addEventListener("play", onPlay)
    current.addEventListener("pause", onStop)
    current.addEventListener("ended", onStop)
    return () => {
      current.removeEventListener("play", onPlay)
      current.removeEventListener("pause", onStop)
      current.removeEventListener("ended", onStop)
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
        clickToPlay={false}
        doubleClickToFullscreen={false}
        initialFrame={45}
        autoPlay={false}
        aria-label={`${name} motion preview`}
      />
      <div className="motion-actions">
        {playing && (
          <button
            type="button"
            aria-label={`Pause ${name} animation`}
            onClick={() => player.current?.pause()}
          >
            Pause
          </button>
        )}
        <button
          type="button"
          aria-label={`Replay ${name} animation`}
          onClick={() => {
            player.current?.seekTo(0)
            player.current?.play()
          }}
        >
          ↻ Replay
        </button>
      </div>
    </div>
  )
}
