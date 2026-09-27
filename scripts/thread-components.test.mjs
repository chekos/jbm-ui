import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import {
  readFileSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, resolve, join } from "node:path"
import { tmpdir } from "node:os"
import { execFileSync } from "node:child_process"
import ts from "typescript"

// Hilo (#141) and VideoPrint (#148): geometry invariants the Doorways scenes rely on.
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

const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")
const { Hilo, hiloGeometry, cubicPoint } = await import(
  "../registry/jbm/ui/hilo.tsx"
)
const { VideoPrint, videoPrintLayout } = await import(
  "../registry/jbm/ui/video-print.tsx"
)
const { color } = await import("../registry/jbm/lib/tokens.ts")
const render = (C, props) => renderToStaticMarkup(React.createElement(C, props))
const near = (a, b, eps = 1e-6) =>
  Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps

const from = { x: 40, y: 90 },
  to = { x: 460, y: 170 }
const grid = []
for (const curve of ["arc", "s"])
  for (const bend of [-0.5, 0, 0.5, 1])
    for (const slack of [0, 0.5, 1])
      for (const fray of [0, 0.6, 1])
        for (const breakAt of [0.05, 0.4, 0.95])
          grid.push({ from, to, curve, bend, slack, fray, breakAt })

test("hilo ends stay pinned to from and to while laid, snapping, and snapped", () => {
  for (const props of grid)
    for (const draw of [0.01, 0.3, 0.5, 0.51, 0.75, 1]) {
      const g = hiloGeometry({ ...props, draw, snapAt: 0.5, notch: true })
      assert.ok(g.pieces.length >= 1)
      assert.ok(near(g.pieces[0][0], from), "first piece starts at from")
      if (g.lay >= 1)
        assert.ok(near(g.pieces.at(-1)[3], to), "last piece ends at to")
      if (g.snapped) {
        assert.equal(g.pieces.length, 2)
        // Anchor tangents never move: hanging and curling only move the free end.
        const sameDirection = (anchor, handle, reference) => {
          const a = { x: handle.x - anchor.x, y: handle.y - anchor.y },
            b = { x: reference.x - anchor.x, y: reference.y - anchor.y }
          return (
            Math.abs(a.x * b.y - a.y * b.x) < 1e-6 && a.x * b.x + a.y * b.y >= -1e-9
          )
        }
        assert.ok(sameDirection(from, g.pieces[0][1], g.base[1]))
        assert.ok(sameDirection(to, g.pieces[1][2], g.base[2]))
      }
    }
})

test("hilo lays by arc length, knots follow the tied ends, and snapping starts from the tied curve", () => {
  const half = hiloGeometry({ from, to, bend: 0.3, draw: 0.5 })
  assert.equal(half.pieces.length, 1)
  const tip = half.pieces[0][3]
  // The tip of a half-laid thread sits halfway along the arc: compare path lengths by sampling.
  const arc = (c, n = 400) => {
    let len = 0,
      prev = c[0]
    for (let i = 1; i <= n; i++) {
      const p = cubicPoint(c, i / n)
      len += Math.hypot(p.x - prev.x, p.y - prev.y)
      prev = p
    }
    return len
  }
  assert.ok(Math.abs(arc(half.pieces[0]) / half.length - 0.5) < 0.01)
  assert.ok(!near(tip, to))
  assert.deepEqual(half.knots, [from])
  assert.deepEqual(hiloGeometry({ from, to, draw: 1 }).knots, [from, to])
  assert.deepEqual(hiloGeometry({ from, to, draw: 1, knots: false }).knots, [])
  assert.equal(hiloGeometry({ from, to, draw: 0 }).pieces.length, 0)
  // At the snap moment the two pieces meet exactly where the tied thread was.
  const tied = hiloGeometry({ from, to, bend: 0.3, slack: 0.4, draw: 0.5, snapAt: 0.5 })
  const justAfter = hiloGeometry({ from, to, bend: 0.3, slack: 0.4, draw: 0.5001, snapAt: 0.5 })
  assert.equal(tied.snapped, false)
  assert.equal(justAfter.snapped, true)
  assert.ok(near(justAfter.pieces[0][3], justAfter.pieces[1][0], 0.5))
  assert.ok(near(cubicPoint(tied.base, 0.5), cubicPoint(justAfter.base, 0.5), 0.5))
})

