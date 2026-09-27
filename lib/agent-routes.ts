// Known agent endpoint names and the answers for unknown ones. proxy.ts imports this module, so it
// reads only contracts/generated/routes.json (names and guide slugs), never the full catalog.
import routes from "@/contracts/generated/routes.json"
import { siteOrigin } from "@/lib/site"

export const itemNames: string[] = routes.items
export const docGuides: { slug: string; title: string }[] = routes.docs

function editDistance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++)
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    previous = current
  }
  return previous[b.length]
}

/** The catalog name that matches `query` ignoring case, if any. */
export function canonicalItemName(query: string, names = itemNames) {
  const lower = query.toLowerCase()
  return names.find((name) => name.toLowerCase() === lower)
}

/** The closest catalog name to `query`: a prefix match first, else the smallest edit distance. */
export function nearestItemName(query: string, names = itemNames) {
  const lower = query.toLowerCase()
  const prefixed = names.find(
    (name) => lower.length >= 3 && (name.startsWith(lower) || lower.startsWith(name))
  )
  if (prefixed) return prefixed
  let best = names[0]
  let bestDistance = Infinity
  for (const name of names) {
    const distance = editDistance(lower, name)
    if (distance < bestDistance) [best, bestDistance] = [name, distance]
  }
  return best
}

/**
 * Up to `count` plausible names for `query`, closest first: prefix matches, then names that
 * contain the query (or it them), then small edit distances. Unlike nearestItemName this can be
 * empty: a query with nothing close (`zzz`) suggests nothing rather than a random item.
 */
export function nearestItemNames(query: string, count = 3, names = itemNames) {
  const lower = query.toLowerCase()
  const long = lower.length >= 3
  const limit = Math.max(2, Math.floor(lower.length / 2))
  return names
    .map((name, order) => {
      const distance = editDistance(lower, name)
      const tier =
        long && (name.startsWith(lower) || lower.startsWith(name))
          ? 0
          : long && (name.includes(lower) || (name.length >= 3 && lower.includes(name)))
            ? 1
            : distance <= limit
              ? 2
              : 3
      return { name, order, distance, tier }
    })
    .filter((match) => match.tier < 3)
    .sort((a, b) => a.tier - b.tier || a.distance - b.distance || a.order - b.order)
    .slice(0, count)
    .map((match) => match.name)
}

/** Body of a /catalog/<name>.json 404. */
export function catalogNotFoundJson(name: string, origin = siteOrigin()) {
  const suggestion = nearestItemName(name)
  return {
    error: `No catalog item is named "${name}".`,
    didYouMean: suggestion,
    suggestion: `${origin}/catalog/${suggestion}.json`,
    index: "/llms.txt",
    catalog: "/catalog.json",
  }
}

/** Body of a /catalog/<name>.md 404. */
export function catalogNotFoundMarkdown(name: string, origin = siteOrigin()) {
  const suggestion = nearestItemName(name)
  return [
    "# Not found",
    "",
    `No catalog item is named \`${name}\`.`,
    "",
    `- Did you mean [${suggestion}](${origin}/catalog/${suggestion}.md)?`,
    `- Every item: [llms.txt](${origin}/llms.txt) or [catalog.json](${origin}/catalog.json)`,
    "",
  ].join("\n")
}

/** Body of a /docs/<slug>.md 404: the published guides. */
export function docsNotFoundMarkdown(origin = siteOrigin()) {
  return [
    "# Not found",
    "",
    "No guide is published at this address. Published guides:",
    "",
    ...docGuides.map((doc) => `- [${doc.title}](${origin}/docs/${doc.slug}.md)`),
    "",
  ].join("\n")
}
