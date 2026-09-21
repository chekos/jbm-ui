export const categories = [
  "All",
  "UI",
  "UI Bits",
  "Layout",
  "Motion",
  "Foundations",
] as const
export type Category = (typeof categories)[number]

// Browsing categories describe purpose, independently of file location or renderer.
const itemCategories: Record<string, Exclude<Category, "All">> = {
  "scroll-stack": "Motion",
  "flip-text": "Motion",
  "text-fill": "Motion",
  "scroll-text-fill": "Motion",
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
  paper: "UI",
  "ui-bits": "UI Bits",
  "ui-button": "UI Bits",
  "ui-input": "UI Bits",
  "ui-card": "UI Bits",
  piece: "UI Bits",
  "phone-frame": "UI Bits",
  badge: "UI Bits",
  "token-glyph": "UI Bits",
  "replay-button": "Motion",
  "motion-hooks": "Foundations",
  scene: "Layout",
  "scene-spec": "Layout",
  pop: "Motion",
  counter: "Motion",
  "prob-bar": "Motion",
  "code-card": "Motion",
  captions: "Motion",
  "rebuild-screens": "Motion",
  catalog: "Motion",
  propagate: "Motion",
  shelf: "Motion",
}

export function category(name: string): Exclude<Category, "All"> {
  const value = itemCategories[name]
  if (!value) throw new Error(`Assign a gallery category for ${name}`)
  return value
}
