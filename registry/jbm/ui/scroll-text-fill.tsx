"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { TextFill, type TextFillProps } from "./text-fill"
import { color } from "../lib/tokens"

function subscribe(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", listener)
  return () => media.removeEventListener("change", listener)
}
const getReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
const serverReducedMotion = () => true

export type ScrollTextFillProps = Omit<TextFillProps, "progress"> & {
  /** Height of the self-contained, keyboard-scrollable viewport in pixels. */
  height?: number
  /** Extra scroll distance in pixels. */
  distance?: number
  label?: string
}

/** Scroll forward to fill, backward to rewind. Never autoplays. */
export function ScrollTextFill({
  height = 320,
  distance = 640,
  label = "Scroll to fill the text",
  reducedMotion,
  ...props
}: ScrollTextFillProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribe,
    getReducedMotion,
    serverReducedMotion
  )
  const reduced = reducedMotion ?? prefersReducedMotion
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const viewport = Number.isFinite(height) ? Math.max(120, height) : 320
  const travel = Number.isFinite(distance) ? Math.max(1, distance) : 640
  useEffect(() => {
    const element = ref.current
    if (!element || reduced) return
    const update = () =>
      setProgress(
        element.scrollTop /
          Math.max(1, element.scrollHeight - element.clientHeight)
      )
    update()
    element.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      element.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [reduced, travel, viewport, props.text])
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={reduced ? undefined : 0}
      style={{
        width: "100%",
        height: reduced ? "auto" : viewport,
        overflowY: reduced ? "visible" : "auto",
        overscrollBehavior: "contain",
        background: color.bg,
      }}
    >
      <div style={{ minHeight: reduced ? undefined : viewport + travel }}>
        <div
          style={{
            position: reduced ? "relative" : "sticky",
            top: 0,
            minHeight: viewport,
            display: "flex",
            alignItems: "center",
            padding: 24,
          }}
        >
          <p style={{ margin: 0, width: "100%" }}>
            <TextFill {...props} progress={progress} reducedMotion={reduced} />
          </p>
        </div>
      </div>
    </div>
  )
}
