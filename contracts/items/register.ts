import type { ItemContract } from "../schema"

const spec = {
  kind: "Register: mono, plain, grid, prose, or mixed.",
  n: "Steps (mono, 0–24, default 7), list groups (plain, 0–24, default 10), tables (grid, 0–12, default 7; one column up to 4, then two, then three), source ticks (prose, 0–16, default 8), or bands (mixed, 0–4 of mono, plain, grid, prose; default 4). 0 draws a blank sheet (prose keeps its lines). Rounded and clamped. More items tighten the packing; the sheet never grows. List numerals set at 12 × scale; source ticks sit 14 × scale apart.",
  w: "Sheet width in stage px.",
  h: "Sheet height in stage px.",
  sources: "Prose only: source ticks, overriding n. In mixed, the prose band's ticks (default 3).",
  bands: "Mixed only: the stacked registers, top to bottom, each `{ kind, n?, weight? }` (weight sets its share of the page before row pitches are capped; each band then sits at the height its writing actually uses, bands follow each other with even separators at least 2 × (frayReach() + 2) + 8 px tall so a Tear's fray or Paper's starting notch at a seam never reaches the writing, and any leftover height collects at the foot of the page; at most 8 bands). Overrides n. Give a mixed page about the board's proportions (460 × 1000): a squatter sheet compresses every band.",
  gapAt: "Row index where a gap opens: mono steps, plain and grid rows of cells, prose lines then the spacer then source rows; for mixed, the band index (0 = above the first band, bands.length = below the last). Rows from here down move to make room; omit for no gap.",
  gap: "Gap height in px when fully open. Defaults to a quarter of the writing height; clamped to 60% of it. Marks are sized for the open gap at every reflow value, so reflow moves writing without resizing it.",
  reflow: "How open the gap is, 0–1 (default 1): run 1 → 0 on the sheet a slip leaves (it closes) and 0 → 1 on the sheet it lands on (it makes room).",
  scale: "Mark scale: bar thickness, strokes, and spacing. Defaults to w / 360 (clamped 0.4–4), so a 360 px sheet draws 6 px prompt bars and 1.5 px outlines.",
  pad: "Inset from the sheet edge to the writing in px (default 20 × scale).",
  reveal: "Writing drawn so far, 0–1: cells ink in reading order, each one left to right; 0 is a blank sheet. The sheet itself is always there.",
  accent: "Cell indices (reading order, see registerLayout) whose lead mark is vermilion: the prompt bar, list heading, table header, prose line, or source tick. Everything else stays ink.",
  tone: "The stock the writing sits on (Paper's tone, default paper): ink writing on paper; on ink or vermilion stock the writing is card-coloured and dim marks cream at 62%. Result boxes and tables are filled with the stock, so whatever lies under the writing (Paper's creases) never shows through them.",
}

