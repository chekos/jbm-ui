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

// Writing registers (#142) and the slip (#143): geometry the sheet draws is the geometry hosts
// attach threads, tears, and slips to, so these invariants are what later components rely on.
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

const {
  Register,
  RegisterInk,
  registerLayout,
  registerAnchors,
  registerSeams,
  registerGap,
} = await import("../registry/jbm/ui/register.tsx")
const { Slip, slipPoint, slipGrip } = await import("../registry/jbm/ui/slip.tsx")
const { color } = await import("../registry/jbm/lib/tokens.ts")
const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")
const h = React.createElement

const EPS = 1e-6
const sizes = [
  { w: 300, h: 380 },
  { w: 440, h: 280 },
  { w: 180, h: 520 },
]
const inside = (box, l, label) => {
  const pad = l.scale * 20 - 2 * l.scale // allows a chevron's stroke to sit on the pad line
  assert.ok(box.x >= pad - EPS, `${label}: left ${box.x}`)
  assert.ok(box.y >= pad - EPS, `${label}: top ${box.y}`)
  assert.ok(box.x + box.w <= l.w - pad + EPS, `${label}: right ${box.x + box.w}`)
  assert.ok(box.y + box.h <= l.h - pad + EPS, `${label}: bottom ${box.y + box.h}`)
}

test("each register draws exactly n units and keeps every cell on the sheet", () => {
  for (const size of sizes)
    for (const kind of ["mono", "plain", "grid"])
      for (let n = 1; n <= (kind === "grid" ? 12 : 24); n++) {
        const l = registerLayout({ kind, n, ...size })
        assert.equal(l.cells.length, n, `${kind} ${n}`)
        assert.deepEqual(l.cells.map((c) => c.index), [...Array(n).keys()])
        for (const c of l.cells) inside(c.box, l, `${kind} n=${n} ${size.w}×${size.h}`)
      }
})

test("prose exposes one anchor per source tick, inside its tick, top to bottom", () => {
  for (const size of sizes)
    for (let n = 0; n <= 16; n++) {
      const spec = { kind: "prose", n, ...size }
      const l = registerLayout(spec)
      const ticks = l.cells.filter((c) => c.kind === "source")
      assert.equal(ticks.length, n)
      assert.deepEqual(registerAnchors(spec), l.anchors)
      assert.equal(l.anchors.length, n)
      ticks.forEach((c, i) => {
        const tick = c.marks[0]
        assert.ok(c.anchor.x > tick.x && c.anchor.x < tick.x + tick.w)
        assert.ok(c.anchor.y > tick.y && c.anchor.y < tick.y + tick.h)
        if (i) assert.ok(c.anchor.y > ticks[i - 1].anchor.y)
      })
      assert.ok(l.cells.filter((c) => c.kind === "prose").length >= 2)
      for (const c of l.cells) inside(c.box, l, `prose n=${n}`)
    }
  // `sources` overrides n
  assert.equal(registerAnchors({ kind: "prose", n: 8, sources: 3, w: 300, h: 380 }).length, 3)
})

test("mixed pages stack bands with seams strictly between them", () => {
  for (let n = 1; n <= 4; n++) {
    const spec = { kind: "mixed", n, w: 380, h: 840 }
    const l = registerLayout(spec)
    assert.equal(l.bands.length, n)
    assert.deepEqual(registerSeams(spec), l.seams)
    assert.equal(l.seams.length, n - 1)
    l.seams.forEach((y, i) => {
      assert.ok(l.bands[i].y + l.bands[i].h < y, "seam below the band above")
      assert.ok(y < l.bands[i + 1].y, "seam above the band below")
    })
    for (const c of l.cells) {
      const b = l.bands[c.band]
      assert.ok(c.box.y >= b.y - EPS && c.box.y + c.box.h <= b.y + b.h + EPS, "cell stays in its band")
    }
  }
  // The default page carries the board's four registers, with prose anchors in the last band.
  const page = registerLayout({ kind: "mixed", w: 380, h: 840 })
  assert.deepEqual([...new Set(page.cells.map((c) => c.kind))], ["mono", "plain", "grid", "prose", "source"])
  assert.equal(page.anchors.length, 3)
  assert.equal(registerLayout({ kind: "mixed", w: 380, h: 840, sources: 5 }).anchors.length, 5)
  // Single registers have no seams.
  assert.deepEqual(registerSeams({ kind: "prose", w: 300, h: 380 }), [])
})

test("reflow moves writing around the gap without resizing any mark", () => {
  const cases = [
    { kind: "mono", n: 6, gapAt: 3 },
    { kind: "plain", n: 10, gapAt: 2 },
    { kind: "grid", n: 7, gapAt: 1 },
    { kind: "prose", n: 3, gapAt: 4 },
    { kind: "mixed", gapAt: 2 },
    { kind: "mono", n: 2, gapAt: 1 },
  ]
  for (const c of cases) {
    const spec = { ...c, w: 250, h: 300, gap: 66 }
    const at = (reflow) => registerLayout({ ...spec, reflow })
    const open = at(1),
      closed = at(0),
      half = at(0.5)
    assert.equal(closed.gap.h, 0)
    assert.ok(Math.abs(open.gap.h - 66) < EPS)
    assert.ok(Math.abs(half.gap.h - 33) < EPS)
    assert.deepEqual(registerGap({ ...spec, reflow: 1 }), open.gap)
    for (const l of [open, half, closed]) {
      assert.equal(l.cells.length, open.cells.length)
      l.cells.forEach((cell, i) => {
        const ref = open.cells[i]
        assert.ok(Math.abs(cell.box.w - ref.box.w) < EPS, `${c.kind}: width kept`)
        assert.ok(Math.abs(cell.box.h - ref.box.h) < EPS, `${c.kind}: height kept`)
        const slot = c.kind === "mixed" ? cell.band : cell.row
        if (slot >= c.gapAt) assert.ok(cell.box.y >= l.gap.y + l.gap.h - EPS, `${c.kind}: below the gap`)
        else assert.ok(cell.box.y + cell.box.h <= l.gap.y + EPS, `${c.kind}: above the gap`)
        inside(cell.box, l, `${c.kind} reflow`)
      })
    }
  }
  assert.equal(registerGap({ kind: "mono", w: 250, h: 300 }), null)
})

