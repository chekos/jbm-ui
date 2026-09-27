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

/**
 * Human-facing GitHub link to a file in the public source repository. Pages for people may link
 * here ("Source ↗"); agent-facing outputs (catalog, llms*.txt, per-item Markdown/JSON, schemas,
 * registry JSON) must not, and scripts/agent-catalog.test.mjs enforces that.
 */
export function repoSourceUrl(path: string): string {
  return `https://github.com/chekos/jbm-ui/blob/main/${path}`
}
