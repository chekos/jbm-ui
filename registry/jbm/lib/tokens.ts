/**
 * jbm-ui tokens. Palette verified from Paper "Sistema de trabajo — seis meses de construcción",
 * artboards "CURRENT — 01/02 · Cream & vermilion". Two-colour system: ink on cream, vermilion for the one accent.
 * Used as inline styles in components so the same file renders in the browser and in Remotion.
 */
export const color = {
  bg: "#FFF6E8", // canvas
  card: "#FFFCF5", // raised surface
  ink: "#20241F", // text
  dim: "#65675F", // muted text
  line: "#D5D1C6", // rules and borders
  accent: "#C63D24", // vermilion
  accent2: "#A04D31", // annotations
  soft: "#FF8A6A", // emphasis highlight on dark
  dimOnDark: "rgba(255, 246, 232, 0.62)", // muted text on ink/codeBg: cream at 62%, 6.5:1 (dim on ink is 2.7:1)
  codeBg: "#20241F",
  codeGreen: "#9BE59B",
} as const

/** Font stacks: the CSS variable when a host app sets one (next/font), else the Geist / Geist Mono family loaded in Remotion (@remotion/google-fonts or @remotion/fonts). */
export const font = {
  sans: "var(--font-sans, Geist), Geist, system-ui, sans-serif",
  mono: "var(--font-mono, 'Geist Mono'), 'Geist Mono', ui-monospace, monospace",
} as const

// Geist advances in em for printable ASCII (32–126), measured in the browser: 800 weight for tab
// names, 400 italic for sublabels. Fonts may load after first render, so tab widths come from
// these tables rather than from the DOM, and stay identical in the browser and in Remotion.
const SANS_800 = [22,27,41,63,68,83,73,21,34,34,42,57,25,42,25,54,70,47,66,66,67,69,64,55,68,64,32,32,55,56,55,60,98,75,71,74,72,63,61,75,72,31,64,70,59,93,75,79,68,78,71,70,62,71,75,104,71,65,61,40,52,40,47,56,29,61,65,61,65,62,46,65,62,29,36,67,33,91,62,63,65,65,44,59,46,62,63,86,67,60,60,41,30,41,52]
const SANS_ITALIC = [25,21,34,49,62,85,64,17,32,32,42,56,17,43,17,43,67,35,60,59,62,62,60,50,61,60,21,21,55,54,55,50,88,66,67,69,69,60,59,68,70,27,58,64,58,87,74,73,65,73,66,63,54,69,67,93,61,57,54,32,42,32,43,53,25,54,58,53,58,55,40,58,57,24,25,54,27,84,57,55,58,58,38,52,40,58,52,79,54,52,49,40,26,40,52]

/**
 * Estimated advance width of `text` set in Geist at `size`: 800 weight (tab names) or 400
 * italic (sublabels). Accented letters measure as their base letter; anything else outside ASCII
 * as an average glyph.
 */
export function sansWidth(text: string, size: number, italic = false): number {
  const table = italic ? SANS_ITALIC : SANS_800
  let em = 0
  for (const ch of text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) {
    const c = ch.codePointAt(0) ?? 0
    em += c >= 32 && c < 127 ? table[c - 32] : italic ? 56 : 62
  }
  return (em / 100) * size
}

export const radius = { chip: 14, code: 12, card: 28, pill: 10 } as const
/** Surface recipes: crisp contact, progressively softer depth, then inset edge light.
 * See docs/surface-depth.md. Keep shadow.card compatible with existing consumers.
 */
export const shadowLayers = {
  card: {
    inset: [
      "inset 0 1px 0 rgba(255,255,255,0.85)",
      "inset 0 -1px 0 rgba(32,36,31,0.025)",
    ],
    contact: ["0 1px 1px -0.5px rgba(32,36,31,0.08)"],
    ambient: [
      "0 3px 3px -1.5px rgba(32,36,31,0.06)",
      "0 6px 6px -3px rgba(32,36,31,0.05)",
      "0 12px 12px -6px rgba(32,36,31,0.04)",
      "0 24px 24px -12px rgba(32,36,31,0.04)",
    ],
  },
  cardDark: {
    inset: [
      "inset 0 1px 0 rgba(255,246,232,0.10)",
      "inset 0 -1px 0 rgba(0,0,0,0.15)",
    ],
    contact: ["0 1px 1px -0.5px rgba(32,36,31,0.16)"],
    ambient: [
      "0 3px 3px -1.5px rgba(32,36,31,0.12)",
      "0 6px 6px -3px rgba(32,36,31,0.09)",
      "0 12px 12px -6px rgba(32,36,31,0.07)",
      "0 24px 24px -12px rgba(32,36,31,0.06)",
    ],
  },
} as const
export const shadow = {
  card: [
    ...shadowLayers.card.inset,
    ...shadowLayers.card.contact,
    ...shadowLayers.card.ambient,
  ].join(", "),
  cardDark: [
    ...shadowLayers.cardDark.inset,
    ...shadowLayers.cardDark.contact,
    ...shadowLayers.cardDark.ambient,
  ].join(", "),
} as const
export const surfaceBorder = {
  card: "1px solid rgba(32,36,31,0.12)",
  cardDark: "1px solid rgba(32,36,31,0.65)",
} as const

/** Safe areas per orientation: content stays inside these; captions live below. */
export const stage = {
  landscape: { w: 1920, h: 1080, pad: 120, top: 90, bottom: 920 },
  vertical: { w: 1080, h: 1920, pad: 72, top: 100, bottom: 1440 },
} as const
export type Orientation = keyof typeof stage

/** The same palette as CSS custom properties, for Tailwind/shadcn consumers. Paste into globals.css or import as a string. */
export const cssVars = `:root{--jbm-bg:${color.bg};--jbm-card:${color.card};--jbm-ink:${color.ink};--jbm-dim:${color.dim};--jbm-line:${color.line};--jbm-accent:${color.accent};--jbm-accent2:${color.accent2};--jbm-soft:${color.soft};}`
