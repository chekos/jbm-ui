// lib/site.ts: human-facing source links into the public repository.
//   node --test scripts/site.test.mjs
import test from "node:test"
import assert from "node:assert/strict"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const root = resolve(import.meta.dirname, "..")
const { repoSourceUrl } = await import(pathToFileURL(join(root, "lib/site.ts")).href)

test("repoSourceUrl links a repository file on the main branch", () => {
  const base = "https://github.com/chekos/jbm-ui/blob/main/"
  assert.equal(repoSourceUrl("registry/jbm/ui/folder.tsx"), `${base}registry/jbm/ui/folder.tsx`)
  assert.equal(repoSourceUrl("/lib/tokens.ts"), `${base}lib/tokens.ts`)
  assert.equal(repoSourceUrl("./docs/scene-spec.md"), `${base}docs/scene-spec.md`)
  assert.equal(repoSourceUrl("docs/a b#c.md"), `${base}docs/a%20b%23c.md`)
})
