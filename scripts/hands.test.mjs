// Geometry invariants for Hand poses, Mano's arm and cuff, and Pluma's nib (issues #135–#137).
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
const { Hand, handPoses, handWrist } = await import("../registry/jbm/ui/hand.tsx")
const { Mano, manoArm } = await import("../registry/jbm/motion/mano.tsx")
const { Pluma, plumaNib } = await import("../registry/jbm/motion/pluma.tsx")
const { color } = await import("../registry/jbm/lib/tokens.ts")
const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")
const h = React.createElement
const close = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps
const dot = (a, b) => a.x * b.x + a.y * b.y

/** Vertices (segment endpoints) of an absolute-command path: M, L, H, V, C, A, Z. */
function vertices(d) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g)
  const pts = []
  let i = 0, cmd, x = 0, y = 0
  const n = () => parseFloat(toks[i++])
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    if (cmd === "Z") continue
    if (cmd === "M" || cmd === "L") { x = n(); y = n() }
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

test("hand pose list: six poses, each with artwork, a label, and a wrist edge", () => {
  assert.deepEqual([...handPoses], ["open", "point", "pinch", "grip", "type", "hold"])
  for (const pose of handPoses) {
    const markup = renderToStaticMarkup(h(Hand, { pose }))
    assert.ok(markup.includes(`aria-label="Hand: ${pose}"`), pose)
    assert.ok(pathsOf(markup).length >= 4, pose)
    const [a, b] = handWrist[pose]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    assert.ok(len > 8 && len < 9, `${pose} wrist ${len}`)
    // Thumb side first, low in the box: the forearm normal points down.
    assert.ok(a.x < b.x && a.y > 23 && b.y > 23 && a.y < 29, pose)
  }
})

