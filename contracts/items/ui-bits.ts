import type { ItemContract } from "../schema"

export default {
  name: "ui-bits",
  entry: "bundle",
  title: "UiBits",
  description:
    "One install for the paper cut-out interface pieces: UiButton, UiInput, UiCard, Piece, PhoneFrame, Badge, and TokenGlyph.",
  category: "UI Bits",
  capabilities: [],
  api: [
    { export: "UiButton", kind: "re-export", from: "ui-button" },
    { export: "UiInput", kind: "re-export", from: "ui-input" },
    { export: "UiCard", kind: "re-export", from: "ui-card" },
    { export: "Piece", kind: "re-export", from: "piece" },
    { export: "PhoneFrame", kind: "re-export", from: "phone-frame" },
    { export: "Badge", kind: "re-export", from: "badge" },
    { export: "TokenGlyph", kind: "re-export", from: "token-glyph" },
    { export: "PieceKind", kind: "re-export", from: "piece" },
    { export: "TokenKind", kind: "re-export", from: "token-glyph" },
  ],
  pageReason:
    "A backward-compatible barrel that only re-exports other items. Open /c/ui-button, /c/ui-input, /c/ui-card, /c/piece, /c/phone-frame, /c/badge, and /c/token-glyph for props, stage sizes, and previews.",
  stage: {
    mode: "n/a",
    reason: "A re-export barrel; each re-exported component declares its own stage size on its page.",
  },
  examples: [
    {
      title: "Phone screen from cut-out pieces",
      code: 'import { PhoneFrame, UiCard, UiInput, UiButton } from "@/jbm/ui/ui-bits"\n\n<PhoneFrame w={420} h={780}>\n  <UiCard w={290} />\n  <UiInput w={290} h={92} />\n  <UiButton w={290} h={92} tone="ink" />\n</PhoneFrame>',
    },
    {
      title: "Status badges and token glyphs",
      code: 'import { Badge, TokenGlyph } from "@/jbm/ui/ui-bits"\n\n<Badge kind="check" size={40} />\n<Badge kind="x" size={40} tone="ink" />\n<TokenGlyph kind="color" size={70} />',
    },
  ],
  qa: [
    "After adding or removing a component in the barrel, confirm registry.json registryDependencies still lists every re-exported item so one install brings in all of them.",
    "Import each re-export from @/jbm/ui/ui-bits in a consumer build (pnpm consumer:check) and confirm it renders the same as the direct import from its own item.",
  ],
} satisfies ItemContract
