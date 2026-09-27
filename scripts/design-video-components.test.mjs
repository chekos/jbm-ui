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
const { PaperTape, paperAt } = await import("../registry/jbm/ui/paper-tape.tsx")
const { FolderCarry, folderGrip, carriedFolderGeometry, tableFolderGeometry } =
  await import("../registry/jbm/ui/folder-carry.tsx")
const { PaperLine } = await import("../registry/jbm/ui/paper-line.tsx")
const { Mano } = await import("../registry/jbm/motion/mano.tsx")
const { pointOn } = await import("../registry/jbm/lib/geometry.ts")
const render = (C, props) => renderToStaticMarkup(React.createElement(C, props))
test("each new registry item typechecks with only its own published dependencies", () => {
  const temp = mkdtempSync(join(tmpdir(), "jbm-desk-contract-"))
  try {
    for (const name of [
      "paper-tape",
      "paper-clip",
      "tape-marker",
      "clipped-note",
      "punched-tag",
      "stamp",
      "paper-line",
      "folder-contents",
      "folder-carry",
      "frontmatter",
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

test("tape feed preserves paper coordinates and bounds DOM work by the window", () => {
  assert.equal(paperAt(720, 520) - paperAt(700, 520), 20)
  const markup = render(PaperTape, { length: 1e9, window: 320 })
  assert.ok((markup.match(/<line /g) ?? []).length < 20)
  assert.ok(!markup.includes("NaN"))
  assert.ok(!render(PaperTape, { length: 0 }).includes("<line "))
  assert.ok(!render(PaperTape, { length: NaN }).includes("NaN"))
  assert.ok(
    !render(PaperTape, {
      length: 100,
      markers: [{ id: "later", at: 200, label: "future" }],
    }).includes("future")
  )
})
test("folder contact stays on the path at endpoints and throughout travel", () => {
  const from = tableFolderGeometry({ x: 0, y: 80 }, 100),
    to = tableFolderGeometry({ x: 220, y: 70 }, 190)
  const path = [folderGrip(from), { x: 180, y: 40 }, folderGrip(to)]
  for (const p of [0, 0.1, 0.5, 0.9, 1]) {
    const g = carriedFolderGeometry(from, to, path, p),
      grip = folderGrip(g),
      at = pointOn(path, p)
    assert.ok(Math.abs(grip.x - at.x) < 1e-8 && Math.abs(grip.y - at.y) < 1e-8)
    assert.ok(g.w >= from.w && g.w <= to.w)
  }
  const start = carriedFolderGeometry(from, to, path, 0)
  for (const key of Object.keys(from))
    assert.ok(Math.abs(start[key] - from[key]) < 1e-8)
  const end = carriedFolderGeometry(from, to, path, 1)
  for (const key of Object.keys(to))
    assert.ok(Math.abs(end[key] - to[key]) < 1e-8)
  assert.ok(
    !render(FolderCarry, { from, to, path, progress: NaN }).includes("NaN")
  )
})
test("paper text reveals whole graphemes and keeps a stable full-text alternative", () => {
  const text = "A👨‍👩‍👧B"
  const markup = render(PaperLine, { text, reveal: 0.5 })
  assert.ok(markup.includes("👨‍👩‍👧"))
  assert.ok(markup.includes(text))
  assert.ok(markup.includes("visibility:hidden"))
  assert.ok(
    !render(PaperLine, { text, lift: NaN, reveal: NaN }).includes("NaN")
  )
})
test("hand anchoring is inside rotation and uses the artwork aspect ratio", () => {
  const markup = render(Mano, {
    at: { x: 100, y: 120 },
    pose: "pinch",
    size: 60,
    angle: 30,
    anchor: { x: 6, y: 10 },
  })
  assert.ok(markup.includes("translate(100 120) rotate(30)"))
  assert.ok(markup.includes("translate(-12 -20)"))
  assert.ok(markup.includes('height="58"'))
})
test("carried folder takes the caller's fill and keeps its label legible on it", () => {
  const from = tableFolderGeometry({ x: 0, y: 80 }, 100),
    to = tableFolderGeometry({ x: 220, y: 70 }, 190)
  const path = [folderGrip(from), folderGrip(to)]
  const base = { from, to, path, progress: 0.5, label: "Doorways" }
  assert.match(render(FolderCarry, base), /fill="#C63D24"/)
  const card = render(FolderCarry, { ...base, fill: "#FFFCF5" })
  assert.match(card, /<path d="[^"]+" fill="#FFFCF5"/)
  assert.ok(!card.includes("#C63D24"))
  assert.match(card, /<text[^>]*fill="#20241F"/)
  assert.match(render(FolderCarry, { ...base, fill: "#20241F" }), /<text[^>]*fill="#FFFCF5"/)
})
test("carried name prints in one place, fully opaque, at >= 4.5:1 on its fill", async () => {
  const { drawerLight } = await import("../registry/jbm/motion/cajon.tsx")
  const from = tableFolderGeometry({ x: 0, y: 80 }, 100),
    to = tableFolderGeometry({ x: 220, y: 70 }, 190)
  const path = [folderGrip(from), folderGrip(to)]
  const lum = (hex) =>
    [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
      .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0)
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
  const cases = [
    ["#C63D24", "front"],
    ["#20241F", "front"],
    ["#FFFCF5", "tab"],
    ...[1, 0.9, 0.8, 0.72].map((k) => [drawerLight(k), "tab"]),
  ]
  for (const [fill, place] of cases)
    for (const progress of [0, 0.3, 0.5, 0.7, 1]) {
      const m = render(FolderCarry, { from, to, path, progress, label: "proyecto", fill })
      const texts = [...m.matchAll(/<text([^>]*)>proyecto<\/text>/g)]
      assert.equal(texts.length, 1, `${fill} @${progress}: one copy of the name`)
      assert.ok(!/opacity/.test(texts[0][1]), "no crossfade")
      assert.equal(/font-family="[^"]*Mono/.test(texts[0][1]), place === "front", `${fill}: on the ${place}`)
      const ink = texts[0][1].match(/fill="(#[0-9A-Fa-f]{6})"/)[1]
      assert.ok(ratio(ink, fill) >= 4.5, `${ink} on ${fill}: ${ratio(ink, fill).toFixed(2)}`)
    }
  // A caller can put the name on the tab of a vermilion folder (Cajon's accent folder): card on it.
  const tab = render(FolderCarry, { from, to, path, progress: 0.5, label: "proyecto", labelOn: "tab" })
  assert.match(tab, /<text[^>]*font-weight="800"[^>]*fill="#FFFCF5"[^>]*>proyecto/)
})
test("carry label: ink on light drawer shades, whole names, Cajon's type at the handoff", async () => {
  const { cajonLayout, drawerLight } = await import("../registry/jbm/motion/cajon.tsx")
  const name = "Training Within Industry 1940s"
  const l = cajonLayout({ folders: [{ name: "Anthropic 2024" }, { name }], open: 1 })
  const from = l.folders[1],
    to = tableFolderGeometry({ x: 220, y: 70 }, 190)
  const path = [folderGrip(from), folderGrip(to)]
  for (const k of [1, 0.9, 0.8, 0.72]) {
    const m = render(FolderCarry, { from, to, path, progress: 0, label: name, fill: drawerLight(k) })
    assert.match(m, /<text[^>]*fill="#20241F"/, `k ${k}`)
    assert.ok(m.includes(`>${name}</text>`), "the tab shows the whole name")
  }
  const m = render(FolderCarry, { from, to, path, progress: 0, label: name, fill: drawerLight(0.8) })
  // Same size as the drawer's tab names, and the fold line sits on the drawer's flap line.
  assert.ok(m.includes(`font-size="${l.labelSize}"`))
  const [, fx, fy] = m.match(/<path d="M([-\d.]+) ([-\d.]+)H[-\d.]+" stroke/).map(Number)
  assert.ok(Math.abs(fx - from.x) < 1e-6 && Math.abs(fy - from.flap) < 1e-6)
})
