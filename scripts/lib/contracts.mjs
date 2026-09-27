// Agent contract core: loads contracts/items/<name>.ts, extracts prop and parameter facts from
// registry source with the TypeScript compiler, validates each contract, and builds the generated
// JSON that the gallery, /c/<name>, /catalog.json, and /llms.txt read. See docs/agent-contract.md.
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"
import { buildSceneSpecSchema, sceneSpecSchemaFile, sceneSpecSchemaPath } from "./scene-spec-schema.mjs"

export const root = resolve(import.meta.dirname, "../..")
export const itemsDir = join(root, "contracts/items")
export const generatedDir = join(root, "contracts/generated")
export const catalogPath = join(generatedDir, "catalog.json")
export const galleryPath = join(generatedDir, "gallery.json")

/** Production origin for absolute URLs in generated files (lib/site.ts falls back to the same). */
export const publicOrigin = "https://jbm-ui.bns.studio"
/**
 * Agent-facing output never links the source repository (public on GitHub, but agents get
 * everything from the site). Guides are served by the site instead: docs/<slug>.md is published at /docs/<slug>.md (app/docs/[file]/route.ts).
 */
export const sourceRepo = "github.com/chekos/jbm-ui"
/** Site path prefix for published guides. */
export const docsRoute = "/docs/"
/** Guides published even when no contract links them. */
export const alwaysPublishedDocs = ["agent-contract", "scene-spec"]
export const contractDocsPath = join(generatedDir, "docs.json")
/** Names and guide slugs only, small enough for proxy.ts (unknown /catalog and /docs files). */
export const routesPath = join(generatedDir, "routes.json")

/** JSON Schemas generated from registry types, served statically from public/. */
export function generatedSchemas() {
  return [
    {
      file: join(root, sceneSpecSchemaFile),
      url: publicOrigin + sceneSpecSchemaPath,
      schema: buildSceneSpecSchema(root, { id: publicOrigin + sceneSpecSchemaPath }),
    },
  ]
}

const rel = (path) => relative(root, path).split("\\").join("/")
const read = (path) => readFileSync(join(root, path), "utf8")

/** Evaluates a dependency-free TypeScript module (data files such as categories.ts). */
function evalModule(path) {
  const code = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  }).outputText
  const compiled = { exports: {} }
  const require = (id) => {
    throw new Error(`${path}: contracts may only use \`import type\`; found a runtime import of "${id}"`)
  }
  new Function("module", "exports", "require", code)(compiled, compiled.exports, require)
  return compiled.exports
}

export const registry = JSON.parse(read("registry.json"))
const registryByName = new Map(registry.items.map((item) => [item.name, item]))
export const categories = evalModule("components/gallery/categories.ts").categories.filter(
  (value) => value !== "All"
)

// The gallery preview timelines (fps and each Player demo's length), read from the same module the
// previews use, so cues are checked against the frames the strip actually shows.
const previewTiming = await import(pathToFileURL(join(root, "components/gallery/timing.ts")).href)
/** Most cues a contract may list; with Begin and End that is two rows of three strip cells. */
export const maxCues = 4
export const maxCueLabel = 24
/** Zero-based frame of a cue at `at` seconds on the gallery preview timeline. */
export const cueFrame = (at) => Math.round(at * previewTiming.fps)
/** Frames in an item's gallery preview (the default scene-spec layout for scene-spec). */
export const previewFrames = (name) => previewTiming.durationFor(name)

/** Documentation entries that appear in the gallery without a registry item of their own. */
export const docEntries = ["surface-depth"]
export const capabilityNames = ["controls", "scroll", "replay", "portrait", "player"]

/** Every name that needs a contract, in gallery order (tokens, surface-depth, then the registry). */
export function contractNames() {
  const names = registry.items.map((item) => item.name)
  return [names[0], ...docEntries, ...names.slice(1)]
}

