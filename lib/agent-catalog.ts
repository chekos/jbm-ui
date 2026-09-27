// Machine-readable catalog built from the agent contracts (contracts/items →
// contracts/generated/catalog.json). See docs/agent-contract.md. It backs:
//   /llms.txt             concise index: purpose, install once, endpoints, one line per item
//   /llms-full.txt        every item in full as plain text
//   /catalog.json         every item in full as JSON
//   /catalog/<name>.json  one item's catalog entry plus the install setup
//   /catalog/<name>.md    one item as Markdown
import { addCommand, getGalleryItems } from "@/components/gallery/item-meta"
import { categories, categoryDefinitions } from "@/components/gallery/categories"
import type {
  ApiField,
  ContractEntry,
  GeneratedApiEntry,
  StageSize,
} from "@/contracts/schema"
import { getContract, getContracts } from "@/lib/contracts"
import { docUrl, getPublishedDocs } from "@/lib/docs"
import { registryUrlTemplate, siteOrigin } from "@/lib/site"
import registry from "@/registry.json"

export const purpose =
  "jbm-ui is a personal component library for tacosdedatos, distributed as a shadcn registry, so an explainer video and a web page share one visual vocabulary. The same tokens and components render in plain React pages and in Remotion compositions: ui/ items are pure React with inline token styles and never import Remotion, motion/ items add timeline behavior, and lib/ items hold tokens and helpers. Illustrations are simple geometric line art in ink on cream, with vermilion as the single accent per composition."

export const rules = [
  "Install through the @jbm namespace: each registry item JSON (/r/<name>.json) carries its files' contents and each guide is served at /docs/<slug>.md, so agents never need the source repository (it is public on GitHub for people browsing the code).",
  "Files install to src/jbm/ and import as @/jbm/…, which needs the @/* → ./src/* path alias in tsconfig.json.",
  "Items marked needsRemotion require the remotion package and must render inside a Remotion composition or Player; every other item works in any React page.",
  "Use one vermilion accent per composition; accent2 is for annotations only and soft is for dark surfaces only.",
  "Stages are 1920×1080 landscape and 1080×1920 vertical with declared safe areas; each item's stage field declares its size in stage pixels, and scenes compose from YAML-shaped specs with @jbm/scene-spec.",
]


/** One installed file: where it lives in this repo, where shadcn writes it, and how to import it. */
export type CatalogFile = {
  /** Path in the jbm-ui source tree; the content ships in the registry item JSON (files[].content). */
  source: string
  /** Path shadcn writes in the consumer project. */
  target: string
  /** Module specifier consumers import, e.g. @/jbm/ui/folder. */
  import: string
  /** shadcn file type, e.g. registry:ui. */
  type: string
}

export type RelatedItem = {
  name: string
  relation:
    | "installs"
    | "installed-by"
    | "re-exports"
    | "bundled-in"
    | "example-import"
}

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
  /** Registry item that the install command adds (differs from name for doc entries). */
  installName: string
  /** QA page URL, or null for a bundle (see pageReason). */
  page: string | null
  pageReason?: string
  registryItem: string
  /** Primary source file (path in the source tree; read its content from registryItem). */
  sourcePath: string
  files: CatalogFile[]
  /** Per-item agent endpoints. */
  endpoints: { markdown: string; json: string }
  snippet: string
  api: GeneratedApiEntry[]
  stage: StageSize
  examples: ContractEntry["examples"]
  qa: string[]
  related: RelatedItem[]
  /** Player items with cues: the moments to inspect on the gallery preview, and what it renders. */
  galleryPreview?: AgentGalleryPreview
  /** Contract fields beyond the core schema (for example docs or schemas) pass through as-is. */
  [extra: string]: unknown
}

/** One strip frame on the gallery preview: frame 0, a contract cue, or the last frame. */
export type PreviewFrame = {
  label: string
  frame: number
  /** Seconds on the gallery preview timeline. */
  at: number
  note?: string
}

