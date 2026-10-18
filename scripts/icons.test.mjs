import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import ts from "typescript"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const require = createRequire(import.meta.url)
function load(file) {
  const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText
  const compiled = { exports: {} }
  const imports = name => name === "../lib/tokens" ? { color: { bg: "#FFF6E8" }, stroke: { outline: 3 } } : require(name)
  new Function("require", "module", "exports", source)(imports, compiled, compiled.exports)
  return compiled.exports
}
const { JbmIcon, iconPaths } = load("../registry/jbm/ui/icons.tsx")
const { emptyReview, parseReview, reviewPacket, reviewNames, REVIEW_VERSION } = load("../lib/icon-review.ts")

test("review covers the entire published icon inventory", () => {
  assert.deepEqual(reviewNames, Object.keys(iconPaths))
})
test("v2 keeps approved silhouettes and does not inherit v1 approvals", () => {
  assert.equal(iconPaths.folder.body, "M3 5H9L12 8H21V20H3Z")
  assert.equal(iconPaths.notebook.body, "M5 3H20V21H5Z")
  assert.equal(iconPaths.chart.body, "M8 20V12H13V20ZM13 20V5H18V20Z")
  assert.equal(REVIEW_VERSION, "jbm-icons-v2")
  assert.throws(() => parseReview(JSON.stringify({ version: "jbm-icons-v1", review: emptyReview() })))
  assert.ok(Object.values(emptyReview().icons).every(icon => icon.decision === "Unreviewed"))
  assert.match(renderToStaticMarkup(React.createElement(JbmIcon, { name: "search" })), /stroke-width="2.5"/)
})
test("decorative and named icons have distinct accessibility semantics", () => {
  const decorative = renderToStaticMarkup(React.createElement(JbmIcon, { name: "folder" }))
  assert.match(decorative, /aria-hidden="true"/)
  assert.doesNotMatch(decorative, /role="img"/)
  const meaningful = renderToStaticMarkup(React.createElement(JbmIcon, { name: "folder", label: "Research & notes" }))
  assert.match(meaningful, /role="img"/)
  assert.match(meaningful, /aria-label="Research &amp; notes"/)
  assert.doesNotMatch(meaningful, /aria-hidden/)
})
test("SVG exports retain color and size, and reject invalid dimensions", () => {
  for (const name of reviewNames) {
    const svg = renderToStaticMarkup(React.createElement(JbmIcon, { name, size: 16, treatment: "paper", paperColor: "#C63D24", color: "#20241F" }))
    assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    assert.match(svg, /width="16" height="16"/)
    assert.match(svg, /stroke="#20241F"/)
    if (iconPaths[name].body) assert.match(svg, /fill="#C63D24"/)
  }
  for (const size of [0, -1, NaN, Infinity]) assert.match(renderToStaticMarkup(React.createElement(JbmIcon, { name: "check", size })), /width="24" height="24"/)
})
test("feedback survives storage round trip without silently approving untouched icons", () => {
  const review = emptyReview()
  review.icons.folder = { decision: "Revise", note: 'Wider tab; keep "paper".\nSecond note.' }
  review.direction = "A — Outline"
  const restored = parseReview(JSON.stringify({ version: REVIEW_VERSION, review }))
  assert.deepEqual(restored, review)
  assert.match(reviewPacket(restored), /folder: Revise — Wider tab/)
  assert.match(reviewPacket(restored), /agent: Unreviewed/)
  assert.match(reviewPacket(restored), /Unreviewed icons are not approvals/)
})
test("malformed or incompatible persisted feedback fails explicitly", () => {
  for (const value of ["{", "null", "{}", JSON.stringify({ version: "old", review: emptyReview() })]) assert.throws(() => parseReview(value))
  const review = emptyReview()
  review.icons.agent.decision = "Approved by default"
  assert.throws(() => parseReview(JSON.stringify({ version: REVIEW_VERSION, review })))
})
