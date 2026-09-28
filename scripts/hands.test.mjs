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
    assert.ok(pathsOf(markup).length >= (["grip", "type", "hold"].includes(pose) ? 1 : 4), pose)
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

/** Segments of an absolute path (M L C A Z) with start/end tangents; arcs assume rx = ry. */
function segments(d) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g)
  const out = []
  let i = 0, cmd, x = 0, y = 0, sx = 0, sy = 0, sp = -1
  const closed = []
  const n = () => parseFloat(toks[i++])
  const push = out.push.bind(out)
  out.push = (seg) => push({ ...seg, sp })
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    if (cmd === "Z") {
      if (x !== sx || y !== sy) out.push({ a: [x, y], b: [sx, sy], t0: [sx - x, sy - y], t1: [sx - x, sy - y] })
      closed[sp] = true
      x = sx; y = sy
      continue
    }
    if (cmd === "M") { x = sx = n(); y = sy = n(); sp++; closed[sp] = false; continue }
    if (cmd === "L") {
      const [bx, by] = [n(), n()]
      out.push({ a: [x, y], b: [bx, by], t0: [bx - x, by - y], t1: [bx - x, by - y] })
      x = bx; y = by
    } else if (cmd === "C") {
      const c = [n(), n(), n(), n(), n(), n()]
      out.push({ a: [x, y], b: [c[4], c[5]], t0: [c[0] - x, c[1] - y], t1: [c[4] - c[2], c[5] - c[3]] })
      x = c[4]; y = c[5]
    } else if (cmd === "A") {
      const [r0, , , fa, fs, bx, by] = [n(), n(), n(), n(), n(), n(), n()]
      const dx = (x - bx) / 2, dy = (y - by) / 2, d2 = dx * dx + dy * dy
      const r = Math.max(r0, Math.sqrt(d2))
      const k = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, (r * r - d2) / d2))
      const cx = k * dy + (x + bx) / 2, cy = -k * dx + (y + by) / 2
      const tan = (px, py) => (fs ? [-(py - cy), px - cx] : [py - cy, -(px - cx)])
      out.push({ a: [x, y], b: [bx, by], t0: tan(x, y), t1: tan(bx, by) })
      x = bx; y = by
    } else throw new Error(`command ${cmd}`)
  }
  out.closed = closed
  return out
}
const turn = (u, v) => {
  let t = (Math.atan2(v[1], v[0]) - Math.atan2(u[1], u[0])) * (180 / Math.PI)
  while (t > 180) t -= 360
  while (t < -180) t += 360
  return t
}

test("grip, type, hold: one ink path; interior lines are retraced spurs; every join is tangent", () => {
  // Deliberate corners: the wrist cut, type's thumb web, and where hold's heel meets the little
  // finger (its underside, and the fingertip it leaves at a right angle).
  const corners = {
    grip: ["36.8,64.8", "54.1,60.1"],
    type: ["36.8,64.8", "54.1,60.1", "28.4,43.7"],
    hold: ["36.8,64.8", "54.1,60.1", "63.8,50", "57.6,46.8"],
  }
  for (const pose of ["grip", "type", "hold"]) {
    const paths = pathsOf(renderToStaticMarkup(h(Hand, { pose })))
    assert.equal(paths.length, 1, `${pose}: the outline carries every interior line`)
    const [ink] = paths
    assert.notEqual(ink.fill, "none")
    const segs = segments(ink.d)
    assert.equal(segs.closed[0], true, `${pose}: the outline is closed`)
    // Anything after the outline is a free stroke retraced out and back (type's fold marks).
    assert.ok(segs.closed.slice(1).every((c) => !c), `${pose}: only the outline is closed`)
    // A segment walked both ways is an interior spur (no fill); the rest is the outline.
    const k = (s) => `${s.a}|${s.b}`
    const count = new Map()
    for (const s of segs) count.set(k(s), (count.get(k(s)) ?? 0) + 1)
    const spur = (s) => count.has(`${s.b}|${s.a}`)
    for (const s of segs.filter(spur))
      assert.equal(count.get(k(s)), count.get(`${s.b}|${s.a}`), `${pose}: spur ${k(s)} is retraced`)
    assert.ok(segs.filter(spur).length >= 6, `${pose}: interior lines are spurs`)
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i]
      const nx =
        segs[i + 1]?.sp === s.sp
          ? segs[i + 1]
          : segs.closed[s.sp]
            ? segs.find((q) => q.sp === s.sp)
            : null
      if (!nx) continue // a free stroke's far end
      const t = Math.abs(turn(s.t1, nx.t0))
      const at = `${s.b[0]},${s.b[1]}`
      if (corners[pose].includes(at)) continue
      assert.ok(t < 0.5 || t > 179.5, `${pose}: join at ${at} turns ${t.toFixed(1)}°`)
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
  // The pen weaves with the hand (#170): the whole pen, masked by the hand's outline, lies under
  // the hand; the hand's ink is cut along the upper shaft (plus a half-outline gap), the gap is
  // refilled with card only inside the hand's fill, and the upper shaft is drawn again over it.
  // Nothing card-coloured is painted on the page around the hand.
  const held = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 100, y: 100 } })))
  assert.match(held, /<mask id="pluma-[\w-]+"/)
  const under = held.indexOf(`fill="${color.ink}"`)
  const refill = held.indexOf('mask="url(#pluma-fill-')
  const cut = held.indexOf('mask="url(#pluma-cut-')
  const hand = held.indexOf("Hand: pinch")
  const over = held.indexOf("data-pluma-over")
  assert.ok(under >= 0 && under < refill && refill < cut && cut < hand && hand < over, "pen under the hand, upper shaft over it")
  assert.ok(held.slice(refill, cut).includes(`stroke="${color.card}"`), "card refill of the cut, inside the hand")
  const fillMask = held.slice(held.indexOf('<mask id="pluma-fill-'))
  assert.ok(!fillMask.slice(0, fillMask.indexOf("</mask>")).includes("stroke="), "refill clipped to the hand's fill, not its outer stroke")
  const overPart = held.slice(over)
  assert.equal((held.match(/fill="#20241F"/g) ?? []).length, 2, "the pen, and its upper shaft again")
  // The upper shaft starts at the grip point and runs back to the tail, never toward the nib.
  const upper = overPart.match(/<path transform="[^"]*" d="M([-\d.]+) /)
  assert.ok(upper && Number(upper[1]) <= 0, "upper shaft starts at or behind the grip")
  const alone = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 0, y: 0 }, hand: false })))
  assert.ok(!alone.includes("Hand:"))
  assert.ok(!alone.includes("data-pluma-over"), "a released pen is one silhouette")
  assert.ok(!alone.includes(`stroke="${color.card}"`))
  assert.ok(!alone.includes(color.accent))
  // The default nib points down-left of the grip, past the thumb.
  const d = plumaNib({ x: 0, y: 0 })
  assert.ok(d.x < 0 && d.y > 0)
})