export function needsRemotion(name, seen = new Set()) {
  if (seen.has(name)) return false
  seen.add(name)
  const item = registryByName.get(name)
  if (!item) return false
  if (item.dependencies?.includes("remotion")) return true
  return (item.registryDependencies ?? []).some((dependency) =>
    needsRemotion(dependency.replace(/^@jbm\//, ""), seen)
  )
}

function transitiveDependencies(name, seen = new Set()) {
  for (const dependency of registryByName.get(name)?.registryDependencies ?? []) {
    const next = dependency.replace(/^@jbm\//, "")
    if (seen.has(next)) continue
    seen.add(next)
    transitiveDependencies(next, seen)
  }
  return seen
}

// --- Source extraction ----------------------------------------------------------------------

const sourceFiles = []
;(function walk(dir) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) walk(path)
    else if (/\.(tsx?|d\.ts)$/.test(entry.name)) sourceFiles.push(join(root, path))
  }
})("registry/jbm")

let program
let checker
function compiler() {
  program ??= ts.createProgram(sourceFiles, {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  })
  checker ??= program.getTypeChecker()
  return { program, checker }
}

const isRegistrySource = (fileName) => rel(fileName).startsWith("registry/jbm/")
const clean = (text) => text.replace(/\s+/g, " ").trim()

/** Type-checkable source files for a registry item (a .js file is read through its .d.ts). */
function itemSources(name) {
  const item = registryByName.get(name)
  if (!item) return []
  return item.files
    .map((file) => file.path.replace(/\.js$/, ".d.ts"))
    .filter((path) => /\.(tsx?)$/.test(path))
}

function resolveAlias(symbol) {
  const { checker } = compiler()
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
}

/** Runtime and type exports of a source file, keyed by exported name. */
function exportsOf(path) {
  const { program, checker } = compiler()
  const source = program.getSourceFile(join(root, path))
  if (!source) return undefined
  const moduleSymbol = checker.getSymbolAtLocation(source)
  const result = new Map()
  for (const symbol of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
    const target = resolveAlias(symbol)
    const runtime = Boolean(
      target.flags & (ts.SymbolFlags.Value | ts.SymbolFlags.Function | ts.SymbolFlags.Class)
    )
    const declaration = target.declarations?.[0]
    const from = declaration ? rel(declaration.getSourceFile().fileName) : path
    result.set(symbol.name, { symbol: target, runtime, from, file: path })
  }
  return result
}

function functionNode(declaration) {
  if (!declaration) return undefined
  if (ts.isFunctionDeclaration(declaration)) return declaration
  if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
    let init = declaration.initializer
    while (ts.isAsExpression(init) || ts.isSatisfiesExpression?.(init) || ts.isParenthesizedExpression(init))
      init = init.expression
    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return init
    // React.memo(fn) / forwardRef(fn)
    if (ts.isCallExpression(init)) {
      const fn = init.arguments.find((arg) => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg))
      if (fn) return fn
    }
  }
  return undefined
}

/** Defaults written in a destructuring pattern: `{ dur = 0.8, color: c = color.accent }`. */
function bindingDefaults(name) {
  const defaults = new Map()
  if (!name || !ts.isObjectBindingPattern(name)) return defaults
  for (const element of name.elements) {
    if (element.dotDotDotToken || !element.initializer) continue
    const key = (element.propertyName ?? element.name).getText()
    defaults.set(key, clean(element.initializer.getText()))
  }
  return defaults
}

/** Type references outside registry source that a props type spreads in, e.g. React.SVGProps<…>. */
function passthroughTypes(node, found = new Set(), seen = new Set()) {
  const { checker } = compiler()
  if (!node || seen.has(node)) return found
  seen.add(node)
  if (ts.isParenthesizedTypeNode(node)) return passthroughTypes(node.type, found, seen)
  if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
    for (const member of node.types) passthroughTypes(member, found, seen)
    return found
  }
  if (ts.isTypeReferenceNode(node)) {
    const symbol = checker.getSymbolAtLocation(node.typeName)
    const target = symbol && resolveAlias(symbol)
    const declaration = target?.declarations?.[0]
    if (declaration && isRegistrySource(declaration.getSourceFile().fileName)) {
      if (ts.isTypeAliasDeclaration(declaration)) passthroughTypes(declaration.type, found, seen)
      else if (ts.isInterfaceDeclaration(declaration))
        for (const clause of declaration.heritageClauses ?? [])
          for (const type of clause.types) passthroughTypes(type, found, seen)
    } else if (declaration) found.add(clean(node.getText()))
  }
  if (ts.isExpressionWithTypeArguments(node)) {
    const symbol = checker.getSymbolAtLocation(node.expression)
    const declaration = symbol && resolveAlias(symbol).declarations?.[0]
    if (declaration && !isRegistrySource(declaration.getSourceFile().fileName))
      found.add(clean(node.getText()))
  }
  return found
}

