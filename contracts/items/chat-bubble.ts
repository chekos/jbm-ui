import type { ItemContract } from "../schema"

export default {
  name: "chat-bubble",
  entry: "component",
  title: "ChatBubble",
  description: "Messages with optional speakers and tails, incoming/outgoing alignment, and three palette tones.",
  category: "UI",
  capabilities: [],
  api: [
    {
      export: "ChatBubble",
      kind: "component",
      summary:
        "One message bubble, sized to its content up to the container width, with an optional mono speaker line and a small tail under the aligned corner. The paper tone is card stock with the shared ink outline (stroke.outline) around body and tail as one line: each side of the tail curves out of the bottom edge through a small fillet and the edge opens where the tail leaves it. Ink and accent bubbles are edged in their own fill, so every tone has the same size. No chat state or typing simulation; callers choose the list or conversation semantics. Div attributes pass through.",
      props: {
        side: "\"start\" aligns the bubble and tail to the inline start (incoming); \"end\" to the inline end (outgoing). RTL-aware via logical margins.",
        tone: "Fill: \"paper\" (card stock with ink text and an ink outline), \"ink\", or \"accent\" (vermilion); ink and accent use cream text and no ink edge.",
        tail: "Shows the tail below the bubble: its sides leave the bottom edge 37 and 57px in from the aligned side and meet at a tip 40px in (the outer side leans slightly inward, never back under the corner), 12.5px below the bubble with its outline, which adds 13px bottom margin and a minimum width of 90px, so even a one-word message keeps the tail on the straight run of the bottom edge, clear of both rounded corners. False removes all three.",
        speaker: "Optional speaker name above the message, 11px mono. Omit (null/undefined) to hide.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fits the content up to 100% of the container (at least 90px with a tail); height is 16px top and bottom (13px padding inside the 3px edge) plus message lines at 18px × 1.5, an optional speaker line (11px + 6px gap), and 13px of margin for the tail when shown.",
  },
  examples: [
    {
      title: "A short exchange",
      code: 'import { ChatBubble } from "@/jbm/ui/chat-bubble"\n\n<ChatBubble speaker="Tú" tone="ink">¿Y si lo hacemos más sencillo?</ChatBubble>\n<ChatBubble speaker="La idea" side="end" tone="accent">\n  Una pieza a la vez.\n</ChatBubble>',
    },
  ],
  qa: [
    "Compare paper, ink, and accent tones on cream: text stays legible, the tail matches the bubble fill, and the paper bubble's ink edge runs around body and tail as one line.",
    "Enlarge the paper bubble's tail at 8×: both sides curve out of the bottom edge without a step, gap, stub, or doubled edge, and no ink hairline crosses the opening.",
    "Check start and end alignment: the tail leaves the bottom edge clear of the rounded corner, mirrored on the end side, and points toward that side. Repeat with a one-word message (\"Sí\") on both sides: the tail still sits on the straight bottom edge, never off a corner.",
    "Turn off the tail and confirm the 13px gap below disappears.",
    "Check a long unbroken message on a narrow screen wraps inside the bubble instead of overflowing.",
  ],
  docs: [
    { title: "Visual primitives guide", url: "https://jbm-ui.bns.studio/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
