// Every gallery item (plus the ui-bits bundle) has a complete, valid agent contract whose props
// match the component source, and the generated JSON is current.
//   node --test scripts/contracts.test.mjs                          all items
//   CONTRACT_ITEMS="counter folder" node --test scripts/contracts.test.mjs   only these
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  buildGenerated,
  catalogPath,
  contractNames,
  galleryPath,
  json,
  root,
  syncedRegistry,
  validateContract,
} from "./lib/contracts.mjs"

const subset = (process.env.CONTRACT_ITEMS ?? "").split(/[,\s]+/).filter(Boolean)
const names = subset.length ? subset : contractNames()

for (const name of names)
  test(`contract: ${name}`, () => {
    const { errors } = validateContract(name)
    assert.deepEqual(errors, [], `${name}:\n  - ${errors.join("\n  - ")}`)
  })

test("generated contracts and registry.json are current", { skip: subset.length > 0 && "subset run" }, () => {
  const { catalog, gallery } = buildGenerated()
  assert.equal(readFileSync(catalogPath, "utf8"), json(catalog), "run pnpm contracts:build")
  assert.equal(readFileSync(galleryPath, "utf8"), json(gallery), "run pnpm contracts:build")
  assert.equal(
    readFileSync(`${root}/registry.json`, "utf8"),
    json(syncedRegistry(catalog.items)),
    "run pnpm contracts:build, then pnpm registry:build"
  )
})
