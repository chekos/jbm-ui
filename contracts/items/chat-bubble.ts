import type { ItemContract } from "../schema"

export default {
  name: "chat-bubble",
  entry: "component",
  title: "Chat Bubble",
  description: "Messages with optional speakers and tails, incoming/outgoing alignment, and three palette tones.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "ChatBubble",
      kind: "component",
      summary:
        "One message bubble, sized to its content up to the container width, with an optional mono speaker line and a small triangular tail under the aligned corner. No chat state or typing simulation; callers choose the list or conversation semantics. Div attributes pass through.",
      props: {
        side: "\"start\" aligns the bubble and tail to the inline start (incoming); \"end\" to the inline end (outgoing). RTL-aware via logical margins.",
        tone: "Fill: \"paper\" (card stock with ink text), \"ink\", or \"accent\" (vermilion); ink and accent use cream text.",
        tail: "Shows the 18×12 tail below the bubble, which adds 10px bottom margin. False removes both.",
        speaker: "Optional speaker name above the message, 11px mono. Omit (null/undefined) to hide.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fits the content up to 100% of the container; height is 16px padding top and bottom plus message lines at 18px × 1.5, an optional speaker line (11px + 6px gap), and 10px of margin for the tail when shown.",
  },
  examples: [
    {
      title: "A short exchange",
      code: 'import { ChatBubble } from "@/jbm/ui/chat-bubble"\n\n<ChatBubble speaker="Tú" tone="ink">¿Y si lo hacemos más sencillo?</ChatBubble>\n<ChatBubble speaker="La idea" side="end" tone="accent">\n  Una pieza a la vez.\n</ChatBubble>',
    },
  ],
  qa: [
    "Compare paper, ink, and accent tones on cream: text stays legible and the tail matches the bubble fill.",
    "Check start and end alignment: the tail sits 22px in from the aligned corner and points toward that side.",
    "Turn off the tail and confirm the 10px gap below disappears.",
    "Check a long unbroken message on a narrow screen wraps inside the bubble instead of overflowing.",
  ],
  docs: [
    { title: "Visual primitives guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
