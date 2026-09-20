"use client"

import { useEffect, useRef, useState } from "react"
import { ReplayButton } from "@/registry/jbm/ui/replay-button"

/** A plain browser animation demonstrates that ReplayButton does not need Remotion. */
export function ReplayDemo() {
  const [progress, setProgress] = useState(1)
  const [charging, setCharging] = useState(false)
  const frame = useRef(0)
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  function replay() {
    cancelAnimationFrame(frame.current)
    setProgress(0)
    setCharging(true)
    const start = performance.now()
    function tick(now: number) {
      const next = Math.min(1, (now - start) / 1500)
      setProgress(next)
      if (next < 1) frame.current = requestAnimationFrame(tick)
      else setCharging(false)
    }
    frame.current = requestAnimationFrame(tick)
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <ReplayButton
        progress={progress}
        charging={charging}
        onReplay={replay}
        label="Replay button demo"
        iconSize={52}
      />
      <p style={{ fontSize: 22 }}>
        Click to replay · {Math.round(progress * 100)}%
      </p>
    </div>
  )
}
