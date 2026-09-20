import test from "node:test"
import assert from "node:assert/strict"
import {
  durationFor,
  fps,
  timing,
  springFrames,
  popItems,
  codeLines,
  captionWords,
} from "../components/gallery/timing.ts"

test("short demos finish on their terminal animation frame, not a five-second hold", () => {
  assert.equal(durationFor("counter"), 52)
  assert.equal(durationFor("motion-hooks"), 52)
  assert.equal(
    (durationFor("counter") - 1) / fps,
    timing.counter.at + timing.counter.dur
  )
  assert.ok(durationFor("prob-bar") < durationFor("counter"))
})
test("spring demos include the last entrance and settling time", () => {
  assert.equal(
    durationFor("pop") - 1,
    Math.round(
      (timing.pop.at + (popItems.length - 1) * timing.pop.step) * fps
    ) + springFrames
  )
  assert.equal(
    durationFor("code-card") - 1,
    Math.round(Math.max(...codeLines.map((line) => line.at)) * fps) +
      springFrames
  )
})
test("captions finish after the final group fade; static scenes have no timeline", () => {
  assert.equal(durationFor("captions"), (captionWords.at(-1).e + 1) * fps + 1)
  assert.equal(durationFor("scene"), 1)
})
