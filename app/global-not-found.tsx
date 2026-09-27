import type { Metadata } from "next"
import { headers } from "next/headers"
import { getGalleryItems } from "@/components/gallery/item-meta"
import { ItemNotFound, SiteNotFound } from "@/components/gallery/not-found"
import { MISSING_ITEM_HEADER, nearestItemNames } from "@/lib/agent-routes"
import { getContracts } from "@/lib/contracts"
import { SiteDocument, siteMetadata } from "./document"

// The 404 for every unmatched URL, rendered on demand (next.config.ts enables globalNotFound).
// proxy.ts rewrites an unknown /c/<name> to the unmatched /c-missing and passes the name in the
// MISSING_ITEM_HEADER request header; this page then names it and suggests the closest item pages.
// Other paths, /c-missing itself included, get the plain site 404.
//
// Why here: the item pages are prerendered with dynamicParams = false, and a nested not-found.tsx
// gets no params. A rewrite with { status: 404 } works under `next start`, but Vercel answers it
// with the static /404 and drops the name. notFound() from a dynamic page sends a client-rendered
// empty shell. Reading headers() in app/not-found.tsx would make every page dynamic, because the
// root not-found renders into each page's payload; this file renders only for 404s.

export const metadata: Metadata = {
  ...siteMetadata,
  title: "Not found · jbm-ui",
}

// Keep an absurdly long address from turning the heading into a wall of text.
function displayName(raw: string) {
  let name = raw
  try {
    name = decodeURIComponent(raw)
  } catch {}
  return name.length > 64 ? `${name.slice(0, 63)}…` : name
}

function itemMatches(name: string) {
  // Suggest only names with a page of their own: gallery items and bundles. nearestItemNames is
  // the same matcher and threshold the /catalog and /docs 404s use, so "zzz" suggests nothing.
  const titles = new Map([
    ...getGalleryItems().map(({ name, title }) => [name, title] as const),
    ...getContracts()
      .filter((contract) => contract.entry === "bundle")
      .map(({ name, title }) => [name, title] as const),
  ])
  return nearestItemNames(name, 3, [...titles.keys()]).map((match) => ({
    name: match,
    title: titles.get(match) ?? match,
  }))
}

export default async function GlobalNotFound() {
  const raw = (await headers()).get(MISSING_ITEM_HEADER)
  const name = raw ? displayName(raw) : ""
  return (
    <SiteDocument>
      {name ? (
        <ItemNotFound name={name} matches={itemMatches(name)} />
      ) : (
        <SiteNotFound />
      )}
    </SiteDocument>
  )
}
