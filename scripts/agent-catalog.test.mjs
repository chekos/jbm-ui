// The agent surfaces built by lib/agent-catalog.ts: every contract gets a per-item JSON and
// Markdown document, /llms.txt indexes every item, and the public catalog carries file paths.
//   node --test scripts/agent-catalog.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
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
  canonicalItemName,
  nearestItemName,
  nearestItemNames,
  catalogNotFoundJson,
  catalogNotFoundMarkdown,
} = catalogModule
const { docsNotFoundMarkdown } = await import(pathToFileURL(join(root, "lib/agent-routes.ts")).href)

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
    // One heading for the API whether the item has one export or many.
    assert.ok(md.includes("\n## API\n"), "## API heading")
    assert.ok(!md.includes("\n## Props\n"), "no ## Props heading")
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
    const tag = item.needsRemotion ? "Remotion" : "React"
    assert.ok(line.includes(`](${item.endpoints.markdown}) · ${tag}: `), `${item.name} runtime tag`)
    assert.ok(line.includes(item.endpoints.json), `${item.name} JSON link`)
    if (item.page !== null) assert.ok(line.includes(item.page), `${item.name} page link`)
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

test("bundles have a null page with a reason, and the catalog documents page", () => {
  for (const item of catalog.items) {
    if (item.entry === "bundle") {
      assert.equal(item.page, null, item.name)
      assert.ok(item.pageReason, `${item.name} pageReason`)
    } else assert.equal(item.page, `${catalog.homepage}/c/${item.name}`, item.name)
  }
  assert.ok(catalog.fields.page.includes("null"))
})

test("titles are the primary component export, else the name in PascalCase", () => {
  const pascal = (name) => name.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("")
  for (const item of catalog.items) {
    const first = item.api[0]
    assert.equal(item.title, first?.kind === "component" ? first.export : pascal(item.name), item.name)
  }
  const title = (name) => catalog.items.find((item) => item.name === name).title
  assert.equal(title("tool-caddy"), "ToolCaddy")
  assert.equal(title("ui-button"), "UiButton")
  assert.equal(title("action-link"), "ActionLink")
})

test("unknown catalog names suggest the nearest item; other casings resolve", () => {
  assert.equal(canonicalItemName("Folder"), "folder")
  assert.equal(canonicalItemName("TOOL-CADDY"), "tool-caddy")
  assert.equal(canonicalItemName("zzz"), undefined)
  assert.equal(nearestItemName("foldr"), "folder")
  assert.equal(nearestItemName("toolcaddy"), "tool-caddy")
  const json = catalogNotFoundJson("foldr")
  assert.equal(json.didYouMean, "folder")
  assert.equal(json.index, "/llms.txt")
  assert.ok(json.error.includes("foldr"))
  const md = catalogNotFoundMarkdown("foldr")
  assert.match(md, /^# Not found\n/)
  assert.ok(md.includes("/catalog/folder.md"))
})

test("the /c 404 suggests a few close names, or none for noise", () => {
  assert.equal(nearestItemNames("foldr")[0], "folder")
  assert.equal(nearestItemNames("toolcaddy")[0], "tool-caddy")
  assert.ok(nearestItemNames("cabinet").includes("file-cabinet"))
  assert.ok(nearestItemNames("foldr").length <= 3)
  assert.deepEqual(nearestItemNames("zzz"), [])
  assert.deepEqual(nearestItemNames("zz", 3, ["folder", "zzap"]), ["zzap"])
})

// One matcher and threshold (SUGGESTION_THRESHOLD) serves /catalog/<x>.md, /catalog/<x>.json,
// /docs/<x>.md, and the /c/<x> page, so the same query gets the same answer everywhere.
test("noise suggests nothing on every surface", () => {
  for (const query of ["zzz", "qqqq", "xylophone", "a"]) {
    assert.equal(nearestItemName(query), undefined, query)
    assert.deepEqual(nearestItemNames(query), [], query)
    const json = catalogNotFoundJson(query)
    assert.equal(json.didYouMean, null, query)
    assert.equal(json.suggestion, null, query)
    const md = catalogNotFoundMarkdown(query)
    assert.ok(!md.includes("Did you mean"), query)
    assert.ok(md.includes("No item has a similar name."), query)
    assert.ok(!docsNotFoundMarkdown(query).includes("Did you mean"), query)
  }
})

test("typos, casing, and partial words suggest the same names on every surface", () => {
  for (const query of ["foldr", "Folder", "FOLDR", "flder", "folders"]) {
    assert.equal(nearestItemName(query), "folder", query)
    assert.equal(catalogNotFoundJson(query).didYouMean, "folder", query)
    assert.ok(catalogNotFoundMarkdown(query).includes("/catalog/folder.md"), query)
  }
  assert.deepEqual(nearestItemNames("paper", 4), ["paper", "paper-clip", "paper-line", "paper-tape"])
  assert.deepEqual(nearestItemNames("clip", 2), ["paper-clip", "clipped-note"])
  assert.equal(nearestItemName("clcok"), "clock")
  assert.equal(nearestItemName("Tool Caddy"), "tool-caddy")
  assert.match(docsNotFoundMarkdown("scene"), /Did you mean \[Scene specs\]\([^)]*\/docs\/scene-spec\.md\)/)
  assert.match(docsNotFoundMarkdown("surface-dept"), /\/docs\/surface-depth\.md\)\?/)
})

