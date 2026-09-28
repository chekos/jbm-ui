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
const { Pluma, plumaNib, plumaPoses } = await import("../registry/jbm/motion/pluma.tsx")
const { handOutline } = await import("../registry/jbm/ui/hand.tsx")
const { createHash } = await import("node:crypto")
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

test("hand pose list: seven poses, each with artwork and a label", () => {
  assert.deepEqual([...handPoses], ["open", "point", "pinch", "grip", "type", "hold", "write"])
  for (const pose of handPoses) {
    const markup = renderToStaticMarkup(h(Hand, { pose }))
    assert.ok(markup.includes(`aria-label="Hand: ${pose}"`), pose)
    assert.ok(pathsOf(markup).length >= (["grip", "type", "hold", "write"].includes(pose) ? 1 : 4), pose)
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

test("grip, type, hold, write: one ink path; interior lines are retraced spurs; every join is tangent", () => {
  // Deliberate corners: the wrist cut, type's thumb web, where hold's heel meets the little finger
  // (its underside, and the fingertip it leaves at a right angle), and hold's thumb web, where the
  // pocket edge ends on the thumb's underside (a T-junction; the crease carries the underside on).
  const corners = {
    grip: ["36.8,64.8", "54.1,60.1"],
    type: ["36.8,64.8", "54.1,60.1", "28.4,43.7"],
    hold: ["36.8,64.8", "54.1,60.1", "62.3,55", "57.6,51.8", "43,25.81"],
    // write: where the thumb's top side comes out from behind the index tip and the index's
    // underside leaves it (a T-junction of the two creases).
    write: ["36.8,64.8", "54.1,60.1", "27.498,17.962"],
  }
  for (const pose of ["grip", "type", "hold", "write"]) {
    const paths = pathsOf(renderToStaticMarkup(h(Hand, { pose })))
    assert.equal(paths.length, 1, `${pose}: the outline carries every interior line`)
    const [ink] = paths
    assert.notEqual(ink.fill, "none")
    const segs = segments(ink.d)
    assert.equal(segs.closed[0], true, `${pose}: the outline is closed`)
    // The outline is the whole path: no free strokes.
    assert.equal(segs.closed.length, 1, `${pose}: one subpath`)
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
  // The six approved poses (and pinch's Pluma) render byte for byte as before write was added (#173).
  const approved = {
    open: "c9bb98f16792b9b5",
    point: "ade88ed5654b72dd",
    pinch: "46e134469cc64539",
    grip: "c7bf177ec7bba2b4",
    type: "5934d934bbe29c61",
    hold: "5a086438caafab6c",
  }
  const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16)
  for (const [pose, want] of Object.entries(approved))
    assert.equal(
      hash(renderToStaticMarkup(h(Hand, { pose })) + renderToStaticMarkup(h(Hand, { pose, halo: true }))),
      want,
      `${pose} changed`
    )
  assert.equal(
    hash(renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 100, y: 90 }, angle: -20, size: 150 })))),
    "cea80c6cbfa96f4d",
    "pinch Pluma changed"
  )
})

