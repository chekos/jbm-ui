import type { ItemContract } from "../schema"

export default {
  name: "tape-marker",
  entry: "component",
  title: "TapeMarker",
  description:
    "Folded vermilion paper checkpoint marker with an optional label above it.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "TapeMarker",
      kind: "component",
      summary:
        "A 20×72 vermilion strip with the shared paper shadow and a darker 14px fold at the top. Usable alone or as PaperTape's checkpoint marker.",
      props: {
        label:
          "Optional bold vermilion text centered 8px above the marker. It does not wrap and sits outside the marker's box, so reserve headroom for it.",
        style: "Inline styles merged last onto the marker strip, e.g. for positioning.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 20, height: 72 },
    vertical: { width: 20, height: 72 },
    basis:
      "Fixed 20×72 box. The label is absolutely positioned above it (8px gap plus one line of inherited-size text) and does not add to the box; long labels extend sideways beyond 20px.",
  },
  examples: [
    {
      title: "Labeled checkpoint",
      code: 'import { TapeMarker } from "@/jbm/ui/tape-marker"\n\n<TapeMarker label="parar aquí" />',
    },
  ],
  qa: [
    "Toggle Marker label: the marker box does not move or resize, and the label centers above it.",
    "Check the top fold reads as a darker band and the shadow matches other paper surfaces.",
    "Check long labels at narrow widths: they do not wrap, so make sure they are not clipped by a parent.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
