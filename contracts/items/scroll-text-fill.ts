import type { ItemContract } from "../schema"

export default {
  name: "scroll-text-fill",
  entry: "component",
  title: "ScrollTextFill",
  description:
    "Scroll to bring text into focus, one character at a time. Keyboard scrolling, reversible progress, and reduced-motion support.",
  category: "Motion",
  capabilities: ["scroll"],
  api: [
    {
      export: "ScrollTextFill",
      kind: "component",
      summary:
        "Self-contained, focusable scroll region that pins a TextFill in a sticky row and maps its own scroll position (0 at top, 1 at the bottom) to fill progress. Scrolling back rewinds; it never autoplays. Under reduced motion it renders the full text statically with no scroll region.",
      props: {
        text: "The sentence to fill; passed to TextFill.",
        dimColor: "Color of characters not yet reached; passed to TextFill.",
        accentColor: "Color of the leading wave; passed to TextFill.",
        textColor: "Final color of settled characters; passed to TextFill.",
        reducedMotion:
          "Overrides the system prefers-reduced-motion setting. True renders the complete text with auto height and no scrolling; undefined follows the system preference (and renders reduced on the server).",
        style: "Inline styles for the TextFill span; set fontSize here.",
        className: "Class name on the TextFill span.",
        height:
          "Height of the scroll viewport in stage pixels. Minimum 120; non-finite values fall back to 320.",
        distance:
          "Extra scroll distance in pixels beyond the viewport; the whole fill happens over this travel. Minimum 1; non-finite values fall back to 640.",
        label: "Accessible name of the scroll region.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: "fill", height: 320 },
    vertical: { width: "fill", height: 320 },
    basis:
      "The region is width 100% and exactly `height` (default 320, minimum 120) stage pixels tall; the scrollable content inside is height + distance. With reduced motion the height becomes auto: the text plus 24px padding on each side, with a minimum of `height`.",
  },
  examples: [
    {
      title: "Contained scroll fill",
      code: 'import { ScrollTextFill } from "@/jbm/ui/scroll-text-fill"\n\n<ScrollTextFill\n  text="Una idea toma forma. Letra por letra."\n  height={320}\n  distance={640}\n  style={{ fontSize: 40 }}\n/>\n// Self-contained scroll region; respects prefers-reduced-motion.',
    },
  ],
  qa: [
    "Scroll the region from top to bottom and back: fill tracks scroll position in both directions and is complete exactly at the bottom.",
    "Focus the region with Tab and use ↓ / ↑ (and Page Down / Up): it scrolls and fills without scrolling the page (overscroll is contained).",
    "Enable prefers-reduced-motion (or pass reducedMotion): the full ink text renders statically, the region is not focusable, and there is no scroll.",
    "Check narrow screens: long text wraps inside the sticky row and stays vertically centered in the viewport.",
    "Change text or height after mount and confirm progress recomputes (a ResizeObserver re-measures).",
  ],
} satisfies ItemContract