export type AgentGalleryPreview = {
  about: string
  fps: number
  durationInFrames: number
  lastFrame: number
  /** The QA page's strip view, which shows these frames side by side. */
  strip: string
  /** Frame 0, each contract cue, then the last frame. */
  frames: PreviewFrame[]
  /** The elements the preview renders, with their props (timing props in seconds). */
  demo: NonNullable<ContractEntry["galleryPreview"]>["demo"]
  /** The same demo as TSX. */
  code: string
}

const previewAbout =
  "Cue times are seconds on the gallery preview's timeline, which renders the demo below; the Usage examples may use other timings. Map a cue to your own props by its place in the demo."

function agentGalleryPreview(
  contract: ContractEntry,
  origin: string
): AgentGalleryPreview | undefined {
  const preview = contract.galleryPreview
  if (!preview || !contract.cues || contract.page === null) return undefined
  const lastFrame = preview.durationInFrames - 1
  const seconds = (frame: number) => Math.round((frame / preview.fps) * 1000) / 1000
  return {
    about: previewAbout,
    fps: preview.fps,
    durationInFrames: preview.durationInFrames,
    lastFrame,
    strip: `${origin}${contract.page}?view=strip`,
    frames: [
      { label: contract.start ?? "Begin", frame: 0, at: 0 },
      ...contract.cues.map(({ label, frame, at, note }) => ({
        label,
        frame,
        at,
        ...(note ? { note } : {}),
      })),
      { label: "End", frame: lastFrame, at: seconds(lastFrame) },
    ],
    demo: preview.demo,
    code: preview.code,
  }
}

// Contract fields the catalog maps explicitly; anything else passes through (extraFields).
const knownContractFields = new Set([
  "name",
  "entry",
  "title",
  "description",
  "category",
  "capabilities",
  "needsRemotion",
  "registryDependencies",
  "installName",
  "inRegistry",
  "page",
  "pageReason",
  "registryItem",
  "sourcePath",
  "files",
  "api",
  "omit",
  "stage",
  "examples",
  "qa",
  "install",
  // Rendered together as "Gallery preview cues" (galleryPreview in the catalog).
  "cues",
  "start",
  "galleryPreview",
])

/** Names of contract fields outside the core schema, in contract order. */
export function extraFields(contract: object): string[] {
  return Object.keys(contract).filter((key) => !knownContractFields.has(key))
}

type RegistryFile = { path: string; type: string; target?: string }
type RegistryItem = {
  name: string
  files: RegistryFile[]
  registryDependencies?: string[]
}
const registryItems = (registry as { items: RegistryItem[] }).items
const registryFiles = new Map(
  registryItems.flatMap((item) =>
    item.files.map((file) => [file.path, { ...file, item: item.name }] as const)
  )
)

