import type { CSSProperties } from "react"
import { color, font } from "../lib/tokens"
import { unit } from "../lib/geometry"

export type PaperLineProps = {
  text: string
  reveal?: number
  lift?: number
  strike?: number
  dotted?: boolean
  accent?: boolean
  mono?: boolean
  style?: CSSProperties
}
/** All progress values are controlled 0–1. The full text remains available to assistive technology. */
export function PaperLine({
  text,
  reveal = 1,
  lift = 0,
  strike = 0,
  dotted = false,
  accent = false,
  mono = false,
  style,
}: PaperLineProps) {
  const p = unit(lift)
  const glyphs = Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    (s) => s.segment
  )
  return (
    <span
      style={{
        display: "inline-block",
        maxWidth: "100%",
        fontFamily: mono ? font.mono : font.sans,
        color: accent ? color.accent : color.ink,
        lineHeight: 1.4,
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clipPath: "inset(50%)",
        }}
      >
        {text}
      </span>
      <span
        aria-hidden
        style={{
          position: "relative",
          display: "inline-block",
          maxWidth: "100%",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          transform: `translate(${p * 60}px, ${-p * 40}px) rotate(${-p * 9}deg)`,
          opacity: 1 - p * p,
          borderBottom: dotted ? `2px dotted ${color.dim}` : undefined,
        }}
      >
        {glyphs.map((g, i) => (
          <span
            key={i}
            style={{
              visibility:
                i < Math.ceil(unit(reveal) * glyphs.length)
                  ? "visible"
                  : "hidden",
            }}
          >
            {g}
          </span>
        ))}
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: `${unit(strike) * 100}%`,
            height: 2,
            background: color.accent,
          }}
        />
      </span>
    </span>
  )
}
