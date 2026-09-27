// Machine-readable catalog served at /llms.txt and /catalog.json.
import {
  addCommand,
  getGalleryItems,
  isRegistryItem,
  registryDependencies,
  needsRemotion,
  capabilities,
} from "@/components/gallery/item-meta"
import { category, categories } from "@/components/gallery/categories"
import registry from "@/registry.json"
import { registryUrlTemplate, siteOrigin } from "@/lib/site"

export const purpose =
  "jbm-ui is a personal component library for tacosdedatos, distributed as a shadcn registry, so an explainer video and a web page share one visual vocabulary. The same tokens and components render in plain React pages and in Remotion compositions: ui/ items are pure React with inline token styles and never import Remotion, motion/ items add timeline behavior, and lib/ items hold tokens and helpers. Illustrations are simple geometric line art in ink on cream, with vermilion as the single accent per composition."

export const rules = [
  "Install through the @jbm namespace; never copy files from GitHub by hand.",
  "Files install to src/jbm/ and import as @/jbm/…, which needs the @/* → ./src/* path alias in tsconfig.json.",
  "Items marked needsRemotion require the remotion package and must render inside a Remotion composition or Player; every other item works in any React page.",
  "Use one vermilion accent per composition; accent2 is for annotations only and soft is for dark surfaces only.",
  "Stages are 1920×1080 landscape and 1080×1920 vertical with declared safe areas; compose scenes from YAML-shaped specs with @jbm/scene-spec.",
]

export type CatalogItem = {
  name: string
  title: string
  description: string
  category: string
  capabilities: string[]
  needsRemotion: boolean
  registryDependencies: string[]
  /** null when the entry is a gallery guide rather than an installable item. */
  install: string | null
  page: string | null
  registryItem: string | null
  snippet?: string
}

export function getCatalog() {
  const origin = siteOrigin()
  const galleryItems = getGalleryItems()
  const onGallery = new Set(galleryItems.map((item) => item.name))
  const entries: CatalogItem[] = galleryItems.map((item) => ({
    name: item.name,
    title: item.title,
    description: item.description,
    category: item.category,
    capabilities: item.capabilities,
    needsRemotion: item.needsRemotion,
    registryDependencies: item.registryDependencies,
    install: isRegistryItem(item.name) ? addCommand(item.name) : null,
    page: `${origin}/c/${item.name}`,
    registryItem: isRegistryItem(item.name)
      ? `${origin}/r/${item.name}.json`
      : null,
    ...(item.snippet ? { snippet: item.snippet } : {}),
  }))
  // Installable composites without their own gallery card (the ui-bits barrel).
  for (const item of registry.items) {
    if (onGallery.has(item.name)) continue
    entries.push({
      name: item.name,
      title: item.title,
      description: item.description,
      category: category(item.name),
      capabilities: capabilities(item.name),
      needsRemotion: needsRemotion(item.name),
      registryDependencies: registryDependencies(item.name),
      install: addCommand(item.name),
      page: null,
      registryItem: `${origin}/r/${item.name}.json`,
    })
  }
  return {
    name: "jbm-ui",
    namespace: "@jbm",
    homepage: origin,
    source: "https://github.com/chekos/jbm-ui",
    purpose,
    install: {
      componentsJson: { registries: { "@jbm": registryUrlTemplate(origin) } },
      command: "npx shadcn@latest add @jbm/<name>",
      target: "src/jbm/",
      importAlias: "@/jbm/…",
      tsconfigPaths: { "@/*": ["./src/*"] },
    },
    rules,
    categories: categories.filter((value) => value !== "All"),
    capabilities: {
      controls: "The preview exposes independent controls for states.",
      scroll: "The preview responds to scroll position.",
      replay:
        "The preview is a timeline that replays on request; it never autoplays.",
      portrait: "The preview compares landscape and vertical stages.",
      remotion: "The preview renders in a Remotion Player.",
    },
    links: {
      llms: `${origin}/llms.txt`,
      catalog: `${origin}/catalog.json`,
      registryIndex: `${origin}/r/registry.json`,
    },
    items: entries,
  }
}

const yesNo = (value: boolean) => (value ? "yes" : "no")

export function getLlmsText() {
  const catalog = getCatalog()
  const lines = [
    "# jbm-ui",
    "",
    `> ${catalog.purpose}`,
    "",
    "## Install once",
    "",
    "Add the @jbm entry inside `registries` in the project's components.json, keeping any entries already there:",
    "",
    "```json",
    JSON.stringify(catalog.install.componentsJson, null, 2),
    "```",
    "",
    "Then add any item with `npx shadcn@latest add @jbm/<name>`. Registry dependencies install automatically.",
    "",
    "## Rules",
    "",
    ...catalog.rules.map((rule) => `- ${rule}`),
    "",
    "## Machine-readable",
    "",
    `- [catalog.json](${catalog.links.catalog}): this list as JSON`,
    `- [registry.json](${catalog.links.registryIndex}): shadcn registry index`,
    `- [Source](${catalog.source})`,
    "",
    "Capabilities describe the gallery preview: " +
      Object.entries(catalog.capabilities)
        .map(
          ([key, value]) =>
            `${key} (${value[0].toLowerCase()}${value.slice(1, -1)})`
        )
        .join("; ") +
      ". None means a still preview.",
  ]
  for (const group of catalog.categories) {
    const items = catalog.items.filter((item) => item.category === group)
    if (!items.length) continue
    lines.push("", `## ${group}`)
    for (const item of items) {
      lines.push(
        "",
        `### ${item.title} (${item.name})`,
        "",
        item.description,
        "",
        `- Category: ${item.category}`,
        `- Capabilities: ${item.capabilities.join(", ") || "none"}`,
        `- Needs Remotion: ${yesNo(item.needsRemotion)}`,
        `- Registry dependencies: ${item.registryDependencies.join(", ") || "none"}`,
        item.install
          ? `- Add: \`${item.install}\``
          : "- Add: ships inside @jbm/tokens (`npx shadcn@latest add @jbm/tokens`)",
        ...(item.page ? [`- QA page: ${item.page}`] : []),
        ...(item.registryItem ? [`- Registry item: ${item.registryItem}`] : [])
      )
      if (item.snippet) lines.push("", "```tsx", item.snippet, "```")
    }
  }
  return lines.join("\n") + "\n"
}
