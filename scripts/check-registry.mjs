import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

execFileSync("pnpm", ["registry:build"], { stdio: "inherit" })
const changes = execFileSync(
  "git",
  ["status", "--porcelain", "--", "public/r"],
  { encoding: "utf8" }
)
if (changes.trim())
  throw new Error(
    "Registry output is stale. Run pnpm registry:build and commit public/r/."
  )
const registry = JSON.parse(readFileSync("registry.json", "utf8"))
for (const item of registry.items) {
  const built = JSON.parse(readFileSync(`public/r/${item.name}.json`, "utf8"))
  if (built.name !== item.name)
    throw new Error(`Incorrect registry item: ${item.name}`)
  for (const file of built.files) {
    if (file.content !== readFileSync(file.path, "utf8"))
      throw new Error(`Stale source: ${file.path}`)
  }
}
console.log(`Verified ${registry.items.length} registry items.`)
