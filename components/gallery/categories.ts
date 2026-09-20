export const categories = [
  "All",
  "UI",
  "Layout",
  "Motion",
  "Foundations",
] as const
export type Category = (typeof categories)[number]

// Browsing categories describe purpose, independently of file location or renderer.
const itemCategories: Record<string, Exclude<Category, "All">> = {
  tokens: "Foundations",
  "surface-depth": "Foundations",
  label: "UI",
  big: "UI",
  card: "UI",
  chip: "UI",
  "stat-card": "UI",
  callout: "UI",
  "bullet-list": "UI",
  brand: "UI",
  "replay-button": "Motion",
  "motion-hooks": "Foundations",
  scene: "Layout",
  "scene-spec": "Layout",
  pop: "Motion",
  counter: "Motion",
  "prob-bar": "Motion",
  "code-card": "Motion",
  captions: "Motion",
}

export function category(name: string): Exclude<Category, "All"> {
  const value = itemCategories[name]
  if (!value) throw new Error(`Assign a gallery category for ${name}`)
  return value
}
