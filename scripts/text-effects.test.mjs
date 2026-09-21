import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import ts from "typescript"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

const require = createRequire(import.meta.url)
// Compile the published TSX in memory, without a Next.js or browser runtime.
function load(path) {
  const compiled = { exports: {} }
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const localRequire = name => name.startsWith(".")
    ? load(resolve(dirname(path), name + (name.endsWith("text-fill") ? ".tsx" : ".ts")))
    : require(name)
  new Function("require", "module", "exports", source)(localRequire, compiled, compiled.exports)
  return compiled.exports
}
const { TextFill } = load(resolve("registry/jbm/ui/text-fill.tsx"))
const { ScrollTextFill } = load(resolve("registry/jbm/ui/scroll-text-fill.tsx"))
const { FlipText } = load(resolve("registry/jbm/ui/flip-text.tsx"))
const render = (Component, props) => renderToStaticMarkup(createElement(Component, props))

test("fill clamps invalid progress and exposes a fully settled reduced-motion state", () => {
  const start = render(TextFill, { text: "Hola", progress: 0 })
  for (const progress of [-1, NaN, Infinity]) assert.equal(render(TextFill, { text: "Hola", progress }), start)
  const end = render(TextFill, { text: "Hola", progress: 1 })
  assert.equal(render(TextFill, { text: "Hola", progress: 2 }), end)
  assert.equal(render(TextFill, { text: "Hola", progress: 0, reducedMotion: true }), end)
  assert.equal((end.match(/color:#20241F/g) ?? []).length, 4)
  assert.notEqual(render(TextFill, { text: "Hola", progress: 0.5 }), start)
  assert.notEqual(render(TextFill, { text: "Hola", progress: 0.5 }), end)
})

test("text effects preserve grapheme clusters and expose one accessible phrase", () => {
  const text = "e\u0301 👩🏽‍💻"
  const fill = render(TextFill, { text, progress: 1 })
  assert.equal((fill.match(/color:#20241F/g) ?? []).length, 2)
  assert.ok(fill.includes(`>${text}</span><span aria-hidden="true">`))
  const flip = render(FlipText, { children: text })
  assert.equal((flip.match(/data-flip-character/g) ?? []).length, 2)
  assert.ok(flip.includes(`aria-label="Flip text: ${text}"`))
  assert.ok(!flip.includes("animation:"))
  assert.doesNotThrow(() => render(TextFill, { text: "", progress: 0.5 }))
})

test("scroll fill server output is readable and does not trap reduced-motion users in an empty scroll area", () => {
  const html = render(ScrollTextFill, { text: "Hola" })
  assert.ok(html.includes("height:auto"))
  assert.ok(!html.includes('tabindex="0"'))
  assert.equal((html.match(/color:#20241F/g) ?? []).length, 4)
})

const { ScrollStack } = load(resolve("registry/jbm/ui/scroll-stack.tsx"))
test("scroll stack keeps arbitrary children and interactive semantics in readable server output", () => {
  const html = render(ScrollStack, {height: 400, children: [createElement("section", {key: "card"}, "A card"), null, createElement("button", {key: "action"}, "Still a button")]})
  assert.equal((html.match(/role="listitem"/g) ?? []).length, 2)
  assert.ok(html.includes("<section>A card</section>"))
  assert.ok(html.includes("<button>Still a button</button>"))
  assert.ok(!html.includes("opacity:0"))
  assert.ok(!html.includes("position:sticky"))
  assert.ok(html.includes('tabindex="0"'))
})

test("scroll stack supports empty, single, and page-scrolling content without a fixed viewport", () => {
  const empty = render(ScrollStack, {children: null})
  assert.ok(!empty.includes('role="listitem"'))
  assert.ok(!empty.includes('tabindex="0"'))
  const single = render(ScrollStack, {children: createElement("div", null, "Only item")})
  assert.equal((single.match(/role="listitem"/g) ?? []).length, 1)
  assert.ok(!single.includes("height:480px"))
  assert.ok(!single.includes("overflow-y:auto"))
})
