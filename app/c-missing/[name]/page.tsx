import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getGalleryItems } from "@/components/gallery/item-meta"
import { ItemNotFound } from "@/components/gallery/not-found"
import { itemNames, nearestItemNames } from "@/lib/agent-routes"
import { getContracts } from "@/lib/contracts"

// The /c/<unknown> 404. The item pages are prerendered with dynamicParams = false, and a nested
// not-found.tsx is not server-rendered for them, so proxy.ts rewrites an unknown /c/<name> here
// with a 404 status. The address bar keeps /c/<name>; this path is never linked.

type Props = { params: Promise<{ name: string }> }

export const metadata: Metadata = {
  title: "Not found · jbm-ui",
  robots: { index: false, follow: true },
}

// Keep an absurdly long address from turning the heading into a wall of text.
function displayName(raw: string) {
  let name = raw
  try {
    name = decodeURIComponent(raw)
  } catch {}
  return name.length > 64 ? `${name.slice(0, 63)}…` : name
}

export default async function MissingItem({ params }: Props) {
  const { name: raw } = await params
  const name = displayName(raw)
  // Reached directly with a real name: send the reader to the item page.
  if (itemNames.includes(name)) redirect(`/c/${name}`)
  // Suggest only names with a page of their own: gallery items and bundles.
  const titles = new Map([
    ...getGalleryItems().map(({ name, title }) => [name, title] as const),
    ...getContracts()
      .filter((contract) => contract.entry === "bundle")
      .map(({ name, title }) => [name, title] as const),
  ])
  const matches = nearestItemNames(name, 3, [...titles.keys()]).map(
    (match) => ({ name: match, title: titles.get(match) ?? match })
  )
  return <ItemNotFound name={name} matches={matches} />
}