test("hilo after a snap: the route's sag hands over to two ends hanging from their anchors", () => {
  const level = { from: { x: 40, y: 100 }, to: { x: 460, y: 100 } }
  const taut = hiloGeometry({ ...level, draw: 1, snapAt: 0, slack: 0 })
  const limp = hiloGeometry({ ...level, draw: 1, snapAt: 0, slack: 1 })
  // Fully snapped, slack no longer sags the route itself.
  for (let i = 0; i < 4; i++) assert.ok(near(limp.base[i], taut.base[i], 1e-9))
  const [a, b] = limp.pieces
  // Each piece keeps its anchor and its anchor tangent; its free tip hangs lowest.
  assert.ok(near(a[0], level.from) && near(b[3], level.to))
  assert.ok(near(a[1], taut.pieces[0][1], 1e-9) && near(b[2], taut.pieces[1][2], 1e-9))
  for (const [piece, tip] of [[a, 1], [b, 0]]) {
    const ys = Array.from({ length: 21 }, (_, i) => cubicPoint(piece, i / 20).y)
    assert.ok(Math.abs(Math.max(...ys) - cubicPoint(piece, tip).y) < 1e-9, "the free tip is the lowest point")
  }
  assert.ok(a[3].y > level.from.y + 20 && b[0].y > level.to.y + 20, "the ends hang limp")
})

test("hilo fibers all fall to one side of the thread, never a symmetric fan", () => {
  const level = { from: { x: 40, y: 100 }, to: { x: 460, y: 100 } }
  for (const notch of [false, true])
    for (const width of [2, 6]) {
      const g = hiloGeometry({ ...level, draw: 1, snapAt: 0, fray: 1, notch, width })
      assert.equal(g.strands.length, 10)
      for (const [root, , end] of g.strands) assert.ok(end.y >= root.y - 1e-6, "fibers curl down, with gravity")
    }
})

test("hilo snapAt 0 starts laid and draw drives only the snap; no snapAt never snaps", () => {
  const start = hiloGeometry({ from, to, draw: 0, snapAt: 0 })
  assert.equal(start.lay, 1)
  assert.equal(start.snapped, false)
  assert.equal(hiloGeometry({ from, to, draw: 1, snapAt: 0 }).recoil, 1)
  assert.equal(hiloGeometry({ from, to, draw: 1 }).snapped, false)
  assert.equal(hiloGeometry({ from, to, draw: 1, snapAt: 1 }).snapped, false)
})

test("hilo gap, fray, and notch: clean cut at fray 0, the notch marks the gap without bridging it, vermilion only when notch", () => {
  const clean = hiloGeometry({ from, to, draw: 1, snapAt: 0, fray: 0 })
  assert.equal(clean.strands.length, 0)
  const frayed = hiloGeometry({ from, to, draw: 1, snapAt: 0, fray: 1, notch: true })
  assert.equal(frayed.strands.length, 10)
  // The notch is a straight bar strictly between the tips, with open paper between it and
  // every tip and fiber (#168: a notch that touches the ends reads as an intact thread).
  // Edge to edge: the notch's half width and each ink stroke's half width come off the distance.
  const clearance = (g) => {
    let min = Infinity
    const ink = [
      ...[g.pieces[0], g.pieces[1]].flatMap((c) =>
        Array.from({ length: 81 }, (_, i) => ({ p: cubicPoint(c, i / 80), r: g.width / 2 }))
      ),
      ...g.strands.flatMap(([a, q, b]) =>
        Array.from({ length: 21 }, (_, i) => {
          const t = i / 20
          return {
            p: {
              x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * q.x + t * t * b.x,
              y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * q.y + t * t * b.y,
            },
            r: g.strandWidth / 2,
          }
        })
      ),
    ]
    for (let i = 0; i <= 40; i++) {
      const p = cubicPoint(g.notch, i / 40)
      for (const { p: q, r } of ink)
        min = Math.min(min, Math.hypot(p.x - q.x, p.y - q.y) - r - g.notchWidth / 2)
    }
    return min
  }
  for (const width of [1, 2, 4, 6])
    for (const slack of [0, 0.35, 1])
      for (const breakAt of [0.05, 0.5, 0.95])
        for (const curve of ["s", "arc"]) {
          const g = hiloGeometry({ from, to, curve, bend: curve === "s" ? 0.5 : 0.3, draw: 1, snapAt: 0, fray: 1, notch: true, width, slack, breakAt })
          assert.ok(g.notch, `notch drawn at width ${width}, slack ${slack}, break ${breakAt}`)
          const [p0, p1, p2, p3] = g.notch
          const cross = (u, v) => (u.x - p0.x) * (v.y - p0.y) - (u.y - p0.y) * (v.x - p0.x)
          assert.ok(Math.abs(cross(p1, p3)) < 1e-6 && Math.abs(cross(p2, p3)) < 1e-6, "the notch is straight")
          assert.ok(
            clearance(g) >= 2,
            `open paper around the notch at width ${width}, slack ${slack}, break ${breakAt}: ${clearance(g)}`
          )
        }
  // The gap is about a fifth of the thread and never more than 90 units.
  const gap = Math.hypot(
    frayed.pieces[1][0].x - frayed.pieces[0][3].x,
    frayed.pieces[1][0].y - frayed.pieces[0][3].y
  )
  assert.ok(gap > 30 && gap < 110, `gap ${gap}`)
  // Fibers peel off within a few widths of a tip and reach past it.
  const tips = [frayed.pieces[0][3], frayed.pieces[1][0]]
  const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y)
  for (const [a, , b] of frayed.strands) {
    const tip = dist(a, tips[0]) < dist(a, tips[1]) ? tips[0] : tips[1]
    assert.ok(dist(a, tip) <= 3 * frayed.width + 0.5)
    assert.ok(dist(b, tip) > frayed.width)
  }
  const markup = render(Hilo, { from, to, draw: 1, snapAt: 0, notch: true })
  assert.equal(markup.split(color.accent).length - 1, 1)
  for (const props of [
    { from, to, draw: 1 },
    { from, to, draw: 1, snapAt: 0 },
    { from, to, draw: 0.2, snapAt: 0.5, notch: true },
  ])
    assert.ok(!render(Hilo, props).includes(color.accent))
})

