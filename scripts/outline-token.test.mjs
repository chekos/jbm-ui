// One ink outline for every desk, paper, and thread object (issue #163). The components are loaded
// with the shared token patched to a value no component hardcodes (5), so every outline that
// renders at 5 stage px provably reads it from lib/tokens rather than from a local literal.
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, resolve } from "node:path"
import ts from "typescript"
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const TOKENS = resolve(root, "registry/jbm/lib/tokens.ts")
const PROBE = 5
const tokenSource = readFileSync(TOKENS, "utf8")
const DECLARATION = "export const stroke = { outline: 3 } as const"
let patched = false
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
    ) {
      let text = readFileSync(fileURLToPath(url), "utf8")
      if (fileURLToPath(url) === TOKENS) {
        patched = text.includes(DECLARATION)
        text = text.replace(DECLARATION, `export const stroke = { outline: ${PROBE} } as const`)
      }
      return {
        format: "module",
        source: ts.transpileModule(text, {
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            jsx: ts.JsxEmit.ReactJSX,
          },
        }).outputText,
        shortCircuit: true,
      }
    }
    return next(url, context)
  },
})
const reg = (p) => import(pathToFileURL(resolve(root, "registry/jbm", p)).href)
const { stroke, outlineIn } = await reg("lib/tokens.ts")
const { Hand, handPoses, handOutline } = await reg("ui/hand.tsx")
const { Mano } = await reg("motion/mano.tsx")
const { Folder, FolderOutline } = await reg("ui/folder.tsx")
const { FolderCarry, tableFolderGeometry } = await reg("ui/folder-carry.tsx")
const { FolderContents } = await reg("ui/folder-contents.tsx")
const { FileCabinet } = await reg("ui/file-cabinet.tsx")
const { Cajon } = await reg("motion/cajon.tsx")
const { Escritorio } = await reg("motion/escritorio.tsx")
const { DeskTop } = await reg("ui/desk-top.tsx")
const { DeskProp } = await reg("ui/desk-prop.tsx")
const { Bandeja } = await reg("motion/bandeja.tsx")
const { ToolCaddy } = await reg("motion/tool-caddy.tsx")
const { Document } = await reg("ui/document.tsx")
const { Paper } = await reg("ui/paper.tsx")
const { Tear } = await reg("ui/tear.tsx")
const { Register } = await reg("ui/register.tsx")
const { Slip } = await reg("ui/slip.tsx")
const { Hilo } = await reg("ui/hilo.tsx")
const { VideoPrint } = await reg("ui/video-print.tsx")
const { PunchedTag } = await reg("ui/punched-tag.tsx")
const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")
const h = React.createElement
const html = (el) => renderToStaticMarkup(el)
const svg = (el) => html(h("svg", null, el))
/** Every stroke width an element renders, as numbers (attributes and CSS borders). */
const widths = (markup) => [
  ...[...markup.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => Number(m[1])),
]
const borders = (markup) =>
  [...markup.matchAll(/border:([\d.]+)px solid (#[0-9A-Fa-f]{6})/g)].map((m) => ({
    w: Number(m[1]),
    c: m[2].toUpperCase(),
  }))
const close = (a, b) => Math.abs(a - b) < 1e-3

test("the shared outline is 3 stage px, and outlineIn converts it to local units", () => {
  assert.ok(patched, "tokens.ts declares the outline the probe patches")
  assert.match(tokenSource, /export const stroke = \{ outline: 3 \} as const/)
  assert.equal(stroke.outline, PROBE)
  assert.equal(outlineIn(), PROBE)
  assert.ok(close(outlineIn(30 / 180), PROBE / 6))
  for (const bad of [0, -1, NaN, Infinity]) assert.equal(outlineIn(bad), PROBE)
})