/** src/jbm/ui/folder.tsx → @/jbm/ui/folder */
export const importSpecifier = (target: string) =>
  target.replace(/^src\//, "@/").replace(/(\.d)?\.tsx?$/, "")

// Import specifier → registry item, for relating the items an example imports.
const itemByImport = new Map(
  [...registryFiles.values()]
    .filter((file) => file.target)
    .map((file) => [importSpecifier(file.target!), file.item])
)

function catalogFiles(contract: ContractEntry): CatalogFile[] {
  return contract.files.map((path) => {
    const file = registryFiles.get(path)
    const target = file?.target ?? path.replace(/^registry\//, "src/")
    return {
      source: path,
      target,
      import: importSpecifier(target),
      type: file?.type ?? "registry:file",
    }
  })
}

const bare = (dependency: string) => dependency.replace(/^@jbm\//, "")

function relatedItems(
  contract: ContractEntry,
  contracts: ContractEntry[]
): RelatedItem[] {
  const related: RelatedItem[] = []
  const seen = new Set([contract.name])
  const add = (name: string, relation: RelatedItem["relation"]) => {
    if (seen.has(name)) return
    seen.add(name)
    related.push({ name, relation })
  }
  for (const entry of contract.api)
    if (entry.kind === "re-export") add(entry.from, "re-exports")
  for (const dependency of contract.registryDependencies)
    add(bare(dependency), "installs")
  for (const other of contracts) {
    if (!other.registryDependencies.includes(`@jbm/${contract.installName}`))
      continue
    add(other.name, other.entry === "bundle" ? "bundled-in" : "installed-by")
  }
  for (const example of contract.examples)
    for (const [, specifier] of example.code.matchAll(/from "(@\/jbm\/[^"]+)"/g)) {
      const name = itemByImport.get(specifier)
      if (name && name !== contract.installName) add(name, "example-import")
    }
  return related
}

export const itemEndpoints = (name: string, origin = siteOrigin()) => ({
  markdown: `${origin}/catalog/${name}.md`,
  json: `${origin}/catalog/${name}.json`,
})

export function getCatalog() {
  const origin = siteOrigin()
  const contracts = getContracts()
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
    installName: contract.installName,
    page: contract.page === null ? null : `${origin}${contract.page}`,
    ...(contract.pageReason ? { pageReason: contract.pageReason } : {}),
    registryItem: `${origin}${contract.registryItem}`,
    sourcePath: contract.sourcePath,
    files: catalogFiles(contract),
    endpoints: itemEndpoints(contract.name, origin),
    snippet: contract.examples[0].code,
    api: contract.api,
    stage: contract.stage,
    examples: contract.examples,
    qa: contract.qa,
    related: relatedItems(contract, contracts),
    ...(contract.galleryPreview
      ? { galleryPreview: agentGalleryPreview(contract, origin) }
      : {}),
    ...Object.fromEntries(
      extraFields(contract).map((key) => [
        key,
        (contract as unknown as Record<string, unknown>)[key],
      ])
    ),
  })
  // Gallery cards first, then installable composites without a card of their own (ui-bits).
  const entries: CatalogItem[] = [
    ...galleryItems.map((item) => fromContract(getContract(item.name))),
    ...contracts
      .filter((contract) => !onGallery.has(contract.name))
      .map(fromContract),
  ]
  return {
    name: "jbm-ui",
    namespace: "@jbm",
    homepage: origin,
    purpose,
    install: {
      componentsJson: { registries: { "@jbm": registryUrlTemplate(origin) } },
      command: "npx shadcn@latest add @jbm/<name>",
      target: "src/jbm/",
      importAlias: "@/jbm/…",
      tsconfigPaths: { "@/*": ["./src/*"] },
    },
    rules,
    categories: categories.filter(
      (value): value is Exclude<typeof value, "All"> => value !== "All"
    ),
    categoryDefinitions,
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
      galleryPreview:
        "Optional, Player items with cues. The frames worth inspecting on the gallery preview (frame 0, each cue, the last frame) as {label, frame, at, note}: frame zero-based and at in seconds at the preview's fps. These are the preview's timings, not the examples': demo (elements with props) and code (TSX) are what the preview renders. The QA page's strip view shows the frames side by side (strip), and ?frame=<frame> opens one.",
      page: "The item's QA page in the gallery, or null for a bundle, whose pageReason names the pages to open instead.",
      registryItem:
        "The shadcn registry item JSON; its files[].content holds the source code, so no repository checkout is needed.",
      files:
        "Each installed file: source path in the jbm-ui source tree, target path shadcn writes in the consumer project, and the import specifier.",
      endpoints:
        "Per-item Markdown and JSON with the same content as this entry plus install setup.",
      docs: "Optional. Guides that cover the item, as {title, url}; each is Markdown served by this site at /docs/<slug>.md.",
      schemas:
        "Optional. JSON Schemas for the item's input data (for scene-spec, the scenes file), as {title, url}.",
      related:
        "Other items by relation: installs (registry dependency), installed-by, re-exports, bundled-in, example-import.",
    },
    links: {
      llms: `${origin}/llms.txt`,
      llmsFull: `${origin}/llms-full.txt`,
      catalog: `${origin}/catalog.json`,
      itemMarkdown: `${origin}/catalog/{name}.md`,
      itemJson: `${origin}/catalog/{name}.json`,
      registryIndex: `${origin}/r/registry.json`,
      contract: docUrl("agent-contract", origin),
      doc: `${origin}/docs/{slug}.md`,
    },
    /** Guides served as Markdown by this site. */
    docs: getPublishedDocs().map((doc) => ({
      title: doc.title,
      url: docUrl(doc.slug, origin),
    })),
    items: entries,
  }
}

