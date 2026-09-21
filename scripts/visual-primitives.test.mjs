import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import ts from "typescript"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
const require = createRequire(import.meta.url)
function load(path) {
  const module = { exports: {} }
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function("require", "module", "exports", code)(name => name.startsWith(".") ? load(resolve(dirname(path), name + ".ts")) : require(name), module, module.exports)
  return module.exports
}
const { ScoreScale } = load(resolve("registry/jbm/ui/score-scale.tsx"))
const { ComparisonBars } = load(resolve("registry/jbm/ui/comparison-bars.tsx"))
const { Clock } = load(resolve("registry/jbm/ui/clock.tsx"))
const { Folder } = load(resolve("registry/jbm/ui/folder.tsx"))
const render = (component, props) => renderToStaticMarkup(createElement(component, props))

test("score meters expose clamped values and reject ranges that cannot be plotted", () => {
  const base = { label: "Score", min: -5, max: 5 }
  assert.match(render(ScoreScale, { ...base, value: 20 }), /aria-valuenow="5"/)
  assert.match(render(ScoreScale, { ...base, value: -20 }), /aria-valuenow="-5"/)
  assert.match(render(ScoreScale, { ...base, value: 0 }), /left:50%/)
  for (const props of [{ value: NaN }, { value: Infinity }, { value: 0, min: 5, max: 5 }]) assert.throws(() => render(ScoreScale, { ...base, ...props }), RangeError)
})
test("comparison bars share one scale and never silently misrepresent out-of-range values", () => {
  const html = render(ComparisonBars, { items: [{ label: "A", value: 25 }, { label: "B", value: 50 }], max: 100 })
  assert.match(html, /width:25%/)
  assert.match(html, /width:50%/)
  assert.match(html, /<dt[^>]*>A<\/dt><dd[^>]*>25<\/dd>/)
  assert.doesNotThrow(() => render(ComparisonBars, { items: [] }))
  assert.ok(!render(ComparisonBars, { items: [{ label: "Zero", value: 0 }] }).includes("NaN"))
  for (const props of [{ items: [{ label: "A", value: -1 }] }, { items: [{ label: "A", value: Infinity }] }, { items: [{ label: "A", value: 101 }], max: 100 }, { items: [], max: 0 }]) assert.throws(() => render(ComparisonBars, props), RangeError)
})
test("clock normalizes time across midnight and advances the hour hand with minutes", () => {
  assert.equal(render(Clock, { hours: 24, minutes: 30 }), render(Clock, { hours: 0, minutes: 30 }))
  assert.equal(render(Clock, { hours: 0, minutes: -30 }), render(Clock, { hours: 23, minutes: 30 }))
  assert.match(render(Clock, { hours: 3, minutes: 30 }), /rotate\(105 32 32\)/)
  assert.match(render(Clock, { hours: 3, minutes: 30 }), />03:30</)
  assert.throws(() => render(Clock, { hours: NaN }), RangeError)
})
test("folder state clamps without invalid SVG geometry", () => {
  const closed = render(Folder, { open: 0, label: "Notes" })
  for (const open of [-1, NaN, Infinity]) assert.equal(render(Folder, { open, label: "Notes" }), closed)
  assert.equal(render(Folder, { open: 2 }), render(Folder, { open: 1 }))
  assert.match(closed, /aria-label="Notes, closed folder"/)
})
