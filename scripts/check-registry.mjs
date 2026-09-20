import { execFileSync } from "node:child_process"
import { readFileSync, readdirSync } from "node:fs"

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

const published = new Set(registry.items.flatMap(item => item.files.map(file => file.path)));
function checkDirectory(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = dir + "/" + entry.name;
    if (entry.isDirectory()) checkDirectory(path);
    else if (!published.has(path)) throw new Error("Unpublished registry source: " + path);
  }
}
checkDirectory("registry/jbm");
