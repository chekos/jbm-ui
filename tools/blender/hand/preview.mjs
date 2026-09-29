// Render the real Pluma and Hand with a pose traced by rig.py --draw (out/<pose>.hand.json)
// swapped in, beside pinch, as a contact sheet: out/<pose>.pluma.svg and .png.
//
//   node tools/blender/hand/preview.mjs write
//
// The registry files are copied to out/registry with the traced path, front, and pen placement
// patched in; nothing in registry/ changes.
import { execFileSync } from "node:child_process"
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { registerHooks } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "../../..")
const out = join(here, "out")
const pose = process.argv[2] ?? "write"
const traced = JSON.parse(readFileSync(join(out, `${pose}.hand.json`), "utf8"))
const copy = join(out, "registry")
cpSync(join(root, "registry/jbm"), copy, { recursive: true })

const handFile = join(copy, "ui/hand.tsx")
let hand = readFileSync(handFile, "utf8")
hand = hand.replace(new RegExp(`(\\n  ${pose}: \\[\\s*\\{\\s*d: )"[^"]+"`), `$1${JSON.stringify(traced.d)}`)
hand = hand.replace(new RegExp(`(\\n  ${pose}: )"M[^"]+"`), `$1${JSON.stringify(traced.front)}`)
writeFileSync(handFile, hand)
if (traced.pen) {
  const plumaFile = join(copy, "motion/pluma.tsx")
  const { grip, nib, tailLength } = traced.pen
  const geo = `${pose}: { grip: { x: ${grip[0]}, y: ${grip[1]} }, nib: { x: ${nib[0]}, y: ${nib[1]} }, tail: ${tailLength} },`
  writeFileSync(plumaFile, readFileSync(plumaFile, "utf8").replace(new RegExp(`\\n  ${pose}: \\{ grip:[^\\n]+`), `\n  ${geo}`))
}

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith(pathToFileURL(copy + "/").href)) {
      const base = fileURLToPath(new URL(specifier, context.parentURL))
      for (const ext of [".ts", ".tsx"]) if (existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.startsWith(pathToFileURL(copy + "/").href) && /\.tsx?$/.test(url))
      return {
        format: "module",
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
        }).outputText,
        shortCircuit: true,
      }
    return next(url, context)
  },
})
const { Hand } = await import(pathToFileURL(join(copy, "ui/hand.tsx")).href)
const { Pluma, plumaNib } = await import(pathToFileURL(join(copy, "motion/pluma.tsx")).href)
const { renderToStaticMarkup } = await import(join(root, "node_modules/react-dom/server.js"))
const React = await import(join(root, "node_modules/react/index.js"))
const h = React.createElement

// Each cell: a word ending where the nib writes, the hand at a scene's size and tilt.
const cells = []
const W = 360, H = 250
const tilts = [
  ["write", -45, 180], ["write", -20, 180], ["write", 20, 150], ["write", 35, 150],
  ["pinch", 20, 150], ["pinch", 35, 150],
]
tilts.forEach(([p, angle, size], i) => {
  const nib = { x: 150, y: 150 }
  const o = plumaNib({ x: 0, y: 0 }, angle, undefined, size, p)
  const at = { x: nib.x - o.x, y: nib.y - o.y }
  const pluma = renderToStaticMarkup(h("svg", null, h(Pluma, { at, angle, size, pose: p }))).replace(/^<svg>|<\/svg>$/g, "")
  const x = (i % 3) * W, y = Math.floor(i / 3) * H
  cells.push(`<g transform="translate(${x} ${y})"><rect width="${W - 8}" height="${H - 8}" rx="6" fill="#fbf8f1" stroke="#ddd"/>` +
    `<text x="${nib.x - 6}" y="${nib.y}" text-anchor="end" font-family="Geist, sans-serif" font-weight="700" font-size="44" fill="#111212">bi</text>${pluma}` +
    `<text x="10" y="${H - 18}" font-family="monospace" font-size="12" fill="#888">${p} · ${angle}° · ${size}</text></g>`)
})
const bare = renderToStaticMarkup(h(Hand, { pose, width: 240 }))
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${3 * W + 260}" height="${2 * H}" viewBox="0 0 ${3 * W + 260} ${2 * H}">` +
  `<rect width="100%" height="100%" fill="#fff"/>${cells.join("")}<g transform="translate(${3 * W + 10} 20)">${bare}</g></svg>\n`
const file = join(out, `${pose}.pluma.svg`)
writeFileSync(file, sheet)
execFileSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless", "--disable-gpu", "--hide-scrollbars", `--screenshot=${file.replace(/svg$/, "png")}`, `--window-size=${3 * W + 260},${2 * H}`, `file://${file}`], { stdio: "ignore" })
console.log(`preview.mjs: wrote ${file} and .png`)
