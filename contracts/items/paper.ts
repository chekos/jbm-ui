import type { ItemContract } from "../schema"

export default {
  name: "paper",
  entry: "component",
  title: "Paper",
  description:
    "Paper cut-out primitives: a card-stock sheet that can crease, start to tear, and carry a real tab, a slanted Sticker with display type, and a centered Caption.",
  category: "UI Bits",
  family: "Paper & writing",
  capabilities: ["controls"],
  api: [
    {
      export: "Paper",
      kind: "component",
      summary:
        "Flat piece of card stock (border-box, position relative) in cream, vermilion, or ink with an optional 2px edge, the paper drop shadow, and an optional rotation. Under `tension` each pulled corner sends a few short, soft creases into the sheet (under its writing, spreading apart, never meeting or converging) and, from 0.6, a frayed notch tears into the sheet at a seam; `tab` fixes a pestaña behind the top edge that slides out with its reveal. With neither set it renders exactly the original single div. Pure React and controlled; wrap in a motion Pop for entrances.",
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
          "Content placed on the paper. Creases are folds in the stock and lie under it, so the writing is never crossed out (draw result boxes filled with the stock, as RegisterInk does, and no crease shows through them); the tear's lips and its shadow band draw above it, and the tear's mouth cuts through it, so writing across the seam never covers the hole.",
        tension:
          "0–1 stress on the sheet. Each pulled corner sends two short creases inward (deterministic in `seed`), turned 7–11° to either side of the corner's diagonal, the second shorter. They start at the pulled corner itself (a few px apart on the rounded contour) and only spread from there: no two share an end or meet. They fade from the corner, grow to full length at 0.8, and the longer is at most 14% of the sheet's shorter side, so they stay at the corner, under the writing's margins. From 0.6 a notch tears into the sheet at `seam`: square-root eased, it is already half its depth with a 17px mouth at 0.7, and at 1 runs in 14% of the width (at most 90px; 64px without `w`) with a 24px mouth. It is a frayed wedge, widest at the edge, narrowing fast and running out as a single crack; its lips are ink on the cream stock and a cream hairline on vermilion or ink stock, and the mouth shows the page beneath; inside the mouth a thin band of the house rule tone is the upper lip's shadow, so it reads as a hole cut into the sheet. 0 draws neither and keeps the plain rendering.",
        pull: 'Corners being pulled, from "tl", "tr", "br", "bl", in any combination; each fans its own short creases. Default all four; [] creases nothing.',
        seam: "Y of the starting tear in stage px from the top edge; default half of `h` (50% without `h`). Use a Tear seam to continue the same edge. null draws creases only.",
        seamSide: '"left" or "right": the edge the tear starts from.',
        seed: "Fray pattern of the starting tear, and the creases' lengths and angles. With the same seed, seam, and w as a Tear, the midline between the lips follows that Tear's seam; each lip adds small fibres so the two sides are not a smooth mirror.",
        tab: "A pestaña fixed behind the top edge: `{ label, reveal = 1, offset = max(radius, 24), size = 32 }`. The label is Geist 800 at `size` stage px in the tone's text colour (ink on paper). `reveal` 0 hides the whole tab behind the sheet; 1 shows it with its base still tucked 14px behind the edge. It shares the sheet's stock, edge, and shadow. The tab stays on the sheet: it sits in a row from the left edge to the top-right radius, so a tab too long for its offset slides left; on a sized sheet a label too long for that row sets smaller (sansWidth) so the whole name fits, and without a width it ends in an ellipsis.",
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
        "Deterministic torn edge along a horizontal line: fine, irregular grain at uneven spacing on a slow wander, with the odd fibre sticking out further, like torn paper rather than pinking shears. Paper's starting tear and Tear's seams share it, so the same seed, y, width, and amplitude give the same profile.",
      params: {
        width: "Length of the edge in stage px; it runs from x = 0 to x = width.",
        y: "The line the edge follows, in stage px; also keys the pattern.",
        seed: "Pattern seed; default 1.",
        amplitude: "Tooth size in stage px; default FRAY.",
        step: "Spacing scale in stage px; points fall 0.25–0.8 × step apart (about half a step on average). Default 12.",
      },
      returns:
        "Points `{ x, y }` from x = 0 to x = width, x strictly increasing, each within frayReach(amplitude) of y and most within one amplitude. Non-finite inputs are treated as 0.",
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
        "`{ crease, tear }`: crease growth as a share of each crease's full length (tension / 0.8, capped at 1) and tear progress (√((tension − 0.6) / 0.4), from 0 to 1).",
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
      "Paper takes w×h when given and otherwise fills its container's width with height following children. A tab rises size + 2 × round(size × 0.3) + 2 × edge width above the top edge at reveal 1 (56px at size 32 with the 2px edge; the 14px tuck is behind the sheet) without changing layout size; the tear cuts into the box and never adds to it. Sticker is inline and sized by its text: at the default size 72 it is about 72 × 1.05 + 2 × 13 ≈ 102 stage px tall. Rotation does not change layout size, so tilted corners can extend beyond the box.",
  },
  examples: [
    {
      title: "A sheet pulled from four corners, with a tab",
      code: 'import { Paper } from "@/jbm/ui/paper"\n\n// Drive tension and reveal from your timeline, e.g. interpolate(frame, [0, 60], [0, 1]).\n<Paper\n  w={520}\n  h={760}\n  radius={10}\n  tension={0.9}\n  seam={380}\n  tab={{ label: "Tutorial", reveal: 1 }}\n/>',
    },
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
    "Drag Tension through 0, 0.4, 0.7, and 1: two short creases (at most 14% of the shorter side) come in from each pulled corner, starting at the corner and spreading apart, fade toward their tips, and lie under the writing; none shows inside a result box, and at no tension do two meet, converge into a V, or read as an X or a crossed-out page. The tear opens only past 0.6 and at 0.7 is already a clearly visible notch cut into the sheet at the seam: a short frayed wedge narrowing into a crack, never a shape sticking out of the edge or a long spike. Its lips are a 2px ink edge on the sheet's side of the cut (a cream hairline on ink stock), a thin shadow band sits under the upper lip, and the rest of the mouth shows what lies under the sheet rather than a painted fill; over the writing it stays inside the band gap. The mouth cuts the sheet's writing too: with Tear through the writing the notch runs through a table's ruled body and stays open through the rules.",
    "Try each Pulled corners preset and Tear from the right edge, and the tear on the ink stock: there the writing is card-coloured and stays visible.",
    "The bench shows only the sheet, its tension, and its tab; Sticker and Caption appear in the Usage examples.",
    "Drag Tab reveal from 0 to 1: at 0 the whole tab is hidden behind the sheet; in between the label stays hidden until the tab shows most of its capitals, then fades in whole, so the sheet's edge never leaves glyph tops as specks; at 1 the label is Geist 800 at 32 stage px and the tab base stays tucked behind the edge.",
    "With tension 0 and no tab the markup equals the original single div; existing scenes depend on it.",
  ],
  docs: [
    { title: "Surface depth guide", url: "https://jbm-ui.bns.studio/docs/surface-depth.md" },
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