test("write: the pose stays in the shared box, wrist cut at the bottom", () => {
  const { d, transform } = handOutline("write")
  assert.equal(transform, handOutline("open").transform)
  assert.ok(d.startsWith("M54.1 60.1 "), "starts at the shared wrist corner")
  assert.ok(d.endsWith(" L36.8 64.8 Z"), "closes along the shared wrist cut")
  // Every vertex inside the 30×29 box, half an outline clear of its edges.
  for (const p of vertices(d)) {
    const x = (p.x - 19) * 0.48 + 4, y = (p.y - 13) * 0.48 + 1
    assert.ok(x >= 0.25 && x <= 29.75 && y >= 0.25 && y <= 28.75, `${p.x},${p.y} leaves the box`)
  }
  assert.ok(handOutline("write").front, "write names the parts in front of a held pen")
  for (const pose of ["open", "point", "pinch", "grip", "type", "hold"]) assert.equal(handOutline(pose).front, undefined)
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

/** Sample an absolute path (M L C A Z; arcs with rx = ry) into polylines, one per subpath. */
function sample(d, step = 0.04) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g)
  const subs = []
  let i = 0, cmd, x = 0, y = 0, sx = 0, sy = 0, cur
  const n = () => parseFloat(toks[i++])
  const line = (bx, by) => {
    const k = Math.max(1, Math.ceil(Math.hypot(bx - x, by - y) / step))
    for (let j = 1; j <= k; j++) cur.push([x + ((bx - x) * j) / k, y + ((by - y) * j) / k])
  }
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    if (cmd === "Z") { line(sx, sy); x = sx; y = sy; continue }
    if (cmd === "M") { x = sx = n(); y = sy = n(); cur = [[x, y]]; subs.push(cur); continue }
    if (cmd === "L") { const [bx, by] = [n(), n()]; line(bx, by); x = bx; y = by }
    else if (cmd === "C") {
      const c = [n(), n(), n(), n(), n(), n()]
      const k = 200
      for (let j = 1; j <= k; j++) {
        const t = j / k, u = 1 - t
        cur.push([
          u * u * u * x + 3 * u * u * t * c[0] + 3 * u * t * t * c[2] + t * t * t * c[4],
          u * u * u * y + 3 * u * u * t * c[1] + 3 * u * t * t * c[3] + t * t * t * c[5],
        ])
      }
      x = c[4]; y = c[5]
    } else if (cmd === "A") {
      const [r0, , , fa, fs, bx, by] = [n(), n(), n(), n(), n(), n(), n()]
      const dx = (x - bx) / 2, dy = (y - by) / 2, d2 = dx * dx + dy * dy
      const r = Math.max(r0, Math.sqrt(d2))
      const k = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, (r * r - d2) / d2))
      const cx = k * dy + (x + bx) / 2, cy = -k * dx + (y + by) / 2
      let a0 = Math.atan2(y - cy, x - cx), a1 = Math.atan2(by - cy, bx - cx)
      let da = a1 - a0
      if (fs && da < 0) da += 2 * Math.PI
      if (!fs && da > 0) da -= 2 * Math.PI
      const m = Math.max(1, Math.ceil((Math.abs(da) * r) / step))
      for (let j = 1; j <= m; j++) cur.push([cx + r * Math.cos(a0 + (da * j) / m), cy + r * Math.sin(a0 + (da * j) / m)])
      x = bx; y = by
    } else throw new Error(`command ${cmd}`)
  }
  return subs
}
const inside = (poly, [px, py]) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const nearest = (pts, [px, py]) => Math.min(...pts.map(([x, y]) => Math.hypot(x - px, y - py)))
/** The Pluma's transforms from its markup: the pen frame and the hand's rotation. */
const frames = (markup) => {
  const [, tx, ty, pen] = markup.match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)" data-pluma-nib/).map(Number)
  const hand = Number(markup.match(/<g transform="translate\([-\d.]+ [-\d.]+\) rotate\(([-\d.]+)\)"><g transform="translate\(/)[1])
  return { tx, ty, pen, hand }
}

test("pluma write: plumaNib is the drawn nib at every angle, size, and offset; the hand turns with the pen", () => {
  assert.deepEqual([...plumaPoses], ["pinch", "write"])
  const at = { x: 321, y: 207 }
  let rel
  for (const size of [48, 150, 180, 260])
    for (const angle of [-90, -45, -20, 0, 20, 45, 90])
      for (const nibOffset of [undefined, { x: -30, y: 80 }, { x: -80, y: 20 }]) {
        const markup = renderToStaticMarkup(h("svg", null, h(Pluma, { at, angle, size, nibOffset, pose: "write" })))
        assert.ok(markup.includes("Hand: write"))
        const [, tx, ty, rot, len] = markup
          .match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)" data-pluma-nib="([-\d.]+)"/)
          .map(Number)
        const r = (rot * Math.PI) / 180
        const nib = plumaNib(at, angle, nibOffset, size, "write")
        assert.ok(close(tx + len * Math.cos(r), nib.x, 0.05) && close(ty + len * Math.sin(r), nib.y, 0.05), `${size} ${angle}`)
        // The hand keeps one pose relative to the pen whatever the rotation or offset, so the
        // layering checked below holds at every angle.
        const f = frames(markup)
        let d = f.pen - f.hand
        while (d > 180) d -= 360
        while (d < -180) d += 360
        rel ??= d
        assert.ok(close(d, rel, 0.02), `hand turns with the pen at ${angle} ${JSON.stringify(nibOffset)}`)
      }
  // Pinch stays the default grip, and write's default nib points left of the grip, into the writing.
  assert.deepEqual(plumaNib({ x: 0, y: 0 }), plumaNib({ x: 0, y: 0 }, 0, undefined, 180, "pinch"))
  const d = plumaNib({ x: 0, y: 0 }, 0, undefined, 180, "write")
  assert.ok(d.x < 0)
})

