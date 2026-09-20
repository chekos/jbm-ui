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
  codeBg: "#20241F",
  codeGreen: "#9BE59B",
} as const;

/** Font stacks: the CSS variable when a host app sets one (next/font), else the family loaded by @remotion/fonts. */
export const font = {
  sans: "var(--font-sans, Geist), Geist, system-ui, sans-serif",
  mono: "var(--font-mono, 'Geist Mono'), 'Geist Mono', ui-monospace, monospace",
} as const;

export const radius = { chip: 14, code: 12, card: 28, pill: 10 } as const;
/** Surface recipes: crisp contact, progressively softer depth, then inset edge light.
 * See docs/surface-depth.md. Keep shadow.card compatible with existing consumers.
 */
export const shadow = {
  card: [
    "inset 0 1px 0 rgba(255,255,255,0.85)",
    "inset 0 -1px 0 rgba(32,36,31,0.025)",
    "0 1px 1px -0.5px rgba(32,36,31,0.08)",
    "0 3px 3px -1.5px rgba(32,36,31,0.06)",
    "0 6px 6px -3px rgba(32,36,31,0.05)",
    "0 12px 12px -6px rgba(32,36,31,0.04)",
    "0 24px 24px -12px rgba(32,36,31,0.04)",
  ].join(", "),
  cardDark: [
    "inset 0 1px 0 rgba(255,246,232,0.10)",
    "inset 0 -1px 0 rgba(0,0,0,0.15)",
    "0 1px 1px -0.5px rgba(32,36,31,0.16)",
    "0 3px 3px -1.5px rgba(32,36,31,0.12)",
    "0 6px 6px -3px rgba(32,36,31,0.09)",
    "0 12px 12px -6px rgba(32,36,31,0.07)",
    "0 24px 24px -12px rgba(32,36,31,0.06)",
  ].join(", "),
} as const;
export const surfaceBorder = {
  card: "1px solid rgba(32,36,31,0.12)",
  cardDark: "1px solid rgba(32,36,31,0.65)",
} as const;

/** Safe areas per orientation: content stays inside these; captions live below. */
export const stage = {
  landscape: { w: 1920, h: 1080, pad: 120, top: 90, bottom: 920 },
  vertical: { w: 1080, h: 1920, pad: 72, top: 100, bottom: 1440 },
} as const;
export type Orientation = keyof typeof stage;

/** The same palette as CSS custom properties, for Tailwind/shadcn consumers. Paste into globals.css or import as a string. */
export const cssVars = `:root{--jbm-bg:${color.bg};--jbm-card:${color.card};--jbm-ink:${color.ink};--jbm-dim:${color.dim};--jbm-line:${color.line};--jbm-accent:${color.accent};--jbm-accent2:${color.accent2};--jbm-soft:${color.soft};}`;
