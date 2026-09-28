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
        label: "Folder name; also names the image for assistive technology. On the front panel (accent and ink default) it is Geist Mono 600 and follows fitLine: whole when it fits, compressed horizontally down to 0.8, then compressed with an ellipsis. On the tab (card default) it is a tab name in Geist 800, drawn whole: the tab widens to fit it (sansWidth from tokens), up to the body width, then the name compresses. The tab is on the back panel, so once `open` is above 0 (a sheet stands in front of it) the name prints on the front panel instead: never a fragment beside the sheet and never painted over it. Front-panel type keeps its proportions as the panel tilts (frontType).",
        sublabel: "Short mono line on the front panel, placed with it as it opens (its glyphs keep their proportions): under a front label, or near the panel's top-left when the label is on the tab. Same overflow rule as a front label (fitLine).",
        labelOn: "\"front\" or \"tab\": where the name prints while the folder is closed. Defaults to \"tab\" for the card tone and \"front\" for accent and ink. Once open is above 0 the name prints on the front panel either way; the tab keeps the width it was given.",
        open: "Opening progress from 0 (closed) to 1 (sheet upright). Clamped; non-finite values render closed.",
        tone: "Folder fill: \"accent\" (vermilion, cream label), \"ink\" (cream label), or \"card\" (plain cream with ink label, tab label by default). A closed card folder shows no sheet: its default sheet, in the folder's own stock, is seated below the front panel's top edge and rises straight out over the first 8% of open, then turns like the others. Accent and ink folders show their contrasting sheet above the panel when closed.",
        children: "Replaces the default sheet entirely. Rendered untransformed, so `open` does not move custom contents; animate them yourself or use FolderContents.",
      },
    },
    {
      export: "folderShape",
      kind: "constant",
      summary:
        "Folder's proportions in its 260×220 space, shared by every folder in the library: viewBox { w: 260, h: 220 }, body { x: 25, y: 55, w: 205, h: 150 } (tab top to the front panel's bottom edge), tab { width: 83, height: 27, slope: 17 }, and flap 95 (the front panel's top edge when closed). tableFolderGeometry and cajonLayout's folders are this body at another scale.",
    },
    {
      export: "folderScaleForDrawer",
      kind: "function",
      summary:
        "The scale that makes a standalone Folder the same object as the front folder of a drawer: render Folder with style.width = 260 × the result, or multiply folderShape by it. Cajon's front folder is the drawer width less 26 units a side (× w / 420 above the 420 reference); a FileCabinet's drawer is the cabinet width less 20.",
      params: { drawerWidth: "Drawer width in parent units (Cajon's w). Non-finite or non-positive widths use the 420 reference." },
      returns: "Folder units to parent units: 368 / 205 (about 1.80) for the 420 reference drawer.",
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
        "SVG transform for text printed on the front panel at a closed-folder point, so it widens and leans with the panel as the folder opens. Use it for marks that should lean with the panel; Folder sets its own type with frontType, so the glyphs are never squashed.",
      params: {
        u: "Baseline start x in the 260×220 folder space (closed).",
        v: "Baseline y in the folder space (closed), between 95 and 205.",
        open: "Opening progress 0–1.",
      },
      returns: "A matrix(…) string for a transform attribute.",
    },
    {
      export: "frontType",
      kind: "function",
      summary:
        "Transform for type on the front panel: the anchor follows frontPlane as the folder opens, but the glyphs keep their proportions (one uniform scale for the panel's foreshortening), never squashed or sheared. Folder uses it for its label and sublabel.",
      params: {
        u: "Baseline start x in the 260×220 folder space (closed).",
        v: "Baseline y in the folder space (closed), between 95 and 205.",
        open: "Opening progress 0–1.",
      },
      returns: "A matrix(k 0 0 k x y) string for a transform attribute.",
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
        fill: "Fill color; the ink edge (stroke.outline, 3px) is fixed.",
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
      title: "Match the folders in a drawer",
      code: 'import { Folder, folderScaleForDrawer } from "@/jbm/ui/folder"\n\n// A loose folder the same size as the front folder of a 420-wide Cajon.\n<Folder tone="card" label="Doorways" style={{ width: 260 * folderScaleForDrawer(420) }} />',
    },
    {
      title: "Drive it from a Remotion timeline",
      code: 'import { Folder } from "@/jbm/ui/folder"\nimport { useProgress } from "@/jbm/motion/hooks" // install @jbm/motion-hooks separately\n\n// Render inside a Remotion <Composition> or <Player>: hooks run in the component body.\nexport function OpeningFolder() {\n  const open = useProgress(0.5, 1, 0.8)\n  return <Folder label="proyecto" tone="ink" open={open} style={{ width: 390 }} />\n}',
    },
  ],
  qa: [
    "Drag open through 0, 0.5, and 1: the sheet never cuts through the front panel and its lower corner clears the folder edge.",
    "Card tone closed: only the back panel, its tab and name, and the front panel show; no sheet edge or dog-ear above the front. Step open through 0.04, 0.08, and 0.12: the sheet rises straight out of the front before it turns, with no ink wedge pinched against the panel's top edge.",
    "Beside a Cajon, a Folder at style.width 260 × folderScaleForDrawer(w) has the same body width as the drawer's front folder.",
    "Check the label stays on the front plane while it foreshortens; a long label and sublabel follow the same rule: compressed to at most 0.8, then an ellipsis.",
    "Compare accent, ink, and card tones; the ink folder keeps a visible 3px edge on cream. Vermilion appears only on the accent tone: the default sheet's heading bar is ink on ink and card folders.",
    "Card tone: the tab name is bold sans (Geist 800), the tab widens for \"Doorways\", reaches the body width for \"Training Within Industry\", and never shows an ellipsis. At open 0.5 and 1 the whole name stays readable over the rising sheet.",
    "Sublabel: stays on the front panel and leans with it through open 0 → 1, under a front label or near the top-left under a tab label.",
    "Scale with style.width at narrow widths: the silhouette keeps its 260:220 proportions.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
    { title: "Visual primitives guide", url: "https://jbm-ui.bns.studio/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
