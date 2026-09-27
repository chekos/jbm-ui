// Browsing categories describe purpose, independently of file location or renderer. Each item's
// category lives in its agent contract (contracts/items/<name>.ts).
export const categories = [
  "All",
  "UI",
  "UI Bits",
  "Layout",
  "Motion",
  "Foundations",
] as const
export type Category = (typeof categories)[number]
