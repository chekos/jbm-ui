import type { ItemContract } from "../schema"

export default {
  name: "paper",
  entry: "component",
  title: "Paper",
  description:
    "Paper cut-out primitives: a flat card-stock shape, a slanted Sticker with display type, and a centered Caption.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Paper",
      kind: "component",
      summary:
        "Flat piece of card stock (border-box, position relative) in cream, vermilion, or ink with an optional 2px edge, the paper drop shadow, and an optional rotation. Pure React; wrap in a motion Pop for entrances.",
      props: {
        tone: '"paper" (card fill, ink edge), "accent" (vermilion), or "ink". Accent and ink edges match their fill.',
        w: "Width in stage pixels, including the edge; unset fills the container as a block.",
        h: "Height in stage pixels, including the edge; unset follows children.",
        radius: "Corner radius in stage pixels.",
        rotate: "Rotation in degrees (positive is clockwise); 0 applies no transform.",
        edge: "Draws the 2px edge; false removes the border.",
        shadow: "Applies paperShadow; false renders flat.",
        style: "Inline styles merged last, for example padding or layout for children.",
        children: "Content placed on the paper.",
      },
    },
    {
      export: "Sticker",
      kind: "component",
      summary:
        "Inline-block Paper holding one non-wrapping line of 800-weight display type; the loud word of a scene. Radius is round(size × 0.22) and padding round(size × 0.18) by round(size × 0.4); the edge is drawn only for the paper tone.",
      props: {
        children: "The word or short phrase; kept on one line.",
        tone: '"accent" (vermilion, default), "ink", or "paper"; text is cream on accent and ink, ink on paper.',
        size: "Font size in stage pixels; radius and padding scale with it.",
        rotate: "Tilt in degrees; negative leans counter-clockwise.",
        mono: "Switches to Geist Mono and drops the negative tracking.",
        style: "Inline styles passed to the underlying Paper, merged after display and padding.",
      },
    },
    {
      export: "Caption",
      kind: "component",
      summary: "Small centered caption under an illustration: sans 600 with line-height 1.2, ink or dim.",
      props: {
        children: "Caption text, usually lowercase.",
        size: "Font size in stage pixels.",
        dim: "Uses the dim color instead of ink.",
        style: "Inline styles merged last.",
      },
    },
    {
      export: "paperShadow",
      kind: "constant",
      summary:
        "Box-shadow string: the card contact and ambient layers from shadowLayers plus a longer 18px drop, without the inset edge light. Shared by the ui-bits illustrations.",
    },
    {
      export: "paperFill",
      kind: "function",
      summary: "Maps a tone to its fill color.",
      params: { tone: 'PaperTone: "paper", "accent", or "ink".' },
      returns: "color.accent for accent, color.ink for ink, otherwise color.card.",
    },
    {
      export: "paperInk",
      kind: "function",
      summary: "Maps a tone to the text color that reads on its fill.",
      params: { tone: 'PaperTone: "paper", "accent", or "ink".' },
      returns: "color.ink for paper, otherwise color.bg (cream).",
    },
    {
      export: "PaperTone",
      kind: "type",
      summary: '"paper" | "accent" | "ink".',
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Paper takes w×h when given and otherwise fills its container's width with height following children. Sticker is inline and sized by its text: at the default size 72 it is about 72 × 1.05 + 2 × 13 ≈ 102 stage px tall. Rotation does not change layout size, so tilted corners can extend beyond the box.",
  },
  examples: [
    {
      title: "Paper, sticker, and caption",
      code: 'import { Paper, Sticker, Caption } from "@/jbm/ui/paper"\n\n<Paper w={200} h={130} rotate={-3} style={{ padding: 20 }}>\n  <Caption size={24}>papel</Caption>\n</Paper>\n<Sticker size={40} rotate={-5}>¿otra vez?</Sticker>\n<Sticker tone="ink" size={28} rotate={2}>catálogo</Sticker>',
    },
    {
      title: "Match a custom illustration to the paper recipe",
      code: 'import { paperFill, paperInk, paperShadow } from "@/jbm/ui/paper"\n\n<div style={{ background: paperFill("accent"), color: paperInk("accent"), boxShadow: paperShadow, borderRadius: 22, padding: 24 }}>nota</div>',
    },
  ],
  qa: [
    "Compare paper, accent, and ink tones: the paper tone keeps a 2px ink edge, accent and ink edges match their fill, and cream text reads on both.",
    "Check rotated pieces and stickers near the safe-area edge: rotation does not reserve layout space, so tilted corners and the longer drop shadow must not clip.",
    "Stickers never wrap; check the longest word at the chosen size fits the frame in portrait.",
    "Toggle edge and shadow off and confirm the piece still separates from the cream canvas where it is used.",
  ],
} satisfies ItemContract
