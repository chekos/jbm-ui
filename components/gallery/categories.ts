// Browsing categories describe behaviour, independently of file location or renderer. Each item's
// category lives in its agent contract (contracts/items/<name>.ts).
//   Motion       plays a Remotion timeline: previews in a Player, replays on request, has frames.
//   Interactive  moves only with the reader or a controlled value (scroll, pointer, a progress or
//                position slider); nothing plays on its own timeline.
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
