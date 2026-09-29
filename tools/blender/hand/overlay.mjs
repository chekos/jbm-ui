// Compare a posed rig (out/<pose>.json from rig.py) with the shipped Hand pose.
//
//   node tools/blender/hand/overlay.mjs grip
//
// Writes out/<pose>.draft.svg (the rig's capsules drawn back to front at the Hand's outline weight:
// a construction draft, never shipped as is) and out/<pose>.overlay.svg/.png (the shipped pose in
// red over the draft in blue, reference landmarks as red dots joined to the rig's in blue), and
// prints each landmark's distance in path units.
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, "out")
const pose = process.argv[2]
if (!pose) throw new Error("usage: overlay.mjs <pose>")

const rig = JSON.parse(readFileSync(join(out, `${pose}.json`), "utf8"))
const spec = JSON.parse(readFileSync(join(here, "rig.json"), "utf8"))
const { reference = {} } = JSON.parse(readFileSync(join(here, "poses.json"), "utf8"))[pose]
const hand = readFileSync(join(here, "../../../registry/jbm/ui/hand.tsx"), "utf8")
const shipped = hand.match(new RegExp(`\\n  ${pose}: \\[\\s*\\{\\s*d: "([^"]+)"`))?.[1]

// The Hand's outline token (3 stage px, 30 viewBox units per 180 px) in 0.48-scaled path units.
const OUTLINE = (3 * 30) / 180 / 0.48
const R = spec.radius
const [X, Y, W, H] = [10, 9, 64, 62]
const f = (n) => +n.toFixed(3)

function stadium([ax, ay], [bx, by], r) {
  const len = Math.hypot(bx - ax, by - ay)
  if (len < 0.01) return `M${f(ax - r)} ${f(ay)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0Z`
  const [nx, ny] = [(-(by - ay) / len) * r, ((bx - ax) / len) * r]
  return `M${f(ax + nx)} ${f(ay + ny)}L${f(bx + nx)} ${f(by + ny)}A${r} ${r} 0 0 0 ${f(bx - nx)} ${f(by - ny)}L${f(ax - nx)} ${f(ay - ny)}A${r} ${r} 0 0 0 ${f(ax + nx)} ${f(ay + ny)}Z`
}

function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list) =>
    list.reduce((h, q) => {
      while (h.length > 1 && cross(h.at(-2), h.at(-1), q) <= 0) h.pop()
      return [...h, q]
    }, [])
  const lower = half(p)
  const upper = half([...p].reverse())
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

// Back to front: larger depth is farther from the camera. The palm sits at its bones' depth.
const parts = [
  { d: `M${hull(rig.palm).map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`, depth: 0 },
  ...Object.entries(rig.bones)
    .filter(([name]) => name !== "hand")
    .map(([, b]) => ({ d: stadium(b.head, b.tail, R), depth: (b.depth[0] + b.depth[1]) / 2 })),
].sort((a, b) => b.depth - a.depth)

const svg = (body, px = 1280) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${X} ${Y} ${W} ${H}" width="${px}" height="${Math.round((px * H) / W)}">\n<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="#fff"/>\n${body}\n</svg>\n`

const draft = parts
  .map((p) => `<path d="${p.d}" fill="#fff" stroke="#111" stroke-width="${f(OUTLINE)}" stroke-linejoin="round"/>`)
  .join("\n")
writeFileSync(join(out, `${pose}.draft.svg`), svg(draft))

const rows = []
const marks = Object.entries(reference)
  .filter(([name]) => !name.startsWith("$"))
  .map(([name, [rx, ry]]) => {
    const [x, y] = rig.points[name]
    rows.push({ landmark: name, reference: `${rx}, ${ry}`, rig: `${f(x)}, ${f(y)}`, off: f(Math.hypot(x - rx, y - ry)) })
    return `<line x1="${rx}" y1="${ry}" x2="${x}" y2="${y}" stroke="#06c" stroke-width="0.15"/><circle cx="${rx}" cy="${ry}" r="0.45" fill="#d22"/><circle cx="${x}" cy="${y}" r="0.35" fill="#06c"/>`
  })
const overlay = [
  ...parts.map((p) => `<path d="${p.d}" fill="#fff" fill-opacity="0.6" stroke="#06c" stroke-width="0.2"/>`),
  shipped ? `<path d="${shipped}" fill="none" stroke="#d22" stroke-width="0.25" stroke-linejoin="round"/>` : "",
  ...marks,
].join("\n")
const overlaySvg = join(out, `${pose}.overlay.svg`)
writeFileSync(overlaySvg, svg(overlay))

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
try {
  execFileSync(chrome, ["--headless", "--disable-gpu", "--hide-scrollbars", `--screenshot=${join(out, `${pose}.overlay.png`)}`, "--window-size=1280,1240", `file://${overlaySvg}`], { stdio: "ignore" })
} catch {
  console.warn("overlay.mjs: no headless Chrome; open the .svg instead")
}
console.table(rows)
const offs = rows.map((r) => r.off)
if (offs.length) console.log(`max ${Math.max(...offs)}, mean ${f(offs.reduce((a, b) => a + b, 0) / offs.length)} path units`)