test("new poses: dividers start on outline vertices with the outline's stroke width", () => {
  for (const pose of ["open", "grip", "type", "hold"]) {
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

test("existing poses keep their artwork", () => {
  const point = renderToStaticMarkup(h(Hand, { pose: "point" }))
  assert.ok(point.includes('transform="translate(-26 -27)"'))
  assert.ok(point.includes("m49.4 41.21c-0.06-1.26"))
  assert.ok(renderToStaticMarkup(h(Hand, {})).includes("Hand: point"))
})

test("mano without arm renders only the placed hand", () => {
  const markup = renderToStaticMarkup(
    h("svg", null, h(Mano, { at: { x: 20, y: 30 }, pose: "pinch", angle: 12 }))
  )
  assert.ok(markup.startsWith('<svg><g transform="translate(20 30) rotate(12)">'))
  assert.ok(!markup.includes("<polygon"))
})

test("mano arm: the sleeve sits on the wrist edge and leaves the frame", () => {
  const frame = { x: 0, y: 0, w: 1920, h: 1080 }
  for (const pose of handPoses)
    for (const angle of [-150, -40, 0, 25, 90, 180])
      for (const anchor of [undefined, { x: 15, y: 14 }]) {
        const props = { at: { x: 900, y: 420 }, pose, size: 200, angle, anchor, arm: { frame } }
        const g = manoArm(props)
        const [A, B] = g.wrist
        const u = { x: B.x - A.x, y: B.y - A.y }
        const M = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
        const [n1, n2, f2, f1] = g.sleeve
        assert.equal(g.sleeve.length, 4, "edge sleeve is one straight quad")
        // Wrist end lies along the wrist edge; the open-palm family keeps its thumb corner on
        // the hand contour (A), the others centre the sleeve on the wrist.
        assert.ok(close((n2.x - n1.x) * u.y - (n2.y - n1.y) * u.x, 0, 1e-6))
        if (pose === "open" || pose === "type") assert.ok(close(n1.x, A.x, 1e-6) && close(n1.y, A.y, 1e-6), pose)
        else assert.ok(close((n1.x + n2.x) / 2, M.x, 1e-6) && close((n1.y + n2.y) / 2, M.y, 1e-6), pose)
        // "edge" runs along the wrist normal, away from the fingers (the Hand's local +y side).
        assert.ok(close(dot(g.axis, u), 0, 1e-9))
        const down = { x: -Math.sin((angle * Math.PI) / 180), y: Math.cos((angle * Math.PI) / 180) }
        assert.ok(dot(g.axis, down) > 0.9, `${pose} ${angle}`)
        // The far end is outside the frame, so no stump shows.
        for (const p of [f1, f2])
          assert.ok(
            p.x <= frame.x || p.x >= frame.x + frame.w || p.y <= frame.y || p.y >= frame.y + frame.h,
            `${pose} ${angle}: far corner inside the frame`
          )
        // Convex, non-self-intersecting quad: all cross products share a sign.
        const q = g.sleeve
        const cross = q.map((p, i) => {
          const a = q[(i + 1) % 4], b = q[(i + 2) % 4]
          return (a.x - p.x) * (b.y - a.y) - (a.y - p.y) * (b.x - a.x)
        })
        assert.ok(cross.every((c) => c > 0) || cross.every((c) => c < 0))
        assert.equal(g.cuff, null)
      }
})

test("mano arm from a point bends at constant width and ends there; the hand is unchanged", () => {
  const props = { at: { x: 100, y: 50 }, pose: "point", size: 150, angle: 10 }
  for (const from of [{ x: 400, y: 300 }, { x: 480, y: 330 }, { x: -200, y: 330 }, { x: 600, y: 120 }, { x: 60, y: 900 }]) {
    const g = manoArm({ ...props, arm: { from, width: 50 }, cuff: "accent" })
    const end = g.spine[g.spine.length - 1]
    assert.ok(close(end.x, from.x) && close(end.y, from.y))
    // Width at the wrist equals width at the far end.
    const [farA, farB] = [...g.sleeve].sort(
      (p, q) => Math.hypot(p.x - from.x, p.y - from.y) - Math.hypot(q.x - from.x, q.y - from.y)
    )
    const wrist = Math.hypot(g.sleeve[1].x - g.sleeve[0].x, g.sleeve[1].y - g.sleeve[0].y)
    assert.ok(close(wrist, 50, 1e-6))
    assert.ok(close(Math.hypot(farA.x - farB.x, farA.y - farB.y), 50, 1e-6), JSON.stringify(from))
    assert.ok(close((farA.x + farB.x) / 2, from.x, 1e-6) && close((farA.y + farB.y) / 2, from.y, 1e-6))
    // The stub leaves along the wrist normal and holds a full-width, square cuff.
    if (g.spine.length === 3) {
      const stub = { x: g.spine[1].x - g.spine[0].x, y: g.spine[1].y - g.spine[0].y }
      assert.ok(close(stub.x * g.axis.y - stub.y * g.axis.x, 0, 1e-6))
      assert.ok(Math.hypot(stub.x, stub.y) >= 50 + Math.hypot(g.cuff[3].x - g.cuff[0].x, g.cuff[3].y - g.cuff[0].y) - 1e-6)
    }
    const [c0, c1, c2, c3] = g.cuff
    assert.ok(close(Math.hypot(c2.x - c3.x, c2.y - c3.y), 50, 1e-6))
    assert.ok(close(dot({ x: c3.x - c0.x, y: c3.y - c0.y }, { x: c1.x - c0.x, y: c1.y - c0.y }), 0, 1e-6))
  }
  const from = { x: 400, y: 300 }
  const plain = renderToStaticMarkup(h("svg", null, h(Mano, props)))
  const armed = renderToStaticMarkup(h("svg", null, h(Mano, { ...props, arm: { from } })))
  assert.ok(armed.includes(plain.slice(5, -6)), "hand markup changed")
})

test("cuff: vermilion only for accent, and only with an arm", () => {
  const at = { x: 200, y: 100 }
  const accent = renderToStaticMarkup(h("svg", null, h(Mano, { at, arm: true, cuff: "accent" })))
  assert.ok(accent.includes(color.accent))
  for (const props of [{ arm: true }, { arm: true, cuff: "ink" }, { cuff: "accent" }, { arm: { tone: "card" }, cuff: "ink" }]) {
    const markup = renderToStaticMarkup(h("svg", null, h(Mano, { at, ...props })))
    assert.ok(!markup.includes(color.accent), JSON.stringify(props))
  }
  const g = manoArm({ at, size: 180, arm: true, cuff: "accent" })
  assert.deepEqual(g.cuff.slice(0, 2), g.sleeve.slice(0, 2))
  const w = Math.hypot(g.sleeve[1].x - g.sleeve[0].x, g.sleeve[1].y - g.sleeve[0].y)
  const [A, B] = g.wrist
  const wristLen = Math.hypot(B.x - A.x, B.y - A.y)
  const depth = Math.hypot(g.cuff[2].x - g.cuff[1].x, g.cuff[2].y - g.cuff[1].y)
  assert.ok(close(depth, Math.max(w * 0.45, wristLen * 0.6), 1e-6))
  // A narrow sleeve still gets a readable band.
  const thin = manoArm({ at, size: 180, arm: { width: 20 }, cuff: "accent" })
  assert.ok(Math.hypot(thin.cuff[3].x - thin.cuff[0].x, thin.cuff[3].y - thin.cuff[0].y) >= wristLen * 0.6 - 1e-6)
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
  const alone = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 0, y: 0 }, hand: false })))
  assert.ok(!alone.includes("Hand:"))
  assert.ok(!alone.includes(color.accent))
  // The default nib points down-left of the grip, past the thumb.
  const d = plumaNib({ x: 0, y: 0 })
  assert.ok(d.x < 0 && d.y > 0)
})
