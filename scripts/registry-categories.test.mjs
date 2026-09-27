import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import ts from "typescript"

// Gallery categories (components/gallery/categories.ts) are the source of truth;
// registry.json repeats them in each item's shadcn `categories` field so agents
// reading /r/registry.json or /r/<name>.json see the same grouping.
function loadCategories() {
  const source = readFileSync("components/gallery/categories.ts", "utf8")
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const compiled = { exports: {} }
  new Function("module", "exports", code)(compiled, compiled.exports)
  return compiled.exports
}

const { category, categories } = loadCategories()
const registry = JSON.parse(readFileSync("registry.json", "utf8"))

test("every registry item carries its gallery category", () => {
  for (const item of registry.items)
    assert.deepEqual(item.categories, [category(item.name)], item.name)
})

test("registry categories are gallery categories", () => {
  const known = new Set(categories.filter((value) => value !== "All"))
  for (const item of registry.items)
    for (const value of item.categories) assert.ok(known.has(value), `${item.name}: ${value}`)
})

test("published registry items keep the categories", () => {
  const index = JSON.parse(readFileSync("public/r/registry.json", "utf8"))
  for (const item of index.items)
    assert.deepEqual(item.categories, [category(item.name)], `registry index: ${item.name}`)
  for (const item of registry.items) {
    const built = JSON.parse(readFileSync(`public/r/${item.name}.json`, "utf8"))
    assert.deepEqual(built.categories, [category(item.name)], `public/r/${item.name}.json`)
  }
})