test("pluma write: the pen lies over the hand and under the thumb and index; nothing pierces a finger", () => {
  const held = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 100, y: 100 }, pose: "write" })))
  // Order: card refill of the cut (inside the hand only), the hand with its ink cut along the pen,
  // then the pen, masked by the hand's front (thumb and index) plus a half-outline gap.
  const refill = held.indexOf('mask="url(#pluma-fill-')
  const cut = held.indexOf('mask="url(#pluma-cut-')
  const hand = held.indexOf("Hand: write")
  const pen = held.indexOf("data-pluma-nib")
  assert.ok(refill >= 0 && refill < cut && cut < hand && hand < pen, "refill, cut hand, then the pen on top")
  assert.ok(held.slice(refill, cut).includes(`stroke="${color.card}"`))
  assert.equal((held.match(/fill="#20241F"/g) ?? []).length, 1, "one pen silhouette")
  const penMask = held.slice(held.indexOf('<mask id="pluma-'), held.indexOf("</mask>"))
  const front = handOutline("write").front.split(/(?=M)/)
  for (const d of front) assert.ok(penMask.includes(`d="${d.trim()}"`), "the pen mask cuts every front part")
  // Geometry, in the pose's path units: wherever the front's edge crosses the pen's body, that edge
  // is the hand's own ink (a fingertip or a crease), so the pen always stops at a drawn contour
  // and never ends in the middle of a finger or shows through one.
  const s = 1 / 0.48
  const toPath = (p) => [(p.x - 4) * s + 19, (p.y - 1) * s + 13]
  const g = plumaNib({ x: 0, y: 0 }, 0, undefined, 30, "write") // nib − grip, viewBox units
  const markup = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 0, y: 0 }, size: 30, pose: "write" })))
  const anchor = markup.match(/<g transform="translate\(([-\d.]+) ([-\d.]+)\)"><svg/).slice(1).map((v) => -Number(v))
  const G = toPath({ x: anchor[0], y: anchor[1] }) // the grip point
  const len = Math.hypot(g.x, g.y) * s
  const u = [-g.x / Math.hypot(g.x, g.y), -g.y / Math.hypot(g.x, g.y)] // grip → tail
  const half = (2.6 / 2) * s, cone = 3.6 * s, tail = 22.5 * s
  const inPen = ([x, y]) => {
    const dx = x - G[0], dy = y - G[1]
    const along = dx * u[0] + dy * u[1] // + toward the tail, −len at the nib
    const across = Math.abs(-dx * u[1] + dy * u[0])
    if (along > tail || along < -len) return false
    const w = along < -len + cone ? (half * (along + len)) / cone : half
    return across < w - 0.05
  }
  const ink = sample(handOutline("write").d).flat()
  const parts = front.map((d) => sample(d)[0])
  let crossings = 0
  parts.forEach((poly, i) => {
    for (const p of poly) {
      if (!inPen(p)) continue
      if (parts.some((q, j) => j !== i && inside(q, p) && nearest(q, p) > 0.05)) continue
      crossings++
      assert.ok(nearest(ink, p) < 0.1, `front edge at ${p.map((v) => v.toFixed(2))} crosses the pen off the hand's ink`)
    }
  })
  assert.ok(crossings > 50, "the thumb and index do cross the pen")
  // A released pen is one silhouette in either pose.
  const alone = renderToStaticMarkup(h("svg", null, h(Pluma, { at: { x: 0, y: 0 }, hand: false, pose: "write" })))
  assert.ok(!alone.includes("Hand:") && !alone.includes("<mask"))
})