export type Catalog = ReturnType<typeof getCatalog>

/** Every name with a per-item endpoint: all contracts, including bundles and doc entries. */
export function getCatalogItemNames() {
  return getContracts().map((contract) => contract.name)
}

export function getCatalogItem(name: string, catalog = getCatalog()) {
  return catalog.items.find((item) => item.name === name)
}

/** /catalog/<name>.json: the item's catalog entry plus what an agent needs to install it. */
export function getCatalogItemJson(name: string, catalog = getCatalog()) {
  const item = getCatalogItem(name, catalog)
  if (!item) return undefined
  return {
    ...item,
    setup: { namespace: catalog.namespace, ...catalog.install },
    rules: catalog.rules,
    links: { catalog: catalog.links.catalog, llms: catalog.links.llms },
  }
}

// --- Text rendering -------------------------------------------------------------------------

const yesNo = (value: boolean) => (value ? "yes" : "no")

/** Where an item runs: Remotion (needs a Composition or Player) or any React tree. */
export const runtime = (item: { needsRemotion: boolean }) =>
  item.needsRemotion ? "Remotion" : "React"

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

const titleCase = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/^./, (first) => first.toUpperCase())

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** Markdown for a pass-through contract field of unknown shape. */
export function extraFieldLines(value: unknown): string[] {
  if (value === null || value === undefined) return []
  if (typeof value !== "object") return [String(value)]
  if (Array.isArray(value)) {
    if (value.every((entry) => typeof entry !== "object" || entry === null))
      return value.map((entry) => `- ${String(entry)}`)
    return value.flatMap((entry) => {
      if (!isRecord(entry)) return [`- ${String(entry)}`]
      const link = entry.url ?? entry.href
      const label = entry.title ?? entry.name ?? entry.label ?? link
      const rest = Object.entries(entry).filter(
        ([key]) => !["url", "href", "title", "name", "label"].includes(key)
      )
      const head =
        typeof link === "string"
          ? `- [${String(label)}](${link})`
          : label !== undefined
            ? `- ${String(label)}`
            : "-"
      const simple = rest.every(([, v]) => typeof v !== "object" || v === null)
      if (simple)
        return [
          head +
            (rest.length
              ? `: ${rest.map(([key, v]) => `${key}: ${String(v)}`).join("; ")}`
              : ""),
        ]
      return [
        head,
        "",
        "```json",
        JSON.stringify(Object.fromEntries(rest), null, 2),
        "```",
      ]
    })
  }
  return ["```json", JSON.stringify(value, null, 2), "```"]
}

/** Plain-text reference for every item (formerly /llms.txt; now /llms-full.txt). */
export function getLlmsFullText(catalog = getCatalog()) {
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
    `- [llms.txt](${catalog.links.llms}): short index with one line per item`,
    `- [catalog.json](${catalog.links.catalog}): this list as JSON, with props, stage sizes, examples, and QA notes`,
    `- ${catalog.links.itemMarkdown} and ${catalog.links.itemJson}: one item as Markdown or JSON`,
    `- [registry.json](${catalog.links.registryIndex}): shadcn registry index`,
    `- [Agent contract](${catalog.links.contract}): what each field means`,
    ...catalog.docs.map((doc) => `- [${doc.title}](${doc.url})`),
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
    lines.push("", `## ${group}`, "", categoryDefinitions[group])
    for (const item of items) {
      lines.push(
        "",
        `### ${item.title} (${item.name})`,
        "",
        item.description,
        "",
        `- Category: ${item.category}`,
        `- Capabilities: ${item.capabilities.join(", ") || "none"}`,
        `- Runtime: ${runtime(item)}`,
        `- Needs Remotion: ${yesNo(item.needsRemotion)}`,
        `- Registry dependencies: ${item.registryDependencies.join(", ") || "none"}`,
        `- Add: \`${item.install}\`` +
          (item.entry === "doc"
            ? " (documentation entry; the code ships in that item)"
            : ""),
        `- Files: ${item.files
          .map((file) => `${file.target} (import ${file.import})`)
          .join(", ")}`,
        item.page === null
          ? `- QA page: none. ${item.pageReason}`
          : `- QA page: ${item.page}`,
        `- Registry item (includes source): ${item.registryItem}`,
        `- Markdown: ${item.endpoints.markdown}`,
        `- JSON: ${item.endpoints.json}`,
        `- Stage: ${stageLine(item.stage)}`
      )
      if (item.api.length) lines.push("", "API:", "", ...apiLines(item.api))
      lines.push("", "```tsx", item.snippet, "```")
      if (item.qa.length)
        lines.push("", "QA:", "", ...item.qa.map((note) => `- ${note}`))
      if (item.galleryPreview)
        lines.push(
          "",
          `Gallery preview cues (seconds on the gallery preview, ${item.galleryPreview.durationInFrames} frames at ${item.galleryPreview.fps} fps; see ${item.endpoints.markdown} for the demo props):`,
          "",
          ...item.galleryPreview.frames.map(
            (entry) =>
              `- ${entry.label}: frame ${entry.frame}, ${entry.at.toFixed(2)} s${entry.note ? `. ${entry.note}` : ""}`
          )
        )
      for (const key of extraFields(getContract(item.name)))
        lines.push("", `${titleCase(key)}:`, "", ...extraFieldLines(item[key]))
    }
  }
  return lines.join("\n") + "\n"
}