export default {
  name: "register",
  entry: "component",
  title: "Register",
  description:
    "Paper sheet of drawn writing whose shape says who reads it: steps, lists, tables, sourced prose, or a mixed page.",
  category: "UI Bits",
  family: "Paper & writing",
  capabilities: ["controls"],
  api: [
    {
      export: "Register",
      kind: "component",
      summary:
        "A Paper sheet (ink edge at the shared outline weight, house paper shadow) carrying one register of drawn writing: bars, boxes, and rules, never legible prose. `mono` is a prompt chevron, prompt bar, and outlined result box per step; `plain` short numbered lists in two columns; `grid` ruled tables with an ink header; `prose` a justified block with paragraph ends (every fifth line and the last, never two in a row and never the first line after a gap) and a block of source ticks; `mixed` stacks registers on one long page. Every quantity is a prop (no timer), so a slider or video frame drives it. Anchors, seams, and the gap are in the sheet's px from its outer top-left corner, the same space `children` draw in.",
      props: {
        ...spec,
        rotate: "Sheet rotation in degrees (Paper's rotate).",
        label: "Accessible name of the drawing; defaults to “Page of <kind> writing”.",
        children: "Laid over the sheet in sheet px (a Slip at registerGap, a tab, a thread origin).",
        style: "Styles merged onto the Paper sheet, e.g. position.",
      },
    },
    {
      export: "RegisterInk",
      kind: "component",
      summary:
        "The writing alone as an SVG <g> in sheet px, for SVG scenes, tear pieces, or any other surface. Takes the RegisterSpec props plus reveal and accent. Render inside an <svg>.",
      props: spec,
    },
    {
      export: "registerLayout",
      kind: "function",
      summary:
        "Pure geometry for a register: every cell (reading order, band, row, kind, box, lead point, anchor, marks), row slots, band boxes, mixed seams, prose anchors, and the gap box, in sheet px. Register and RegisterInk draw exactly this, so hosts can attach threads and tears to the same points.",
      params: { spec: "RegisterSpec: kind, n, w, h, sources, bands, gapAt, gap, reflow, scale, pad." },
      returns: "RegisterLayout { w, h, scale, cells, rows, bands, seams, anchors, gap }.",
    },
    {
      export: "registerAnchors",
      kind: "function",
      summary: "Prose source tick centres (prose kind or the prose band of mixed), top to bottom, in sheet px: where threads leave the sheet.",
      params: { spec: "RegisterSpec." },
      returns: "Pt[]; empty when there is no prose.",
    },
    {
      export: "registerSeams",
      kind: "function",
      summary: "Mixed only: the y of each seam between bands, top to bottom, in sheet px, halfway through the space between bands. Tear lines follow them.",
      params: { spec: "RegisterSpec." },
      returns: "number[] (bands − 1 values); empty for single registers.",
    },
    {
      export: "registerGap",
      kind: "function",
      summary: "The gap's box in sheet px: full writing width, height gap × reflow. Place a slip at the fully open gap (reflow 1) so its resting place does not move while the gap animates.",
      params: { spec: "RegisterSpec with gapAt." },
      returns: "Box, or null without gapAt.",
    },
    { export: "RegisterKind", kind: "type", summary: "\"mono\" | \"plain\" | \"grid\" | \"prose\" | \"mixed\"." },
    { export: "RegisterBand", kind: "type", summary: "One band of a mixed page: `{ kind, n?, weight? }`." },
    { export: "RegisterSpec", kind: "type", summary: "The geometry props shared by Register, RegisterInk, and the layout helpers." },
    { export: "RegisterTone", kind: "type", summary: "\"ink\" | \"dim\" | \"accent\": the fill of a bar mark." },
    { export: "RegisterMark", kind: "type", summary: "One drawn mark: bar, outlined box, rule, chevron, or numeral, in sheet px." },
    { export: "RegisterCell", kind: "type", summary: "One unit of writing: index, band, row, kind, box, lead, optional anchor, marks." },
    { export: "RegisterLayout", kind: "type", summary: "registerLayout's result." },
    { export: "RegisterInkProps", kind: "type", summary: "RegisterSpec plus reveal and accent." },
    { export: "RegisterProps", kind: "type", summary: "RegisterInkProps plus rotate, label, children, style." },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 300, height: 380 },
    vertical: { width: 300, height: 380 },
    basis:
      "Exactly w × h stage px (the gallery uses 300 × 380, and 300 × 700 for mixed, near the board's long-page proportions); n, reveal, gap, and reflow never change the box. Rotation and the paper shadow draw outside it. On a 1920 × 1080 stage the board's quadrant sheets are about 440 × 280 and the long mixed page about 460 × 1000.",
  },
  examples: [
    {
      title: "Four readers, four registers",
      code: 'import { Register } from "@/jbm/ui/register"\n\n<div style={{ display: "flex", gap: 24 }}>\n  <Register kind="mono" n={7} w={300} h={380} />\n  <Register kind="plain" n={10} w={300} h={380} />\n  <Register kind="grid" n={7} w={300} h={380} />\n  <Register kind="prose" sources={8} w={300} h={380} />\n</div>',
    },
    {
      title: "Long mixed page with seams and source anchors",
      code: 'import { Register, registerSeams, registerAnchors } from "@/jbm/ui/register"\n\nconst page = { kind: "mixed", w: 380, h: 840 } as const\nconst seams = registerSeams(page) // three y positions: tear lines\nconst anchors = registerAnchors(page) // prose source ticks: thread origins\n\n<Register {...page} reveal={0.6} />',
    },
    {
      title: "A destination making room",
      code: 'import { Register, registerGap } from "@/jbm/ui/register"\n\nconst reflow = 0.5 // from a slider or frame\nconst sheet = { kind: "prose", n: 3, w: 250, h: 300, gapAt: 4, gap: 66 } as const\nconst landing = registerGap({ ...sheet, reflow: 1 }) // where the slip settles\n\n<Register {...sheet} reflow={reflow} />',
    },
  ],
  qa: [
    "Switch Kind through all five: each reads as one register at a glance (steps with result boxes, numbered lists, ruled tables, a justified block with source ticks, a stacked page) and no mark forms a legible word.",
    "Step Count from 0 to its maximum for every kind: 0 is a blank sheet (no steps, lists, tables, or bands; prose keeps its lines), marks pack tighter inside the same sheet, nothing crosses the pad or the sheet edge, and grid switches to two columns above 4 tables.",
    "Mixed: every band keeps readable proportions (list numerals at 12 × scale, tables with open rows, not squeezed), and the seams sit in the even gaps between bands.",
    "Drag Reveal 0 → 1: a blank sheet, then cells ink in reading order, each left to right; no mark appears early or pops.",
    "Turn on Gap and drag Reflow 1 → 0 → 1: rows below the gap slide while every mark keeps its size; at 0 the writing is evenly spaced again.",
    "Show seams, anchors, gap: seams sit between mixed bands, anchor rings sit on the source ticks without touching each other or the sheet edge, and the gap box is empty.",
    "Accent first mark: only that lead mark turns vermilion.",
    "Check 2× zoom: chevrons, result-box corners, and table rules are crisp and consistent; outlines never exceed the prompt bar's weight.",
  ],
  docs: [{ title: "Writing registers guide", url: "https://jbm-ui.bns.studio/docs/writing-registers.md" }],
} satisfies ItemContract
