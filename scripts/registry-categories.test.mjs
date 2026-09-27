import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { categories } from "./lib/contracts.mjs"

// Each item's agent contract (contracts/items, generated into contracts/generated/catalog.json)
// is the source of truth for its category; registry.json repeats it in the shadcn `categories`
// field so agents reading /r/registry.json or /r/<name>.json see the same grouping.
const read = (path) => JSON.parse(readFileSync(path, "utf8"))
const contracts = new Map(
  read("contracts/generated/catalog.json").items.map((entry) => [entry.name, entry])
)
const registry = read("registry.json")

function category(name) {
  const contract = contracts.get(name)
  assert.ok(contract, `${name} has no generated contract; run pnpm contracts:build`)
  return contract.category
}

test("every registry item carries its contract category", () => {
  for (const item of registry.items)
    assert.deepEqual(item.categories, [category(item.name)], item.name)
})

test("registry categories are gallery categories", () => {
  const known = new Set(categories)
  for (const item of registry.items)
    for (const value of item.categories) assert.ok(known.has(value), `${item.name}: ${value}`)
})

test("published registry items keep the categories", () => {
  const index = read("public/r/registry.json")
  for (const item of index.items)
    assert.deepEqual(item.categories, [category(item.name)], `registry index: ${item.name}`)
  for (const item of registry.items) {
    const built = read(`public/r/${item.name}.json`)
    assert.deepEqual(built.categories, [category(item.name)], `public/r/${item.name}.json`)
  }
})
