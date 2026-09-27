import type { ItemContract } from "../schema"

export default {
  name: "tokens",
  entry: "component",
  title: "Tokens",
  description:
    "Cream, ink, and vermilion palette, Geist font stacks, radii, surface shadows and borders, stage safe areas, and a CSS variables string.",
  category: "Foundations",
  capabilities: [],
  api: [
    {
      export: "color",
      kind: "constant",
      summary:
        "Two-colour palette as hex strings: bg (cream canvas), card (raised surface), ink (text), dim (muted text), line (rules and borders), accent (vermilion, the one accent), accent2 (annotations), soft (emphasis on dark), dimOnDark (cream at 62% for muted text on ink), codeBg, and codeGreen.",
    },
    {
      export: "font",
      kind: "constant",
      summary:
        "Font stacks for sans and mono: the host's --font-sans / --font-mono CSS variable when set (for example by next/font), else Geist and Geist Mono, then system fallbacks.",
    },
    {
      export: "radius",
      kind: "constant",
      summary: "Corner radii in pixels: chip 14, code 12, card 28, pill 10.",
    },
    {
      export: "shadowLayers",
      kind: "constant",
      summary:
        "The surface recipes split into inset (edge light), contact, and ambient box-shadow layers for `card` and `cardDark`. Use it to compose or inspect individual layers; see docs/surface-depth.md.",
    },
    {
      export: "shadow",
      kind: "constant",
      summary:
        "Complete box-shadow strings `card` and `cardDark`, joined from shadowLayers (inset, contact, then ambient). Used by Card, StatCard, and CodeCard.",
    },
    {
      export: "surfaceBorder",
      kind: "constant",
      summary:
        "1px ink-tinted border shorthands `card` (12% ink) and `cardDark` (65% ink) that pair with the matching shadow.",
    },
    {
      export: "stage",
      kind: "constant",
      summary:
        "Stage size and safe area per orientation, in stage pixels: landscape 1920×1080 with 120 side padding, top 90, content bottom 920; vertical 1080×1920 with 72 side padding, top 100, content bottom 1440. Captions live below `bottom`.",
    },
    {
      export: "Orientation",
      kind: "type",
      summary: 'The keys of `stage`: "landscape" or "vertical".',
    },
    {
      export: "cssVars",
      kind: "constant",
      summary:
        "A `:root{…}` CSS string defining --jbm-bg, --jbm-card, --jbm-ink, --jbm-dim, --jbm-line, --jbm-accent, --jbm-accent2, and --jbm-soft for Tailwind or shadcn consumers. It omits dimOnDark, codeBg, and codeGreen.",
    },
  ],
  stage: {
    mode: "n/a",
    reason: "Token values only; nothing renders. The gallery shows the color entries as swatches.",
  },
  examples: [
    {
      title: "Inline styles from tokens",
      code: 'import { color, font } from "@/jbm/lib/tokens"\n\n<div style={{ color: color.ink, background: color.bg, fontFamily: font.sans }} />',
    },
    {
      title: "Keep content inside the safe area",
      code: 'import { stage, type Orientation } from "@/jbm/lib/tokens"\n\nconst o: Orientation = "vertical"\nconst { w, pad, top, bottom } = stage[o]\nconst contentWidth = w - pad * 2 // 936 stage px in vertical\nconst contentHeight = bottom - top // 1340 stage px in vertical',
    },
    {
      title: "CSS variables for Tailwind",
      code: 'import { cssVars } from "@/jbm/lib/tokens"\n\n<style>{cssVars}</style>\n// or paste the string into globals.css and use var(--jbm-accent)',
    },
  ],
  qa: [
    "Check each swatch against the cream, ink, and vermilion palette; the accent stays the only saturated color.",
    "After changing shadowLayers, compare light and dark Card, StatCard, and CodeCard; shadow.card must still equal the joined card layers for existing consumers.",
    "When adding a color, decide whether cssVars should expose it; today it exports eight of the eleven colors.",
    "Verify text using dim or dimOnDark keeps readable contrast on its background.",
  ],
  docs: [
    { title: "Surface depth guide", url: "https://jbm-ui.bns.studio/docs/surface-depth.md" },
  ],
} satisfies ItemContract
