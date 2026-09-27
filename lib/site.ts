const fallbackOrigin = "https://jbm-ui.bns.studio"

/**
 * Canonical origin for install URLs and machine-readable catalogs.
 * next.config.ts inlines VERCEL_PROJECT_PRODUCTION_URL so the server and the
 * browser resolve the same value and hydration stays consistent.
 */
export function siteOrigin(): string {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (production ? `https://${production}` : "") ||
    fallbackOrigin
  return origin.replace(/\/+$/, "")
}

/**
 * GitHub URL for a repository file, for human-facing "Source ↗" links only. Agent-facing outputs
 * (catalog, llms*, per-item Markdown and JSON, schemas) never carry repository URLs.
 */
export function repoSourceUrl(path: string): string {
  return `https://github.com/chekos/jbm-ui/blob/main/${path}`
}

/** shadcn registry URL template for the @jbm namespace. */
export function registryUrlTemplate(origin = siteOrigin()): string {
  return `${origin}/r/{name}.json`
}

/** Machine-readable alternates for every page: <link rel="alternate"> to llms.txt and catalog.json. */
export const agentAlternates = {
  types: {
    "text/plain": "/llms.txt",
    "application/json": "/catalog.json",
  },
}

const repoBlobBase = "https://github.com/chekos/jbm-ui/blob/main"

/**
 * GitHub URL for a file in the public source repository, for human-facing "Source ↗" links only.
 * Agent outputs (catalog.json, llms*.txt, /catalog/<name>.md|json, /docs, schemas) never link the
 * repository; scripts/agent-catalog.test.mjs enforces that.
 *   repoSourceUrl("registry/jbm/ui/folder.tsx")
 *   → "https://github.com/chekos/jbm-ui/blob/main/registry/jbm/ui/folder.tsx"
 */
export function repoSourceUrl(path: string): string {
  const clean = path.replace(/^(\.?\/)+/, "")
  return `${repoBlobBase}/${clean.split("/").map(encodeURIComponent).join("/")}`
}
