import type { ItemContract } from "../schema"

export default {
  name: "brand",
  entry: "component",
  title: "Brand",
  description: "Centered tacosdedatos wordmark in Geist Mono with an optional tagline.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "Brand",
      kind: "component",
      summary:
        "Centered lockup: \"tacos\" and \"datos\" in bold ink Geist Mono with \"de\" in the vermilion accent, and an optional dim sans tagline 10px below.",
      props: {
        tagline: "Optional line under the wordmark at round(size × 0.46) px.",
        size: "Wordmark font size in stage pixels; the tagline scales with it.",
        style: "Inline styles on the centered wrapper, merged last.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "A centered block that fills its container's width. Height is one 56px mono line at the font's normal line height (not set explicitly), plus 10px and one round(size × 0.46) tagline line when a tagline is given.",
  },
  examples: [
    {
      title: "Lockup with tagline",
      code: 'import { Brand } from "@/jbm/ui/brand"\n\n<Brand tagline="Ideas, datos y código." size={64} />',
    },
  ],
  qa: [
    "Check \"de\" is the only accent in the lockup and the wordmark has no spaces.",
    "Confirm the tagline stays centered under the wordmark and scales with size.",
    "In an end card, keep the lockup the only accent element on the frame.",
  ],
} satisfies ItemContract