function typeText(symbol, declaration, fallbackNode) {
  const { checker } = compiler()
  if (declaration && "type" in declaration && declaration.type) return clean(declaration.type.getText())
  const type = checker.getTypeOfSymbolAtLocation(symbol, fallbackNode)
  return clean(checker.typeToString(type, fallbackNode, ts.TypeFormatFlags.NoTruncation)).replace(
    / \| undefined$/,
    ""
  )
}

/** Props declared in registry source for a component's first parameter. */
function extractProps(fn) {
  const { checker } = compiler()
  const param = fn.parameters[0]
  if (!param) return { props: [], passthrough: [] }
  const defaults = bindingDefaults(param.name)
  const type = checker.getTypeAtLocation(param)
  const constituents = type.isUnion() ? type.types : [type]
  const props = new Map()
  for (const part of constituents) {
    for (const symbol of checker.getPropertiesOfType(part)) {
      const declaration = symbol.declarations?.find((d) => isRegistrySource(d.getSourceFile().fileName))
      if (!declaration) continue
      const optional = Boolean(symbol.flags & ts.SymbolFlags.Optional)
      const existing = props.get(symbol.name)
      if (existing) {
        existing.seen += 1
        existing.required &&= !optional
        continue
      }
      props.set(symbol.name, {
        name: symbol.name,
        type: typeText(symbol, declaration, param),
        required: !optional,
        default: defaults.get(symbol.name) ?? null,
        doc: clean(ts.displayPartsToString(symbol.getDocumentationComment(checker))),
        seen: 1,
      })
    }
  }
  return {
    props: [...props.values()].map(({ seen, ...prop }) => ({
      ...prop,
      required: prop.required && seen === constituents.length,
    })),
    passthrough: [...passthroughTypes(param.type)],
  }
}

/** Parameters of a hook or helper; a destructured options object expands to its fields. */
function extractParams(fn) {
  const { checker } = compiler()
  // An unannotated parameter takes its type from its initializer (dur = 0.4 is a number); widen
  // literals so the documented type is the parameter's, not its default's.
  const inferred = (param) =>
    clean(
      checker.typeToString(
        checker.getBaseTypeOfLiteralType(checker.getTypeAtLocation(param)),
        param,
        ts.TypeFormatFlags.NoTruncation
      )
    )
  const params = []
  for (const param of fn.parameters) {
    if (ts.isObjectBindingPattern(param.name)) {
      params.push(...extractProps({ parameters: [param] }).props)
      continue
    }
    params.push({
      name: param.name.getText(),
      type: param.type ? clean(param.type.getText()) : inferred(param),
      required: !param.questionToken && !param.initializer && !param.dotDotDotToken,
      default: param.initializer ? clean(param.initializer.getText()) : null,
      doc: "",
    })
  }
  return params
}

// --- Contracts ------------------------------------------------------------------------------

export function contractPath(name) {
  return join(itemsDir, `${name}.ts`)
}

export function hasContract(name) {
  return existsSync(contractPath(name))
}

export function loadContract(name) {
  return evalModule(rel(contractPath(name))).default
}

const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0

/** Files whose exports an item documents: its own, or its install item's for doc entries. */
function filesFor(contract) {
  const owner = contract.entry === "doc" ? contract.install : contract.name
  return itemSources(owner)
}

/** Import checks for example code: `@/jbm/<path>` must be a published file exporting the names. */
function checkExample(code, ownFiles, errors, label) {
  const imports = [...code.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g)]
  if (!imports.some(([, , , from]) => from.startsWith("@/jbm/")))
    errors.push(`${label}: import from "@/jbm/…" as installed by shadcn`)
  let ownImport = false
  for (const [, , clause, from] of imports) {
    if (!from.startsWith("@/jbm/")) continue
    const base = `registry/jbm/${from.slice("@/jbm/".length)}`
    const path = [".tsx", ".ts", ".d.ts"].map((ext) => base + ext).find((candidate) =>
      existsSync(join(root, candidate))
    )
    if (!path) {
      errors.push(`${label}: "${from}" is not a registry source file`)
      continue
    }
    if (ownFiles.includes(path) || ownFiles.includes(path.replace(/\.d\.ts$/, ".js"))) ownImport = true
    const exported = exportsOf(path)
    const named = clause.match(/\{([^}]*)\}/)?.[1] ?? ""
    for (const spec of named.split(",").map((part) => part.trim()).filter(Boolean)) {
      const importedName = spec.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim()
      if (!exported?.has(importedName)) errors.push(`${label}: "${from}" does not export ${importedName}`)
    }
  }
  if (!ownImport) errors.push(`${label}: import at least one export from this item's own files`)
}