test("hilo S curves never hook back around their anchors, at any bend or width (#168)", () => {
  for (const bend of [-1, -0.5, 0, 0.5, 1, 1.5])
    for (const width of [1, 6])
      for (const slack of [0, 1]) {
        const g = hiloGeometry({ from, to, curve: "s", bend, width, slack, draw: 1 })
        let prev = -Infinity
        for (let i = 0; i <= 200; i++) {
          const x = cubicPoint(g.base, i / 200).x
          assert.ok(x >= prev - 1e-9, `bend ${bend}: x runs from \`from\` to \`to\` without turning back`)
          prev = x
        }
      }
})

test("hilo fibers are fine strands out of the cut, not legs along the thread (#168)", () => {
  for (const width of [1, 2, 6]) {
    const g = hiloGeometry({ from, to, draw: 1, snapAt: 0, fray: 1, width })
    assert.ok(g.strandWidth <= Math.max(0.75, 0.4 * width) + 1e-9)
    const tips = [g.pieces[0][3], g.pieces[1][0]]
    for (const [root] of g.strands) {
      const d = Math.min(...tips.map((t) => Math.hypot(root.x - t.x, root.y - t.y)))
      assert.ok(d <= 0.8 * width, "every fiber leaves the cut itself")
    }
  }
})

test("hilo is deterministic and never renders NaN", () => {
  const props = { from, to, curve: "s", bend: 0.5, draw: 0.8, snapAt: 0.5, fray: 0.7, slack: 0.6, notch: true }
  assert.equal(render(Hilo, props), render(Hilo, { ...props }))
  for (const bad of [
    { from, to, draw: NaN, snapAt: NaN, slack: NaN, fray: NaN, bend: NaN, width: NaN },
    { from, to: from, draw: 1, snapAt: 0, notch: true },
    { from: { x: NaN, y: 0 }, to, draw: 1 },
    { from, to, draw: 1, snapAt: 0, breakAt: -3, width: -1 },
  ])
    assert.ok(!render(Hilo, bad).includes("NaN"))
})

test("video print marks sit on the scrub rule and ink only once the bar reaches them", () => {
  const marks = [0, 0.3, 0.62, 1]
  for (const w of [300, 480, 720]) {
    const l = videoPrintLayout({ w, marks })
    assert.ok(Math.abs(l.h / w - 0.765) < 0.001)
    assert.ok(Math.abs(l.frame.h / l.frame.w - 9 / 16) < 1e-9)
    l.marks.forEach((m, i) => {
      assert.equal(m.y, l.rule.y)
      assert.ok(Math.abs(m.x - (l.rule.x + marks[i] * l.rule.w)) < 1e-9)
    })
    const at = { x: 100, y: 40 }
    const shifted = videoPrintLayout({ w, marks, link: "x.co" }, at)
    shifted.marks.forEach((m, i) => assert.ok(near(m, { x: l.marks[i].x + 100, y: l.marks[i].y + 40 })))
    assert.equal(shifted.tag.y, at.y + shifted.h)
  }
  assert.equal(videoPrintLayout({}).tag, null)
  const base = { title: "Sample talk", date: "Video · 4 nov 2025", marks }
  const count = (scrub) =>
    (render(VideoPrint, { ...base, scrub }).match(/data-mark=/g) ?? []).length
  assert.equal(count(0), 0)
  assert.equal(count(0.3), 2)
  assert.equal(count(0.61), 2)
  assert.equal(count(1), 4)
  assert.ok(!render(VideoPrint, { ...base, scrub: 0 }).includes("data-scrub"))
  assert.ok(!render(VideoPrint, { ...base, scrub: NaN, w: NaN }).includes("NaN"))
})

