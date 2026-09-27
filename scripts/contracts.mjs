// Agent contract CLI.
//   node scripts/contracts.mjs build             write contracts/generated/*.json and public/schemas/*.json, sync registry.json
//   node scripts/contracts.mjs check             fail when generated JSON, schemas, or registry.json are stale
//   node scripts/contracts.mjs validate a b …    validate named contracts only (no writes)
//   node scripts/contracts.mjs status            list gallery items still missing a contract
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import {
  buildGenerated,
  catalogPath,
  contractNames,
  galleryPath,
  generatedDir,
  generatedSchemas,
  hasContract,
  json,
  root,
  syncedRegistry,
  validateContract,
} from "./lib/contracts.mjs"

const [command = "check", ...names] = process.argv.slice(2)
const registryPath = join(root, "registry.json")
const readOr = (path) => {
  try {
    return readFileSync(path, "utf8")
  } catch {
    return ""
  }
}

function report(failures) {
  for (const { name, errors } of failures) {
    console.error(`\n✗ ${name}`)
    for (const error of errors) console.error(`  - ${error}`)
  }
}

if (command === "validate") {
  const targets = names.flatMap((value) => value.split(/[,\s]+/)).filter(Boolean)
  if (!targets.length) {
    console.error("Usage: pnpm contracts:validate <name> [<name> …]")
    process.exit(2)
  }
  const failures = []
  for (const name of targets) {
    const { errors } = validateContract(name)
    if (errors.length) failures.push({ name, errors })
    else console.log(`✓ ${name}`)
  }
  report(failures)
  process.exit(failures.length ? 1 : 0)
}

if (command === "status") {
  const missing = contractNames().filter((name) => !hasContract(name))
  console.log(`${contractNames().length - missing.length} of ${contractNames().length} items have contracts.`)
  if (missing.length) console.log(`Missing: ${missing.join(" ")}`)
  process.exit(0)
}

const { catalog, gallery, failures } = buildGenerated()
if (failures.length) {
  report(failures)
  console.error("\nFix the contracts above, then rerun.")
  process.exit(1)
}
const outputs = [
  [catalogPath, json(catalog)],
  [galleryPath, json(gallery)],
  [registryPath, json(syncedRegistry(catalog.items))],
  ...generatedSchemas().map(({ file, schema }) => [file, json(schema)]),
]

if (command === "build") {
  mkdirSync(generatedDir, { recursive: true })
  for (const [path, content] of outputs) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, content)
  }
  console.log(`Wrote ${catalog.items.length} contracts. Run pnpm registry:build if registry.json changed.`)
} else if (command === "check") {
  const stale = outputs.filter(([path, content]) => readOr(path) !== content)
  if (stale.length) {
    console.error(
      `Stale: ${stale.map(([path]) => path.slice(root.length + 1)).join(", ")}. Run pnpm contracts:build and commit the output.`
    )
    process.exit(1)
  }
  console.log(`Verified ${catalog.items.length} generated contracts.`)
} else {
  console.error(`Unknown command: ${command}`)
  process.exit(2)
}
