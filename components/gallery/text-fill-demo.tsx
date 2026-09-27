"use client"
import { FlipText } from "@/registry/jbm/ui/flip-text"
import { ProgressControl } from "./progress-control"

import { useBenchParam } from "./bench-url"
import { TextFill } from "@/registry/jbm/ui/text-fill"
import { ScrollTextFill } from "@/registry/jbm/ui/scroll-text-fill"

const text = "Una idea toma forma. Letra por letra."

export function TextFillDemo() {
  const [progress, setProgress] = useBenchParam("progress", 0.45, {
    clamp: [0, 1],
  })
  return (
    <div style={{ width: "100%", padding: 24 }}>
      <p style={{ margin: "0 0 24px", fontSize: "clamp(24px, 3vw, 40px)" }}>
        <TextFill text={text} progress={progress} />
      </p>
      <ProgressControl
        label="Fill progress"
        ariaLabel="Text fill progress"
        value={progress}
        onChange={setProgress}
        presets={["Empty", "Half", "Full"]}
      />
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
