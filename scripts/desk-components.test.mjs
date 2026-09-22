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
const { burbujaLayout, Burbuja } =
  await import("../registry/jbm/motion/burbuja.tsx")
const { manoAnchor, Mano } = await import("../registry/jbm/motion/mano.tsx")
const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")

test("each new registry item typechecks with only its own published dependencies", () => {
  const temp = mkdtempSync(join(tmpdir(), "jbm-desk-contract-"))
  try {
    for (const name of [
      "cajon",
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

test("twelve folder labels stay separated, grow depth, and long names grow width", () => {
  const folders = Array.from({ length: 12 }, (_, i) => ({
    name: "folder " + i,
  }))
  const l = cajonLayout({ folders })
  assert.ok(l.h > cajonLayout({ folders: folders.slice(0, 1) }).h)
  assert.ok(l.front + 116 <= l.y + l.h)
  const closed = cajonLayout({ folders, open: 0 })
  assert.equal(closed.front + 28, closed.y + 12)
  for (let i = 1; i < 12; i++)
    assert.ok(l.folders[i].y - l.folders[i - 1].y >= 30)
  const long = cajonLayout({ folders: [{ name: "a".repeat(60) }] })
  assert.ok(long.folders[0].tabX + long.folders[0].tabWidth <= long.w)
  const pulled = cajonLayout({
    folders: folders.map((f) => ({ ...f, pulled: 1 })),
  })
  assert.ok(pulled.folders.every((f) => f.y + 104 <= 26))
  assert.throws(() => cajonLayout({ folders: [...folders, folders[0]] }))
})

test("desk layout and rendered children share exact coordinates on either side", () => {
  for (const drawerSide of ["start", "end"]) {
    const props = {
      box: { x: 31, y: 29, w: 820, h: 580 },
      spec: {
        tools: [{ name: "Read" }],
        runners: [{ name: "python" }],
        drawerSide,
      },
      folders: [{ name: "datos", pulled: 0.5 }],
      layers: 3,
    }
    const l = escritorioLayout(props)
    const drawer = cajonLayout(l.drawer)
    assert.deepEqual(l.anchors.folders[0], drawer.folders[0].anchor)
    assert.equal(l.anchors.tools.length, 2)
    assert.ok(l.drawer.x >= l.box.x)
    assert.ok(l.drawer.x + drawer.w <= l.box.x + l.box.w)
    assert.ok(l.drawer.y + drawer.h <= l.box.y + l.box.h)
    const markup = renderToStaticMarkup(
      React.createElement("svg", null, React.createElement(Escritorio, props))
    )
    assert.ok(!/NaN|Infinity/.test(markup))
  }
})

test("bubble wrapping, entry offset and line origin use the same deterministic cells", () => {
  const props = {
    words: ["uno", "dos", "larguísimo", "fin"],
    width: 210,
    fontSize: 20,
    at: { x: 50, y: 80 },
    speaker: "Tú",
    arrive: 1,
  }
  const l = burbujaLayout(props)
  assert.ok(l.positions[2].y > l.positions[0].y)
  for (const p of l.positions) {
    assert.ok(p.x + p.w <= l.w - 20)
    assert.equal(p.anchor.x, l.origin.x + p.x + p.w / 2)
  }
  assert.equal(burbujaLayout({ ...props, arrive: 0 }).origin.x - l.origin.x, 90)
  assert.equal(
    burbujaLayout({ ...props, arrive: 0, side: "start" }).origin.x - l.origin.x,
    -90
  )
  for (const link of [0, 0.5, 1]) {
    const markup = renderToStaticMarkup(
      React.createElement(Burbuja, {
        ...props,
        highlight: [2, 2, 99, -1],
        target: { x: 100, y: 400 },
        glow: 1,
        link,
      })
    )
    assert.ok(markup.includes('stroke-dashoffset="' + (1 - link) + '"'))
    assert.ok(!/NaN|undefined/.test(markup))
  }
})

test("hand pins the same contact to at while gripping; held children render between layers", () => {
  for (const grip of [0, 0.5, 1]) {
    const a = manoAnchor(grip)
    const tree = Mano({
      at: { x: 25, y: 70 },
      grip,
      size: 48,
      children: React.createElement("rect", { "data-held": true }),
    })
    assert.equal(tree.props.transform, "translate(25 70) rotate(0)")
    assert.equal(tree.props.children[1].props["data-held"], true)
    assert.ok(
      tree.props.children[2].props.transform.includes(
        "translate(" + -a.x + " " + -a.y + ")"
      )
    )
  }
})
