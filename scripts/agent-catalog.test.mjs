// The agent surfaces built by lib/agent-catalog.ts: every contract gets a per-item JSON and
// Markdown document, /llms.txt indexes every item, and the public catalog carries file paths.
//   node --test scripts/agent-catalog.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, statSync } from "node:fs"
import { registerHooks } from "node:module"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = resolve(import.meta.dirname, "..")

// Load the server-side TypeScript modules directly: resolve the @/ alias and extensionless
// imports the way the bundler does, and read JSON imports as default exports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    let base
    if (specifier.startsWith("@/")) base = join(root, specifier.slice(2))
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:"))
      base = resolve(fileURLToPath(new URL(".", context.parentURL)), specifier)
    if (base && !base.includes("node_modules"))
      for (const candidate of [base, `${base}.ts`, `${base}/index.ts`])
        if (existsSync(candidate) && statSync(candidate).isFile())
          return { url: pathToFileURL(candidate).href, shortCircuit: true }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && url.endsWith(".json"))
      return {
        format: "module",
        source: `export default ${readFileSync(fileURLToPath(url), "utf8")}`,
        shortCircuit: true,
      }
    return nextLoad(url, context)
  },
})

const catalogModule = await import(pathToFileURL(join(root, "lib/agent-catalog.ts")).href)
const {
  getCatalog,
  getCatalogItemJson,
  getCatalogItemNames,
  getItemMarkdown,
  getLlmsFullText,
  getLlmsText,
  extraFieldLines,
} = catalogModule

const generated = JSON.parse(readFileSync(join(root, "contracts/generated/catalog.json"), "utf8"))
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"))
const catalog = getCatalog()
const names = generated.items.map((item) => item.name)

test("every contract has a per-item endpoint name", () => {
  assert.deepEqual([...getCatalogItemNames()].sort(), [...names].sort())
  assert.deepEqual(catalog.items.map((item) => item.name).sort(), [...names].sort())
})

for (const name of names)
  test(`per-item endpoints: ${name}`, () => {
    const item = catalog.items.find((entry) => entry.name === name)
    const json = getCatalogItemJson(name, catalog)
    assert.ok(json, "JSON entry exists")
    for (const [key, value] of Object.entries(item)) assert.deepEqual(json[key], value, key)
    assert.equal(json.setup.componentsJson.registries["@jbm"], `${catalog.homepage}/r/{name}.json`)
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(json)))

    const md = getItemMarkdown(name, catalog)
    assert.ok(md, "Markdown exists")
    assert.match(md, new RegExp(`^# .+ \\(${name}\\)\\n`))
    assert.ok(md.includes(item.install), "install command")
    assert.ok(md.includes(`"@jbm": "${catalog.homepage}/r/{name}.json"`), "registry namespace with real origin")
    for (const file of item.files) {
      assert.ok(md.includes(file.target), `target ${file.target}`)
      assert.ok(md.includes(file.import), `import ${file.import}`)
    }
    for (const example of item.examples) assert.ok(md.includes(example.code), `example ${example.title}`)
    for (const note of item.qa) assert.ok(md.includes(note), "QA note")
    for (const entry of item.api)
      if (entry.kind === "component")
        for (const prop of entry.props) assert.ok(md.includes(`\`${prop.name}\``), `prop ${prop.name}`)
    assert.match(md, /## Stage\n/)
    assert.ok(!md.includes("[object Object]"), "no unrendered objects")
    // Table rows keep their column count: pipes inside types are escaped.
    for (const line of md.split("\n").filter((row) => row.startsWith("| ")))
      assert.ok(!/[^\\]\|[^\s-]/.test(line.slice(1, -1).replace(/\\\|/g, "")), `row: ${line}`)
  })

test("unknown names have no per-item endpoint", () => {
  assert.equal(getCatalogItemJson("does-not-exist", catalog), undefined)
  assert.equal(getItemMarkdown("does-not-exist", catalog), undefined)
})

test("llms.txt index lists every item with its Markdown, JSON, and page", () => {
  const text = getLlmsText(catalog)
  assert.match(text, /^# jbm-ui\n\n> /)
  assert.ok(text.includes("## Install once"))
  assert.ok(text.includes("/catalog/<name>.md"))
  assert.ok(text.includes(catalog.links.llmsFull))
  for (const item of catalog.items) {
    const line = text.split("\n").find((row) => row.includes(`](${item.endpoints.markdown})`))
    assert.ok(line, `index line for ${item.name}`)
    assert.ok(line.startsWith(`- [${item.title} (${item.name})]`), item.name)
    assert.ok(line.includes(item.endpoints.json), `${item.name} JSON link`)
    if (item.page !== "n/a") assert.ok(line.includes(item.page), `${item.name} page link`)
  }
  // The index stays an index: the full text lives at /llms-full.txt.
  assert.ok(text.length < getLlmsFullText(catalog).length / 4)
})

test("llms-full.txt keeps every item in full", () => {
  const text = getLlmsFullText(catalog)
  for (const item of catalog.items) {
    assert.ok(text.includes(`### ${item.title} (${item.name})`), item.name)
    assert.ok(text.includes(item.snippet), `${item.name} snippet`)
  }
})

test("public catalog has source paths, install targets, and import specifiers", () => {
  const targets = new Map(
    registry.items.flatMap((item) => item.files.map((file) => [file.path, file.target]))
  )
  for (const item of catalog.items) {
    const contract = generated.items.find((entry) => entry.name === item.name)
    assert.equal(item.sourcePath, contract.sourcePath, item.name)
    assert.deepEqual(item.files.map((file) => file.source), contract.files, item.name)
    for (const file of item.files) {
      assert.equal(file.target, targets.get(file.source), `${item.name} target`)
      assert.match(file.target, /^src\/jbm\//)
      assert.equal(file.import, file.target.replace(/^src\//, "@/").replace(/(\.d)?\.tsx?$/, ""))
    }
    assert.equal(item.endpoints.markdown, `${catalog.homepage}/catalog/${item.name}.md`)
    assert.equal(item.endpoints.json, `${catalog.homepage}/catalog/${item.name}.json`)
  }
  const folder = catalog.items.find((item) => item.name === "folder")
  assert.deepEqual(folder.files[0], {
    source: "registry/jbm/ui/folder.tsx",
    target: "src/jbm/ui/folder.tsx",
    import: "@/jbm/ui/folder",
    type: "registry:ui",
  })
})

test("bundles relate to the items they re-export", () => {
  const bundle = catalog.items.find((item) => item.entry === "bundle")
  const members = [
    ...new Set(bundle.api.filter((entry) => entry.kind === "re-export").map((entry) => entry.from)),
  ]
  assert.ok(members.length > 0)
  assert.deepEqual(
    bundle.related.filter((entry) => entry.relation === "re-exports").map((entry) => entry.name),
    members
  )
  const md = getItemMarkdown(bundle.name, catalog)
  for (const member of members) assert.ok(md.includes(`/catalog/${member}.md`), member)
})

test("extra contract fields render generically", () => {
  assert.deepEqual(extraFieldLines(["a", "b"]), ["- a", "- b"])
  assert.deepEqual(extraFieldLines([{ title: "Spec", url: "https://x.test/spec", note: "YAML" }]), [
    "- [Spec](https://x.test/spec): note: YAML",
  ])
  assert.deepEqual(extraFieldLines("text"), ["text"])
  assert.equal(extraFieldLines({ a: 1 })[0], "```json")
})
