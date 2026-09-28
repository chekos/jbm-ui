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

const { pointOn, pathTilt } = await import("../registry/jbm/lib/geometry.ts")
const { cajonLayout, drawerInside } = await import("../registry/jbm/motion/cajon.tsx")
const { escritorioLayout, Escritorio } =
  await import("../registry/jbm/motion/escritorio.tsx")
const { Burbuja } =
  await import("../registry/jbm/motion/burbuja.tsx")
const { Mano } = await import("../registry/jbm/motion/mano.tsx")
const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")

test("each new registry item typechecks with only its own published dependencies", () => {
  const temp = mkdtempSync(join(tmpdir(), "jbm-desk-contract-"))
  try {
    for (const name of [
      "cajon",
      "hand",
      "file-cabinet",
      "mano",
      "bandeja",
      "tool-caddy",
      "escritorio",
      "burbuja",
    ]) {
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

test("paths travel by distance, clamp at endpoints, and tolerate stationary segments", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 30, y: 0 },
    { x: 30, y: 40 },
  ]
  assert.deepEqual(pointOn(path, 0.5), { x: 30, y: 5 })
  assert.deepEqual(pointOn(path, -1), path[0])
  assert.deepEqual(pointOn(path, 2), path.at(-1))
  assert.deepEqual(pointOn([path[0]], 0.5), path[0])
  assert.throws(() => pointOn([], 0))
  assert.ok(Math.abs(pathTilt(path, 0.5)) <= 18)
})


test("folder count and labels never resize the drawer; first folder stays at front", () => {
  const one = cajonLayout({folders:[{name:"one"}]})
  for (const count of [1,6,12,30]) {
    const l = cajonLayout({folders:Array.from({length:count},()=>({name:"long ".repeat(20)}))})
    assert.equal(l.w,one.w)
    assert.equal(l.h,one.h)
    assert.equal(l.folders[0].y,one.folders[0].y)
    assert.ok(l.folders.every(f=>f.y<=l.folders[0].y))
  }
})
test("lifting preserves the entire folder and clears the drawer front", () => {
  const base=cajonLayout({folders:[{name:"front"}]})
  for(const pulled of [0,.25,.5,.75,1]) {
    const l=cajonLayout({folders:[{name:"front",pulled}]})
    assert.equal(l.folders[0].h,base.folders[0].h)
    assert.equal(l.folders[0].w,base.folders[0].w)
    // Fully lifted, the folder's bottom stays just behind the front's rim: it never floats clear.
    if(pulled===1) {
      const bottom=l.folders[0].y+l.folders[0].h
      assert.ok(bottom>l.frontTop && bottom<=l.frontTop+14+1e-9)
      assert.ok(l.folders[0].y<base.folders[0].y)
    }
  }
})
test("closed drawer hides complete folders behind the front with no open top gap", () => {
  const l = cajonLayout({folders:[{name:"front",pulled:1},{name:"back"}],open:0})
  assert.equal(l.frontTop,l.y+10)
  for(const f of l.folders) {
    assert.ok(f.y>=l.frontTop)
    assert.ok(f.y+f.h<=l.frontTop+l.frontHeight)
    assert.equal(f.visible,0)
  }
})
test("desk dimensions stay fixed and cabinet is optional",()=>{
  const box={x:30,y:20,w:760,h:420}
  for(const count of [0,1,6,12]) for(const drawerSide of ["start","end"]) {
    const props={box,spec:{drawerSide},folders:Array.from({length:count},()=>({name:"folder"}))}
    assert.deepEqual(escritorioLayout(props).box,box)
    const empty=renderToStaticMarkup(React.createElement("svg",null,React.createElement(Escritorio,props)))
    assert.ok(!empty.includes("File cabinet"))
    assert.ok(!/Tool caddy|Paper tray|línea de carga/.test(empty))
    const withCabinet=renderToStaticMarkup(React.createElement("svg",null,React.createElement(Escritorio,{...props,cabinet:true})))
    assert.ok(withCabinet.includes("File cabinet"))
  }
})
test("highlight bubble uses normal text flow and no scene connection",()=>{
  const markup=renderToStaticMarkup(React.createElement(Burbuja,{words:["Reuse","this","word"],highlight:[1],progress:.5}))
  assert.ok(markup.includes("color-mix"))
  // The only drawing is ChatBubble's own tail; the words stay in normal text flow.
  assert.equal((markup.match(/<svg/g) ?? []).length, 1)
  assert.ok(markup.includes("data-tail"))
  assert.ok(!markup.includes("position:absolute;left"))
})
test("hand movement wraps the independent artwork without carried props",()=>{
  const markup=renderToStaticMarkup(React.createElement("svg",null,React.createElement(Mano,{at:{x:20,y:30},pose:"pinch",angle:12})))
  assert.ok(markup.includes("translate(20 30) rotate(12)"))
  assert.ok(markup.includes("Hand: pinch"))
})

test("cabinet and closed drawer fit between the legs and share the floor", () => {
  for (const w of [440, 760, 980]) for (const drawerSide of ["start", "end"]) {
    const box = { x: 31, y: 29, w, h: 420 }
    for (const open of [0, .25, .5, .75, 1]) {
      const l = escritorioLayout({ box, spec: { drawerSide }, folders: [{name:"datos"}], open })
      assert.ok(l.cabinet.x > l.plane.innerLeft)
      assert.ok(l.cabinet.x + l.cabinet.w < l.plane.innerRight)
      assert.ok(l.cabinet.y > l.plane.apronBottom)
      assert.equal(l.cabinet.y + l.cabinet.h, l.plane.floor)
      assert.ok(l.drawer.x > l.plane.innerLeft)
      assert.ok(l.drawer.x + l.drawer.w < l.plane.innerRight)
      const closed = escritorioLayout({ box, spec: { drawerSide }, folders: [], open: 0 })
      assert.deepEqual({...l.cabinet, folders:[], open:0}, closed.cabinet)
      assert.equal(cajonLayout(l.drawer).front - cajonLayout(closed.drawer).front, 104 * open)
    }
  }
})

const { drawerLight, backLight, Cajon } = await import("../registry/jbm/motion/cajon.tsx")
const { fileCabinetLayout } = await import("../registry/jbm/ui/file-cabinet.tsx")
const sources = [
  "Anthropic 2024",
  "Procida 2017",
  "Grove 1983",
  "Mintzberg 1979",
  "Simon 1947",
  "Training Within Industry 1940s",
  "Taylor 1911",
  "Doorways 2025",
]
const drawMarkup = (props) =>
  renderToStaticMarkup(
    React.createElement("svg", null, React.createElement(Cajon, props))
  )
test("every tab and a band of back panel stay visible for one to six folders", () => {
  for (const w of [300, 420, 900])
    for (const labelSize of [13, 24, 36])
      for (const tabLayout of ["stair", "stagger3"])
        for (const sub of [false, true])
          for (let n = 1; n <= 6; n++) {
            const folders = sources.slice(0, n).map((name) => ({
              name,
              sublabel: sub ? "Administrative Behavior" : undefined,
            }))
            const l = cajonLayout({ w, labelSize, tabLayout, folders })
            l.folders.forEach((f, i) => {
              assert.ok(
                f.tabX >= f.x - 1e-9 && f.tabX + f.tabWidth <= f.x + f.w + 1e-9,
                "tab inside its folder"
              )
              if (sub)
                assert.ok(
                  f.sublabel.y + 0.3 * l.labelSize * 0.8 <= f.flap + 1e-9,
                  "sublabel sits on the band above the flap"
                )
              if (i === 0) {
                assert.ok(
                  f.y + f.tabHeight + l.band <= l.frontTop + 1e-9,
                  "the front folder's tab and band clear the drawer front"
                )
                return
              }
              const front = l.folders[i - 1]
              assert.ok(
                front.y - f.y >= f.tabHeight + l.band - 1e-9,
                `n=${n} i=${i}: tab and band clear the next folder forward`
              )
              assert.ok(f.w <= front.w && f.h <= front.h, "back folders are never larger")
              assert.ok(f.w >= 0.6 * l.folders[0].w - 1e-9, "narrowing stays slight")
            })
          }
})
test("crowded drawers pack within six folders' rise: names whole, struck sublabels dropped", () => {
  const twelve = [...sources, "Smith 1776", "Babbage 1832", "Fayol 1916", "Follett 1924"]
  for (const labelSize of [13, 24])
    for (const sub of [false, true]) {
      const folders = (n) =>
        twelve.slice(0, n).map((name) => ({ name, sublabel: sub ? "Administrative Behavior" : undefined }))
      const six = cajonLayout({ labelSize, folders: folders(6) })
      const rise = (l) => l.folders[0].y - l.folders.at(-1).y
      six.folders.forEach((f) => assert.equal(f.sublabel.visible, true))
      for (const n of [7, 8, 12]) {
        const l = cajonLayout({ labelSize, folders: folders(n) })
        assert.ok(Math.abs(rise(l) - rise(six)) < 1e-9, `n=${n}: the stack keeps six folders' height`)
        l.folders.forEach((f, i) => {
          if (i === 0) return assert.equal(f.sublabel.visible, true)
          // Each name sits above the next folder forward, so no tab edge crosses it.
          assert.ok(f.label.y + 0.25 * l.labelSize <= l.folders[i - 1].y + 1e-9, `n=${n} i=${i} name whole`)
          // What covers the sublabel is the nearer folders' edge over its span: a tab's top, or
          // beside the tab the body's top edge. A partly covered sublabel is hidden, never cut.
          const a = f.sublabel.x, b = a + f.sublabel.width
          const cover = Math.min(
            l.frontTop,
            ...l.folders.slice(0, i).flatMap((g) =>
              b <= g.x || a >= g.x + g.w
                ? []
                : [
                    ...(b > g.tabX && a < g.tabX + g.tabWidth ? [g.y] : []),
                    ...(b > g.tabX + g.tabWidth ? [g.y + g.tabSlope] : []),
                    ...(a < g.tabX ? [g.y + g.tabHeight] : []),
                  ]
            )
          )
          const clear = f.sublabel.y + 0.35 * l.labelSize * 0.8 <= cover + 1e-9
          if (sub) assert.equal(f.sublabel.visible, clear, `n=${n} i=${i} size ${labelSize}: a sublabel prints only when clear (${f.sublabel.y} ${cover} ${f.sublabel.x} ${f.sublabel.width})`)
        })
        if (sub) {
          const markup = drawMarkup({ labelSize, folders: folders(n) })
          assert.equal(
            (markup.match(/Administrative Behavior/g) ?? []).length,
            l.folders.filter((f) => f.sublabel.visible).length
          )
        }
      }
    }
})
test("an ajar flap drops straight: never wider than its folder, lifted or not", () => {
  for (const labelSize of [13, 24])
    for (const pulled of [0, 0.5, 1]) {
      const folders = [{ name: "Anthropic 2024", open: 1, pulled }, { name: "Procida 2017", open: 1 }]
      const l = cajonLayout({ labelSize, folders })
      for (const f of l.folders) assert.equal(f.opening.lean, 0)
      const markup = drawMarkup({ labelSize, folders })
      const f = l.folders[0]
      // The flap runs from its fixed bottom-left corner up to the dropped top edge and across.
      const at = markup.indexOf(`d="M${f.x} ${f.y + f.h}L`)
      assert.ok(at > 0, "flap drawn")
      const [, x0, x1] = /L([-\d.]+) [-\d.]+H([-\d.]+)/.exec(markup.slice(at))
      assert.ok(+x0 >= f.x - 1e-9 && +x1 <= f.x + f.w + 1e-9, "flap inside the folder's width")
    }
})
test("an empty open drawer is a box of token shades, not an ink block", () => {
  const markup = drawMarkup({ folders: [], open: 1 })
  // Pencil Rule toward Graphite, never an ink mix; the side panels are card, not page-cream holes.
  for (const [plane, fill] of Object.entries(drawerInside)) assert.ok(markup.includes(`fill="${fill}"`), `plane ${plane}`)
  assert.equal(drawerInside.right, "#D5D1C6")
  assert.ok(!markup.includes('fill="#FFF6E8"Z') && markup.includes('fill="#FFFCF5"'))
  // The only ink fill in an empty drawer is the handle.
  assert.equal((markup.match(/fill="#20241F"/g) ?? []).length, 1)
})
test("names: the tab widens, a barely-long name squeezes at most to 0.94, longer ones end in an ellipsis", () => {
  const long = "Training Within Industry 1940s and beyond"
  const markup = drawMarkup({ w: 300, folders: [{ name: long }] })
  assert.ok(!markup.includes(long))
  assert.ok(markup.includes("…"))
  const f = cajonLayout({ w: 300, folders: [{ name: long }] }).folders[0]
  assert.ok(f.tabWidth <= f.w && f.label.scale === 1 && f.label.text.endsWith("…"))
  for (const labelSize of [10, 13, 24, 36])
    for (const g of cajonLayout({ labelSize, folders: sources.map((name) => ({ name })) }).folders)
      assert.ok(g.label.scale >= 0.94, `size ${labelSize}: ${g.label.text} never visibly condensed`)
  assert.equal(
    cajonLayout({ folders: [{ name: "Grove 1983" }] }).folders[0].label.scale,
    1
  )
})
test("light ramps with depth from the palette tokens, and a lifted folder regains it", () => {
  assert.equal(drawerLight(1), "#FFFCF5")
  assert.equal(drawerLight(0), "#20241F")
  assert.equal(drawerLight(NaN), drawerLight(1))
  const l = cajonLayout({ folders: sources.slice(0, 6).map((name) => ({ name })) })
  assert.equal(l.folders[0].light, 1)
  assert.ok(Math.abs(l.folders[5].light - backLight) < 1e-9)
  for (let i = 1; i < 6; i++) assert.ok(l.folders[i].light < l.folders[i - 1].light)
  const lifted = cajonLayout({
    folders: [{ name: "a" }, { name: "b", k: 0.72, pulled: 1 }],
  })
  assert.equal(lifted.folders[1].light, 1)
  const markup = drawMarkup({
    folders: [{ name: "a", open: 1 }, { name: "b", accent: true }],
  })
  assert.equal((markup.match(/#C63D24/g) ?? []).length, 1, "vermilion only on the accent folder")
})
test("anchors spread n thread ends along the tab from just before the name", () => {
  const l = cajonLayout({ folders: [{ name: "Procida 2017" }, { name: "Taylor 1911" }] })
  assert.deepEqual(l.anchors(0, 0), [])
  assert.deepEqual(l.anchors(9, 3), [])
  for (const i of [0, 1])
    for (const n of [1, 2, 4, 7]) {
      const f = l.folders[i],
        pts = l.anchors(i, n)
      assert.equal(pts.length, n)
      // The first end (a knot) sits in the tab's lead-in, clear of the first letter.
      assert.ok(pts[0].x < f.label.x - 0.3 * l.labelSize && pts[0].x > f.tabX)
      for (const p of pts) {
        assert.ok(p.x >= f.tabX && p.x <= f.tabX + f.tabWidth - f.tabSlope)
        assert.ok(p.y > f.y && p.y < f.y + f.tabHeight)
      }
      for (let j = 1; j < n; j++) assert.ok(pts[j].x > pts[j - 1].x)
    }
})
test("reveal inks the name in by grapheme and renders deterministically", () => {
  const draw = (reveal) =>
    drawMarkup({
      folders: [{ name: "Simon 1947", sublabel: "Administrative Behavior", reveal }],
    })
  assert.ok(!draw(0).includes("Simon") && !draw(0).includes("Admin"))
  assert.ok(draw(1).includes(">Simon 1947<") && draw(1).includes(">Administrative Behavior<"))
  assert.ok(draw(0.5).includes("Simo") && !draw(0.5).includes("Simon 1947"))
  assert.equal(draw(0.37), draw(0.37))
  assert.ok(!draw(NaN).includes("NaN"))
})
test("a cabinet keeps its packed drawer: staggered tabs within the 48-unit rise", () => {
  for (const n of [1, 6, 12]) {
    const folders = Array.from({ length: n }, () => ({ name: "folder" }))
    const { drawer } = fileCabinetLayout({ folders })
    assert.equal(drawer.tabLayout, "stagger3")
    const l = cajonLayout(drawer)
    const spacing = 48 / Math.max(5, n - 1)
    l.folders.forEach((f, i) =>
      assert.ok(Math.abs(f.y - (l.front + 32 - 62 - i * spacing)) < 1e-9)
    )
  }
})
test("perspective follows depth, not label size; wide drawers scale their furniture", () => {
  const folders = sources.slice(0, 6).map((name) => ({ name }))
  const a = cajonLayout({ folders, labelSize: 13 })
  const b = cajonLayout({ folders, labelSize: 24 })
  a.folders.forEach((f, i) => assert.ok(Math.abs(f.w - b.folders[i].w) < 1e-9, `folder ${i}`))
  // Six folders reach five-sevenths of the way back: each side moves in 5/7 of a fifth.
  assert.ok(Math.abs(b.folders[5].w - (1 - 0.4 * 5 / 7) * b.folders[0].w) < 1e-9)
  const wide = cajonLayout({ w: 840, folders, open: 1 })
  const closed = cajonLayout({ w: 840, folders, open: 0 })
  assert.equal(wide.scale, 2)
  assert.ok(Math.abs(wide.front - closed.front - 208) < 1e-9, "travel doubles at twice the width")
  assert.equal(cajonLayout({ w: 280, folders }).scale, 1)
})
test("an ajar flap shows: the folder rises so the opening clears what is in front of it", () => {
  for (const labelSize of [13, 24])
    for (const sub of [false, true])
      for (let i = 0; i < 4; i++) {
        const folders = sources.slice(0, 4).map((name, j) => ({
          name,
          sublabel: sub ? "Administrative Behavior" : undefined,
          open: j === i ? 1 : 0,
        }))
        const l = cajonLayout({ folders, labelSize })
        const f = l.folders[i]
        const cover = i === 0 ? l.frontTop : l.folders[i - 1].y
        assert.ok(f.opening.drop > 0)
        // At least half the shaded opening shows above whatever covers the folder…
        assert.ok(cover - f.flap >= 0.5 * f.opening.drop - 1e-9, `size ${labelSize} folder ${i}`)
        // …and the folder behind keeps its whole tab in view.
        if (i < 3) assert.ok(l.folders[i + 1].y + f.tabHeight <= f.y + 1e-9, `tab behind ${i}`)
      }
})
test("a closed flap edge never crosses a folder body: it draws side to side only over a tab of flap clear of everything in front", () => {
  const twelve = [...sources, "Smith 1776", "Babbage 1832", "Fayol 1916", "Follett 1924"]
  // The top of folder g's silhouette at x (tab, its slope, and the body beside it), or none.
  const topAt = (g, x) => {
    if (x < g.x || x > g.x + g.w) return Infinity
    if (x < g.tabX) return g.y + g.tabHeight
    const knee = g.tabX + g.tabWidth - g.tabSlope
    if (x <= knee) return g.y
    if (x <= g.tabX + g.tabWidth) return g.y + (x - knee)
    return g.y + g.tabSlope
  }
  const edges = (markup) =>
    [...markup.matchAll(/d="M([-\d.e]+) ([-\d.e]+)H([-\d.e]+)" fill="none"/g)].map((m) => m.slice(1).map(Number))
  const check = (props, label) => {
    const l = cajonLayout(props)
    const drawn = edges(drawMarkup(props))
    const expected = l.folders.filter((f, i) => f.rule && !(props.folders[i].open > 0))
    assert.equal(drawn.length, expected.length, `${label}: one edge per drawn rule`)
    for (const [x0, y, x1] of drawn) {
      const i = l.folders.findIndex((f) => Math.abs(f.x - x0) < 1e-6 && Math.abs(f.flap - y) < 1e-6)
      assert.ok(i >= 0, `${label}: edge at ${y} belongs to a folder's flap`)
      const f = l.folders[i]
      assert.ok(Math.abs(x1 - (f.x + f.w)) < 1e-6, `${label}: edge meets both sides of folder ${i}`)
      // Everything in front: the drawer front and every nearer folder's true silhouette.
      for (let s = 0; s <= 64; s++) {
        const x = x0 + ((x1 - x0) * s) / 64
        const cover = Math.min(l.frontTop, ...l.folders.slice(0, i).map((g) => topAt(g, x)))
        assert.ok(
          y + f.tabHeight <= cover + 1e-6,
          `${label}: folder ${i} edge at x ${x.toFixed(1)} is ${(cover - y).toFixed(1)} above what is in front`
        )
      }
    }
    return l
  }
  for (const labelSize of [13, 24])
    for (const tabLayout of ["stair", "stagger3"])
      for (const sub of [false, true])
        for (const n of [1, 3, 5, 8, 12]) {
          const base = (extra) =>
            twelve.slice(0, n).map((name, j) => ({
              name,
              sublabel: sub ? "Administrative Behavior" : undefined,
              ...extra(j),
            }))
          // A fan at rest, at any opening and any given spacing, shows no closed flap edge.
          for (const open of [0, 0.5, 1])
            for (const depthSpacing of [undefined, 24, 60]) {
              const props = { labelSize, tabLayout, open, depthSpacing, folders: base(() => ({})) }
              const l = check(props, `n=${n} open ${open} rise ${depthSpacing}`)
              assert.ok(l.folders.every((f) => !f.rule), `n=${n} open ${open}: a fan at rest has no seams`)
            }
          // Lift and ajar extremes, one folder or all of them.
          for (const target of [0, Math.floor(n / 2), n - 1, -1])
            for (const pulled of [0.05, 0.1, 0.5, 1])
              for (const ajar of [0, 1]) {
                const aim = (j) => target === -1 || j === target
                const props = {
                  labelSize,
                  tabLayout,
                  folders: base((j) => (aim(j) ? { pulled, open: ajar } : {})),
                }
                const l = check(props, `n=${n} target ${target} lift ${pulled} ajar ${ajar}`)
                if (target === 0 && pulled === 1 && ajar === 0)
                  assert.equal(l.folders[0].flapEdge, 1, "a folder lifted out shows its front panel, like Folder")
              }
        }
})
test("anchors of tabs inside a closed drawer stop at its top rim", () => {
  const l = cajonLayout({ folders: sources.slice(0, 3).map((name) => ({ name })), open: 0 })
  for (let i = 0; i < 3; i++) for (const p of l.anchors(i, 2)) assert.ok(p.y <= l.frontTop + 1e-9)
})
test("the drawer front carries a label holder near its top edge and a separate pull under it", async () => {
  const { Cajon } = await import("../registry/jbm/motion/cajon.tsx")
  const { color, stroke } = await import("../registry/jbm/lib/tokens.ts")
  const inside = (a, b, m = 0) =>
    a.x >= b.x + m && a.y >= b.y + m && a.x + a.w <= b.x + b.w - m && a.y + a.h <= b.y + b.h - m
  for (const w of [280, 420, 900])
    for (const open of [0, 0.5, 1]) {
      const l = cajonLayout({ w, open, folders: [{ name: "a" }] })
      const front = { x: l.x, y: l.frontTop, w: l.w, h: l.frontHeight }
      const { holder, pull } = l.hardware
      for (const [part, box] of [["holder", holder], ["pull", pull]]) {
        assert.ok(inside(box, front, stroke.outline), `${part} on the front at w ${w}`)
        assert.ok(Math.abs(box.x + box.w / 2 - (l.x + l.w / 2)) < 1e-9, `${part} centred`)
      }
      // Near the top edge, the pull under the holder with a clear gap (never one plate).
      assert.ok(holder.y - l.frontTop <= 0.12 * l.frontHeight, "holder near the top edge")
      assert.ok(pull.y - (holder.y + holder.h) >= 4.5 + stroke.outline, "separate pieces")
      assert.ok(pull.y + pull.h - l.frontTop < 0.42 * l.frontHeight, "pull in the upper part, never mid-panel")
      assert.ok(pull.w > holder.w && pull.h < holder.h, "a wide bar under a small label card")
    }
  const markup = renderToStaticMarkup(
    React.createElement("svg", null, React.createElement(Cajon, { folders: [{ name: "a" }] }))
  )
  const rects = [...markup.matchAll(/<rect ([^>]*)>/g)].map((m) => m[1])
  assert.equal(rects.filter((r) => r.includes(`fill="${color.bg}"`)).length, 1, "one label card")
  assert.equal(rects.filter((r) => r.includes(`fill="${color.ink}"`)).length, 1, "one ink pull")
  assert.ok(!rects.some((r) => /stroke-width/.test(r)), "hardware inherits the shared outline")
})
test("drawer folders are Folder's body at folderScaleForDrawer, the loose folder's scale", async () => {
  const { folderShape, folderScaleForDrawer } = await import("../registry/jbm/ui/folder.tsx")
  const { fileCabinetLayout } = await import("../registry/jbm/ui/file-cabinet.tsx")
  for (const w of [280, 420, 900]) {
    const l = cajonLayout({ w, folders: [{ name: "a" }] })
    const k = folderScaleForDrawer(w)
    assert.ok(Math.abs(l.folders[0].w - folderShape.body.w * k) < 1e-9, `width at ${w}`)
    assert.ok(Math.abs(l.folders[0].h - folderShape.body.h * k) < 1e-9, `height at ${w}`)
  }
  assert.ok(Math.abs(folderScaleForDrawer(420) - 368 / 205) < 1e-12)
  assert.equal(folderScaleForDrawer(NaN), folderScaleForDrawer(420))
  const cab = fileCabinetLayout({ folders: [{ name: "a" }] })
  assert.ok(
    Math.abs(
      cajonLayout(cab.drawer).folders[0].w -
        folderShape.body.w * folderScaleForDrawer(cab.drawer.w)
    ) < 1e-9
  )
})
