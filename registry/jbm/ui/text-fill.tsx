import type { CSSProperties } from "react"
import { color, font } from "../lib/tokens"

export type TextFillProps = {
  text: string
  /** Controlled progress, 0–1. Drive with scroll, a slider, or a video timeline. */
  progress: number
  dimColor?: string
  accentColor?: string
  textColor?: string
  /** Render the complete text without a sweep. */
  reducedMotion?: boolean
  style?: CSSProperties
  className?: string
}

/** A deterministic character sweep. No timers, browser globals, or Remotion. */
export function TextFill({
  text,
  progress,
  dimColor = color.line,
  accentColor = color.accent,
  textColor = color.ink,
  reducedMotion = false,
  style,
  className,
}: TextFillProps) {
  const amount = reducedMotion
    ? 1
    : Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0))
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
  const words = text.split(/(\s+)/u)
  const count = [...segmenter.segment(text.replace(/\s/gu, ""))].length
  let index = 0
  return (
    <span
      className={className}
      style={{
        fontFamily: font.sans,
        fontWeight: 800,
        lineHeight: 1.15,
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
      <span aria-hidden="true">
        {words.map((word, wordIndex) =>
          /^\s*$/u.test(word) ? (
            word
          ) : (
            <span
              key={wordIndex}
              style={{ display: "inline-block", maxWidth: "100%" }}
            >
              {[...segmenter.segment(word)].map(({ segment }, charIndex) => {
                const local = Math.min(
                  1,
                  Math.max(0, amount * (count + 3) - index++)
                )
                // A short accent wave travels ahead of the settled ink.
                const settled = Math.min(
                  1,
                  Math.max(0, (amount * (count + 3) - (index - 1) - 1) / 3)
                )
                const tint =
                  local < 1
                    ? `color-mix(in srgb, ${dimColor}, ${accentColor} ${local * 100}%)`
                    : `color-mix(in srgb, ${accentColor}, ${textColor} ${settled * 100}%)`
                return (
                  <span
                    key={charIndex}
                    style={{ color: amount === 1 ? textColor : tint }}
                  >
                    {segment}
                  </span>
                )
              })}
            </span>
          )
        )}
      </span>
    </span>
  )
}
