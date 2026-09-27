// The per-item agent contract. One file per gallery item lives in contracts/items/<name>.ts and
// default-exports an `ItemContract`. `pnpm contracts:build` merges each contract with facts it
// extracts from source (prop types, required flags, defaults) and from registry.json (files,
// dependencies, Remotion), then writes contracts/generated/*.json for the gallery, /c/<name>,
// /catalog.json, and /llms.txt. See docs/agent-contract.md.
//
// Contract files may only use `import type`: the generator evaluates them without a bundler.
import type { Category } from "@/components/gallery/categories"

/** What the gallery preview lets you inspect. An empty list means a still preview. */
export type Capability =
  /** Independent controls for the item's states. */
  | "controls"
  /** The preview responds to scroll position. */
  | "scroll"
  /** A timeline that replays on request; it never autoplays. */
  | "replay"
  /** Compares landscape and vertical stages. */
  | "portrait"
  /** Previews in a Remotion Player (needsRemotion is the separate dependency flag). */
  | "player"

/** Size of the item's box on a stage, in stage pixels, at its documented defaults. */
export type StageBox = {
  /** A number, "auto" (content-sized), or "fill" (takes the container width). */
  width: number | "auto" | "fill"
  height: number
}

export type StageSize =
  | {
      mode: "declared"
      landscape: StageBox
      vertical: StageBox
      /** How the numbers follow from the source and which props change them. */
      basis: string
    }
  /** Height follows content or the container; say what adds to it. */
  | { mode: "fluid"; reason: string }
  /** Nothing renders on a stage (tokens, helpers, documentation). */
  | { mode: "n/a"; reason: string }

/** Descriptions keyed by prop or parameter name. Types, required flags, and defaults are extracted. */
export type Descriptions = Record<string, string>

export type ApiEntry =
  | {
      /** Exported name in the item's source files. */
      export: string
      kind: "component"
      summary: string
      /**
       * One description per prop declared in registry source. A JSDoc comment on the prop's
       * declaration is used when a description is omitted; one of the two is required.
       */
      props: Descriptions
    }
  | {
      export: string
      kind: "hook" | "function"
      summary: string
      params: Descriptions
      returns: string
    }
  | { export: string; kind: "constant" | "type"; summary: string }
  /** Bundles only: an export documented by the registry item named in `from`. */
  | { export: string; kind: "re-export"; from: string }

export type Example = {
  title: string
  /** Consumer code with real `@/jbm/…` imports, as installed by shadcn. */
  code: string
}

export type ItemContract = {
  /** Registry item name, or the gallery entry name for documentation entries. */
  name: string
  /**
   * `component`: a registry item with its own /c/<name> page.
   * `bundle`: a registry item that re-exports others; it has no page of its own.
   * `doc`: a gallery documentation entry with no registry item; `install` names what to add.
   */
  entry: "component" | "bundle" | "doc"
  /** Synced into registry.json by `pnpm contracts:build`. */
  title: string
  /** Synced into registry.json by `pnpm contracts:build`. */
  description: string
  /** Behaviour-based browsing category; synced into registry.json `categories`. */
  category: Exclude<Category, "All">
  capabilities: Capability[]
  /** Every runtime export of the item's source files, except those listed in `omit`. */
  api: ApiEntry[]
  /** Runtime exports deliberately left out of `api`, with the reason. */
  omit?: Record<string, string>
  stage: StageSize
  /** At least one; the first is the usage snippet on cards and pages. */
  examples: Example[]
  /** What to inspect before accepting a change: states, extremes, orientations. */
  qa: string[]
  /** `doc` entries only: the registry item that installs the documented code. */
  install?: string
  /** `bundle` entries only: why there is no page and which items to open instead. */
  pageReason?: string
}

// --- Generated shapes (contracts/generated/*.json) -----------------------------------------

/** A prop or parameter: type, required, and default are extracted from source. */
export type ApiField = {
  name: string
  /** Type as written in source. */
  type: string
  required: boolean
  /** Default as written in source (a destructuring or parameter initializer), or null. */
  default: string | null
  description: string
}

export type GeneratedApiEntry =
  | {
      export: string
      kind: "component"
      summary: string
      props: ApiField[]
      /** External prop types spread onto the component, e.g. React.SVGProps<SVGSVGElement>. */
      passthrough: string[]
    }
  | {
      export: string
      kind: "hook" | "function"
      summary: string
      params: ApiField[]
      returns: string
    }
  | { export: string; kind: "constant" | "type"; summary: string }
  | { export: string; kind: "re-export"; from: string }

export type ContractEntry = {
  name: string
  entry: ItemContract["entry"]
  title: string
  description: string
  category: ItemContract["category"]
  capabilities: Capability[]
  /** Derived from registry.json: the item, or anything it installs, depends on Remotion. */
  needsRemotion: boolean
  registryDependencies: string[]
  /** Registry item that `npx shadcn add` installs (a doc entry's `install`). */
  installName: string
  inRegistry: boolean
  /** Site-relative QA page path, or "n/a" for bundles (see pageReason). */
  page: string
  pageReason?: string
  /** Site-relative registry JSON path for installName. */
  registryItem: string
  sourcePath: string
  files: string[]
  api: GeneratedApiEntry[]
  omit?: Record<string, string>
  stage: StageSize
  examples: Example[]
  qa: string[]
}
