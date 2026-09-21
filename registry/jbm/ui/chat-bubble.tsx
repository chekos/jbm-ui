import * as React from "react"
import { color, font, radius } from "../lib/tokens"

export type ChatBubbleProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "start" | "end"
  tone?: "paper" | "ink" | "accent"
  tail?: boolean
  speaker?: React.ReactNode
}

/** One message, without chat application state or simulated typing. */
export function ChatBubble({
  side = "start",
  tone = "paper",
  tail = true,
  speaker,
  children,
  style,
  ...props
}: ChatBubbleProps) {
  const fill =
    tone === "paper" ? color.card : tone === "ink" ? color.ink : color.accent
  return (
    <div
      {...props}
      style={{
        position: "relative",
        width: "fit-content",
        maxWidth: "100%",
        boxSizing: "border-box",
        marginInlineStart: side === "end" ? "auto" : 0,
        marginInlineEnd: side === "start" ? "auto" : 0,
        marginBottom: tail ? 10 : 0,
        padding: "16px 20px",
        borderRadius: radius.card,
        background: fill,
        color: tone === "paper" ? color.ink : color.bg,
        fontFamily: font.sans,
        fontSize: 18,
        lineHeight: 1.5,
        overflowWrap: "anywhere",
        ...style,
      }}
    >
      {speaker != null && (
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {speaker}
        </div>
      )}
      {children}
      {tail && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -9,
            ...(side === "start"
              ? { insetInlineStart: 22 }
              : { insetInlineEnd: 22 }),
            width: 18,
            height: 12,
            background: fill,
            clipPath:
              side === "start"
                ? "polygon(0 0, 100% 0, 0 100%)"
                : "polygon(0 0, 100% 0, 100% 100%)",
          }}
        />
      )}
    </div>
  )
}
