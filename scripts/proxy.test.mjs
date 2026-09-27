// proxy.ts routing for item pages and agent endpoints. An unknown /c/<name> must reach
// app/global-not-found.tsx with its name in a request header and no status override: Vercel answers
// a rewrite with { status: 404 } with its static /404, which cannot name the item.
//   node --test scripts/proxy.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, statSync } from "node:fs"
import { registerHooks } from "node:module"
import { join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = resolve(import.meta.dirname, "..")

// Load proxy.ts directly: resolve the @/ alias, extensionless imports, and next/server (which has
// no ESM exports map), and read JSON imports as default exports.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") return nextResolve("next/server.js", context)
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

const { NextRequest } = await import("next/server")
const { proxy } = await import(pathToFileURL(join(root, "proxy.ts")).href)
const { MISSING_ITEM_HEADER } = await import(pathToFileURL(join(root, "lib/agent-routes.ts")).href)

const origin = "https://jbm-ui.test"
const run = (path) => proxy(new NextRequest(`${origin}${path}`))
// NextResponse.next/rewrite carry request-header overrides as x-middleware-request-* headers.
const requestHeader = (response, name) => response.headers.get(`x-middleware-request-${name}`)

test("a known /c/<name> passes through to its prerendered page", () => {
  const response = run("/c/folder")
  assert.equal(response.headers.get("x-middleware-next"), "1")
  assert.equal(response.headers.get("x-middleware-rewrite"), null)
  assert.equal(requestHeader(response, MISSING_ITEM_HEADER), null)
})

test("another casing of a known /c/<name> redirects permanently", () => {
  const response = run("/c/Folder")
  assert.equal(response.status, 308)
  assert.equal(response.headers.get("location"), `${origin}/c/folder`)
})

for (const [path, name] of [
  ["/c/foldr", "foldr"],
  ["/c/zzz", "zzz"],
  ["/c/%E2%9C%93", "✓"],
])
  test(`unknown ${path} reaches the global 404 with its name`, () => {
    const response = run(path)
    // No status override: the 404 status comes from app/global-not-found.tsx.
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("x-middleware-rewrite"), `${origin}/c-missing`)
    assert.equal(decodeURIComponent(requestHeader(response, MISSING_ITEM_HEADER)), name)
  })

test("an unknown name is capped before it reaches the 404", () => {
  const response = run(`/c/${"a".repeat(300)}`)
  assert.equal(requestHeader(response, MISSING_ITEM_HEADER), "a".repeat(128))
})

test("the rewrite target is not a route of its own", () => {
  assert.equal(existsSync(join(root, "app/c-missing")), false)
  assert.ok(existsSync(join(root, "app/global-not-found.tsx")))
})

test("agent endpoints answer unknown names in their own format", async () => {
  const json = run("/catalog/foldr.json")
  assert.equal(json.status, 404)
  assert.equal((await json.json()).didYouMean, "folder")
  const markdown = run("/catalog/foldr.md")
  assert.equal(markdown.status, 404)
  assert.match(markdown.headers.get("content-type"), /text\/markdown/)
  assert.equal(run("/catalog/Folder.json").headers.get("location"), `${origin}/catalog/folder.json`)
  assert.equal(run("/docs/zzz.md").status, 404)
})
