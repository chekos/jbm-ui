import { codeTypingSchedule } from "../../registry/jbm/motion/code-card-timing.js"
import { measureSpring } from "remotion"

export const fps = 30
export const timing = {
  counter: { at: 0.2, dur: 1.5 },
  pop: { at: 0.2, step: 0.35 },
  probability: { at: 0.2, dur: 0.7 },
}
export const popItems = ["Idea", "Datos", "Historia"]
// Compact cue sheets for the illustrated scene blocks (seconds).
export const illustrated = {
  screens: { pieces: [0.2, 0.7, 1.2], again: [2.2, 3.2], sticker: 2.3 },
  catalog: {
    at: 0.2,
    items: [0.8, 1.2, 1.6],
    tokensAt: 2.6,
    tokens: [3.0, 3.4, 3.8],
    stamp: 4.4,
  },
  propagate: {
    at: 0.2,
    label: 0.9,
    bug: 1.6,
    fix: 2.4,
    fixed: 3.2,
    recolor: 4.0,
    recolored: 4.8,
  },
  shelf: { items: [0.2, 0.6, 1.0], twice: 2.0, second: 2.8, strike: 3.0 },
}
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
const settle = (damping: number, stiffness = 120) =>
  measureSpring({ fps, config: { damping, stiffness, mass: 0.8 } })
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
    case "scene-spec":
      return frame(0.8) + springFrames + 1
    case "code-card":
      return (codeTypingSchedule(codeLines, fps).at(-1)?.end ?? 0) + 1
    case "captions":
      // Captions keeps its last group for one second, including its fade-out.
      return frame(captionWords[captionWords.length - 1].e + 1) + 1
    case "rebuild-screens":
      return (
        Math.max(
          frame(
            Math.max(...illustrated.screens.again) +
              0.12 +
              (illustrated.screens.pieces.length - 1) * 0.22
          ) + springFrames,
          frame(illustrated.screens.sticker) + settle(9, 160),
          frame(Math.max(...illustrated.screens.again)) + settle(12, 110)
        ) + 1
      )
    case "catalog":
      return (
        Math.max(
          frame(illustrated.catalog.stamp) + settle(9, 160),
          frame(Math.max(...illustrated.catalog.tokens)) + springFrames
        ) + 1
      )
    case "propagate":
      return (
        Math.max(
          frame(illustrated.propagate.recolored + 0.35),
          frame(illustrated.propagate.fixed) + settle(10)
        ) + 1
      )
    case "shelf":
      return (
        Math.max(
          frame(illustrated.shelf.strike + 0.45),
          frame(illustrated.shelf.second) + springFrames
        ) + 1
      )
    default:
      return 1 // Scene is a static layout component, not a timed animation.
  }
}
