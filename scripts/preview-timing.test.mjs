import { codeTypingSchedule, typedCode } from "../registry/jbm/motion/code-card-timing.js"
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
    codeTypingSchedule(codeLines, fps).at(-1).end
  )
})
test("captions finish after the final group fade; static scenes have no timeline", () => {
  assert.equal(durationFor("captions"), (captionWords.at(-1).e + 1) * fps + 1)
  assert.equal(durationFor("scene"), 1)
})

test("typing stays in place, queues lines, and finishes on the replay terminal frame", () => {
  const schedule = codeTypingSchedule([{t: "abc", at: 0.2}, {t: "😀x", at: 0}], 30, 10)
  assert.equal(typedCode(schedule[0], 5, 30, 10), "")
  assert.equal(typedCode(schedule[0], 9, 30, 10), "a")
  assert.equal(schedule[1].start, schedule[0].end)
  assert.equal(typedCode(schedule[1], schedule[1].start + 3, 30, 10), "😀")
  const demo = codeTypingSchedule(codeLines, fps)
  const last = demo.at(-1)
  assert.notEqual(typedCode(last, durationFor("code-card") - 2, fps), codeLines.at(-1).t)
  assert.equal(typedCode(last, durationFor("code-card") - 1, fps), codeLines.at(-1).t)
  assert.throws(() => codeTypingSchedule([], 30, 0), RangeError)
})

test('illustrated replay duration follows final motion instead of padded holds', async () => {
  const {illustrated} = await import('../components/gallery/timing.ts');
  assert.equal(durationFor('propagate')-1, Math.round((illustrated.propagate.recolored+0.35)*fps));
  assert.equal(durationFor('shelf')-1, Math.max(Math.round((illustrated.shelf.strike+0.45)*fps),Math.round(illustrated.shelf.second*fps)+springFrames));
  assert.ok(durationFor('catalog') < 5.8*fps+1);
  assert.ok(durationFor('rebuild-screens') < 4.6*fps+1);
});