/**
 * Validates one contract and returns `{ errors, entry }`, where `entry` is the generated catalog
 * entry (only when there are no errors).
 */
export function validateContract(name) {
  const errors = []
  if (!hasContract(name)) return { errors: [`missing contracts/items/${name}.ts`] }
  let contract
  try {
    contract = loadContract(name)
  } catch (error) {
    return { errors: [error.message] }
  }
  if (!contract || typeof contract !== "object") return { errors: ["default-export an ItemContract"] }

  const inRegistry = registryByName.has(name)
  const known = inRegistry || docEntries.includes(name)
  if (!known) errors.push(`${name} is not a registry item or gallery documentation entry`)
  if (contract.name !== name) errors.push(`name must be "${name}" (the file name)`)
  if (!["component", "bundle", "doc"].includes(contract.entry))
    errors.push(`entry must be component, bundle, or doc`)
  if (inRegistry && contract.entry === "doc") errors.push("registry items are component or bundle entries")
  if (!inRegistry && contract.entry !== "doc") errors.push("documentation entries use entry: \"doc\"")
  for (const field of ["title", "description"])
    if (!nonEmpty(contract[field])) errors.push(`${field} is required`)
  if (nonEmpty(contract.title) && Array.isArray(contract.api) && contract.title !== expectedTitle(contract))
    errors.push(`title must be "${expectedTitle(contract)}" (the primary component export, else the name in PascalCase)`)
  if (!categories.includes(contract.category))
    errors.push(`category must be one of ${categories.join(", ")}`)

  const capabilities = contract.capabilities
  if (!Array.isArray(capabilities)) errors.push("capabilities must be an array (empty for a still preview)")
  else {
    for (const value of capabilities)
      if (!capabilityNames.includes(value)) errors.push(`unknown capability "${value}"`)
    if (new Set(capabilities).size !== capabilities.length) errors.push("capabilities repeat")
    // "player" routes the gallery preview into the Remotion Player (even for a plain layout such
    // as scene, which needsRemotion leaves false); "portrait" adds the stage orientation toggle,
    // which only Player previews have.
    if (capabilities.includes("portrait") && !capabilities.includes("player"))
      errors.push('capability "portrait" is only for "player" previews')
  }

  if (contract.entry === "doc") {
    if (!registryByName.has(contract.install)) errors.push("doc entries name a registry item in install")
  } else if (contract.install !== undefined) errors.push("install is only for doc entries")
  if (contract.entry === "bundle") {
    if (!nonEmpty(contract.pageReason)) errors.push("bundle entries explain the missing page in pageReason")
  } else if (contract.pageReason !== undefined) errors.push("pageReason is only for bundle entries")

  // API: every runtime export is documented (or omitted with a reason); props match source.
  const files = inRegistry || registryByName.has(contract.install) ? filesFor(contract) : []
  const exported = new Map()
  for (const file of files) for (const [key, value] of exportsOf(file) ?? []) exported.set(key, value)
  const api = []
  if (!Array.isArray(contract.api) || contract.api.length === 0) errors.push("api lists at least one export")
  for (const entry of contract.api ?? []) {
    const label = `api ${entry.export}`
    const found = exported.get(entry.export)
    if (!found) {
      errors.push(`${label}: not exported by ${files.join(", ") || "any file"}`)
      continue
    }
    if (entry.kind === "re-export") {
      const owner = registryByName.has(entry.from) && itemSources(entry.from)
      if (!owner || !owner.includes(found.from)) errors.push(`${label}: from must name the item that defines it`)
      api.push({ export: entry.export, kind: "re-export", from: entry.from })
      continue
    }
    if (!nonEmpty(entry.summary)) errors.push(`${label}: summary is required`)
    const declaration = found.symbol.declarations?.[0]
    const fn = functionNode(declaration)
    if (["component", "hook", "function"].includes(entry.kind) && !fn) {
      errors.push(`${label}: ${entry.kind} must be a function in source`)
      continue
    }
    if (entry.kind === "component" && !/^[A-Z]/.test(entry.export)) errors.push(`${label}: components are PascalCase`)
    if (entry.kind === "hook" && !/^use[A-Z]/.test(entry.export)) errors.push(`${label}: hooks start with use`)
    if (entry.kind === "type" && found.runtime) errors.push(`${label}: a runtime value is not a type`)
    if (entry.kind === "constant" && (!found.runtime || fn)) errors.push(`${label}: constant must be a non-function value`)
    if (!["component", "hook", "function", "constant", "type"].includes(entry.kind)) {
      errors.push(`${label}: unknown kind "${entry.kind}"`)
      continue
    }
    const out = { export: entry.export, kind: entry.kind, summary: entry.summary }
    const described = (list, descriptions, field) => {
      if (!descriptions || typeof descriptions !== "object") {
        errors.push(`${label}: ${field} is required ({} when there are none)`)
        descriptions = {}
      }
      for (const key of Object.keys(descriptions))
        if (!list.some((item) => item.name === key)) errors.push(`${label}: ${field}.${key} is not in source`)
      return list.map(({ doc, ...item }) => {
        const description = descriptions[item.name] ?? doc
        if (!nonEmpty(description)) errors.push(`${label}: describe ${field}.${item.name}`)
        return { ...item, description: description ?? "" }
      })
    }
    if (entry.kind === "component") {
      const { props, passthrough } = extractProps(fn)
      out.props = described(props, entry.props, "props")
      out.passthrough = passthrough
    } else if (entry.kind === "hook" || entry.kind === "function") {
      out.params = described(extractParams(fn), entry.params, "params")
      if (!nonEmpty(entry.returns)) errors.push(`${label}: returns is required`)
      out.returns = entry.returns
    }
    api.push(out)
  }
  const documented = new Set((contract.api ?? []).map((entry) => entry.export))
  const omit = contract.omit ?? {}
  for (const [key, reason] of Object.entries(omit)) {
    if (!exported.has(key)) errors.push(`omit.${key} is not exported`)
    if (!nonEmpty(reason)) errors.push(`omit.${key} needs a reason`)
  }
  if (contract.entry !== "doc")
    for (const [key, value] of exported)
      if (value.runtime && !documented.has(key) && !(key in omit))
        errors.push(`export ${key} is neither in api nor omit`)

  // Stage size, declared per orientation or explicitly not applicable.
  const stage = contract.stage
  const box = (value, label) => {
    if (!value || !(value.height > 0)) errors.push(`stage.${label}.height must be a positive number`)
    if (!value || !(value.width > 0 || value.width === "auto" || value.width === "fill"))
      errors.push(`stage.${label}.width must be a positive number, "auto", or "fill"`)
  }
  if (stage?.mode === "declared") {
    box(stage.landscape, "landscape")
    box(stage.vertical, "vertical")
    if (!nonEmpty(stage.basis)) errors.push("stage.basis explains the numbers")
  } else if (stage?.mode === "fluid" || stage?.mode === "n/a") {
    if (!nonEmpty(stage.reason)) errors.push(`stage.reason is required for ${stage.mode}`)
  } else errors.push('stage.mode must be "declared", "fluid", or "n/a"')

  if (!Array.isArray(contract.examples) || contract.examples.length === 0)
    errors.push("examples lists at least one example")
  const ownFiles = inRegistry ? registryByName.get(name).files.map((file) => file.path) : registryByName.get(contract.install)?.files.map((file) => file.path) ?? []
  const reachable = new Set([name, contract.install, ...transitiveDependencies(inRegistry ? name : contract.install)])
  for (const [index, example] of (contract.examples ?? []).entries()) {
    const label = `examples[${index}]`
    if (!nonEmpty(example?.title)) errors.push(`${label}.title is required`)
    if (!nonEmpty(example?.code)) {
      errors.push(`${label}.code is required`)
      continue
    }
    checkExample(example.code, ownFiles, errors, label)
    // Imports from items the install does not bring in must say so in a comment.
    for (const [, from] of example.code.matchAll(/from\s+["']@\/jbm\/([^"']+)["'][^\n]*/g)) {
      const owner = registry.items.find((item) =>
        item.files.some((file) => file.path.replace(/\.(tsx?|js)$/, "") === `registry/jbm/${from}`)
      )
      if (owner && !reachable.has(owner.name)) {
        const line = example.code.split("\n").find((text) => text.includes(`@/jbm/${from}`)) ?? ""
        if (!line.includes(`install @jbm/${owner.name} separately`))
          errors.push(`${label}: comment "// install @jbm/${owner.name} separately" on the ${from} import`)
      }
    }
  }
  if (!Array.isArray(contract.qa) || contract.qa.length === 0 || !contract.qa.every(nonEmpty))
    errors.push("qa lists at least one non-empty note")
  for (const field of ["docs", "schemas"]) checkLinks(contract[field], field, errors)
  const cues = checkCues(contract, errors)
  const start = checkStart(contract, errors)

  if (errors.length) return { errors, contract }
  const installName = inRegistry ? name : contract.install
  const install = registryByName.get(installName)
  return {
    errors,
    contract,
    entry: {
      name,
      entry: contract.entry,
      title: contract.title,
      description: contract.description,
      category: contract.category,
      capabilities: contract.capabilities,
      needsRemotion: needsRemotion(installName),
      registryDependencies: inRegistry ? install.registryDependencies ?? [] : [],
      installName,
      inRegistry,
      page: contract.entry === "bundle" ? null : `/c/${name}`,
      ...(contract.pageReason ? { pageReason: contract.pageReason } : {}),
      registryItem: `/r/${installName}.json`,
      sourcePath: install.files[0].path,
      files: install.files.map((file) => file.path),
      api,
      ...(Object.keys(omit).length ? { omit } : {}),
      stage,
      examples: contract.examples,
      qa: contract.qa,
      ...(cues ? { cues } : {}),
      ...(start !== undefined ? { start } : {}),
      ...(cues ? { galleryPreview: galleryPreview(name) } : {}),
      ...(contract.docs ? { docs: contract.docs } : {}),
      ...(contract.schemas ? { schemas: contract.schemas } : {}),
    },
  }
}

