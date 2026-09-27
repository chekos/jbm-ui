import type { ItemContract } from "../schema"

export default {
  name: "scroll-stack",
  entry: "component",
  title: "Scroll stack",
  description:
    "Stack any React content as you scroll. Successive items scale into place while earlier ones fade. Page or contained scrolling, keyboard access, and a plain-list fallback.",
  category: "Motion",
  capabilities: ["controls", "scroll"],
  api: [
    {
      export: "ScrollStack",
      kind: "component",
      summary:
        "A list region whose direct children become sticky items: each incoming item scales from 1.06 to 1 as it pins, and the item it covers shrinks toward `minScale` and fades out over the last 35% of its progress. Uses native scroll and sticky positioning (page or contained), never intercepts scroll, and scrolls a covered item back into view when keyboard focus reaches it. It falls back to a plain list under reduced motion, with fewer than two items, or when any item is taller than the viewport minus twice `top`.",
      props: {
        children:
          "Each direct child is one stack item; its content and styling stay yours. Keep backgrounds opaque for a solid stack; wrap related content in one element.",
        height:
          "Omit to stack against page scrolling. Set a number for a self-contained, focusable scroll viewport of that many stage pixels (minimum 160; non-finite falls back to 480).",
        distance:
          "Scroll distance in pixels between successive items while stacking (also the margin between them). Minimum 0; non-finite falls back to 120. The plain list uses a fixed 24px gap.",
        top: "Sticky inset from the top of the viewport (or the contained region), in pixels; also the list's top padding. Minimum 0.",
        minScale: "Scale of an item once fully covered, clamped to 0.5–1.",
        reducedMotion:
          "True renders a plain list; false forces stacking. Undefined follows the system prefers-reduced-motion setting and updates when it changes.",
        label: "Accessible name of the region.",
        className: "Class name on the outer region.",
        style:
          "Inline styles for the outer region, merged before height and overflow (those are controlled by `height`).",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width is 100% of the container. In page mode (height omitted) the height is the sum of the items plus `distance` between each, `top` padding, and a tail that lets the last item rest pinned. With `height` set the region is exactly that tall (minimum 160) and scrolls internally.",
  },
  examples: [
    {
      title: "Contained stack of cards",
      code: 'import { ScrollStack } from "@/jbm/ui/scroll-stack"\nimport { Card } from "@/jbm/ui/card" // install @jbm/card separately\n\n<ScrollStack height={480} distance={120}>\n  <Card>First idea</Card>\n  <Card dark>Another idea</Card>\n  <div style={{ background: "#fff", padding: 24 }}>Any content</div>\n</ScrollStack>\n// Omit height for page scrolling; avoid overflow ancestors in page mode.',
    },
  ],
  qa: [
    "Scroll the contained demo from top to bottom and back: each card pins at the top inset, the covered card shrinks and fades fully before the next settles, and the last card rests without a gap or jump.",
    "Toggle Plain list: items render as an ordinary list with 24px gaps, no transforms, and full opacity; toggling back restores stacking.",
    "Tab into the covered cards' controls (the demo's button): the stack scrolls the focused item into view and it stays clickable.",
    "Resize to a narrow screen so an item is taller than the viewport: the component switches to the plain list (data-stack-mode=\"list\").",
    "Check page mode separately (height omitted) inside a page without overflow ancestors; sticky positioning fails under overflow: hidden/auto parents.",
    "Enable prefers-reduced-motion with reducedMotion undefined: it falls back to the list live.",
  ],
} satisfies ItemContract
