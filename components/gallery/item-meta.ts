// Client-safe metadata for every gallery card: the index, the /c/<name> QA pages, and the
// machine-readable surfaces read the same categories, capabilities, and snippets from here.
// The agent contracts (contracts/items, generated into contracts/generated/gallery.json) are
// the only source; run `pnpm contracts:build` after editing one.
import generated from "@/contracts/generated/gallery.json"
import type { Capability } from "@/contracts/schema"
import { categoryFamilies, type Category, type Family } from "./categories"

export type { Capability }

/** Tag wording for readers on cards and /c pages; the ids stay in data attributes and search. */
export const capabilityLabel: Record<Capability, string> = {
  controls: "adjustable",
  scroll: "scroll-driven",
  replay: "replayable",
  portrait: "landscape + vertical",
  player: "video player",
}

export type GalleryItemMeta = {
  name: string
  title: string
  description: string
  category: Exclude<Category, "All">
  /** The index sub-heading within the category, for categories that list families. */
  family?: Family
  /** What the preview lets you inspect. Empty for a static example. */
  capabilities: Capability[]
  /** True when the item, or anything it installs, depends on Remotion. */
  needsRemotion: boolean
  registryDependencies: string[]
  /** The contract's first example. */
  snippet: string
  /** Registry item that `npx shadcn add` installs (surface-depth is documentation for @jbm/tokens). */
  installName: string
  /** Repository path of the item's primary source file. */
  sourcePath: string
  /** False for documentation entries that have no registry JSON of their own. */
  inRegistry: boolean
  /** Player items: the contract's cues, the strip frames between Begin and End. */
  cues?: StripCue[]
  /** Player items: the caption of the strip's frame-0 cell when it is not "Begin". */
  start?: string
  /**
   * Player items: frames in the longest gallery preview timeline (the default layout for
   * scene-spec). Frame numbers pad to the digits of its last frame everywhere on the bench.
   */
  frames?: number
}

/** A labelled frame on the gallery preview timeline (zero-based, 30 fps). */
export type StripCue = { label: string; frame: number }

// Gallery order: tokens, the surface-depth note, then the registry. Bundles (ui-bits) have no
// card of their own; each member does. A category that lists families (categories.ts) orders its
// members by family, keeping gallery order within each, so the index sub-headings and the
// /c/<name> pager walk the same sequence.
const galleryItems = orderByFamily(generated.items as GalleryItemMeta[])

function orderByFamily(items: GalleryItemMeta[]) {
  const out = [...items]
  for (const [category, families] of Object.entries(categoryFamilies)) {
    const order: readonly string[] = families
    const rank = (item: GalleryItemMeta) =>
      item.family ? order.indexOf(item.family) : order.length
    const slots = out.flatMap((item, i) => (item.category === category ? [i] : []))
    const members = slots.map((i) => out[i]).sort((a, b) => rank(a) - rank(b))
    slots.forEach((slot, k) => (out[slot] = members[k]))
  }
  return out
}
const byName = new Map(galleryItems.map((item) => [item.name, item]))

export function addCommand(name: string) {
  return `npx shadcn@latest add @jbm/${name}`
}

const hasCapability = (name: string, capability: Capability) =>
  byName.get(name)?.capabilities.includes(capability) ?? false

/** Previews in the Remotion Player (MotionPreview); every other item renders plain React. */
export const isPlayerPreview = (name: string) => hasCapability(name, "player")
/** Player previews that compile into both stage orientations (landscape and vertical). */
export const supportsOrientation = (name: string) =>
  hasCapability(name, "portrait")

/** Every gallery item, in gallery order, with its category, capabilities, and install data. */
export function getGalleryItems(): GalleryItemMeta[] {
  return galleryItems
}

export function getGalleryItem(name: string): GalleryItemMeta | undefined {
  return byName.get(name)
}

export const categorySlug = (value: string) =>
  value.toLowerCase().replaceAll(" ", "-")
