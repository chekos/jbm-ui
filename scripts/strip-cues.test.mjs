// QA strip cues (contracts/items/<name>.ts `cues`) and behaviour categories. Cues are authored in
// seconds on the gallery preview timeline; these tests tie each one to the demo cue sheet in
// components/gallery/timing.ts, so a retimed demo fails here instead of showing an empty frame.
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { checkCues, cueFrame, maxCues } from "./lib/contracts.mjs"
import {
  captionWords,
  codeLines,
  durationFor,
  fps,
  illustrated,
  popItems,
  springFrames,
  timing,
} from "../components/gallery/timing.ts"
import { codeTypingSchedule } from "../registry/jbm/motion/code-card-timing.js"

const read = (path) => JSON.parse(readFileSync(path, "utf8"))
const catalog = read("contracts/generated/catalog.json").items
const gallery = read("contracts/generated/gallery.json").items
const byName = new Map(catalog.map((entry) => [entry.name, entry]))
const cue = (name, label) => {
  const found = byName.get(name)?.cues?.find((entry) => entry.label === label)
  assert.ok(found, `${name} has a "${label}" cue`)
  return found.at
}
/** `at` lies after `from` (seconds) and strictly before `to`. */
const between = (at, from, to, label) =>
  assert.ok(at >= from && at < to, `${label}: ${at} s is outside [${from}, ${to})`)
const spring = springFrames / fps

test("every Motion item declares cues inside its preview timeline", () => {
  for (const entry of catalog.filter((item) => item.category === "Motion")) {
    assert.ok(entry.cues?.length, `${entry.name} has cues`)
    assert.ok(entry.cues.length <= maxCues, entry.name)
    const last = durationFor(entry.name) - 1
    let previous = 0
    for (const { at, frame, label } of entry.cues) {
      assert.equal(frame, cueFrame(at), `${entry.name} ${label}`)
      assert.ok(frame > previous && frame < last, `${entry.name} ${label}: frame ${frame}`)
      previous = frame
    }
  }
})

test("gallery cards carry each cue's label and frame for the strip", () => {
  for (const item of gallery) {
    const entry = byName.get(item.name)
    assert.deepEqual(
      item.cues,
      entry.cues?.map(({ label, frame }) => ({ label, frame })),
      item.name
    )
  }
})

test("propagate cues sit between the demo's bug, fix, and recolour cues", () => {
  const p = illustrated.propagate
  between(cue("propagate", "Bug appears"), p.bug + spring, p.fix, "Bug appears")
  between(cue("propagate", "Fix travels"), p.fix, p.fixed, "Fix travels")
  between(cue("propagate", "Fix lands"), p.fixed, p.recolor - 0.2, "Fix lands")
})

test("shelf, catalog, and rebuild-screens cues follow their cue sheets", () => {
  const s = illustrated.shelf
  between(cue("shelf", "Libraries stacked"), Math.max(...s.items) + spring, s.twice, "shelf stack")
  between(cue("shelf", "One button"), s.twice + spring, s.second, "shelf one")
  between(cue("shelf", "Built twice"), s.second + spring, s.strike, "shelf twice")
  const c = illustrated.catalog
  between(cue("catalog", "Pieces tested"), Math.max(...c.items), c.tokensAt + 0.01, "catalog pieces")
  between(cue("catalog", "Tokens arriving"), c.tokens[0], c.tokens[2], "catalog arriving")
  between(cue("catalog", "Tokens in"), c.tokens[2], c.stamp, "catalog tokens")
  const r = illustrated.screens
  between(cue("rebuild-screens", "First screen built"), Math.max(...r.pieces) + spring, r.again[0], "screens first")
  between(cue("rebuild-screens", "Built again"), r.sticker, r.again[1], "screens again")
})

test("typing, captions, and entrance cues follow the demo data", () => {
  const schedule = codeTypingSchedule(codeLines, fps)
  assert.equal(cueFrame(cue("code-card", "First line typed")), schedule[0].end)
  assert.equal(cueFrame(cue("code-card", "Second line typed")), schedule[1].end)
  const emphasis = captionWords.find((word) => word.emph)
  between(cue("captions", "Emphasis word"), emphasis.s + 0.2, emphasis.e, "captions emphasis")
  between(cue("captions", "Every word spoken"), captionWords.at(-1).s, captionWords.at(-1).e, "captions spoken")
  const chip = (index) => timing.pop.at + index * timing.pop.step
  assert.equal(popItems.length, 3)
  between(cue("pop", "First chip lands"), chip(0), chip(1) + 0.01, "pop first")
  between(cue("pop", "Second chip lands"), chip(1), chip(2) + 0.01, "pop second")
  const count = timing.counter
  between(cue("counter", "Counting up"), count.at, count.at + count.dur, "counter")
  between(cue("motion-hooks", "Counting up"), count.at, count.at + count.dur, "motion-hooks")
  const bar = timing.probability
  between(cue("prob-bar", "Bar filling"), bar.at, bar.at + bar.dur, "prob-bar")
})

test("cue validation rejects labels, order, and frames the strip cannot show", () => {
  const errorsFor = (cues, capabilities = ["replay", "player"]) => {
    const errors = []
    checkCues({ name: "propagate", capabilities, cues }, errors)
    return errors
  }
  assert.deepEqual(errorsFor([{ label: "Bug appears", at: 2.3 }]), [])
  assert.match(errorsFor([])[0], /non-empty/)
  assert.match(errorsFor([{ label: "Bug", at: 2.3 }], ["controls"])[0], /only for "player"/)
  assert.match(errorsFor([{ label: "Middle", at: 2 }])[0], /says what happens/)
  assert.match(errorsFor([{ label: "x".repeat(25), at: 2 }])[0], /longer than/)
  assert.match(errorsFor([{ label: "Late", at: 60 }])[0], /strictly between/)
  assert.match(errorsFor([{ label: "Start", at: 0 }])[0], /strictly between/)
  assert.match(errorsFor([{ label: "A", at: 2 }, { label: "B", at: 1 }])[0], /in order/)
  assert.match(errorsFor([{ label: "A", at: 2, when: 1 }])[0], /not a cue field/)
  assert.match(
    errorsFor(Array.from({ length: maxCues + 1 }, (_, i) => ({ label: `Cue ${i}`, at: 0.5 + i * 0.1 })))[0],
    /at most/
  )
})

// Categories describe behaviour: a category pager walks one kind of bench.
test("Motion holds Player timelines; Interactive holds pieces that respond to the reader", () => {
  const motion = catalog.filter((item) => item.category === "Motion")
  const interactive = catalog.filter((item) => item.category === "Interactive")
  assert.ok(motion.length > 0 && interactive.length > 0)
  for (const item of motion) {
    assert.ok(item.capabilities.includes("player"), `${item.name} previews in a Player`)
    assert.ok(durationFor(item.name) > 1, `${item.name} has a timeline`)
  }
  for (const item of interactive) {
    assert.ok(!item.capabilities.includes("player"), `${item.name} has no Remotion timeline`)
    assert.ok(!item.needsRemotion, `${item.name} works without Remotion`)
  }
  assert.deepEqual(
    interactive.map((item) => item.name).sort(),
    [
      "flip-text",
      "replay-button",
      "scroll-stack",
      "scroll-text-fill",
    ]
  )
})
