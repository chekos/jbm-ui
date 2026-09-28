// Geometry invariants for the top-down desk pieces: DeskTop, Ejes, DeskProp.
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

const { color } = await import("../registry/jbm/lib/tokens.ts")
const { DeskTop, deskTopLayout, deskShade, deskLight, DESK_EDGE } =
  await import("../registry/jbm/ui/desk-top.tsx")
const { Ejes, ejesLayout, quadrants, EJES_TYPE } =
  await import("../registry/jbm/ui/ejes.tsx")
const { DeskProp, deskPropLayout, deskPropSize, deskPropKeys } =
  await import("../registry/jbm/ui/desk-prop.tsx")
const { renderToStaticMarkup } = await import("react-dom/server")
const React = await import("react")
const svg = (el) => renderToStaticMarkup(React.createElement("svg", null, el))

const inside = (inner, outer, eps = 1e-6) =>
  inner.x >= outer.x - eps &&
  inner.y >= outer.y - eps &&
  inner.x + inner.w <= outer.x + outer.w + eps &&
  inner.y + inner.h <= outer.y + outer.h + eps
const overlaps = (a, b) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

test("the desk pieces typecheck with only their own published dependencies", () => {
  const temp = mkdtempSync(join(tmpdir(), "jbm-desk-surface-"))
  try {
    for (const name of ["desk-top", "ejes", "desk-prop"]) {
      const seen = new Set()
      const install = (itemName) => {
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
      const item = JSON.parse(
        readFileSync(join(root, "public/r", name + ".json"), "utf8")
      )
      assert.ok(!(item.dependencies ?? []).includes("remotion"), name)
      for (const file of item.files)
        assert.ok(!/from "remotion"/.test(file.content), `${name} imports remotion`)
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

test("DeskTop: tilt and drawer never move the box; parts tile it without overlap", () => {
  const box = { x: 31, y: 17, w: 760, h: 460 }
  for (const drawer of [undefined, "start", "end", "top", "bottom"])
    for (const edge of [0, 0.25, 0.5, 1, 2, -1])
      for (const drawerSize of [undefined, 0, 150, 5000]) {
        const l = deskTopLayout({ box, edge, drawer, drawerSize })
        assert.deepEqual(l.box, box)
        assert.equal(l.front.h, DESK_EDGE * Math.max(0, Math.min(1, edge)))
        assert.equal(l.front.y + l.front.h, box.y + box.h)
        assert.ok(inside(l.surface, box))
        assert.ok(l.surface.w > 0 && l.surface.h > 0)
        assert.ok(l.surface.y + l.surface.h <= l.front.y + 1e-6)
        if (!drawer) {
          assert.equal(l.drawer, null)
          assert.equal(l.surface.w, box.w)
          continue
        }
        assert.ok(inside(l.drawer.panel, box))
        assert.ok(inside(l.drawer.well, l.drawer.panel))
        assert.ok(!overlaps(l.drawer.panel, l.surface))
        assert.ok(!overlaps(l.drawer.panel, l.front))
        // The seam between surface and drawer is 6 units wide.
        const gap =
          drawer === "start"
            ? l.surface.x - (l.drawer.panel.x + l.drawer.panel.w)
            : drawer === "end"
              ? l.drawer.panel.x - (l.surface.x + l.surface.w)
              : drawer === "top"
                ? l.surface.y - (l.drawer.panel.y + l.drawer.panel.h)
                : l.drawer.panel.y - (l.surface.y + l.surface.h)
        assert.ok(Math.abs(gap - 6) < 1e-6, `${drawer} seam ${gap}`)
      }
})

test("DeskTop light is OKLab lightness on the cream token: 1 is the token, lower is darker", () => {
  assert.equal(deskShade(color.bg, 1).toUpperCase(), color.bg.toUpperCase())
  const luma = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)
  let last = Infinity
  for (const k of [1, 0.9, 0.8, 0.72, 0.5]) {
    const l = luma(deskShade(color.bg, k))
    assert.ok(l < last)
    last = l
  }
  const markup = svg(React.createElement(DeskTop, { box: { x: 0, y: 0, w: 400, h: 300 }, drawer: "end", edge: 1 }))
  assert.ok(markup.includes("Desk seen from above, with a drawer"))
  assert.ok(!markup.includes(color.accent), "no vermilion on the desk")
})

const { sansWidth } = await import("../registry/jbm/lib/tokens.ts")
const labels = { top: "hacer", bottom: "entender", left: "aprender", right: "trabajar" }
const box = { x: 20, y: 20, w: 760, h: 460 }

test("Ejes: each axis stays in the box, grows only with its own progress, and spans it at 1", () => {
  for (const origin of ["center", "start"])
    for (const center of [undefined, { x: 250, y: 160 }, { x: -50, y: 900 }])
      for (const p of [0, 0.3, 0.5, 1, 1.5]) {
        const l = ejesLayout({ box, center, origin, h: p, v: 0 })
        assert.ok(l.horizontal.x1 >= box.x - 1e-9 && l.horizontal.x2 <= box.x + box.w + 1e-9)
        assert.equal(l.vertical.y1, l.vertical.y2, "v 0 draws no vertical axis")
        assert.ok(l.center.x >= box.x && l.center.x <= box.x + box.w)
        const full = ejesLayout({ box, center, origin, h: 1, v: 1 })
        assert.equal(full.horizontal.x1, box.x)
        assert.equal(full.horizontal.x2, box.x + box.w)
        assert.equal(full.vertical.y1, box.y)
        assert.equal(full.vertical.y2, box.y + box.h)
      }
})

test("Ejes labels arrive with their axis and shrink to quiet at the same ends", () => {
  for (const origin of ["center", "start"]) {
    const none = ejesLayout({ box, origin, h: 0, v: 0 })
    for (const side of ["top", "bottom", "left", "right"])
      assert.equal(none.labels[side].opacity, 0)
    const drawn = ejesLayout({ box, origin, h: 1, v: 1 })
    for (const side of ["top", "bottom", "left", "right"])
      assert.equal(drawn.labels[side].opacity, 1, `${origin} ${side}`)
    const hOnly = ejesLayout({ box, origin, h: 1, v: 0 })
    assert.equal(hOnly.labels.top.opacity, 1)
    assert.equal(hOnly.labels.left.opacity, 0)
  }
  const early = ejesLayout({ box, h: 0.2, v: 0, reveal: { top: 1 } })
  assert.equal(early.labels.top.opacity, 1)
  assert.equal(early.labels.bottom.opacity, 0)
  const full = ejesLayout({ box, h: 1, v: 1 })
  const quiet = ejesLayout({ box, h: 1, v: 1, quiet: true })
  assert.equal(full.type.size, EJES_TYPE.full)
  assert.equal(quiet.type.size, EJES_TYPE.quiet)
  assert.equal(ejesLayout({ box, h: 1, v: 1, quiet: 0.5 }).type.size, (EJES_TYPE.full + EJES_TYPE.quiet) / 2)
  for (const side of ["top", "bottom", "left", "right"]) {
    assert.equal(quiet.labels[side].x, full.labels[side].x)
    assert.equal(quiet.labels[side].y, full.labels[side].y)
  }
})

test("Ejes focus outlines stay in their quadrant and clear the labels", () => {
  // Generous label boxes: 0.62 em per character, full line height.
  const labelBox = (l, side) => {
    const t = l.labels[side]
    const w = labels[side].length * l.type.size * 0.62
    const x = t.anchor === "end" ? t.x - w : t.x
    const y = t.baseline === "auto" ? t.y - l.type.size : t.y
    return { x, y, w, h: l.type.size }
  }
  for (const quiet of [0, 0.5, 1])
    for (const center of [undefined, { x: 330, y: 200 }]) {
      const l = ejesLayout({ box, center, h: 1, v: 1, quiet, labels })
      for (const q of quadrants) {
        assert.ok(inside(l.focus[q], l.quadrants[q]), q)
        for (const side of ["top", "bottom", "left", "right"])
          assert.ok(!overlaps(l.focus[q], labelBox(l, side)), `${q} crosses ${side} at quiet ${quiet}`)
      }
    }
})

test("Ejes: all four focus outlines form one aligned set", () => {
  for (const quiet of [0, 1])
    for (const center of [undefined, { x: 330, y: 200 }, { x: 520, y: 300 }]) {
      const f = ejesLayout({ box, center, h: 1, v: 1, quiet, labels }).focus
      assert.ok(Math.abs(f.tl.y - f.tr.y) < 1e-9, "top edges")
      assert.ok(Math.abs(f.tl.y + f.tl.h - (f.tr.y + f.tr.h)) < 1e-9, "edges above the axis")
      assert.ok(Math.abs(f.bl.y - f.br.y) < 1e-9, "edges below the axis")
      assert.ok(Math.abs(f.bl.y + f.bl.h - (f.br.y + f.br.h)) < 1e-9, "bottom edges")
    }
})

test("Ejes: an off-centre crossing is clamped so labels stay in the box; tiny outlines are dropped", () => {
  const small = { x: 0, y: 0, w: 580, h: 380 }
  for (const center of [{ x: 90, y: 300 }, { x: 10, y: 10 }, { x: 570, y: 370 }, { x: 290, y: 190 }])
    for (const quiet of [0, 1]) {
      const l = ejesLayout({ box: small, center, h: 1, v: 1, quiet, labels })
      const width = (side) => sansWidth(labels[side], l.type.size)
      // Left label ends before the box edge; top/bottom labels end before the vertical axis.
      assert.ok(l.labels.left.x - width("left") >= small.x - 1e-9)
      assert.ok(l.labels.top.x + width("top") <= l.center.x - 1e-9)
      assert.ok(l.labels.bottom.x + width("bottom") <= l.center.x - 1e-9)
      assert.ok(l.labels.right.x + width("right") <= small.x + small.w + 1e-9)
      assert.ok(l.labels.top.y - l.type.size >= small.y - 1e-9)
      assert.ok(l.labels.bottom.y + l.type.size <= small.y + small.h + 1e-9)
      for (const q of quadrants) {
        const b = l.focus[q]
        assert.ok((b.w === 0 && b.h === 0) || (b.w >= 40 && b.h >= 40), q)
      }
    }
  const markup = svg(React.createElement(Ejes, { box: small, h: 1, v: 1, labels, focus: "tl" }))
  assert.ok(markup.includes('stroke-width="2"'), "desk line weight by default")
})

test("Ejes is ink by default; vermilion appears only with focusTone accent", () => {
  const base = { box, h: 1, v: 1, labels, focus: ["tl", "br"] }
  for (const focusTone of [undefined, "ink", "fill"])
    assert.ok(!svg(React.createElement(Ejes, { ...base, focusTone })).includes(color.accent))
  const accent = svg(React.createElement(Ejes, { ...base, focusTone: "accent" }))
  assert.ok(accent.includes(color.accent))
  assert.equal((accent.match(/data-quadrant/g) ?? []).length, 2)
  assert.ok(!svg(React.createElement(Ejes, { ...base, focusProgress: 0 })).includes("data-quadrant"))
  const all = svg(React.createElement(Ejes, { ...base, focus: ["tl", "tl", "tr", "bl", "br"] }))
  assert.equal((all.match(/data-quadrant/g) ?? []).length, 4, "duplicates collapse")
})

test("DeskProp: contact points sit on the prop at any scale and rotation", () => {
  for (const kind of ["keycap", "keyboard", "mug"])
    for (const scale of [0.5, 1, 2])
      for (const rotate of [-30, 0, 17, 90]) {
        const l = deskPropLayout({ kind, x: 100, y: 80, scale, rotate })
        // Undo the transform and check the contact lies in the footprint.
        const a = (-rotate * Math.PI) / 180
        const dx = l.contact.x - 100, dy = l.contact.y - 80
        const lx = (dx * Math.cos(a) - dy * Math.sin(a)) / scale
        const ly = (dx * Math.sin(a) + dy * Math.cos(a)) / scale
        const { w, h } = deskPropSize[kind]
        assert.ok(Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2, `${kind} contact`)
        assert.ok(Math.abs(l.size.w - w * scale) < 1e-9)
        const side = Math.hypot(l.corners[1].x - l.corners[0].x, l.corners[1].y - l.corners[0].y)
        assert.ok(Math.abs(side - w * scale) < 1e-9)
        assert.equal(l.keys.length, kind === "keyboard" ? deskPropKeys.length : 0)
      }
})

test("DeskProp keyboard keys fit its body without overlapping; stroke stays the shared outline", () => {
  assert.equal(deskPropKeys.length, 32)
  const body = { x: -135, y: -65, w: 270, h: 130 }
  deskPropKeys.forEach((k, i) => {
    assert.ok(inside(k, { x: body.x + 6, y: body.y + 6, w: body.w - 12, h: body.h - 12 }), `key ${i}`)
    deskPropKeys.slice(i + 1).forEach((o) => assert.ok(!overlaps(k, o)))
  })
  for (const scale of [0.5, 1, 2]) {
    const markup = svg(React.createElement(DeskProp, { kind: "mug", x: 0, y: 0, scale }))
    assert.ok(markup.includes(`stroke-width="${3 / scale}"`))
    assert.ok(markup.includes('aria-label="Mug"'))
    assert.ok(!markup.includes(color.accent))
  }
  const pressed = svg(React.createElement(DeskProp, { kind: "keyboard", x: 0, y: 0, press: 1, keys: [13] }))
  assert.equal((pressed.match(new RegExp(`fill="${color.bg}"`, "g")) ?? []).length, 1)
})

test("DeskTop: a top or bottom drawer takes 40% of the height; every fill follows light", () => {
  const box = { x: 0, y: 0, w: 580, h: 380 }
  for (const drawer of ["top", "bottom"]) {
    const l = deskTopLayout({ box, drawer })
    assert.ok(Math.abs(l.drawer.panel.h + 6 - 0.4 * 380) < 1e-6, drawer)
    assert.ok(l.surface.h > 0.55 * 380, `${drawer} leaves the surface most of the desk`)
  }
  const dim = svg(React.createElement(DeskTop, { box, drawer: "end", edge: 1, light: 0.72 }))
  assert.ok(!dim.includes(`fill="${color.card}"`), "the handle dims with the desk")
  assert.ok(dim.includes(`fill="${deskLight(color.card, 0.72)}"`))
})
test("DeskProp press reads: the pressed face insets and takes an ink wash", () => {
  const key = svg(React.createElement(DeskProp, { kind: "keyboard", x: 0, y: 0, press: 1, keys: [13] }))
  assert.match(key, /data-key="13"><rect x="[-\d.]+" y="[-\d.]+" width="16"/)
  assert.ok(key.includes('fill-opacity="0.28"'))
  const cap = svg(React.createElement(DeskProp, { kind: "keycap", x: 0, y: 0, press: 1 }))
  assert.ok(cap.includes('fill-opacity="0.28"'))
  assert.ok(!svg(React.createElement(DeskProp, { kind: "keycap", x: 0, y: 0 })).includes("fill-opacity"))
})

test("DeskTop light stays on the palette: cream at 1, the line token at 0.72, then toward ink", () => {
  assert.equal(deskLight(color.bg, 1).toUpperCase(), color.bg.toUpperCase())
  assert.equal(deskLight(color.bg, 0.72).toUpperCase(), color.line.toUpperCase())
  assert.equal(deskLight(color.card, 0.72).toUpperCase(), color.line.toUpperCase())
  assert.equal(deskLight(color.bg, 0).toUpperCase(), color.ink.toUpperCase())
  const luma = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)
  let last = Infinity
  for (const k of [1, 0.9, 0.8, 0.72, 0.6, 0.3, 0]) {
    const l = luma(deskLight(color.bg, k))
    assert.ok(l < last, `k ${k}`)
    last = l
  }
})

test("DeskTop drawer: a pulled-out box narrower than the desk, one pull on its outer front", () => {
  const box = { x: 31, y: 17, w: 760, h: 460 }
  for (const drawer of ["start", "end", "top", "bottom"])
    for (const edge of [0, 1])
      for (const drawerSize of [undefined, 0, 5000]) {
        const l = deskTopLayout({ box, edge, drawer, drawerSize })
        const d = l.drawer
        assert.ok(inside(d.body, d.panel), `${drawer} body`)
        assert.ok(inside(d.well, d.body) && inside(d.front, d.body) && inside(d.pull, d.front), drawer)
        assert.ok(!overlaps(d.well, d.front), `${drawer} opening stops at the front`)
        // The front sits on the region's outer edge.
        const outer =
          drawer === "start" ? d.front.x === d.panel.x
          : drawer === "end" ? Math.abs(d.front.x + d.front.w - (d.panel.x + d.panel.w)) < 1e-6
          : drawer === "top" ? d.front.y === d.panel.y
          : Math.abs(d.front.y + d.front.h - (d.panel.y + d.panel.h)) < 1e-6
        assert.ok(outer, `${drawer} front on the outer edge`)
        // Narrower than the desk along the seam, so it reads as pulled out.
        const along = drawer === "start" || drawer === "end" ? ["h", "y"] : ["w", "x"]
        assert.ok(d.body[along[0]] < d.panel[along[0]], drawer)
      }
  const markup = svg(React.createElement(DeskTop, { box, drawer: "bottom", edge: 1 }))
  assert.equal((markup.match(new RegExp(`fill="${color.ink}"`, "g")) ?? []).length, 1, "one pull bar")
})

test("Ejes: the four focus outlines are the same size", () => {
  for (const quiet of [0, 0.5, 1])
    for (const center of [undefined, { x: 330, y: 200 }, { x: 520, y: 300 }]) {
      const f = ejesLayout({ box, center, h: 1, v: 1, quiet, labels }).focus
      for (const q of ["tr", "bl", "br"]) {
        assert.ok(Math.abs(f[q].w - f.tl.w) < 1e-9, `${q} width`)
        assert.ok(Math.abs(f[q].h - f.tl.h) < 1e-9, `${q} height`)
      }
      assert.ok(Math.abs(f.tl.x + f.tl.w - (f.bl.x + f.bl.w)) < 1e-9)
      assert.ok(Math.abs(f.tr.x - f.br.x) < 1e-9)
    }
})

test("Ejes accent marks one quadrant only; the rest of the set stays ink", () => {
  const all = svg(React.createElement(Ejes, { box, h: 1, v: 1, labels, focus: ["tr", "tl", "bl", "br"], focusTone: "accent" }))
  assert.equal((all.match(new RegExp(color.accent, "g")) ?? []).length, 1)
  assert.match(all, new RegExp(`data-quadrant="tr"[^>]*stroke="${color.accent}"`))
})

test("DeskProp weight sets the stroke in parent units at any scale", () => {
  for (const scale of [0.5, 1, 2]) {
    const markup = svg(React.createElement(DeskProp, { kind: "keycap", x: 0, y: 0, scale, weight: 3 }))
    assert.ok(markup.includes(`stroke-width="${3 / scale}"`))
  }
  const mug = svg(React.createElement(DeskProp, { kind: "mug", x: 0, y: 0 }))
  assert.equal((mug.match(/<circle/g) ?? []).length, 2, "top-down mug: body and rim")
})