test("Hand: every pose's outline is the token at the default 180px size", () => {
  // The Hand draws 30 viewBox units across 180 px; open, grip, type, and hold sit at scale 0.48, write at 0.45.
  const scale = { open: 0.48, point: 1, pinch: 1, grip: 0.48, type: 0.48, hold: 0.48, write: 0.45 }
  for (const pose of handPoses) {
    const markup = html(h(Hand, { pose }))
    const px = widths(markup).map((w) => w * scale[pose] * 6)
    assert.ok(px.length > 0, pose)
    for (const w of px) assert.ok(Math.abs(w - PROBE) < 0.01, `${pose}: ${w}`)
    assert.ok(Math.abs(handOutline(pose).strokeWidth * scale[pose] * 6 - PROBE) < 0.01)
    // The halo stays a multiplier on the outline: twice it, centred on the contour.
    const halo = widths(html(h(Hand, { pose, halo: true })))
    assert.ok(close(halo[0], 2 * handOutline(pose).strokeWidth), `${pose} halo`)
  }
  // Mano at its default size is the same drawing.
  const mano = widths(svg(h(Mano, { at: { x: 0, y: 0 }, pose: "point" })))
  for (const w of mano) assert.ok(Math.abs(w * 6 - PROBE) < 0.01)
})

test("desk, folder, and drawer objects stroke their outlines with the token", () => {
  const cases = {
    Folder: html(h(Folder, { label: "Doorways", open: 0.5 })),
    FolderOutline: svg(h(FolderOutline, {})),
    FolderCarry: svg(
      h(FolderCarry, {
        from: tableFolderGeometry({ x: 0, y: 0 }, 260),
        to: tableFolderGeometry({ x: 300, y: 0 }, 260),
        path: [{ x: 0, y: 0 }, { x: 300, y: 0 }],
        progress: 0.5,
        label: "Tutorial",
      })
    ),
    FolderContents: html(
      h(FolderContents, { entries: [{ id: "a", label: "a", document: "b.md", documentReveal: 1 }] })
    ),
    Cajon: svg(h(Cajon, { folders: [{ name: "Grove 1983" }, { name: "Procida" }], open: 1 })),
    FileCabinet: svg(h(FileCabinet, { folders: [{ name: "Grove 1983" }], open: 1 })),
    Escritorio: svg(
      h(Escritorio, { box: { x: 0, y: 0, w: 640, h: 360 }, cabinet: true, folders: [{ name: "a" }] })
    ),
    DeskTop: svg(h(DeskTop, { box: { x: 0, y: 0, w: 600, h: 360 }, drawer: "end", edge: 1 })),
    Bandeja: svg(h(Bandeja, { layers: 2 })),
    Document: html(h(Document, { label: "a" })),
    Hilo: svg(h(Hilo, { from: { x: 0, y: 0 }, to: { x: 200, y: 50 } })),
  }
  for (const [name, markup] of Object.entries(cases)) {
    const ws = widths(markup)
    assert.ok(ws.includes(PROBE), `${name} draws its outline at the token`)
  }
  // Escritorio's wood grain is a texture line, not an outline; every other stroke is the token.
  for (const name of ["FolderOutline", "Cajon", "FileCabinet", "DeskTop", "Bandeja", "Hilo"])
    for (const w of widths(cases[name])) assert.equal(w, PROBE, name)
})

test("scaled desk objects keep the token in parent units", () => {
  for (const scale of [0.5, 1, 2]) {
    for (const kind of ["keycap", "keyboard", "mug", "mug-side"]) {
      const ws = widths(svg(h(DeskProp, { kind, x: 0, y: 0, scale })))
      assert.ok(ws.length > 0)
      // A small keyboard caps its key outlines at half the 6-unit key gap (3 × scale parent
      // units) so the keys never fuse; the case keeps the token.
      const keyCap = kind === "keyboard" ? Math.min(PROBE, 3 * scale) : PROBE
      assert.ok(close(ws[0] * scale, PROBE), `${kind} ×${scale}`)
      for (const w of ws) assert.ok(close(w * scale, PROBE) || close(w * scale, keyCap), `${kind} ×${scale}`)
    }
    // An explicit weight still wins.
    assert.ok(widths(svg(h(DeskProp, { kind: "mug", x: 0, y: 0, scale, weight: 2 }))).every((w) => close(w * scale, 2)))
  }
  for (const w of [120, 240, 480]) {
    const ws = widths(svg(h(ToolCaddy, { w })))
    for (const x of ws) assert.ok(close((x * w) / 240, PROBE), `ToolCaddy w ${w}`)
  }
})

