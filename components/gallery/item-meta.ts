// Server-safe metadata for every gallery item: the index cards, the /c/<name> QA pages, and
// machine-readable surfaces all read the same categories, capabilities, and snippets from here.
// Agent contracts (contracts/items, generated into contracts/generated/gallery.json) are the
// source of truth; items without a contract yet fall back to the legacy derivation below.
import registry from "@/registry.json"
import generated from "@/contracts/generated/gallery.json"
import type { Capability } from "@/contracts/schema"
import { category, type Category } from "./categories"
import {
  deskNames,
  deskSnippets,
  designNames,
  designSnippets,
  orientationNames,
  playerNames,
  snippets,
  surfaceUsage,
} from "./demo-data"

type RegistryItem = {
  name: string
  title?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: { path: string }[]
}

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
  snippet?: string
  /** Registry item that `npx shadcn add` installs (surface-depth is documentation for @jbm/tokens). */
  installName: string
  /** Repository path of the item's primary source file. */
  sourcePath: string
  /** False for documentation entries that have no registry JSON of their own. */
  inRegistry: boolean
}

const registryItems = registry.items as RegistryItem[]
const contracted = new Map(
  (generated.items as GalleryItemMeta[]).map((item) => [item.name, item])
)
const byName = new Map(registryItems.map((item) => [item.name, item]))

const surfaceDepth: RegistryItem = {
  name: "surface-depth",
  title: "Surface depth",
  description:
    "Fine borders, inset edge lighting, and layered shadows. Compare the original surface and inspect each layer.",
  files: [{ path: "registry/jbm/lib/tokens.ts" }],
}

// Gallery order: tokens, the surface-depth note, then the registry. `ui-bits` is a bundle whose
// pieces each have their own card.
const galleryOrder: RegistryItem[] = [
  registryItems[0],
  surfaceDepth,
  ...registryItems.slice(1).filter((item) => item.name !== "ui-bits"),
]

/** True when the item, or anything it installs, depends on Remotion. */
export function needsRemotion(name: string, seen = new Set<string>()): boolean {
  if (seen.has(name)) return false
  seen.add(name)
  const item = byName.get(name)
  if (!item) return false
  if (item.dependencies?.includes("remotion")) return true
  return (item.registryDependencies ?? []).some((dependency) =>
    needsRemotion(dependency.replace(/^@jbm\//, ""), seen)
  )
}

export function registryDependencies(name: string): string[] {
  return byName.get(name)?.registryDependencies ?? []
}

export function addCommand(name: string) {
  return `npx shadcn@latest add @jbm/${name}`
}

export function isRegistryItem(name: string) {
  return byName.has(name)
}

/** Video-primitive demos that render their own inputs rather than a fixed example. */
const interactivePrimitives = ["ticket", "folder", "score-scale", "clock"]
const controlledDemos = [
  "scroll-stack",
  "flip-text",
  "text-fill",
  "surface-depth",
]

export const isPlayerPreview = (name: string) => playerNames.includes(name)
export const supportsOrientation = (name: string) =>
  orientationNames.includes(name)

/** What an item's gallery preview lets you inspect. Empty means a still preview. */
export function capabilities(name: string): Capability[] {
  const contract = contracted.get(name)
  if (contract) return contract.capabilities
  // Legacy derivation for items without a contract yet.
  const player = isPlayerPreview(name)
  const tags: Capability[] = []
  if (
    designNames.includes(name) ||
    deskNames.includes(name) ||
    interactivePrimitives.includes(name) ||
    controlledDemos.includes(name) ||
    name === "scene-spec"
  )
    tags.push("controls")
  if (name.startsWith("scroll-")) tags.push("scroll")
  // Scene is a static layout (a one-frame composition); every other Player preview replays.
  if ((player && name !== "scene") || name === "replay-button")
    tags.push("replay")
  if (supportsOrientation(name)) tags.push("portrait")
  if (player) tags.push("player")
  return tags
}

function snippetFor(name: string): string | undefined {
  if (name === "surface-depth") return surfaceUsage
  return designSnippets[name] ?? deskSnippets[name] ?? snippets[name]
}

let cache: GalleryItemMeta[] | undefined

/** Every gallery item, in gallery order, with its category, capabilities, and install data. */
export function getGalleryItems(): GalleryItemMeta[] {
  cache ??= galleryOrder.map((item) => {
    const contract = contracted.get(item.name)
    if (contract) return contract
    const inRegistry = byName.has(item.name)
    return {
      name: item.name,
      title: item.title ?? item.name,
      description: item.description ?? "",
      category: category(item.name),
      capabilities: capabilities(item.name),
      needsRemotion: needsRemotion(item.name),
      registryDependencies: item.registryDependencies ?? [],
      snippet: snippetFor(item.name),
      installName: inRegistry ? item.name : "tokens",
      sourcePath: item.files[0].path,
      inRegistry,
    }
  })
  return cache
}

export function getGalleryItem(name: string): GalleryItemMeta | undefined {
  return getGalleryItems().find((item) => item.name === name)
}

export const categorySlug = (value: string) =>
  value.toLowerCase().replaceAll(" ", "-")