/** /llms.txt: the llmstxt.org index. Purpose, install once, endpoints, one line per item. */
export function getLlmsText(catalog = getCatalog()) {
  const origin = catalog.homepage
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
    "Map `@/*` to `./src/*` in tsconfig.json paths. Then run `npx shadcn@latest add @jbm/<name>`; files land in src/jbm/ and import as `@/jbm/…`. Registry dependencies install automatically.",
    "",
    "## Rules",
    "",
    ...catalog.rules.map((rule) => `- ${rule}`),
    "",
    "## Endpoints",
    "",
    "Read one item's page before using it: it has the install command, files and import paths, props, stage size, examples, QA notes, and related items.",
    "",
    `- ${origin}/catalog/<name>.md: one item as Markdown`,
    `- ${origin}/catalog/<name>.json: one item as JSON, with the install setup`,
    `- ${origin}/c/<name>: the item's QA page in the gallery (components only)`,
    `- ${origin}/r/<name>.json: the shadcn registry item, with each file's source in files[].content`,
    `- ${origin}/docs/<slug>.md: guides as Markdown (listed under Guides)`,
    ...catalog.items.flatMap((item) =>
      ((item.schemas as { title: string; url: string }[] | undefined) ?? []).map(
        (schema) => `- ${schema.url}: ${schema.title} for @jbm/${item.name}; validate input against it before use`
      )
    ),
    "",
  ]
  for (const group of catalog.categories) {
    const items = catalog.items.filter((item) => item.category === group)
    if (!items.length) continue
    lines.push(`## ${group}`, "", categoryDefinitions[group], "")
    for (const item of items) {
      const links = [`[JSON](${item.endpoints.json})`]
      if (item.page !== null) links.push(`[QA page](${item.page})`)
      const kind =
        item.entry === "bundle"
          ? " Bundle; re-exports other items."
          : item.entry === "doc"
            ? ` Documentation entry; installs @jbm/${item.installName}.`
            : ""
      lines.push(
        `- [${item.title} (${item.name})](${item.endpoints.markdown}) · ${runtime(item)}: ${item.description}${kind} ${links.join(" · ")}`
      )
    }
    lines.push("")
  }
  lines.push(
    "## Guides",
    "",
    ...catalog.docs.map((doc) => `- [${doc.title}](${doc.url})`),
    "",
    "## Optional",
    "",
    `- [llms-full.txt](${catalog.links.llmsFull}): every item in full as plain text`,
    `- [catalog.json](${catalog.links.catalog}): every item in full as JSON`,
    `- [registry.json](${catalog.links.registryIndex}): shadcn registry index`,
    `- [Agent contract](${catalog.links.contract}): what each field means`
  )
  return lines.join("\n") + "\n"
}

// Markdown table cells: keep pipes and line breaks from splitting the row.
const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ")
const codeCell = (text: string) => `\`${cell(text)}\``

