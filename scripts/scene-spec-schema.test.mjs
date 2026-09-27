// The scene-spec JSON Schema (public/schemas/scene-spec.json) is current with spec.ts, accepts the
// compiler's fixtures and every YAML example in docs/scene-spec.md (which must also compile), rejects
// malformed specs, and the docs reference names every block and field the schema defines.
//   node --test scripts/scene-spec-schema.test.mjs   (Node 22.15+)
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { dirname, resolve } from "node:path"
import ts from "typescript"
import { load } from "js-yaml"
import Ajv2020 from "ajv/dist/2020.js"
import { buildSceneSpecSchema, sceneSpecSchemaFile, sceneSpecSchemaPath } from "./lib/scene-spec-schema.mjs"
import { json, publicOrigin, validateContract } from "./lib/contracts.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith(".") && context.parentURL?.startsWith(pathToFileURL(root + "/registry/").href)) {
      const base = fileURLToPath(new URL(specifier, context.parentURL))
      for (const ext of [".ts", ".tsx"])
        if (existsSync(base + ext)) return { url: pathToFileURL(base + ext).href, shortCircuit: true }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.startsWith(pathToFileURL(root + "/registry/").href) && /\.tsx?$/.test(url))
      return {
        format: "module",
        source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
          compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
        }).outputText,
        shortCircuit: true,
      }
    return next(url, context)
  },
})
const { SceneFromSpec } = await import("../registry/jbm/motion/compile.tsx")

const schemaUrl = publicOrigin + sceneSpecSchemaPath
const schema = JSON.parse(readFileSync(resolve(root, sceneSpecSchemaFile), "utf8"))
const ajv = new Ajv2020({ allErrors: true, strict: true })
const validateFile = ajv.compile(schema)
const validateScene = ajv.getSchema(`${schemaUrl}#/$defs/SceneSpec`)
const errorsOf = (validate, data) => (validate(data) ? [] : validate.errors)
const host = { resolve: () => 1, t: (s) => s }

const docs = readFileSync(resolve(root, "docs/scene-spec.md"), "utf8")
const yamlExamples = [...docs.matchAll(/```yaml\n([\s\S]*?)```/g)].map(([, body]) => load(body))

test("committed schema matches spec.ts", () => {
  assert.equal(
    readFileSync(resolve(root, sceneSpecSchemaFile), "utf8"),
    json(buildSceneSpecSchema(root, { id: schemaUrl })),
    "run pnpm contracts:build"
  )
  assert.equal(schema.$id, schemaUrl)
})

test("the scene-spec contract links the guide and the schema by absolute URL", () => {
  const { errors, entry } = validateContract("scene-spec")
  assert.deepEqual(errors, [])
  assert.deepEqual(entry.schemas.map((link) => link.url), [schemaUrl])
  assert.ok(entry.docs.some((link) => link.url.endsWith("/blob/main/docs/scene-spec.md")))
})

// The compiler fixtures from scene-spec.test.mjs.
const fixtures = [
  {
    id: "all",
    gap: { landscape: 20, vertical: 30 },
    blocks: [
      { type: "big", at: 0, text: "heading" },
      { type: "stat-row", items: [{ at: 0, label: "a", value: "1" }, { at: 1, label: "b", value: "2" }] },
      { type: "note", at: 0, text: "note" },
      { type: "callout", at: 0, text: "callout" },
      { type: "bullets", at: 0, items: ["bullet"] },
      { type: "chips", at: 0, items: ["chip"] },
      { type: "code", at: 0, charsPerSecond: 12, lines: [{ text: "abc", at: 0.5, color: "soft" }] },
      { type: "spacer", h: { landscape: 10, vertical: 20 } },
    ],
  },
  {
    id: "illustrated",
    anchors: { cue: "narration" },
    valign: "center",
    blocks: [
      { type: "screens", pieces: [{ kind: "card", at: "cue" }], again: ["cue+1"] },
      { type: "catalog", at: 0, items: [{ kind: "button", label: "button", at: "cue" }], tokens: [{ kind: "type", label: "type", at: "cue+1" }] },
      { type: "propagate", at: 0, bug: "cue", fix: "cue+1", fixed: "cue+1.1" },
      { type: "shelf", items: [{ text: "library", at: "cue" }] },
      { type: "twice", at: 0, second: "cue" },
      { type: "overlay", until: "cue+3", blocks: [{ type: "brand", at: "cue", tagline: "tagline" }] },
    ],
  },
  {
    id: "portrait",
    anchors: { cue: "spoken" },
    blocks: [{ type: "note", at: 0, text: "landscape" }],
    variants: {
      vertical: {
        layout: "headline-illustration",
        safeArea: "full",
        headlineRatio: 0.25,
        gap: 40,
        subjectScale: 1.5,
        blocks: [{ type: "big", at: 0, text: "Portrait" }, { type: "screens", phoneScale: 1.5, pieces: [{ kind: "button", at: "cue" }] }],
      },
    },
  },
]