/**
 * `cues`: optional QA strip frames for Player items, as { label, at, note? } in seconds on the
 * gallery preview timeline. Each lands on a distinct frame strictly between Begin (0) and End (the
 * last frame of components/gallery/timing.ts durationFor), in order. Returns the cues with their
 * frames, or undefined when the contract lists none.
 */
export function checkCues(contract, errors) {
  const cues = contract.cues
  if (cues === undefined) return undefined
  if (!Array.isArray(cues) || cues.length === 0) {
    errors.push("cues must be a non-empty array of { label, at, note? } when present")
    return undefined
  }
  if (!contract.capabilities?.includes("player"))
    errors.push('cues are only for "player" items (the strip steps through a Player timeline)')
  if (cues.length > maxCues) errors.push(`cues lists at most ${maxCues} moments`)
  const last = previewFrames(contract.name) - 1
  const labels = new Set()
  let previous = 0
  const out = []
  for (const [index, cue] of cues.entries()) {
    const label = `cues[${index}]`
    if (!cue || typeof cue !== "object") {
      errors.push(`${label} must be { label, at, note? }`)
      continue
    }
    for (const key of Object.keys(cue))
      if (!["label", "at", "note"].includes(key)) errors.push(`${label}.${key} is not a cue field`)
    if (!nonEmpty(cue.label)) errors.push(`${label}.label is required`)
    else if (cue.label.length > maxCueLabel)
      errors.push(`${label}.label is longer than ${maxCueLabel} characters (it captions a strip cell)`)
    else if (["begin", "middle", "end"].includes(cue.label.trim().toLowerCase()))
      errors.push(`${label}.label says what happens; Begin and End are added by the strip`)
    else if (labels.has(cue.label)) errors.push(`${label}.label repeats`)
    labels.add(cue.label)
    if (cue.note !== undefined && !nonEmpty(cue.note)) errors.push(`${label}.note must be non-empty when present`)
    if (typeof cue.at !== "number" || !Number.isFinite(cue.at)) {
      errors.push(`${label}.at must be a number of seconds`)
      continue
    }
    const frame = cueFrame(cue.at)
    if (frame <= 0 || frame >= last)
      errors.push(`${label}.at ${cue.at} s is frame ${frame}; cues fall strictly between Begin (0) and End (${last})`)
    else if (frame <= previous)
      errors.push(`${label}.at ${cue.at} s is frame ${frame}; cues are in order on distinct frames`)
    previous = Math.max(previous, frame)
    out.push({ label: cue.label, at: cue.at, frame, ...(cue.note !== undefined ? { note: cue.note } : {}) })
  }
  return out
}

