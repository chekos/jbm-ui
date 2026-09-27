// Copy to contracts/items/<name>.ts, fill every field, then run
//   pnpm contracts:validate <name>
// Exemplars: contracts/items/counter.ts (motion), folder.ts (controlled illustration),
// card.ts (static ui). Reference: docs/agent-contract.md. Only `import type` is allowed.
import type { ItemContract } from "./schema"

export default {
  // The registry item name (registry.json) and the file name.
  name: "item-name",
  // "component" (has /c/<name>), "bundle" (re-exports; set pageReason), or "doc" (set install).
  entry: "component",
  // Start from registry.json; `pnpm contracts:build` writes these back into it.
  title: "Item title",
  description: "One sentence: what it is and what it does.",
  // Behaviour, not folder: one of the categories in components/gallery/categories.ts.
  category: "UI",
  // What the gallery preview offers: controls, scroll, replay, portrait, player. [] = still.
  capabilities: [],
  // Every runtime export of the item's files. Types, required flags, and defaults are
  // extracted from source; describe each prop (a JSDoc comment on the prop also counts).
  api: [
    {
      export: "ItemName",
      kind: "component",
      summary: "What it renders and how it is driven.",
      props: {
        propName: "What it controls, with units and range.",
      },
    },
    // { export: "useThing", kind: "hook", summary, params: { … }, returns: "…" },
    // { export: "helper", kind: "function", summary, params: { … }, returns: "…" },
    // { export: "value", kind: "constant", summary },
  ],
  // Exports deliberately left out of `api`, with the reason.
  // omit: { internalHelper: "Implementation detail shared with …" },
  // Stage pixels at the documented defaults, or fluid / n/a with a reason.
  stage: {
    mode: "declared",
    landscape: { width: "auto", height: 100 },
    vertical: { width: "auto", height: 100 },
    basis: "How the numbers follow from the source and which props change them.",
  },
  // stage: { mode: "fluid", reason: "Height follows children; adds …" },
  // stage: { mode: "n/a", reason: "Tokens only; nothing renders." },
  examples: [
    {
      title: "Most common use",
      code: 'import { ItemName } from "@/jbm/ui/item-name"\n\n<ItemName propName={1} />',
    },
  ],
  qa: ["What to inspect before accepting a change: states, extremes, orientations."],
  // Player items: the moments the QA strip shows between frame 0 and End (seconds on the gallery
  // preview timeline: the demo's props are previewProps and previewDemos in
  // components/gallery/timing.ts). Say what happens, in a few words.
  // cues: [{ label: "Bug appears", at: 2.3, note: "What to check on this frame." }],
  // start: "Empty stage", // when every element enters after frame 0
} satisfies ItemContract
