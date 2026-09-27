// Geometry invariants for Hand poses, Mano placement, and Pluma's nib (issues #136–#137).
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, resolve } from "node:path"
import ts from "typescript"
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(pathToFileURL(root + "/registry/").href)
    ) {
      const base = fileURLToPath(new URL(specifier, context.parentURL))
      for (const ext of [".ts", ".tsx"])
        if (existsSync(base + ext))
          return { url: pathToFileURL(base + ext).href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (
      url.startsWith(pathToFileURL(root + "/registry/").href) &&
      /\.tsx?$/.test(url)
    )
      return {
        format: "module",
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            jsx: ts.JsxEmit.ReactJSX,
          },
        }).outputText,
        shortCircuit: true,
      }
    return next(url, context)
  },
})
const { Hand, handPoses } = await import("../registry/jbm/ui/hand.tsx")
const { Mano } = await import("../registry/jbm/motion/mano.tsx")
const { Pluma, plumaNib } = await import("../registry/jbm/motion/pluma.tsx")
const { color } = await import("../registry/jbm/lib/tokens.ts")
const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")
const h = React.createElement
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps

/** Vertices (segment endpoints) of a path: absolute M, L, H, V, C, A, Z and relative m, l, c, z. */
function vertices(d) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g)
  const pts = []
  let i = 0, cmd, x = 0, y = 0
  const n = () => parseFloat(toks[i++])
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    if (cmd === "Z" || cmd === "z") continue
    if (cmd === "M" || cmd === "L") { x = n(); y = n() }
    else if (cmd === "m" || cmd === "l") { x += n(); y += n(); if (cmd === "m") cmd = "l" }
    else if (cmd === "c") { i += 4; x += n(); y += n() }
    else if (cmd === "H") x = n()
    else if (cmd === "V") y = n()
    else if (cmd === "C") { i += 4; x = n(); y = n() }
    else if (cmd === "A") { i += 5; x = n(); y = n() }
    else throw new Error(`relative command ${cmd} in ${d.slice(0, 20)}`)
    pts.push({ x, y })
  }
  return pts
}
const pathsOf = (markup) =>
  [...markup.matchAll(/<path d="([^"]+)" fill="([^"]+)" stroke="[^"]+" stroke-width="([^"]+)"/g)].map(
    ([, d, fill, w]) => ({ d, fill, w: Number(w) })
  )

test("hand pose list: six poses, each with artwork and a label", () => {
  assert.deepEqual([...handPoses], ["open", "point", "pinch", "grip", "type", "hold"])
  for (const pose of handPoses) {
    const markup = renderToStaticMarkup(h(Hand, { pose }))
    assert.ok(markup.includes(`aria-label="Hand: ${pose}"`), pose)
    assert.ok(pathsOf(markup).length >= 4, pose)
  }
})

test("every pose: dividers start on outline vertices with the outline's stroke width", () => {
  for (const pose of handPoses) {
    const [outline, ...dividers] = pathsOf(renderToStaticMarkup(h(Hand, { pose })))
    assert.notEqual(outline.fill, "none")
    const vs = vertices(outline.d)
    for (const div of dividers) {
      const start = vertices(div.d)[0]
      assert.ok(
        vs.some((v) => close(v.x, start.x, 1e-9) && close(v.y, start.y, 1e-9)),
        `${pose}: divider ${div.d} starts off the outline`
      )
      assert.equal(div.w, outline.w, `${pose}: divider width`)
    }
  }
})

test("grip, type, hold: one outline plus open dividers; scallops never meet tangentially", () => {
  for (const pose of ["grip", "type", "hold"]) {
    const [outline, ...dividers] = pathsOf(renderToStaticMarkup(h(Hand, { pose })))
    assert.match(outline.d, /Z$/, `${pose}: the outline is closed`)
    for (const div of dividers) assert.ok(!/[Zz]/.test(div.d), `${pose}: dividers are open lines, not capsules`)
    // A fingertip row (a divider of four cubics) leaves and reaches each junction at 35° or more
    // from the neighbouring scallop, so no notch fills with ink.
    for (const div of dividers) {
      const cubics = [...div.d.matchAll(/C([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)/g)].map((m) =>
        m.slice(1).map(Number)
      )
      if (cubics.length < 4) continue
      let prev = vertices(div.d)[0]
      const dirs = cubics.map(([x1, y1, x2, y2, x, y]) => {
        const d = { start: [x1 - prev.x, y1 - prev.y], end: [x - x2, y - y2] }
        prev = { x, y }
        return d
      })
      for (let i = 1; i < dirs.length; i++) {
        const back = [-dirs[i - 1].end[0], -dirs[i - 1].end[1]],
          next = dirs[i].start
        const cos = (back[0] * next[0] + back[1] * next[1]) / Math.hypot(...back) / Math.hypot(...next)
        assert.ok((Math.acos(cos) * 180) / Math.PI >= 35, `${pose}: scallop join ${i} opens at least 35°`)
      }
    }
  }
})

test("existing poses keep their artwork", () => {
  const point = renderToStaticMarkup(h(Hand, { pose: "point" }))
  assert.ok(point.includes('transform="translate(-26 -27)"'))
  assert.ok(point.includes("m49.4 41.21c-0.06-1.26"))
  assert.ok(renderToStaticMarkup(h(Hand, {})).includes("Hand: point"))
})

test("mano renders only the placed hand", () => {
  const markup = renderToStaticMarkup(
    h("svg", null, h(Mano, { at: { x: 20, y: 30 }, pose: "pinch", angle: 12 }))
  )
  assert.ok(markup.startsWith('<svg><g transform="translate(20 30) rotate(12)">'))
  assert.ok(!markup.includes("<polygon"))
})

test("pluma: plumaNib is the drawn nib tip at every angle, size, and offset", () => {
  for (const size of [90, 180, 260])
    for (const angle of [-60, -15, 0, 20, 45])
      for (const nibOffset of [undefined, { x: -30, y: 80 }]) {
        const at = { x: 321, y: 207 }
        const markup = renderToStaticMarkup(
          h("svg", null, h(Pluma, { at, angle, size, nibOffset }))
        )
        const [, tx, ty, rot, len] = markup.match(
          /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)" data-pluma-nib="([-\d.]+)"/
        ).map(Number)
        const r = (rot * Math.PI) / 180
        const drawn = { x: tx + len * Math.cos(r), y: ty + len * Math.sin(r) }
        const nib = plumaNib(at, angle, nibOffset, size)
        assert.ok(close(drawn.x, nib.x, 0.05) && close(drawn.y, nib.y, 0.05), `${size} ${angle}`)
        assert.ok(markup.includes("Hand: pinch"))
      }
  // The pen is one silhouette masked by the hand's outline; nothing card-coloured is painted on the page.
  const held = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 100, y: 100 } })))
  assert.match(held, /<mask id="pluma-[\w-]+"/)
  assert.ok(!held.includes(`stroke="${color.card}"`), "no card halo")
  assert.equal((held.match(/<path d="M[^"]*" fill="#20241F"/g) ?? []).length, 1, "one pen silhouette")
  const alone = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 0, y: 0 }, hand: false })))
  assert.ok(!alone.includes("Hand:"))
  assert.ok(!alone.includes(color.accent))
  // The default nib points down-left of the grip, past the thumb.
  const d = plumaNib({ x: 0, y: 0 })
  assert.ok(d.x < 0 && d.y > 0)
})
