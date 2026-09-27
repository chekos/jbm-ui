import type { ItemContract } from "../schema"

export default {
  name: "paper",
  entry: "component",
  title: "Paper",
  description:
    "Paper cut-out primitives: a card-stock sheet that can crease, start to tear, and carry a real tab, a slanted Sticker with display type, and a centered Caption.",
  category: "UI",
  capabilities: ["controls"],
  api: [
    {
      export: "Paper",
      kind: "component",
      summary:
        "Flat piece of card stock (border-box, position relative) in cream, vermilion, or ink with an optional 2px edge, the paper drop shadow, and an optional rotation. Under `tension` it creases from the pulled corners toward the centre and, above 0.6, starts to tear at a seam; `tab` fixes a pestaña behind the top edge that slides out with its reveal. With neither set it renders exactly the original single div. Pure React and controlled; wrap in a motion Pop for entrances.",
      props: {
        tone: '"paper" (card fill, ink edge), "accent" (vermilion), or "ink". Accent and ink edges match their fill.',
        w: "Width in stage pixels, including the edge; unset fills the container as a block.",
        h: "Height in stage pixels, including the edge; unset follows children.",
        radius: "Corner radius in stage pixels.",
        rotate: "Rotation in degrees (positive is clockwise); 0 applies no transform.",
        edge: "Draws the 2px edge; false removes the border.",
        shadow: "Applies paperShadow; false renders flat.",
        style: "Inline styles merged last, for example padding or layout for children.",
        children:
          "Content placed on the paper. Creases and the tear's lips draw above it, like marks in the sheet itself.",
        tension:
          "0–1 stress on the sheet. Creases grow from each pulled corner toward the centre and reach it at 0.8 (four corners make an X); from 0.6 a frayed tear opens at `seam` and runs in to 18% of the width (at most 140px; 72px without `w`) at 1. 0 draws neither and keeps the plain rendering.",
        pull: 'Corners being pulled, from "tl", "tr", "br", "bl"; each grows one crease. Default all four; ["tl", "br"] makes a single diagonal crease.',
        seam: "Y of the starting tear in stage px from the top edge; default half of `h` (50% without `h`). Use a Tear seam to continue the same edge. null draws creases only.",
        seamSide: '"left" or "right": the edge the tear starts from.',
        seed: "Fray pattern of the starting tear. With the same seed, seam, and w as a Tear, the lips follow that Tear's seam.",
        tab: "A pestaña fixed behind the top edge: `{ label, reveal = 1, offset = max(radius, 24), size = 32 }`. The label is Geist 800 at `size` stage px in the tone's text colour (ink on paper). `reveal` 0 hides the whole tab behind the sheet; 1 shows it with its base still tucked 14px behind the edge. It shares the sheet's stock, edge, and shadow.",
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
      export: "frayEdge",
      kind: "function",
      summary:
        "Deterministic torn edge along a horizontal line: small irregular teeth riding a gentle wander. Paper's starting tear and Tear's seams share it, so the same seed, y, width, and amplitude give the same profile.",
      params: {
        width: "Length of the edge in stage px; it runs from x = 0 to x = width.",
        y: "The line the edge follows, in stage px; also keys the pattern.",
        seed: "Pattern seed; default 1.",
        amplitude: "Tooth size in stage px; default FRAY.",
        step: "Approximate spacing between teeth in stage px; default 12.",
      },
      returns:
        "Points `{ x, y }` from x = 0 to x = width, each within frayReach(amplitude) of y. Non-finite inputs are treated as 0.",
    },
    {
      export: "frayReach",
      kind: "function",
      summary: "How far a frayed edge can stray from its line.",
      params: { amplitude: "Fray amplitude in stage px; default FRAY." },
      returns: "1.8 × amplitude (0 for a negative amplitude).",
    },
    {
      export: "paperTension",
      kind: "function",
      summary: "Maps a tension value to the two quantities Paper draws.",
      params: { tension: "0–1; non-finite values count as 0." },
      returns:
        "`{ crease, tear }`: crease length as a share of the way to the centre (tension / 0.8, capped at 1) and tear progress ((tension − 0.6) / 0.4, from 0 to 1).",
    },
    {
      export: "FRAY",
      kind: "constant",
      summary: "Default fray amplitude, 6 stage px, shared by Paper's starting tear and Tear.",
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
    {
      export: "PaperCorner",
      kind: "type",
      summary: '"tl" | "tr" | "br" | "bl": top-left, top-right, bottom-right, bottom-left.',
    },
    {
      export: "PaperTab",
      kind: "type",
      summary: "`{ label: string; reveal?: number; offset?: number; size?: number }`, the tab prop.",
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Paper takes w×h when given and otherwise fills its container's width with height following children. A tab rises size + 2 × round(size × 0.3) + 2px edge above the top edge at reveal 1 (about 53px at size 32) without changing layout size; the tear cuts into the box and never adds to it. Sticker is inline and sized by its text: at the default size 72 it is about 72 × 1.05 + 2 × 13 ≈ 102 stage px tall. Rotation does not change layout size, so tilted corners can extend beyond the box.",
  },
  examples: [
    {
      title: "Paper, sticker, and caption",
      code: 'import { Paper, Sticker, Caption } from "@/jbm/ui/paper"\n\n<Paper w={200} h={130} rotate={-3} style={{ padding: 20 }}>\n  <Caption size={24}>papel</Caption>\n</Paper>\n<Sticker size={40} rotate={-5}>¿otra vez?</Sticker>\n<Sticker tone="ink" size={28} rotate={2}>catálogo</Sticker>',
    },
    {
      title: "A sheet pulled from four corners, with a tab",
      code: 'import { Paper } from "@/jbm/ui/paper"\n\n// Drive tension and reveal from your timeline, e.g. interpolate(frame, [0, 60], [0, 1]).\n<Paper\n  w={520}\n  h={760}\n  radius={10}\n  tension={0.9}\n  seam={380}\n  tab={{ label: "Tutorial", reveal: 1 }}\n/>',
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
    "Drag Tension through 0, 0.3, 0.6, 0.8, and 1: creases grow from the pulled corners and meet at the centre at 0.8; the tear opens only past 0.6, its lips join the edge on the border's centreline, and its mouth shows what lies under the sheet rather than a painted fill.",
    "Try each Pulled corners preset and Tear from the right edge, and the tear on the ink stock.",
    "Drag Tab reveal from 0 to 1: at 0 the whole tab is hidden behind the sheet; in between the top edge cuts the label rather than drawing over it; at 1 the label is Geist 800 at 32 stage px and the tab base stays tucked behind the edge.",
    "With tension 0 and no tab the markup equals the original single div; existing scenes depend on it.",
  ],
  docs: [
    { title: "Surface depth guide", url: "https://jbm-ui.bns.studio/docs/surface-depth.md" },
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
