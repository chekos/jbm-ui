// Machine-readable catalog served at /llms.txt and /catalog.json, built from the agent
// contracts (contracts/items → contracts/generated/catalog.json). See docs/agent-contract.md.
import { addCommand, getGalleryItems } from "@/components/gallery/item-meta"
import { categories } from "@/components/gallery/categories"
import type {
  ApiField,
  ContractEntry,
  GeneratedApiEntry,
  StageSize,
} from "@/contracts/schema"
import { getContract, getContracts } from "@/lib/contracts"
import { registryUrlTemplate, siteOrigin } from "@/lib/site"

export const purpose =
  "jbm-ui is a personal component library for tacosdedatos, distributed as a shadcn registry, so an explainer video and a web page share one visual vocabulary. The same tokens and components render in plain React pages and in Remotion compositions: ui/ items are pure React with inline token styles and never import Remotion, motion/ items add timeline behavior, and lib/ items hold tokens and helpers. Illustrations are simple geometric line art in ink on cream, with vermilion as the single accent per composition."

export const rules = [
  "Install through the @jbm namespace; never copy files from GitHub by hand.",
  "Files install to src/jbm/ and import as @/jbm/…, which needs the @/* → ./src/* path alias in tsconfig.json.",
  "Items marked needsRemotion require the remotion package and must render inside a Remotion composition or Player; every other item works in any React page.",
  "Use one vermilion accent per composition; accent2 is for annotations only and soft is for dark surfaces only.",
  "Stages are 1920×1080 landscape and 1080×1920 vertical with declared safe areas; each item's stage field declares its size in stage pixels, and scenes compose from YAML-shaped specs with @jbm/scene-spec.",
]

export type CatalogItem = {
  name: string
  /** component: has a QA page; bundle: re-exports other items; doc: documentation entry. */
  entry: ContractEntry["entry"]
  title: string
  description: string
  category: string
  capabilities: string[]
  needsRemotion: boolean
  registryDependencies: string[]
  /** Always a command; a doc entry installs the registry item that ships its code. */
  install: string
  /** QA page URL, or "n/a" for a bundle (see pageReason). */
  page: string
  pageReason?: string
  registryItem: string
  snippet: string
  api: GeneratedApiEntry[]
  stage: StageSize
  examples: ContractEntry["examples"]
  qa: string[]
}

export function getCatalog() {
  const origin = siteOrigin()
  const galleryItems = getGalleryItems()
  const onGallery = new Set(galleryItems.map((item) => item.name))
  const fromContract = (contract: ContractEntry): CatalogItem => ({
    name: contract.name,
    entry: contract.entry,
    title: contract.title,
    description: contract.description,
    category: contract.category,
    capabilities: contract.capabilities,
    needsRemotion: contract.needsRemotion,
    registryDependencies: contract.registryDependencies,
    install: addCommand(contract.installName),
    page: contract.page === "n/a" ? "n/a" : `${origin}${contract.page}`,
    ...(contract.pageReason ? { pageReason: contract.pageReason } : {}),
    registryItem: `${origin}${contract.registryItem}`,
    snippet: contract.examples[0].code,
    api: contract.api,
    stage: contract.stage,
    examples: contract.examples,
    qa: contract.qa,
  })
  // Gallery cards first, then installable composites without a card of their own (ui-bits).
  const entries: CatalogItem[] = [
    ...galleryItems.map((item) => fromContract(getContract(item.name))),
    ...getContracts()
      .filter((contract) => !onGallery.has(contract.name))
      .map(fromContract),
  ]
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
      player:
        "The preview renders in a Remotion Player; needsRemotion is the separate dependency flag, and searching the gallery for \"remotion\" matches it.",
    },
    fields: {
      api: "Exports with props or params; type, required, and default are extracted from source, descriptions are authored.",
      stage:
        'Size in stage pixels per orientation ("declared"), or "fluid"/"n/a" with a reason.',
      qa: "What to inspect before accepting a change.",
    },
    links: {
      llms: `${origin}/llms.txt`,
      catalog: `${origin}/catalog.json`,
      registryIndex: `${origin}/r/registry.json`,
      contract: "https://github.com/chekos/jbm-ui/blob/main/docs/agent-contract.md",
    },
    items: entries,
  }
}

const yesNo = (value: boolean) => (value ? "yes" : "no")

/** One line per prop: `name` (type, required | default x): description. */
export function fieldLine(field: ApiField) {
  const status = field.required
    ? "required"
    : field.default !== null
      ? `default ${field.default}`
      : "optional"
  return `\`${field.name}\` (${field.type}, ${status}): ${field.description}`
}

export function stageLine(stage: StageSize) {
  if (stage.mode !== "declared") return `${stage.mode}. ${stage.reason}`
  const box = ({ width, height }: { width: number | string; height: number }) =>
    `${width}×${height}`
  return `landscape ${box(stage.landscape)}, vertical ${box(stage.vertical)} stage px. ${stage.basis}`
}

function apiLines(api: GeneratedApiEntry[]) {
  const lines: string[] = []
  for (const entry of api) {
    if (entry.kind === "re-export") {
      lines.push(`- \`${entry.export}\`: re-exported from @jbm/${entry.from}`)
      continue
    }
    lines.push(`- \`${entry.export}\` (${entry.kind}): ${entry.summary}`)
    if (entry.kind === "component") {
      for (const prop of entry.props) lines.push(`  - ${fieldLine(prop)}`)
      if (entry.passthrough.length)
        lines.push(`  - Also accepts ${entry.passthrough.join(", ")}.`)
    } else if (entry.kind === "hook" || entry.kind === "function") {
      for (const param of entry.params) lines.push(`  - ${fieldLine(param)}`)
      lines.push(`  - Returns: ${entry.returns}`)
    }
  }
  return lines
}

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
    `- [catalog.json](${catalog.links.catalog}): this list as JSON, with props, stage sizes, examples, and QA notes`,
    `- [registry.json](${catalog.links.registryIndex}): shadcn registry index`,
    `- [Agent contract](${catalog.links.contract}): what each field means`,
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
        `- Add: \`${item.install}\`` +
          (item.entry === "doc"
            ? " (documentation entry; the code ships in that item)"
            : ""),
        item.page === "n/a"
          ? `- QA page: none. ${item.pageReason}`
          : `- QA page: ${item.page}`,
        `- Registry item: ${item.registryItem}`,
        `- Stage: ${stageLine(item.stage)}`
      )
      if (item.api.length) lines.push("", "API:", "", ...apiLines(item.api))
      lines.push("", "```tsx", item.snippet, "```")
      if (item.qa.length)
        lines.push("", "QA:", "", ...item.qa.map((note) => `- ${note}`))
    }
  }
  return lines.join("\n") + "\n"
}