function apiMarkdown(api: GeneratedApiEntry[], origin: string) {
  const lines: string[] = []
  const fieldTable = (fields: ApiField[], label: string) => [
    `| ${label} | Type | Default | Description |`,
    "| --- | --- | --- | --- |",
    ...fields.map(
      (field) =>
        `| ${codeCell(field.name)} | ${codeCell(field.type)} | ${
          field.required
            ? "required"
            : field.default !== null
              ? codeCell(field.default)
              : "none"
        } | ${cell(field.description)} |`
    ),
  ]
  const reExports = api.filter((entry) => entry.kind === "re-export")
  for (const entry of api) {
    if (entry.kind === "re-export") continue
    lines.push("", `### \`${entry.export}\` (${entry.kind})`, "", entry.summary)
    if (entry.kind === "component") {
      if (entry.props.length) lines.push("", ...fieldTable(entry.props, "Prop"))
      if (entry.passthrough.length)
        lines.push("", `Also accepts ${entry.passthrough.join(", ")}.`)
    } else if (entry.kind === "hook" || entry.kind === "function") {
      if (entry.params.length)
        lines.push("", ...fieldTable(entry.params, "Parameter"))
      lines.push("", `Returns: ${entry.returns}`)
    }
  }
  if (reExports.length)
    lines.push(
      "",
      "| Export | Documented by |",
      "| --- | --- |",
      ...reExports.map(
        (entry) =>
          `| ${codeCell(entry.export)} | [@jbm/${entry.from}](${itemEndpoints(entry.from, origin).markdown}) |`
      )
    )
  return lines
}

const relationLabel: Record<RelatedItem["relation"], string> = {
  "re-exports": "Re-exports",
  installs: "Installs",
  "installed-by": "Installed by",
  "bundled-in": "Bundled in",
  "example-import": "Imported in examples",
}

