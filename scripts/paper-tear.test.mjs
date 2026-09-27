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
const { Paper, frayEdge, frayReach, paperTension, FRAY } = await import(
  "../registry/jbm/ui/paper.tsx"
)
const { Tear, tearGeometry, tearSeams, tearPieceProgress } = await import(
  "../registry/jbm/ui/tear.tsx"
)
const render = (C, props, ...children) =>
  renderToStaticMarkup(React.createElement(C, props, ...children))
const points = (d) =>
  [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]])

test("paper and tear typecheck with only their published dependencies", () => {
  const temp = mkdtempSync(join(tmpdir(), "jbm-paper-tear-"))
  try {
    for (const name of ["paper", "tear"]) {
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

test("Paper without tension or tab keeps its original single-div markup", () => {
  const plain = render(Paper, { w: 200, h: 130, rotate: -3, style: { padding: 20 } }, "x")
  assert.equal(
    plain,
    render(Paper, { w: 200, h: 130, rotate: -3, style: { padding: 20 }, tension: 0 }, "x")
  )
  assert.match(plain, /^<div style="width:200px;height:130px;background:#FFFCF5;border:2px solid #20241F;border-radius:22px;box-shadow:[^"]+;box-sizing:border-box;transform:rotate\(-3deg\);position:relative;padding:20px">x<\/div>$/)
  assert.equal(render(Paper, { tension: NaN }), render(Paper, {}))
})

test("tension fans short creases from each pulled corner and tears only past 0.6", () => {
  assert.deepEqual(paperTension(0.4), { crease: 0.5, tear: 0 })
  const mid = paperTension(0.8)
  assert.equal(mid.crease, 1)
  assert.ok(Math.abs(mid.tear - Math.SQRT1_2) < 1e-9)
  assert.deepEqual(paperTension(2), { crease: 1, tear: 1 })
  const lines = (html) => [...html.matchAll(/<line x1="([\d.]+)%" y1="([\d.]+)%" x2="([\d.]+)%" y2="([\d.]+)%"/g)].map((m) => m.slice(1).map(Number))
  const lips = (html) => (html.match(/<polyline /g) ?? []).length
  const at = (props) => render(Paper, { w: 400, h: 600, ...props }, "WRITING")
  // Two or three creases per pulled corner, all corner combinations included.
  for (const pull of [["tl", "tr", "br", "bl"], ["tl", "br"], ["tl", "tr"], ["bl"]]) {
    const n = lines(at({ tension: 1, pull })).length
    assert.ok(n >= 2 * pull.length && n <= 3 * pull.length, `${pull}: ${n} creases`)
  }
  assert.equal(lines(at({ tension: 0.9, pull: [] })).length, 0)
  // Short folds: at full tension no crease reaches the middle of the sheet, so none meet or cross it.
  for (const seed of [1, 2, 3, 7]) {
    const full = lines(at({ tension: 1, seed }))
    for (const [x1, y1, x2, y2] of full) {
      const corner = [x1 < 50 ? 0 : 100, y1 < 50 ? 0 : 100]
      const toCentre = Math.hypot((50 - corner[0]) * 4, (50 - corner[1]) * 6)
      assert.ok(Math.hypot((x2 - corner[0]) * 4, (y2 - corner[1]) * 6) <= 0.7 * toCentre, `seed ${seed}: crease too long`)
      assert.ok(Math.abs(x2 - 50) > 12 || Math.abs(y2 - 50) > 12, `seed ${seed}: crease reaches the middle`)
    }
  }
  // Creases lie under the writing: drawn behind the children, on the sheet's layer.
  const creased = at({ tension: 0.7 })
  assert.ok(creased.indexOf("<line") < creased.indexOf("WRITING"))
  assert.match(creased, /z-index:-1;overflow:visible;pointer-events:none"><defs><linearGradient/)
  assert.equal(lips(at({ tension: 0.6 })), 0)
  assert.equal(lips(at({ tension: 0.9 })), 2)
  assert.equal(lips(at({ tension: 1, seam: null })), 0)
  assert.match(at({ tension: 1, seam: 150 }), /top:150px/)
  // At 0.7 the starting tear is a real notch: half its full depth and a 10px mouth at the edge.
  const notch = [...at({ tension: 0.7, seam: 300 }).matchAll(/points="([^"]+)"/g)].map((m) =>
    m[1].split(" ").map((p) => p.split(",").map(Number))
  )
  assert.ok(notch[0].at(-1)[0] >= 45, `notch depth ${notch[0].at(-1)[0]}`)
  assert.ok(notch[1][0][1] - notch[0][0][1] >= 9.5, "notch mouth")
  // The tear cuts a real hole: the sheet layer is clipped, the root paints no fill.
  const torn = at({ tension: 1 })
  assert.match(torn, /clip-path:polygon\(/)
  assert.ok(!/^<div style="[^"]*background:/.test(torn))
  assert.equal(at({ tension: 0.95 }), at({ tension: 0.95 }))
})

test("tab is a Geist 800 label of at least 32px hidden by reveal 0", () => {
  const tab = (t) => render(Paper, { w: 400, h: 600, tab: { label: "Tutorial", ...t } })
  const out = tab({})
  assert.match(out, /font-weight:800;font-size:32px/)
  assert.match(out, /color:#20241F/)
  assert.match(out, /translateY\(0%\)/)
  assert.match(tab({ reveal: 0 }), /translateY\(100%\)/)
  assert.match(tab({ reveal: 0.5 }), /translateY\(50%\)/)
  assert.match(tab({ size: 40 }), /font-size:40px/)
  // Behind the sheet: the tab's layer sits below the sheet layer.
  assert.ok(out.indexOf("z-index:-2") < out.indexOf("z-index:-1"))
  assert.match(out, />Tutorial</)
})

test("frayEdge is deterministic, spans the width, and stays within its reach", () => {
  const a = frayEdge({ width: 520, y: 380, seed: 3 })
  assert.deepEqual(a, frayEdge({ width: 520, y: 380, seed: 3 }))
  assert.notDeepEqual(a, frayEdge({ width: 520, y: 380, seed: 4 }))
  assert.equal(a[0].x, 0)
  assert.equal(a[a.length - 1].x, 520)
  for (let i = 1; i < a.length; i++) assert.ok(a[i].x > a[i - 1].x)
  for (const seed of [1, 2, 5, 9])
    for (const y of [40, 190, 571])
      for (const p of frayEdge({ width: 900, y, seed, amplitude: 10 }))
        assert.ok(Math.abs(p.y - y) <= frayReach(10) + 1e-9)
  assert.equal(frayReach(FRAY), 1.8 * FRAY)
  assert.ok(frayEdge({ width: NaN, y: NaN }).every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)))
})

test("tear strips tile the sheet exactly: neighbours share one frayed seam", () => {
  for (const seams of [[300], [190, 380, 570], [108, 217, 326, 434, 543, 651]]) {
    const strips = tearGeometry({ w: 520, h: 760, seams, seed: 2 })
    assert.equal(strips.length, seams.length + 1)
    assert.equal(strips[0].seamAbove, null)
    assert.equal(strips.at(-1).seamBelow, null)
    for (let i = 0; i < strips.length - 1; i++) {
      assert.equal(strips[i].seamBelow, strips[i + 1].seamAbove)
      assert.equal(strips[i].bottom, strips[i + 1].top)
      // The outline of each strip runs along that same polyline.
      const seam = points(strips[i].seamBelow)
      const below = points(strips[i + 1].outline)
      assert.deepEqual(below.slice(0, seam.length), seam)
      // It spans the full width, from one straight side to the other.
      assert.equal(seam[0][0], 1)
      assert.equal(seam.at(-1)[0], 519)
    }
    assert.equal(strips[0].top, 0)
    assert.equal(strips.at(-1).bottom, 760)
  }
})

test("tearSeams drops seams that would cross an edge or a neighbour", () => {
  assert.deepEqual(tearSeams(600, [NaN, -5, 2, 151, 152, 599, 450]), [151, 450])
  assert.deepEqual(tearSeams(600, [450, 150, 300]), [150, 300, 450])
  const margin = frayReach(FRAY) + 4
  const kept = tearSeams(760, Array.from({ length: 80 }, (_, i) => i * 10))
  for (let i = 0; i < kept.length; i++) {
    assert.ok(kept[i] >= margin && kept[i] <= 760 - margin)
    if (i) assert.ok(kept[i] - kept[i - 1] >= 2 * margin)
  }
})

test("each strip reaches its destination; progress 0 shows a whole sheet", () => {
  const pieces = [
    { to: { x: -250, y: -150, rotate: -5 } },
    { to: { x: 250, y: -290, rotate: 4 } },
    {},
  ]
  const props = { w: 520, h: 760, seams: [250, 500], pieces }
  const whole = render(Tear, { ...props, progress: 0 })
  assert.ok(!whole.includes("transform:translate"))
  // No ink seam at progress 0 (only the cream under-band that hides the fills' meeting line).
  assert.ok(!/stroke="#20241F" stroke-opacity/.test(whole))
  assert.match(render(Tear, { ...props, progress: 0.5 }), /stroke="#20241F" stroke-opacity="1"/)
  assert.ok(!whole.includes("drop-shadow"))
  const apart = render(Tear, { ...props, progress: 1 })
  assert.match(apart, /translate\(-250px, -150px\) rotate\(-5deg\)/)
  assert.match(apart, /translate\(250px, -290px\) rotate\(4deg\)/)
  assert.equal((apart.match(/data-piece=/g) ?? []).length, 3)
  for (const stagger of [0, 0.1, 0.3, 0.9])
    for (const count of [2, 4, 7])
      for (let i = 0; i < count; i++) {
        assert.equal(tearPieceProgress(1, i, count, stagger), 1)
        assert.equal(tearPieceProgress(0, i, count, stagger), 0)
      }
  assert.ok(tearPieceProgress(0.3, 0, 4, 0.1) > tearPieceProgress(0.3, 3, 4, 0.1))
  assert.equal(render(Tear, { ...props, progress: 0.4 }), render(Tear, { ...props, progress: 0.4 }))
  assert.ok(!render(Tear, { ...props, progress: NaN, seams: [NaN] }).includes("NaN"))
})

test("tear children render once per strip; a render prop sees each strip", () => {
  const seen = []
  render(Tear, {
    w: 400,
    h: 600,
    seams: [200, 400],
    progress: 0.5,
    children: (p) => {
      seen.push([p.index, p.top, p.bottom])
      return React.createElement("span", null, `strip ${p.index}`)
    },
  })
  assert.deepEqual(seen, [
    [0, 0, 200],
    [1, 200, 400],
    [2, 400, 600],
  ])
  const html = render(Tear, { w: 400, h: 600, seams: [300], progress: 0 }, React.createElement("b", null, "writing"))
  assert.equal((html.match(/<b>writing<\/b>/g) ?? []).length, 2)
  assert.equal((html.match(/clip-path:path\(/g) ?? []).length, 2)
})

test("Paper's starting tear follows the Tear seam with the same seed", () => {
  const w = 520,
    seam = 380,
    seed = 4
  const torn = render(Paper, { w, h: 760, tension: 1, seam, seed })
  const [upper, lower] = [...torn.matchAll(/points="([^"]+)"/g)].map((m) =>
    m[1].split(" ").map((p) => p.split(",").map(Number))
  )
  const edge = frayEdge({ width: w, y: seam, seed })
  // Midway between the lips lies the seam's fray, point for point (bar the tip).
  for (let i = 1; i < upper.length - 1; i++) {
    const mid = (upper[i][1] + lower[i][1]) / 2
    assert.ok(Math.abs(mid - (edge[i].y - seam)) < 0.02, `point ${i}`)
    assert.ok(Math.abs(upper[i][0] - edge[i].x) < 0.02)
  }
  const strip = points(tearGeometry({ w, h: 760, seams: [seam], seed })[0].seamBelow)
  assert.deepEqual(strip.slice(1, 4).map(([, y]) => y), edge.slice(1, 4).map((p) => p.y))
})
