// Known agent endpoint names and the answers for unknown ones. proxy.ts imports this module, so it
// reads only contracts/generated/routes.json (names and guide slugs), never the full catalog.
import routes from "@/contracts/generated/routes.json"
import { siteOrigin } from "@/lib/site"

export const itemNames: string[] = routes.items
export const docGuides: { slug: string; title: string }[] = routes.docs

/**
 * Request header proxy.ts sets on an unknown /c/<name>: the URI-encoded name (at most 128
 * characters) that app/global-not-found.tsx names in the 404. The proxy always overwrites it there; a
 * client that sends it elsewhere only changes the wording of its own 404.
 */
export const MISSING_ITEM_HEADER = "x-jbm-missing-item"

/**
 * Edit distance with adjacent transpositions (optimal string alignment): "clcok" is one edit from
 * "clock", not two.
 */
function editDistance(a: string, b: string) {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1)
    }
  return rows[a.length][b.length]
}

/** The catalog name that matches `query` ignoring case, if any. */
export function canonicalItemName(query: string, names = itemNames) {
  const lower = query.toLowerCase()
  return names.find((name) => name.toLowerCase() === lower)
}

/**
 * Similarity threshold shared by every "did you mean" on the site. A name is suggested only when,
 * comparing lowercase letters and digits with separators dropped ("Tool Caddy" → "toolcaddy"):
 *   0. it equals the query ("toolcaddy" → tool-caddy, "Folder" → folder);
 *   1. a partial word: it starts with the query, at least MIN_PREFIX characters ("pap" → paper,
 *      paper-clip…); one of its words starts with a query word of at least MIN_WORD characters
 *      ("cabinet" → file-cabinet, "clip" → paper-clip, clipped-note); or the query starts with
 *      it, a name of at least MIN_WORD characters ("folders" → folder);
 *   2. it is within MAX_EDIT_RATIO edits per character of the longer string, at least one edit
 *      ("foldr" → folder, "clcok" → clock).
 * Anything else is noise: "zzz" suggests nothing rather than whichever name happens to be closest.
 * Matches rank by rule, then edit distance, then catalog order.
 */
export const SUGGESTION_THRESHOLD = {
  MIN_PREFIX: 2,
  MIN_WORD: 3,
  MAX_EDIT_RATIO: 1 / 3,
} as const

const compact = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
const words = (value: string) =>
  value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

/**
 * Up to `count` names similar to `query` under SUGGESTION_THRESHOLD, closest first. Empty when
 * nothing is genuinely similar. The /catalog, /docs, and /c 404s all use this.
 */
export function nearestItemNames(query: string, count = 3, names = itemNames) {
  const { MIN_PREFIX, MIN_WORD, MAX_EDIT_RATIO } = SUGGESTION_THRESHOLD
  const q = compact(query)
  if (!q) return []
  const queryWords = words(query).filter((word) => word.length >= MIN_WORD)
  return names
    .map((name, order) => {
      const n = compact(name)
      const distance = editDistance(q, n)
      const tier =
        n === q
          ? 0
          : (q.length >= MIN_PREFIX && n.startsWith(q)) ||
              (n.length >= MIN_WORD && q.startsWith(n)) ||
              queryWords.some((word) => words(name).some((part) => part.startsWith(word)))
            ? 1
            : distance <=
                Math.max(1, Math.floor(Math.max(q.length, n.length) * MAX_EDIT_RATIO))
              ? 2
              : 3
      return { name, order, distance, tier }
    })
    .filter((match) => match.tier < 3)
    .sort((a, b) => a.tier - b.tier || a.distance - b.distance || a.order - b.order)
    .slice(0, count)
    .map((match) => match.name)
}

/** The single closest name to `query` under SUGGESTION_THRESHOLD, or undefined when none is similar. */
export function nearestItemName(query: string, names = itemNames): string | undefined {
  return nearestItemNames(query, 1, names)[0]
}

/** Body of a /catalog/<name>.json 404. `didYouMean` and `suggestion` are null when nothing is similar. */
export function catalogNotFoundJson(name: string, origin = siteOrigin()) {
  const match = nearestItemName(name) ?? null
  return {
    error: `No catalog item is named "${name}".`,
    didYouMean: match,
    suggestion: match ? `${origin}/catalog/${match}.json` : null,
    index: "/llms.txt",
    catalog: "/catalog.json",
  }
}

/** Body of a /catalog/<name>.md 404. */
export function catalogNotFoundMarkdown(name: string, origin = siteOrigin()) {
  const match = nearestItemName(name)
  return [
    "# Not found",
    "",
    `No catalog item is named \`${name}\`.`,
    "",
    match
      ? `- Did you mean [${match}](${origin}/catalog/${match}.md)?`
      : "- No item has a similar name.",
    `- Every item: [llms.txt](${origin}/llms.txt) or [catalog.json](${origin}/catalog.json)`,
    "",
  ].join("\n")
}

/** The published guide slug that matches `query` ignoring case, if any. */
export function canonicalGuideSlug(query: string) {
  return canonicalItemName(
    query,
    docGuides.map((doc) => doc.slug)
  )
}

/** Body of a /docs/<slug>.md 404: the closest guide, if any, then every published guide. */
export function docsNotFoundMarkdown(slug = "", origin = siteOrigin()) {
  const match = slug
    ? nearestItemName(
        slug,
        docGuides.map((doc) => doc.slug)
      )
    : undefined
  const guide = docGuides.find((doc) => doc.slug === match)
  return [
    "# Not found",
    "",
    "No guide is published at this address.",
    ...(guide
      ? ["", `Did you mean [${guide.title}](${origin}/docs/${guide.slug}.md)?`]
      : []),
    "",
    "Published guides:",
    "",
    ...docGuides.map((doc) => `- [${doc.title}](${origin}/docs/${doc.slug}.md)`),
    "",
  ].join("\n")
}
