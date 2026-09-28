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
const { color, stroke } = await import("../registry/jbm/lib/tokens.ts")
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
  // Each piece keeps its anchor and anchor tangent; a limp end's anchor handle is shorter, so
  // it falls away from its pin instead of arching; its free tip hangs lowest.
  assert.ok(near(a[0], level.from) && near(b[3], level.to))
  assert.ok(a[1].y === taut.pieces[0][1].y && a[1].x < taut.pieces[0][1].x)
  assert.ok(b[2].y === taut.pieces[1][2].y && b[2].x > taut.pieces[1][2].x)
  for (const [piece, tip] of [[a, 1], [b, 0]]) {
    const ys = Array.from({ length: 21 }, (_, i) => cubicPoint(piece, i / 20).y)
    assert.ok(Math.abs(Math.max(...ys) - cubicPoint(piece, tip).y) < 1e-9, "the free tip is the lowest point")
  }
  assert.ok(a[3].y > level.from.y + 20 && b[0].y > level.to.y + 20, "the ends hang limp")
})

test("hilo frayed ends: two or three short tapered strands that tile the cut and continue the thread (#168)", () => {
  const level = { from: { x: 40, y: 100 }, to: { x: 460, y: 100 } }
  for (const notch of [false, true])
    for (const width of [2, 6])
      for (const [fray, count] of [[0.3, 2], [1, 3]]) {
        const g = hiloGeometry({ ...level, draw: 1, snapAt: 0, fray, notch, width })
        assert.equal(g.strands.length, 2 * count)
        const tips = [g.pieces[0][3], g.pieces[1][0]]
        for (const [b0, point, b1] of g.strands) {
          const tip = tips.reduce((m, t) => (Math.hypot(b0.x - t.x, b0.y - t.y) < Math.hypot(b0.x - m.x, b0.y - m.y) ? t : m))
          // The base lies on the square cut, within half the thread's width of the tip's centre.
          for (const b of [b0, b1]) assert.ok(Math.hypot(b.x - tip.x, b.y - tip.y) <= width / 2 + 1e-6, "base on the cut")
          const mid = { x: (b0.x + b1.x) / 2, y: (b0.y + b1.y) / 2 }
          const len = Math.hypot(point.x - mid.x, point.y - mid.y)
          assert.ok(len <= Math.max(3, 1.5 * width) + 1e-6, `strand ${len} no longer than 1.5 widths`)
          // Nearly along the thread (level here), drooping a few degrees at most, toward gravity.
          const angle = (Math.atan2(Math.abs(point.y - mid.y), Math.abs(point.x - mid.x)) * 180) / Math.PI
          assert.ok(angle <= 10, `strand turns ${angle}°`)
          assert.ok(point.y >= mid.y - 1e-6, "strands droop with gravity")
        }
        // Per end, the bases tile the cut exactly: together they span the thread's width.
        for (const end of [0, 1]) {
          const bases = g.strands.slice(end * count, end * count + count)
          const span = bases.reduce((a, [b0, , b1]) => a + Math.hypot(b1.x - b0.x, b1.y - b0.y), 0)
          assert.ok(Math.abs(span - width) < 1e-6, `end ${end}: bases span the cut`)
        }
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

test("hilo gap, fray, and notch: clean cut at fray 0; the notch tints each broken tip at the thread's width; vermilion only when notch", () => {
  const clean = hiloGeometry({ from, to, draw: 1, snapAt: 0, fray: 0 })
  assert.equal(clean.strands.length, 0)
  const frayed = hiloGeometry({ from, to, draw: 1, snapAt: 0, fray: 1, notch: true })
  assert.equal(frayed.strands.length, 6)
  // #168: the notch is no free capsule floating in the gap. It is two short tints, each the
  // exact end of a broken piece (same curve, same width), so the mark belongs to the ends.
  for (const width of [1.5, 2, 4, 6])
    for (const slack of [0, 0.35, 1])
      for (const breakAt of [0.05, 0.5, 0.95])
        for (const curve of ["s", "arc"]) {
          const g = hiloGeometry({ from, to, curve, bend: curve === "s" ? 0.5 : 0.3, draw: 1, snapAt: 0, fray: 1, notch: true, width, slack, breakAt })
          assert.equal(g.notch.length, 2, `tints at width ${width}, slack ${slack}, break ${breakAt}`)
          assert.ok(near(g.notch[0][3], g.pieces[0][3], 1e-6) && near(g.notch[1][0], g.pieces[1][0], 1e-6), "tints end at the tips")
          assert.ok(near(g.inked[0][3], g.notch[0][0], 1e-6) && near(g.inked[1][0], g.notch[1][3], 1e-6), "ink meets tint")
          for (const t of g.notch) {
            const len = Math.hypot(t[3].x - t[0].x, t[3].y - t[0].y)
            assert.ok(len <= Math.max(5, 3 * width) + 0.1, `tint ${len} is short`)
          }
        }
  // The gap is about a fifth of the thread and never more than 90 units.
  const gap = Math.hypot(
    frayed.pieces[1][0].x - frayed.pieces[0][3].x,
    frayed.pieces[1][0].y - frayed.pieces[0][3].y
  )
  assert.ok(gap > 30 && gap < 110, `gap ${gap}`)
  const markup = render(Hilo, { from, to, draw: 1, snapAt: 0, notch: true, width: 3 })
  assert.equal((markup.match(new RegExp(`stroke="${color.accent}" stroke-width="3"`, "g")) ?? []).length, 2)
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

test("hilo: a limp snapped arc droops, whichever way it bowed, and the far knot shows once reached (#168)", () => {
  for (const bend of [0.3, -0.3]) {
    const g = hiloGeometry({ from, to, curve: "arc", bend, draw: 1, snapAt: 0, slack: 1, fray: 1 })
    const [a, b] = g.pieces
    // Each free tip hangs lower than any point of the chord between its anchor and the tip.
    assert.ok(a[3].y > Math.max(from.y, cubicPoint(a, 0.5).y) - 1e-6, `bend ${bend}: first end droops`)
    assert.ok(b[0].y > Math.max(to.y, cubicPoint(b, 0.5).y) - 1e-6, `bend ${bend}: last end droops`)
  }
  // Tied: a thread laid to within a few widths of the far anchor is laid, and its knot shows.
  const near98 = hiloGeometry({ from, to, draw: 0.49, snapAt: 0.5 })
  assert.equal(near98.knots.length, 2)
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
    // The tag's height: a 14 × s line at 1.3, 6 × s padding above and below, and the shared
    // outline as its edge on both sides.
    const tagH = 14 * 1.3 * s + 12 * s + 2 * stroke.outline
    // Plus the 8 × s the tag settles up from while it drops in, so it never crosses the date.
    assert.ok(Math.abs(l.bounds.h - (l.h + tagH / 2 + 8 * s)) < 1e-9)
    assert.equal(l.bounds.w, l.w)
    assert.ok(l.tagX + l.tagMaxW <= l.w - l.pad + 1e-9, "the tag stops short of the right edge")
  }
  // The contract's declared stage covers the default print with its tag.
  const l = videoPrintLayout({ link: "x" })
  assert.ok(l.bounds.h <= 394 && l.bounds.h > 393)
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

test("PunchedTag: a luggage tag on one line, corners cut at the hole end, and no string (#161)", async () => {
  const { PunchedTag } = await import("../registry/jbm/ui/punched-tag.tsx")
  const long = render(PunchedTag, { children: "example.com/" + "a".repeat(200), maxWidth: 320 })
  for (const rule of ["white-space:nowrap", "overflow:hidden", "text-overflow:ellipsis", "max-width:320px"])
    assert.ok(long.includes(rule), rule)
  assert.ok(!long.includes("overflow-wrap"), "never wraps")
  // Two clip layers (edge, then stock) with 45° cuts at the hole end; the stock cut sits inside the edge.
  const cuts = [...long.matchAll(/clip-path:polygon\(([\d.]+)px 0/g)].map((m) => +m[1])
  assert.equal(cuts.length, 2)
  assert.ok(Math.abs(cuts[0] - 14) < 1e-9 && Math.abs(cuts[1] - (14 - stroke.outline * (2 - Math.SQRT2))) < 0.01)
  assert.ok(!/<svg|<path|string/i.test(long), "no string or loop: Hilo is the connector")
  // The label rule stays with a caller label style, and VideoPrint no longer repeats it.
  const styled = render(PunchedTag, { children: "x", labelStyle: { fontSize: 14 } })
  assert.ok(styled.includes("font-size:14px") && styled.includes("text-overflow:ellipsis"))
  const vp = render(VideoPrint, { title: "t", date: "d", scrub: 1, link: "x" })
  assert.equal((vp.match(/text-overflow:ellipsis/g) ?? []).length, 3, "title, date, and the tag label")
})