test("paper objects draw their ink edge at the token", () => {
  const ink = "#20241F"
  const paper = borders(html(h(Paper, { w: 200, h: 100 }, "x")))
  assert.deepEqual(paper, [{ w: PROBE, c: ink }])
  // Tension and tab: the layered sheet, its tab, and the tear's lips all take the token.
  const layered = html(h(Paper, { w: 360, h: 240, tension: 1, tab: { label: "Tutorial" } }, "x"))
  assert.ok(borders(layered).filter((b) => b.c === ink).every((b) => b.w === PROBE))
  assert.ok(widths(layered).includes(PROBE), "tear lips")
  const tear = html(h(Tear, { w: 300, h: 300, seams: [150], progress: 0.5, pieces: [{}, { to: { y: 40 } }] }))
  assert.ok(widths(tear).includes(PROBE))
  const register = html(h(Register, { kind: "prose", w: 360, h: 460 }))
  assert.ok(borders(register).some((b) => b.w === PROBE && b.c === ink))
  const slip = html(h(Slip, {}))
  assert.match(slip, new RegExp(`<rect x="${PROBE / 2}" y="${PROBE / 2}"[^>]*stroke-width="${PROBE}"`))
  const tag = html(h(PunchedTag, null, "tag"))
  assert.equal(borders(tag).filter((b) => b.c === ink && b.w === PROBE).length, 1, "hole ring")
  assert.ok(tag.includes(`border:${PROBE}px solid transparent`), "the edge's room")
  assert.ok(tag.includes(`inset:-${PROBE}px;background:${ink}`), "the ink edge layer covers the edge's room")
  assert.ok(tag.includes("inset:0;background:#FFFCF5"), "the stock layer inside the edge")
  const print = html(h(VideoPrint, { scrub: 0.5, title: "t", date: "d", link: "x" }))
  assert.ok(widths(print).includes(PROBE), "the still's frame")
  assert.ok(borders(print).some((b) => b.w === PROBE && b.c === ink), "the print's sheet")
})

test("listed components import the outline from lib/tokens and hardcode no outline width", () => {
  const files = [
    "ui/hand.tsx",
    "ui/folder.tsx",
    "ui/folder-carry.tsx",
    "ui/folder-contents.tsx",
    "ui/file-cabinet.tsx",
    "motion/cajon.tsx",
    "motion/escritorio.tsx",
    "ui/desk-top.tsx",
    "ui/desk-prop.tsx",
    "motion/bandeja.tsx",
    "motion/tool-caddy.tsx",
    "ui/document.tsx",
    "ui/paper.tsx",
    "ui/tear.tsx",
    "ui/register.tsx",
    "ui/slip.tsx",
    "ui/hilo.tsx",
    "ui/video-print.tsx",
    "ui/punched-tag.tsx",
  ]
  for (const f of files) {
    const src = readFileSync(resolve(root, "registry/jbm", f), "utf8")
    assert.match(src, /import \{[^}]*\b(stroke|outlineIn)\b[^}]*\} from "\.\.\/lib\/tokens"/, f)
    // Ink outlines never carry a numeric literal (writing and texture lines in line tone may).
    assert.doesNotMatch(src, /stroke=\{color\.ink\}\s*strokeWidth=\{[\d.]+\}/, f)
    assert.doesNotMatch(src, /strokeWidth: "[\d.]+"/, f)
    assert.doesNotMatch(src, /\b2px solid\b/, f)
  }
})

test("Bandeja: no sheet edge lands within a pitch of the back rim, and the stack stays inside the posts", () => {
  const pitch = PROBE + 2
  for (let layers = 0; layers <= 12; layers++) {
    const markup = svg(h(Bandeja, { layers, landing: 0 }))
    const paths = [...markup.matchAll(/<path d="([^"]+)"/g)].map((m) => m[1])
    // The first path is the tray's back well; the last two are the walls and the front lip.
    for (const d of paths.slice(1, -2)) {
      const pts = [...d.matchAll(/(-?[\d.]+)[ ,](-?[\d.]+)/g)].map((m) => ({ x: +m[1], y: +m[2] }))
      for (const m of d.matchAll(/(?:^M|L)(-?[\d.]+) (-?[\d.]+)|V(-?[\d.]+)/g)) {
        const y = +(m[2] ?? m[3])
        assert.ok(y === 16 || Math.abs(y - 16) >= pitch, `layers ${layers}: an edge at y ${y} fuses with the rim`)
      }
      for (const p of pts) assert.ok(p.x >= 22 + pitch && p.x <= 280 - 22 - pitch, `layers ${layers}: the stack reaches past a wall post (${p.x})`)
    }
  }
})
