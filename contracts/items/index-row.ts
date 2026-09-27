import type { ItemContract } from "../schema"

export default {
  name: "index-row",
  entry: "component",
  title: "Index Row",
  description: "A numbered record with optional evidence, linked title, and active state.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "IndexRow",
      kind: "component",
      summary:
        "One row of a numbered index: a mono index, a 22px title (an ActionLink when `href` is set, otherwise bold text), and optional dim evidence below, with a hairline bottom border. Only the title is linked so evidence may contain its own links. Other div attributes pass through.",
      props: {
        index: "The row marker, such as \"01\"; Geist Mono 14px, dim or vermilion when active.",
        title: "The record's title, 22px. Rendered through ActionLink (with its arrow) when `href` is set.",
        evidence: "Optional supporting text below the title, 15px dim; may contain links or other nodes.",
        href: "Links the title. Without it the title is plain text.",
        active:
          "Marks the current row: index and title turn vermilion, and a linked title gets aria-current=\"step\".",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fills the container. Height is 22px padding above and below plus the title (22px × 1.25–1.4 per line) and, when present, 8px + evidence lines at 15px × 1.55, plus the 1px bottom border. Long titles and evidence wrap and add lines.",
  },
  examples: [
    {
      title: "Numbered index with an active row",
      code: 'import { IndexRow } from "@/jbm/ui/index-row"\n\n<IndexRow index="01" title="El contexto" evidence="Empieza con una pregunta." href="/contexto" active />\n<IndexRow index="02" title="La evidencia" href="/evidencia" />\n<IndexRow index="03" title="Una idea útil" />',
    },
  ],
  qa: [
    "Compare active, linked, and unlinked rows: only the active row uses vermilion, linked titles show the ActionLink underline and arrow, and plain titles are bold ink.",
    "Hover and Tab to linked titles; the focus indicator is visible and aria-current=\"step\" is present only on the active row.",
    "Check a narrow screen with long titles and evidence: text wraps beside the index, which stays baseline-aligned with the title's first line.",
  ],
} satisfies ItemContract