test("a few rows keep their natural size instead of filling the sheet", () => {
  const one = registerLayout({ kind: "mono", n: 1, w: 300, h: 380 })
  const seven = registerLayout({ kind: "mono", n: 7, w: 300, h: 380 })
  assert.ok(Math.abs(one.cells[0].box.h - seven.cells[0].box.h) < one.scale * 12)
  const table = registerLayout({ kind: "grid", n: 1, w: 300, h: 380 }).cells[0]
  assert.ok(table.box.h < 100, "one table stays table-sized")
})

test("reveal inks cells in reading order and accent touches only the listed cell", () => {
  const spec = { kind: "mono", n: 4, w: 300, h: 380 }
  const svg = (props) => renderToStaticMarkup(h("svg", null, h(RegisterInk, { ...spec, ...props })))
  assert.doesNotMatch(svg({ reveal: 0 }), /<rect|<path/)
  assert.equal(svg({ reveal: 0.5 }), svg({ reveal: 0.5 }), "deterministic")
  assert.equal((svg({ reveal: 0.5 }).match(/<path/g) ?? []).length, 2, "two chevrons at half")
  assert.equal((svg({ reveal: 1 }).match(/<path/g) ?? []).length, 4)
  assert.match(svg({ reveal: 0.6 }), /clip-path/)
  assert.doesNotMatch(svg({ reveal: 1 }), /clip-path/)
  assert.doesNotMatch(svg({}), new RegExp(color.accent))
  assert.equal((svg({ accent: [2] }).match(new RegExp(color.accent, "g")) ?? []).length, 1)
  const page = renderToStaticMarkup(h(Register, { kind: "prose", w: 300, h: 380 }))
  assert.match(page, /aria-label="Page of prose writing"/)
  for (const file of ["register", "slip"])
    assert.doesNotMatch(readFileSync(join(root, `registry/jbm/ui/${file}.tsx`), "utf8"), /remotion/)
})

test("the slip's grip and points follow offset, lift, and rotation", () => {
  const base = { w: 200, h: 60, rotate: 0 }
  assert.deepEqual(slipGrip(base), { x: 100, y: 60 })
  assert.deepEqual(slipGrip(base, "top"), { x: 100, y: 0 })
  const moved = slipGrip({ ...base, offset: { x: 40, y: -20 } })
  assert.deepEqual(moved, { x: 140, y: 40 })
  // Lift rises by 10 × scale and scales about the centre; the centre only rises.
  const c = slipPoint({ ...base, lift: 1, scale: 2 }, { x: 100, y: 30 })
  assert.ok(Math.abs(c.x - 100) < EPS && Math.abs(c.y - 10) < EPS)
  // The grip stays on the slip's bottom edge at every lift and rotation.
  for (const lift of [0, 0.25, 0.5, 1])
    for (const rotate of [-8, -2, 0, 5]) {
      const p = { ...base, lift, rotate }
      const a = slipPoint(p, { x: 0, y: 60 })
      const b = slipPoint(p, { x: 200, y: 60 })
      const g = slipGrip(p)
      assert.ok(Math.abs(g.x - (a.x + b.x) / 2) < EPS && Math.abs(g.y - (a.y + b.y) / 2) < EPS)
    }
  const flat = renderToStaticMarkup(h(Slip, {}))
  const peeled = renderToStaticMarkup(h(Slip, { lift: 1 }))
  assert.match(flat, /rotate\(0 /, "flap flat at rest")
  assert.match(peeled, /rotate\(-38 /, "flap peeled when held")
  assert.doesNotMatch(renderToStaticMarkup(h(Slip, { tape: false })), new RegExp(color.line))
  assert.match(renderToStaticMarkup(h(Slip, { dashed: true })), /stroke-dasharray/)
  assert.doesNotMatch(flat, new RegExp(color.accent))
})

test("register and slip typecheck with only their own published dependencies", () => {
  const temp = mkdtempSync(join(tmpdir(), "jbm-register-"))
  try {
    for (const name of ["register", "slip"]) {
      const seen = new Set()
      const install = (itemName) => {
        if (seen.has(itemName)) return
        seen.add(itemName)
        const item = JSON.parse(readFileSync(join(root, "public/r", itemName + ".json"), "utf8"))
        for (const dep of item.registryDependencies ?? []) install(dep.replace("@jbm/", ""))
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
    execFileSync(join(root, "node_modules/.bin/tsc"), ["-p", temp], { encoding: "utf8" })
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
})
