import type { ItemContract } from "../schema"

export default {
  name: "folder",
  entry: "component",
  title: "Folder",
  description:
    "Controlled folder illustration that pulls its sheet upright from 0 to 1.",
  category: "UI Bits",
  family: "Folders & drawers",
  capabilities: ["controls"],
  api: [
    {
      export: "Folder",
      kind: "component",
      summary:
        "Accent, ink, or card folder whose sheet rotates upright and clears the front panel as `open` goes from 0 to 1. Pure React with no internal timer; drive `open` from a slider or a video timeline.",
      props: {
        label: "Folder name; also names the image for assistive technology. On the front panel (accent and ink default) it is Geist Mono 600 and follows fitLine: whole when it fits, compressed horizontally down to 0.8, then compressed with an ellipsis. On the tab (card default) it is a tab name in Geist 800, drawn whole: the tab widens to fit it (sansWidth from tokens), up to the body width, then the name compresses; it stays drawn over the rising default sheet, with a halo in the tab's fill, so it reads in every open beat.",
        sublabel: "Short mono line on the front panel, projected with it as it opens: under a front label, or near the panel's top-left when the label is on the tab. Same overflow rule as a front label (fitLine).",
        labelOn: "\"front\" or \"tab\". Defaults to \"tab\" for the card tone and \"front\" for accent and ink, so existing folders are unchanged.",
        open: "Opening progress from 0 (closed) to 1 (sheet upright). Clamped; non-finite values render closed.",
        tone: "Folder fill: \"accent\" (vermilion, cream label), \"ink\" (cream label), or \"card\" (plain cream with ink label, tab label by default).",
        children: "Replaces the default sheet entirely. Rendered untransformed, so `open` does not move custom contents; animate them yourself or use FolderContents.",
      },
    },
    {
      export: "folderTones",
      kind: "constant",
      summary: "The fill and label color of each tone, from the palette tokens: accent, ink, card.",
    },
    {
      export: "FolderTone",
      kind: "type",
      summary: "\"accent\" | \"ink\" | \"card\".",
    },
    {
      export: "fitLine",
      kind: "function",
      summary:
        "The one overflow rule for folder text: the line whole when it fits `room`, compressed horizontally down to 0.8 when that is enough, otherwise compressed to 0.8 and cut to end with an ellipsis.",
      params: {
        text: "The line.",
        width: "Measures a candidate string (e.g. a sansWidth or mono estimate).",
        room: "Available width in the same units.",
      },
      returns: "{ text, scale }: the string to draw and its horizontal scale.",
    },
    {
      export: "oklab",
      kind: "function",
      summary: "A #RRGGBB colour in OKLab ([lightness 0–1, a, b]); used to mix drawer shades and pick label ink.",
      params: { hex: "A #RRGGBB colour." },
      returns: "[L, a, b].",
    },
    {
      export: "oklabHex",
      kind: "function",
      summary: "An OKLab triple back to #RRGGBB, clamped to sRGB.",
      params: { lab: "[L, a, b]." },
      returns: "A #RRGGBB string.",
    },
    {
      export: "labelInkOn",
      kind: "function",
      summary: "Readable label colour for a fill: color.ink when its OKLab lightness is above 0.6, else color.bg (cream). Non-hex fills get cream.",
      params: { fill: "A #RRGGBB fill." },
      returns: "color.ink or color.bg.",
    },
    {
      export: "frontPlane",
      kind: "function",
      summary:
        "SVG transform for text printed on the front panel at a closed-folder point, so it widens and leans with the panel as the folder opens. Folder uses it for the label and sublabel; use it for your own marks on the front.",
      params: {
        u: "Baseline start x in the 260×220 folder space (closed).",
        v: "Baseline y in the folder space (closed), between 95 and 205.",
        open: "Opening progress 0–1.",
      },
      returns: "A matrix(…) string for a transform attribute.",
    },
    {
      export: "FolderOutline",
      kind: "component",
      summary:
        "The complete back silhouette with its tab, as an SVG path. Shared by Folder, FolderContents, FolderCarry, and filing drawers so hidden geometry stays consistent.",
      props: {
        x: "Left edge in the parent SVG's units.",
        y: "Top of the tab.",
        w: "Body width.",
        h: "Height from the top of the tab to the bottom edge.",
        tabX: "Left edge of the tab; defaults to the body's left edge.",
        tabWidth: "Tab width, including its slope.",
        tabHeight: "Tab height above the body.",
        tabSlope: "Horizontal run of the tab's slanted edge.",
        fill: "Fill color; the 2px ink edge is fixed.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 260, height: 220 },
    vertical: { width: 260, height: 220 },
    basis:
      "Fixed 260×220 viewBox rendered at 260×220 stage pixels. It keeps its aspect ratio: set style.width to scale (height is auto), and it shrinks to maxWidth 100% of its container.",
  },
  examples: [
    {
      title: "Half-open folder",
      code: 'import { Folder } from "@/jbm/ui/folder"\n\n<Folder label="Ideas" open={0.5} />\n// open: 0 (closed) to 1 (open); no internal timer.',
    },
    {
      title: "Card folder with a tab label and sublabel",
      code: 'import { Folder } from "@/jbm/ui/folder"\n\n<Folder tone="card" label="Doorways" sublabel="rigor · ir a la fuente" />\n// Cream fill, ink text; the tab widens to fit the whole label.',
    },
    {
      title: "Drive it from a Remotion timeline",
      code: 'import { Folder } from "@/jbm/ui/folder"\nimport { useProgress } from "@/jbm/motion/hooks" // install @jbm/motion-hooks separately\n\n// Render inside a Remotion <Composition> or <Player>: hooks run in the component body.\nexport function OpeningFolder() {\n  const open = useProgress(0.5, 1, 0.8)\n  return <Folder label="proyecto" tone="ink" open={open} style={{ width: 390 }} />\n}',
    },
  ],
  qa: [
    "Drag open through 0, 0.5, and 1: the sheet never cuts through the front panel and its lower corner clears the folder edge.",
    "Check the label stays on the front plane while it foreshortens; a long label and sublabel follow the same rule: compressed to at most 0.8, then an ellipsis.",
    "Compare accent, ink, and card tones; the ink folder keeps a visible 2px edge on cream. Vermilion appears only on the accent tone: the default sheet's heading bar is ink on ink and card folders.",
    "Card tone: the tab name is bold sans (Geist 800), the tab widens for \"Doorways\", reaches the body width for \"Training Within Industry\", and never shows an ellipsis. At open 0.5 and 1 the whole name stays readable over the rising sheet.",
    "Sublabel: stays on the front panel and leans with it through open 0 → 1, under a front label or near the top-left under a tab label.",
    "Scale with style.width at narrow widths: the silhouette keeps its 260:220 proportions.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
    { title: "Visual primitives guide", url: "https://jbm-ui.bns.studio/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
