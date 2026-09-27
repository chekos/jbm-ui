import type { ItemContract } from "../schema"

export default {
  name: "action-link",
  entry: "component",
  title: "ActionLink",
  description: "A text anchor with an optional arrow and visible hover and keyboard focus.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "ActionLink",
      kind: "component",
      summary:
        "A real <a> (all anchor attributes and the ref pass through) in Geist 18px bold with a 1px underline. On hover or keyboard focus it turns vermilion with a 2px underline; caller onMouseEnter, onMouseLeave, onFocus, and onBlur handlers still run. An optional decorative ↗ arrow follows the text.",
      props: {
        arrow: "Shows the trailing ↗ arrow (aria-hidden). Set false for a plain underlined link.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Inline-flex, sized by its text up to 100% of the container: one line is 18px × 1.4 plus 6px padding above and below (about 37px); long text wraps anywhere and adds lines.",
  },
  examples: [
    {
      title: "Link with and without the arrow",
      code: 'import { ActionLink } from "@/jbm/ui/action-link"\n\n<ActionLink href="/ideas">Explora las ideas</ActionLink>\n<ActionLink href="/historia" arrow={false}>Lee la historia completa</ActionLink>',
    },
  ],
  qa: [
    "Hover and Tab to each link: both switch to vermilion with a thicker underline and a visible focus outline offset 5px, then revert on leave or blur.",
    "Check that the arrow is not read by screen readers and does not wrap onto its own line apart from the text.",
    "Check a long link text on a narrow screen: it wraps without overflowing.",
  ],
} satisfies ItemContract