// Agent outputs stay on this site: the source repository is public and humans get "Source ↗"
// links (lib/site.ts repoSourceUrl), but nothing an agent reads links into it, and every guide
// link resolves to a published guide.
const repoUrl = /github\.com\/chekos\/jbm-ui/i
const publishedDocs = JSON.parse(readFileSync(join(root, "contracts/generated/docs.json"), "utf8")).docs
const publicJson = (dir) =>
  readdirSync(join(root, dir))
    .filter((file) => file.endsWith(".json"))
    .map((file) => [`${dir}/${file}`, readFileSync(join(root, dir, file), "utf8")])
const agentOutputs = () => [
  ["catalog.json", JSON.stringify(catalog)],
  ["llms.txt", getLlmsText(catalog)],
  ["llms-full.txt", getLlmsFullText(catalog)],
  ...names.flatMap((name) => [
    [`catalog/${name}.json`, JSON.stringify(getCatalogItemJson(name, catalog))],
    [`catalog/${name}.md`, getItemMarkdown(name, catalog)],
  ]),
  ...publishedDocs.map((doc) => [`docs/${doc.slug}.md`, doc.markdown]),
  ...publicJson("public/schemas"),
  ...publicJson("public/r"),
  ["contracts/generated/catalog.json", readFileSync(join(root, "contracts/generated/catalog.json"), "utf8")],
]

test("no agent-facing output links to the source repository", () => {
  for (const [label, text] of agentOutputs()) assert.ok(!repoUrl.test(text), `${label} links the source repository`)
})

test("every /docs/ link maps to a published guide", () => {
  const slugs = new Set(publishedDocs.map((doc) => doc.slug))
  for (const doc of publishedDocs) {
    assert.ok(existsSync(join(root, "docs", `${doc.slug}.md`)), doc.slug)
    assert.equal(doc.markdown, readFileSync(join(root, "docs", `${doc.slug}.md`), "utf8"), `${doc.slug} is current`)
  }
  assert.ok(slugs.has("agent-contract") && slugs.has("scene-spec"))
  assert.equal(catalog.links.contract, `${catalog.homepage}/docs/agent-contract.md`)
  let checked = 0
  for (const [label, text] of agentOutputs())
    for (const [, slug] of text.matchAll(/(?:^|[\s("\x27\[<]|\.studio|\/\/[\w.:-]+)\/docs\/([\w.-]+?)\.md\b/g)) {
      checked += 1
      assert.ok(slugs.has(slug), `${label}: /docs/${slug}.md is not a published guide`)
    }
  assert.ok(checked > 0)
  for (const item of catalog.items)
    for (const link of item.docs ?? []) {
      const url = new URL(link.url, catalog.homepage)
      assert.match(url.pathname, /^\/docs\/[a-z0-9-]+\.md$/, `${item.name}: ${link.url}`)
      assert.ok(slugs.has(url.pathname.slice(6, -3)), `${item.name}: ${link.url}`)
    }
})