/** /catalog/<name>.md: one item as Markdown. */
export function getItemMarkdown(name: string, catalog = getCatalog()) {
  const item = getCatalogItem(name, catalog)
  if (!item) return undefined
  const titles = new Map(catalog.items.map((entry) => [entry.name, entry.title]))
  const lines = [
    `# ${item.title} (${item.name})`,
    "",
    `> ${item.description}`,
    "",
    `- Entry: ${item.entry}`,
    `- Category: ${item.category}`,
    `- Preview capabilities: ${item.capabilities.join(", ") || "none (still preview)"}`,
    `- Runtime: ${runtime(item)}`,
    `- Needs Remotion: ${yesNo(item.needsRemotion)}`,
    item.page === null
      ? `- QA page: none. ${item.pageReason ?? ""}`.trimEnd()
      : `- QA page: ${item.page}`,
    `- JSON: ${item.endpoints.json}`,
    `- Registry item: ${item.registryItem} (source code in files[].content)`,
    "",
    "## Install",
    "",
    "```sh",
    item.install,
    "```",
  ]
  if (item.entry === "doc")
    lines.push(
      "",
      `Documentation entry, not a registry item: the code it documents ships in @jbm/${item.installName}.`
    )
  if (item.entry === "bundle")
    lines.push(
      "",
      "Bundle: installs every item it re-exports and adds one barrel file that re-exports them."
    )
  if (item.registryDependencies.length)
    lines.push(
      "",
      `Also installs ${item.registryDependencies.join(", ")} (registry dependencies install automatically).`
    )
  lines.push(
    "",
    "## Required setup",
    "",
    `1. Add the \`${catalog.namespace}\` registry to components.json (keep any entries already there):`,
    "",
    "   ```json",
    ...JSON.stringify(catalog.install.componentsJson, null, 2)
      .split("\n")
      .map((line) => `   ${line}`),
    "   ```",
    "",
    '2. Map `@/*` to `./src/*` in tsconfig.json `compilerOptions.paths`, so `@/jbm/…` imports resolve to src/jbm/.'
  )
  if (item.needsRemotion)
    lines.push(
      "3. Install `remotion` and render inside a Remotion `<Composition>` or `<Player>`, not a plain React tree. Timing values are in seconds."
    )
  lines.push(
    "",
    "## Files",
    "",
    `Each file's source code is in the registry item JSON (${item.registryItem}, files[].content).`,
    "",
    "| Source path | Installs to | Import |",
    "| --- | --- | --- |",
    ...item.files.map(
      (file) =>
        `| ${codeCell(file.source)} | ${codeCell(file.target)} | ${codeCell(file.import)} |`
    )
  )
  if (item.api.length)
    lines.push("", "## API", ...apiMarkdown(item.api, catalog.homepage))
  lines.push("", "## Stage", "")
  if (item.stage.mode === "declared")
    lines.push(
      "Declared in stage pixels at the documented defaults.",
      "",
      "| Orientation | Width | Height |",
      "| --- | --- | --- |",
      `| Landscape (1920×1080) | ${item.stage.landscape.width} | ${item.stage.landscape.height} |`,
      `| Vertical (1080×1920) | ${item.stage.vertical.width} | ${item.stage.vertical.height} |`,
      "",
      item.stage.basis
    )
  else lines.push(`${item.stage.mode}: ${item.stage.reason}`)
  lines.push("", "## Examples")
  for (const example of item.examples)
    lines.push("", `### ${example.title}`, "", "```tsx", example.code, "```")
  if (item.qa.length)
    lines.push("", "## QA", "", ...item.qa.map((note) => `- ${note}`))
  if (item.galleryPreview) {
    const preview = item.galleryPreview
    lines.push(
      "",
      "## Gallery preview cues",
      "",
      `${previewAbout} The preview runs at ${preview.fps} fps for ${preview.durationInFrames} frames (0–${preview.lastFrame}); see them side by side at ${preview.strip}, or open one frame with ?frame=<frame>.`,
      "",
      "```tsx",
      preview.code,
      "```",
      "",
      "| Frame | Seconds | Shows | What to check |",
      "| --- | --- | --- | --- |",
      ...preview.frames.map(
        (entry) =>
          `| ${entry.frame} | ${entry.at.toFixed(2)} | ${cell(entry.label)} | ${cell(entry.note ?? "")} |`
      )
    )
  }
  for (const key of extraFields(getContract(item.name))) {
    const body = extraFieldLines(item[key])
    if (body.length) lines.push("", `## ${titleCase(key)}`, "", ...body)
  }
  if (item.related.length) {
    lines.push("", "## Related")
    for (const relation of Object.keys(relationLabel) as RelatedItem["relation"][]) {
      const names = item.related
        .filter((entry) => entry.relation === relation)
        .map((entry) => entry.name)
      if (!names.length) continue
      // tokens is installed by nearly everything; a list that long is noise.
      if (relation === "installed-by" && names.length > 12) {
        lines.push("", `${relationLabel[relation]}: ${names.length} items (see ${catalog.links.catalog}).`)
        continue
      }
      lines.push(
        "",
        `${relationLabel[relation]}:`,
        "",
        ...names.map(
          (other) =>
            `- [${titles.get(other) ?? other} (${other})](${itemEndpoints(other, catalog.homepage).markdown})`
        )
      )
    }
  }
  lines.push(
    "",
    "## More",
    "",
    `- [llms.txt](${catalog.links.llms}): index of every item`,
    `- [catalog.json](${catalog.links.catalog}): every item as JSON`,
    `- [Agent contract](${catalog.links.contract}): what each field means`
  )
  return lines.join("\n") + "\n"
}

/** Alternate links for /c/<name>: the item's Markdown and JSON beside the global catalogs. */
export function itemAlternateTypes(name: string, title: string) {
  return {
    "text/plain": [{ url: "/llms.txt", title: "jbm-ui index (llms.txt)" }],
    "text/markdown": [
      { url: `/catalog/${name}.md`, title: `${title} (Markdown)` },
    ],
    "application/json": [
      { url: "/catalog.json", title: "jbm-ui catalog" },
      { url: `/catalog/${name}.json`, title: `${title} (JSON)` },
    ],
  }
}

// Unknown-name helpers live in lib/agent-routes.ts so proxy.ts can use them without the catalog.
export {
  canonicalItemName,
  catalogNotFoundJson,
  catalogNotFoundMarkdown,
  nearestItemName,
  nearestItemNames,
} from "@/lib/agent-routes"