test("compiler fixtures validate", () => {
  for (const spec of fixtures) assert.deepEqual(errorsOf(validateScene, spec), [], spec.id)
  assert.deepEqual(errorsOf(validateFile, { scenes: fixtures }), [])
})

test("docs/scene-spec.md YAML examples parse, validate, and compile in both orientations", () => {
  assert.ok(yamlExamples.length >= 3, "minimal, realistic, and single-scene examples")
  const minimal = yamlExamples[0]
  assert.equal(minimal.scenes.length, 1)
  assert.equal(minimal.scenes[0].blocks.length, 1)
  let scenes = 0
  for (const example of yamlExamples) {
    const list = "scenes" in example ? example.scenes : [example]
    assert.deepEqual(errorsOf("scenes" in example ? validateFile : validateScene, example), [])
    for (const spec of list) {
      scenes += 1
      for (const orientation of ["landscape", "vertical"])
        assert.doesNotThrow(() => SceneFromSpec({ spec, orientation, host }), `${spec.id} ${orientation}`)
    }
  }
  assert.ok(scenes >= 5)
})

test("malformed specs fail validation with a pointer to the field", () => {
  const scene = (blocks, extra = {}) => ({ id: "bad", anchors: { cue: "x" }, blocks, ...extra })
  const cases = [
    [scene([{ type: "headline", at: 0, text: "x" }]), "/blocks/0/type"],
    [scene([{ type: "big", text: "x" }]), "/blocks/0"],
    [scene([{ type: "big", at: "cue+1.2.3", text: "x" }]), "/blocks/0/at"],
    [scene([{ type: "big", at: 0, text: "x", colour: "ink" }]), "/blocks/0"],
    [scene([{ type: "code", at: 0, charsPerSecond: 0, lines: [] }]), "/blocks/0/charsPerSecond"],
    [scene([{ type: "propagate", at: 0, targets: 1.5 }]), "/blocks/0/targets"],
    [scene([{ type: "overlay", blocks: [{ type: "chips", at: 0, items: [1] }] }]), "/blocks/0/blocks/0/items/0"],
    [scene([], { composition: { headlineRatio: 1 } }), "/composition/headlineRatio"],
    [scene([], { composition: { safeArea: "edge" } }), "/composition/safeArea"],
    [scene([], { composition: { blocks: [] } }), "/composition"],
    [scene([], { variants: { square: {} } }), "/variants"],
    [{ blocks: [] }, ""],
  ]
  for (const [spec, path] of cases) {
    const errors = errorsOf(validateScene, spec)
    assert.ok(errors.length, JSON.stringify(spec))
    assert.ok(errors.some((error) => error.instancePath === path), `${path}: ${JSON.stringify(errors)}`)
  }
})

test("docs/scene-spec.md documents every block and field in the schema", () => {
  const block = schema.$defs.Block
  const sections = new Map(
    [...docs.matchAll(/^### `([\w-]+)`\n([\s\S]*?)(?=^##)/gm)].map(([, name, body]) => [name, body])
  )
  const fieldsOf = (node) => Object.keys(node?.properties ?? {})
  for (const { then } of block.allOf) {
    const type = then.properties.type.const
    const body = sections.get(type)
    assert.ok(body, `docs/scene-spec.md has a "### \`${type}\`" section`)
    for (const field of fieldsOf(then).filter((name) => name !== "type" && name !== "until")) {
      assert.ok(body.includes(`\`${field}\``), `${type}.${field} is documented`)
      const items = then.properties[field].items
      if (items?.$ref === "#/$defs/Block") continue // documented in its own section
      const nested = items?.$ref ? schema.$defs[items.$ref.split("/").pop()] : items
      for (const sub of fieldsOf(nested))
        // A row of its own (`items[].at`) or named in the field's `{ … }` type column.
        assert.ok(
          body.includes(`\`${field}[].${sub}\``) || new RegExp(`\\{[^}]*\\b${sub}\\b[^}]*\\}`).test(body),
          `${type}.${field}[].${sub} is documented`
        )
    }
  }
  assert.deepEqual([...sections.keys()].sort(), block.properties.type.enum.slice().sort())
  for (const field of fieldsOf(schema.$defs.SceneSpec)) assert.ok(docs.includes(`| \`${field}\` |`), `scene ${field}`)
  for (const field of fieldsOf(schema.$defs.CompositionOptions))
    assert.ok(docs.includes(`| \`${field}\` |`), `composition ${field}`)
  for (const preset of schema.$defs.SafeArea.anyOf[0].enum) assert.ok(docs.includes(`| \`${preset}\``), `safe area ${preset}`)
})
