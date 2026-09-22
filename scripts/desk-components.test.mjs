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
const { cajonLayout } = await import("../registry/jbm/motion/cajon.tsx")
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
    if(pulled===1) assert.ok(l.folders[0].y+l.folders[0].h<l.front)
  }
})
test("closed drawer hides complete folders behind the front with no open top gap", () => {
  const l = cajonLayout({folders:[{name:"front",pulled:1},{name:"back"}],open:0})
  assert.equal(l.front+32,l.y+10)
  for(const f of l.folders) {
    assert.ok(f.y>=l.front+32)
    assert.ok(f.y+f.h<=l.front+32+l.frontHeight)
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
  assert.ok(!markup.includes("<svg"))
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
