"use client"
import { FlipText } from "@/registry/jbm/ui/flip-text"
import { color } from "@/registry/jbm/lib/tokens"

import { useState } from "react"
import { TextFill } from "@/registry/jbm/ui/text-fill"
import { ScrollTextFill } from "@/registry/jbm/ui/scroll-text-fill"

const text = "Una idea toma forma. Letra por letra."

export function TextFillDemo() {
  const [progress, setProgress] = useState(0.45)
  return (
    <div style={{ width: "100%", padding: 24 }}>
      <p style={{ margin: "0 0 24px", fontSize: "clamp(24px, 3vw, 40px)" }}>
        <TextFill text={text} progress={progress} />
      </p>
      <label style={{ display: "grid", gap: 12 }}>
        Fill progress · {Math.round(progress * 100)}%
        <input
          aria-label="Text fill progress"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={progress}
          onChange={(event) => setProgress(Number(event.target.value))}
          style={{ width: "100%", accentColor: color.accent }}
        />
      </label>
    </div>
  )
}

export function ScrollTextFillDemo() {
  return (
    <div style={{ width: "100%" }}>
      <p style={{ padding: "12px 24px", margin: 0, fontSize: 12 }}>
        Scroll here ↓ · Focus and use ↓ / ↑ to rewind
      </p>
      <ScrollTextFill
        text={text}
        height={240}
        style={{ fontSize: "clamp(24px, 3vw, 40px)" }}
      />
    </div>
  )
}

export function FlipTextDemo() {
  return (
    <div style={{ width: "100%", padding: 24 }}>
      <FlipText style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>
        Una idea viva.
      </FlipText>
      <p style={{ marginTop: 20, fontSize: 12 }}>
        Hover a letter · Click, tap, or press Enter to flip all
      </p>
    </div>
  )
}
