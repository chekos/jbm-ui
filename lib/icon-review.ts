export const REVIEW_VERSION = "jbm-icons-v1"
export const reviewNames = [
  "arrow-right",
  "search",
  "close",
  "check",
  "play",
  "replay",
  "folder",
  "notebook",
  "dataset",
  "chart",
  "code",
  "agent",
] as const
export const decisions = ["Unreviewed", "Keep", "Revise", "Unsure"] as const
export type Decision = (typeof decisions)[number]
export type Review = {
  direction: string
  weight: string
  personality: string
  useCases: string
  missing: string
  notes: string
  icons: Record<string, { decision: Decision; note: string }>
}
export function emptyReview(): Review {
  return {
    direction: "Undecided",
    weight: "Undecided",
    personality: "Undecided",
    useCases: "",
    missing: "",
    notes: "",
    icons: Object.fromEntries(
      reviewNames.map((name) => [name, { decision: "Unreviewed", note: "" }])
    ),
  }
}
export function parseReview(raw: string): Review {
  const value = JSON.parse(raw)
  if (
    !value ||
    value.version !== REVIEW_VERSION ||
    !value.review ||
    typeof value.review !== "object"
  )
    throw new Error("Incompatible review")
  const result = emptyReview()
  for (const key of [
    "direction",
    "weight",
    "personality",
    "useCases",
    "missing",
    "notes",
  ] as const) {
    if (typeof value.review[key] !== "string")
      throw new Error("Invalid review field")
    result[key] = value.review[key]
  }
  for (const name of reviewNames) {
    const icon = value.review.icons?.[name]
    if (
      !icon ||
      !decisions.includes(icon.decision) ||
      typeof icon.note !== "string"
    )
      throw new Error("Invalid icon review")
    result.icons[name] = { decision: icon.decision, note: icon.note }
  }
  return result
}
export function reviewPacket(review: Review): string {
  return [
    `# JBM icons — feedback (${REVIEW_VERSION})`,
    "",
    "Unreviewed icons are not approvals.",
    "",
    `Direction: ${review.direction}`,
    `Weight: ${review.weight}`,
    `Personality: ${review.personality}`,
    `First uses: ${review.useCases || "Not specified"}`,
    `Missing icons: ${review.missing || "Not specified"}`,
    `Overall notes: ${review.notes || "None"}`,
    "",
    "## Icon decisions",
    "",
    ...reviewNames.map(
      (name) =>
        `- ${name}: ${review.icons[name].decision}${review.icons[name].note ? ` — ${review.icons[name].note}` : ""}`
    ),
  ].join("\n")
}
