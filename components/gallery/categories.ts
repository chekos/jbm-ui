// Browsing categories describe behaviour, independently of file location or renderer. Each item's
// category lives in its agent contract (contracts/items/<name>.ts). The definitions below print
// under each section heading on the index and under each category heading in /llms.txt.
//   Motion       plays a Remotion timeline: previews in a Player, replays on request, has frames.
//   Interactive  responds to the end reader at runtime (scroll, pointer, click, hover). A piece
//                whose state only comes from props (a progress or position value its host drives)
//                is not Interactive; it belongs with what it depicts (UI, UI Bits).
export const categories = [
  "All",
  "UI",
  "UI Bits",
  "Layout",
  "Motion",
  "Interactive",
  "Foundations",
] as const
export type Category = (typeof categories)[number]

/** One sentence per category: what its items have in common. */
export const categoryDefinitions: Record<Exclude<Category, "All">, string> = {
  UI: "Pure React pieces for pages and stages (type, cards, chips, charts, and text effects), set entirely by props.",
  "UI Bits":
    "Paper illustrations of interface elements and desk objects, posed by props. Each component has its own preview and installation.",
  Layout: "Stages and scenes that place a subject inside a 16:9 or 9:16 frame.",
  Motion:
    "Plays a Remotion timeline: previews in a Player with frames and replay.",
  Interactive:
    "Responds to the reader at runtime: scroll, pointer, click, or hover.",
  Foundations:
    "Tokens, geometry, and hooks the other items are built from.",
}