test("video print composes Paper and PunchedTag, shows the link only when opened, and adds no vermilion", () => {
  const base = { title: "Sample talk", date: "Video · 4 nov 2025", scrub: 1 }
  const link = "example.com/watch?v=sample-talk"
  assert.ok(render(VideoPrint, { ...base, link }).includes(link))
  assert.ok(!render(VideoPrint, { ...base, link, opened: 0 }).includes(link))
  assert.ok(!render(VideoPrint, base).includes("example.com"))
  for (const props of [base, { ...base, link }])
    assert.ok(!render(VideoPrint, props).includes(color.accent))
  assert.ok(render(VideoPrint, base).includes(color.card))
  assert.ok(!render(VideoPrint, { ...base, sheet: false }).includes(color.card))
})

test("hilo and video-print typecheck with only their own published dependencies", () => {
  const temp = mkdtempSync(join(tmpdir(), "jbm-thread-contract-"))
  try {
    for (const name of ["hilo", "video-print"]) {
      const seen = new Set()
      function install(itemName) {
        if (seen.has(itemName)) return
        seen.add(itemName)
        const item = JSON.parse(
          readFileSync(join(root, "public/r", itemName + ".json"), "utf8")
        )
        for (const dep of item.registryDependencies ?? [])
          install(dep.replace("@jbm/", ""))
        for (const file of item.files) {
          const target = join(temp, name, file.target)
          mkdirSync(dirname(target), { recursive: true })
          writeFileSync(target, file.content)
        }
      }
      install(name)
    }
    symlinkSync(join(root, "node_modules"), join(temp, "node_modules"), "dir")
    writeFileSync(
      join(temp, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2022",
          module: "Preserve",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          noUnusedLocals: true,
          skipLibCheck: true,
        },
        include: ["**/*.ts", "**/*.tsx"],
      })
    )
    execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", temp], {
      encoding: "utf8",
    })
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})

test("video print: declared bounds hold the link tag, the tag never passes the sheet, and the still tint ignores the sheet (#168)", () => {
  for (const w of [276, 300, 480, 720]) {
    const bare = videoPrintLayout({ w })
    assert.equal(bare.bounds.h, bare.h, "no link, no overhang")
    const l = videoPrintLayout({ w, link: "x" })
    const s = w / 480
    // The tag's height: a 14 × s line at 1.3, 6 × s padding above and below, and a 2px edge.
    const tagH = 14 * 1.3 * s + 12 * s + 4
    assert.ok(Math.abs(l.bounds.h - (l.h + tagH / 2)) < 1e-9)
    assert.equal(l.bounds.w, l.w)
    assert.ok(l.tagX + l.tagMaxW <= l.w - l.pad + 1e-9, "the tag stops short of the right edge")
  }
  // The contract's declared stage covers the default print with its tag.
  const l = videoPrintLayout({ link: "x" })
  assert.ok(l.bounds.h <= 385 && l.bounds.h > 384)
  const long = render(VideoPrint, {
    title: "Sample talk",
    date: "Video · 4 nov 2025",
    scrub: 1,
    link: "example.com/" + "a".repeat(200),
  })
  assert.ok(long.includes("text-overflow:ellipsis"))
  assert.ok(long.includes(`max-width:${Math.round(l.tagMaxW * 100) / 100}px`))
  // The still is one opaque fill, the same with or without the sheet.
  const fill = (markup) => markup.match(/<rect[^>]*fill="(#[0-9a-f]{6})"[^>]*>/i)?.[1]
  const withSheet = render(VideoPrint, { title: "t", date: "d", scrub: 0 })
  const without = render(VideoPrint, { title: "t", date: "d", scrub: 0, sheet: false })
  assert.equal(fill(withSheet), fill(without))
  assert.ok(!withSheet.includes("fill-opacity"))
})