/** `start`: optional caption for the strip's frame-0 cell on Player items (default "Begin"). */
export function checkStart(contract, errors) {
  const start = contract.start
  if (start === undefined) return undefined
  if (!contract.capabilities?.includes("player"))
    errors.push('start is only for "player" items (it captions the strip\'s first frame)')
  if (!nonEmpty(start)) errors.push("start must be a non-empty caption when present")
  else if (start.length > maxCueLabel)
    errors.push(`start is longer than ${maxCueLabel} characters (it captions a strip cell)`)
  return start
}

/** A JSON value as a JSX attribute value or child expression. */
function jsxValue(value) {
  return typeof value === "string" ? JSON.stringify(value) : `{${jsLiteral(value)}}`
}
function jsLiteral(value) {
  if (Array.isArray(value)) return `[${value.map(jsLiteral).join(", ")}]`
  if (value && typeof value === "object")
    return `{ ${Object.entries(value)
      .map(([key, v]) => `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${jsLiteral(v)}`)
      .join(", ")} }`
  return JSON.stringify(value)
}
/** previewDemos elements as TSX, one element per line group. */
export function demoCode(elements, indent = "") {
  return elements
    .map((element) => {
      if ("code" in element) return element.code.split("\n").map((line) => indent + line).join("\n")
      const props = Object.entries(element.props ?? {})
        .map(([key, value]) => ` ${key}=${jsxValue(value)}`)
        .join("")
      const open = `${indent}<${element.component}${props}`
      if (element.children === undefined) return `${open} />`
      if (typeof element.children === "string")
        return `${open}>${element.children}</${element.component}>`
      return `${open}>\n${demoCode(element.children, indent + "  ")}\n${indent}</${element.component}>`
    })
    .join("\n")
}

