// Client-safe metadata for every gallery card: the index, the /c/<name> QA pages, and the
// machine-readable surfaces read the same categories, capabilities, and snippets from here.
// The agent contracts (contracts/items, generated into contracts/generated/gallery.json) are
// the only source; run `pnpm contracts:build` after editing one.
import generated from "@/contracts/generated/gallery.json"
import type { Capability } from "@/contracts/schema"
import type { Category } from "./categories"

export type { Capability }

export type GalleryItemMeta = {
  name: string
  title: string
  description: string
  category: Exclude<Category, "All">
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
}

// Gallery order: tokens, the surface-depth note, then the registry. Bundles (ui-bits) have no
// card of their own; each member does.
const galleryItems = generated.items as GalleryItemMeta[]
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
