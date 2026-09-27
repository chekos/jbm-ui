import type { ItemContract } from "../schema"

export default {
  name: "rule",
  entry: "component",
  title: "Rule",
  description: "A labelled divider with ink or vermilion emphasis and two line weights.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Rule",
      kind: "component",
      summary:
        "A full-width separator (role=\"separator\") with an optional uppercase mono label before a flexible line. The line is 1px hairline by default or 3px when strong; its color is the line token, ink when strong, or vermilion when accent. Other div attributes pass through.",
      props: {
        label:
          "Optional editorial label (Geist Mono, 13px, uppercase) shown before the line; also becomes the separator's aria-label. Dim, or vermilion with `accent`.",
        strong: "Uses a 3px line instead of 1px, and ink instead of the hairline color when not accented.",
        accent: "Colors the line and label vermilion. Keep to one accent per composition.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width is 100% of the container. Height is the line weight (1px, or 3px strong) without a label, or one line of 13px mono label text with a label; long labels wrap anywhere and add lines. The line keeps a 24px minimum width.",
  },
  examples: [
    {
      title: "Labelled accent rule",
      code: 'import { Rule } from "@/jbm/ui/rule"\n\n<Rule label="Una idea a la vez" accent strong />\n<Rule />\n<Rule label="El siguiente capítulo" strong />',
    },
  ],
  qa: [
    "Compare the four looks on cream: plain hairline, strong ink, labelled, and accent strong; the label sits on the line's vertical center with a 16px gap.",
    "Check a long label on a narrow screen: it wraps and the line keeps at least 24px.",
    "Confirm the separator is announced with its label as the accessible name, and without one when unlabelled.",
  ],
} satisfies ItemContract
