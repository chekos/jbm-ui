import { measureSpring } from "remotion"

export const fps = 30
export const timing = {
  counter: { at: 0.2, dur: 1.5 },
  pop: { at: 0.2, step: 0.35 },
  probability: { at: 0.2, dur: 0.7 },
}
export const popItems = ["Idea", "Datos", "Historia"]
export const codeLines = [
  { t: 'const idea = "simple";', at: 0.2 },
  { t: "const story = explain(idea);", at: 0.7 },
  { t: "render(story);", at: 1.2, color: "#FF8A6A" },
]
export const captionWords = [
  { w: "Una", s: 0, e: 0.7 },
  { w: "idea", s: 0.7, e: 1.4, emph: true },
  { w: "a", s: 1.4, e: 1.8 },
  { w: "la", s: 1.8, e: 2.2 },
  { w: "vez.", s: 2.2, e: 3.5 },
]
// Match useIn's spring configuration. Settled means within 0.5% of the target.
export const springFrames = measureSpring({
  fps,
  config: { damping: 14, stiffness: 120, mass: 0.8 },
})
const frame = (seconds: number) => Math.round(seconds * fps)

// Include the terminal frame so interpolated values reach their exact target.
export function durationFor(name: string): number {
  switch (name) {
    case "counter":
    case "motion-hooks":
      return frame(timing.counter.at + timing.counter.dur) + 1
    case "pop":
      return (
        frame(timing.pop.at + (popItems.length - 1) * timing.pop.step) +
        springFrames +
        1
      )
    case "prob-bar":
      return (
        frame(timing.probability.at) +
        Math.max(frame(timing.probability.dur), springFrames) +
        1
      )
    case "code-card":
      return (
        frame(Math.max(...codeLines.map((line) => line.at))) + springFrames + 1
      )
    case "captions":
      // Captions keeps its last group for one second, including its fade-out.
      return frame(captionWords[captionWords.length - 1].e + 1) + 1
    default:
      return 1 // Scene is a static layout component, not a timed animation.
  }
}