/** The gallery preview an item's cue times are measured on (timing.ts previewDemos). */
export function galleryPreview(name) {
  const demo = previewTiming.previewDemos[name]
  if (!demo) throw new Error(`${name} has cues but no previewDemos entry in components/gallery/timing.ts`)
  return {
    fps: previewTiming.fps,
    durationInFrames: previewFrames(name),
    demo,
    code: demoCode(demo),
  }
}

const schemaUrls = new Set([publicOrigin + sceneSpecSchemaPath])

/**
 * `docs` and `schemas`: optional lists of { title, url } with absolute http(s) URLs. Links onto this
 * site must point at files it serves: /docs/<slug>.md needs docs/<slug>.md, anything else a file in
 * public/ or a generated schema. Links into the source repository are rejected.
 */
function checkLinks(links, field, errors) {
  if (links === undefined) return
  if (!Array.isArray(links) || links.length === 0) {
    errors.push(`${field} must be a non-empty array of { title, url } when present`)
    return
  }
  const seen = new Set()
  for (const [index, link] of links.entries()) {
    const label = `${field}[${index}]`
    if (!link || typeof link !== "object") {
      errors.push(`${label} must be { title, url }`)
      continue
    }
    for (const key of Object.keys(link))
      if (key !== "title" && key !== "url") errors.push(`${label}.${key} is not a link field`)
    if (!nonEmpty(link.title)) errors.push(`${label}.title is required`)
    let url
    try {
      url = new URL(link.url)
    } catch {
      errors.push(`${label}.url must be an absolute URL`)
      continue
    }
    if (url.protocol !== "https:" && url.protocol !== "http:")
      errors.push(`${label}.url must be an http(s) URL`)
    if (seen.has(url.href)) errors.push(`${label}.url repeats`)
    seen.add(url.href)
    const bare = url.href.replace(/[#?].*$/, "")
    if (url.href.includes(sourceRepo))
      errors.push(`${label}.url: agent-facing links stay on the site; link the guide at ${publicOrigin}${docsRoute}<slug>.md`)
    else if (url.origin === publicOrigin && url.pathname.startsWith(docsRoute)) {
      const slug = docSlug(url.pathname)
      if (!slug || !existsSync(join(root, "docs", `${slug}.md`)))
        errors.push(`${label}.url: ${url.pathname} is not a guide in docs/ (expected /docs/<slug>.md)`)
    } else if (url.origin === publicOrigin) {
      if (!schemaUrls.has(bare) && !existsSync(join(root, "public", decodeURIComponent(url.pathname))))
        errors.push(`${label}.url: ${url.pathname} is not a static file this site serves`)
    }
  }
}

/** "/docs/scene-spec.md" → "scene-spec"; undefined for anything that is not a published guide path. */
export function docSlug(pathname) {
  return /^\/docs\/([a-z0-9-]+)\.md$/.exec(pathname)?.[1]
}

/**
 * Guides the site publishes at /docs/<slug>.md: every guide a contract links in `docs`, plus
 * alwaysPublishedDocs. Each is { slug, title, url, markdown } with the file content as written.
 */
export function publishedDocs(entries) {
  const slugs = new Set(alwaysPublishedDocs)
  for (const entry of entries)
    for (const link of entry.docs ?? []) {
      const url = new URL(link.url)
      const slug = url.origin === publicOrigin && docSlug(url.pathname)
      if (slug) slugs.add(slug)
    }
  return [...slugs].sort().map((slug) => {
    const markdown = read(`docs/${slug}.md`)
    return {
      slug,
      title: /^# (.+)$/m.exec(markdown)?.[1].trim() ?? slug,
      url: `${publicOrigin}${docsRoute}${slug}.md`,
      markdown,
    }
  })
}

/**
 * Display titles follow one convention: the primary export (the first `api` entry) when it is a
 * component, otherwise the item name in PascalCase (Tokens, MotionHooks, UiBits).
 */
export function expectedTitle(contract) {
  const first = contract.api?.[0]
  if (first?.kind === "component") return first.export
  return String(contract.name)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

/** Generated catalog and lean gallery JSON for every item that has a contract. */
export function buildGenerated(names = contractNames().filter(hasContract)) {
  const entries = []
  const failures = []
  for (const name of names) {
    const { errors, entry } = validateContract(name)
    if (errors.length) failures.push({ name, errors })
    else entries.push(entry)
  }
  const header = "Generated by `pnpm contracts:build` from contracts/items; do not edit."
  const catalog = { $comment: header, items: entries }
  // Gallery cards: every entry except bundles, whose members each have their own card.
  const gallery = {
    $comment: header,
    items: entries.filter((entry) => entry.entry !== "bundle").map((entry) => ({
      name: entry.name,
      title: entry.title,
      description: entry.description,
      category: entry.category,
      capabilities: entry.capabilities,
      needsRemotion: entry.needsRemotion,
      registryDependencies: entry.registryDependencies,
      snippet: entry.examples[0].code,
      installName: entry.installName,
      sourcePath: entry.sourcePath,
      inRegistry: entry.inRegistry,
      // The strip's cells (and the skeleton that reserves their space) need labels and frames.
      ...(entry.cues ? { cues: entry.cues.map(({ label, frame }) => ({ label, frame })) } : {}),
      ...(entry.start !== undefined ? { start: entry.start } : {}),
      // Player items: the longest preview timeline, which sets the width frame numbers pad to.
      ...(entry.capabilities.includes("player") ? { frames: previewFrames(entry.name) } : {}),
    })),
  }
  // Guides published at /docs/<slug>.md, so agents never need the source repository.
  const docs = { $comment: header, docs: publishedDocs(entries) }
  const routes = {
    $comment: header,
    items: entries.map((entry) => entry.name),
    docs: docs.docs.map(({ slug, title }) => ({ slug, title })),
  }
  return { catalog, gallery, docs, routes, failures }
}

/** registry.json with titles, descriptions, and categories synced from contracts. */
export function syncedRegistry(entries) {
  const byName = new Map(entries.map((entry) => [entry.name, entry]))
  return {
    ...registry,
    items: registry.items.map((item) => {
      const entry = byName.get(item.name)
      if (!entry) return item
      return { ...item, title: entry.title, description: entry.description, categories: [entry.category] }
    }),
  }
}

export const json = (value) => JSON.stringify(value, null, 2) + "\n"
