import { ChatBubble, type ChatBubbleProps } from "../ui/chat-bubble"
import { TextFill } from "../ui/text-fill"
import { color } from "../lib/tokens"

export type BurbujaProps = Omit<ChatBubbleProps, "children"> & {
  words: readonly string[]
  highlight: readonly number[]
  progress?: number
}

/** ChatBubble with selected words colored by the existing TextFill primitive. */
export function Burbuja({
  words,
  highlight,
  progress = 1,
  ...props
}: BurbujaProps) {
  return (
    <ChatBubble {...props}>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 ? " " : null}
          {highlight.includes(i) ? (
            <TextFill
              text={word}
              progress={progress}
              dimColor="currentColor"
              accentColor={color.accent}
              textColor={color.accent}
              style={{
                fontSize: "inherit",
                fontWeight: "inherit",
                lineHeight: "inherit",
              }}
            />
          ) : (
            word
          )}
        </span>
      ))}
    </ChatBubble>
  )
}
