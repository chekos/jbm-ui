// Server-safe gallery item metadata: no client modules, no Remotion.
// Shared by the gallery, per-item QA pages, and the agent catalogs
// (app/llms.txt, app/catalog.json).
import registry from "@/registry.json"
import { category, type Category } from "./categories"

type RegistryItem = {
  name: string
  title?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
}

export type Capability =
  "controls" | "scroll" | "replay" | "portrait" | "remotion"

export type GalleryItemMeta = {
  name: string
  title: string
  description: string
  category: Exclude<Category, "All">
  capabilities: Capability[]
  needsRemotion: boolean
  registryDependencies: string[]
  snippet?: string
}

const registryItems = registry.items as RegistryItem[]
const byName = new Map(registryItems.map((item) => [item.name, item]))

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

// Mirrors capabilities() in gallery.tsx, which derives the same tags from the
// demo modules. Those modules are client-only, so the lists are restated here.
const playerPreviews = new Set([
  "motion-hooks",
  "scene",
  "pop",
  "counter",
  "prob-bar",
  "code-card",
  "captions",
  "rebuild-screens",
  "catalog",
  "propagate",
  "shelf",
  "scene-spec",
])
const withControls = new Set([
  // design-video demos
  "paper-tape",
  "tape-marker",
  "paper-clip",
  "clipped-note",
  "punched-tag",
  "paper-line",
  "stamp",
  "frontmatter",
  "folder-contents",
  "folder-carry",
  // desk demos
  "cajon",
  "file-cabinet",
  "hand",
  "mano",
  "bandeja",
  "tool-caddy",
  "escritorio",
  "burbuja",
  // interactive video primitives
  "ticket",
  "folder",
  "score-scale",
  "clock",
  "scroll-stack",
  "flip-text",
  "text-fill",
  "surface-depth",
  "scene-spec",
])

/** QA-bench signals for an item's gallery preview. Empty means a still preview. */
export function capabilities(name: string): Capability[] {
  const player = playerPreviews.has(name)
  const tags: Capability[] = []
  if (withControls.has(name)) tags.push("controls")
  if (name.startsWith("scroll-")) tags.push("scroll")
  // Scene is a one-frame layout; every other Player preview replays.
  if ((player && name !== "scene") || name === "replay-button")
    tags.push("replay")
  if (name === "scene-spec") tags.push("portrait")
  if (player || byName.get(name)?.dependencies?.includes("remotion"))
    tags.push("remotion")
  return tags
}

const surfaceDepth = {
  name: "surface-depth",
  title: "Surface depth",
  description:
    "Fine borders, inset edge lighting, and layered shadows. Compare the original surface and inspect each layer.",
}

/** Every gallery item in gallery order: registry items plus surface-depth, minus the ui-bits barrel. */
export function getGalleryItems(): GalleryItemMeta[] {
  const [first, ...rest] = registryItems
  return [
    first,
    surfaceDepth,
    ...rest.filter((item) => item.name !== "ui-bits"),
  ].map((item) => ({
    name: item.name,
    title: item.title ?? item.name,
    description: item.description ?? "",
    category: category(item.name),
    capabilities: capabilities(item.name),
    needsRemotion: needsRemotion(item.name),
    registryDependencies: registryDependencies(item.name),
  }))
}

export function isRegistryItem(name: string) {
  return byName.has(name)
}
