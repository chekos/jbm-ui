"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import { color, font } from "../lib/tokens"

export type FlipTextProps = {
  children: string
  /** Duration of each character flip, in milliseconds. */
  duration?: number
  accentColor?: string
  reducedMotion?: boolean
  className?: string
  style?: CSSProperties
}

/** Hover a character to flip it; click, tap, Enter, or Space flips the whole text. */
export function FlipText({
  children,
  duration = 450,
  accentColor = color.accent,
  reducedMotion,
  className,
  style,
}: FlipTextProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const animations = useRef(new Set<Animation>())
  useEffect(() => {
    const active = animations.current
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const stop = () => {
      for (const animation of active) animation.cancel()
      active.clear()
    }
    const update = () => {
      if (reducedMotion ?? media.matches) stop()
    }
    update()
    media.addEventListener("change", update)
    return () => {
      media.removeEventListener("change", update)
      stop()
    }
  }, [children, reducedMotion])

  function flip(element: HTMLElement, delay = 0) {
    if (
      reducedMotion ??
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    for (const animation of element.getAnimations()) animation.cancel()
    const animation = element.animate(
      [
        {
          transform: "perspective(400px) translateY(0) rotateX(0deg)",
          color: "inherit",
        },
        {
          transform: "perspective(400px) translateY(-0.15em) rotateX(180deg)",
          color: accentColor,
          offset: 0.5,
        },
        {
          transform: "perspective(400px) translateY(0) rotateX(360deg)",
          color: "inherit",
        },
      ],
      {
        duration: Number.isFinite(duration) ? Math.max(0, duration) : 450,
        delay,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    )
    animations.current.add(animation)
    const remove = () => animations.current.delete(animation)
    animation.onfinish = remove
    animation.oncancel = remove
  }

  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
  return (
    <button
      ref={ref}
      type="button"
      aria-label={`Flip text: ${children}`}
      className={className}
      onClick={() =>
        ref.current
          ?.querySelectorAll<HTMLElement>("[data-flip-character]")
          .forEach((element, index) => flip(element, index * 25))
      }
      style={{
        display: "inline-block",
        maxWidth: "100%",
        font: "inherit",
        fontFamily: font.sans,
        fontWeight: 800,
        lineHeight: 1.3,
        color: color.ink,
        background: "transparent",
        border: 0,
        padding: "0.2em 0",
        cursor: "pointer",
        textAlign: "inherit",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        ...style,
      }}
    >
      <span aria-hidden="true">
        {children.split(/(\s+)/u).map((word, wordIndex) =>
          /^\s*$/u.test(word) ? (
            word
          ) : (
            <span
              key={wordIndex}
              style={{ display: "inline-block", maxWidth: "100%" }}
            >
              {[...segmenter.segment(word)].map(({ segment }, index) => (
                <span
                  key={index}
                  data-flip-character=""
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") flip(event.currentTarget)
                  }}
                  style={{ display: "inline-block" }}
                >
                  {segment}
                </span>
              ))}
            </span>
          )
        )}
      </span>
    </button>
  )
}
