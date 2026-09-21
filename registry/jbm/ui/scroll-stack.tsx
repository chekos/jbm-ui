"use client"

import {
  Children,
  Fragment,
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react"
import { font } from "../lib/tokens"

export type ScrollStackProps = {
  /** Each direct child is one stack item. Its content and styling stay yours. */
  children: ReactNode
  /** Omit to use page scrolling; set pixels for a self-contained viewport. */
  height?: number
  /** Space between successive items, in pixels. */
  distance?: number
  /** Sticky inset from the viewport top, in pixels. */
  top?: number
  /** Scale of the outgoing item, clamped to 0.5–1. */
  minScale?: number
  /** Show a regular list. Defaults to the system reduced-motion preference. */
  reducedMotion?: boolean
  label?: string
  className?: string
  style?: CSSProperties
}

/** Native scroll and sticky positioning; arbitrary children, no scroll interception. */
export function ScrollStack({
  children,
  height,
  distance = 120,
  top = 24,
  minScale = 0.9,
  reducedMotion,
  label = "Scroll through the stack",
  className,
  style,
}: ScrollStackProps) {
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const tail = useRef<HTMLDivElement>(null)
  const items = Children.toArray(children)
  const contained = height !== undefined
  const viewportHeight =
    height !== undefined && Number.isFinite(height)
      ? Math.max(160, height)
      : 480
  const inset = Number.isFinite(top) ? Math.max(0, top) : 24
  const gap = Number.isFinite(distance) ? Math.max(0, distance) : 120
  const scale = Number.isFinite(minScale)
    ? Math.min(1, Math.max(0.5, minScale))
    : 0.9

  useEffect(() => {
    const container = root.current
    const content = list.current
    if (!container || !content) return
    // Direct children only: a nested ScrollStack owns its own elements.
    const rows = Array.from(content.children).filter(
      (element): element is HTMLDivElement =>
        element instanceof HTMLDivElement &&
        element.dataset.stackItem !== undefined
    )
    const anchors = rows.map((row) => row.previousElementSibling as HTMLElement)
    const surfaces = rows.map((row) => row.firstElementChild as HTMLElement)
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const scroller = contained ? container : window
    let frame = 0
    let animated = false
    let viewport = 0

    function update() {
      frame = 0
      if (!animated) return
      const origin = contained
        ? container!.getBoundingClientRect().top + container!.clientTop
        : 0
      const pin = origin + inset
      const positions = anchors.map(
        (anchor) => anchor.getBoundingClientRect().top
      )
      const progress = (position: number, previous: number) => {
        const remaining = position - pin
        const range = Math.max(
          1,
          Math.min(viewport, rows[previous].offsetHeight + gap)
        )
        return remaining <= 1
          ? 1
          : Math.min(1, Math.max(0, 1 - remaining / range))
      }
      surfaces.forEach((surface, index) => {
        const incoming = index === 0 ? 1 : progress(positions[index], index - 1)
        const outgoing =
          index === rows.length - 1 ? 0 : progress(positions[index + 1], index)
        const fade = Math.min(1, Math.max(0, (outgoing - 0.65) / 0.35))
        surface.style.transform = `scale(${1 + (1 - incoming) * 0.06 - outgoing * (1 - scale)})`
        surface.style.opacity = String(1 - fade)
        surface.style.pointerEvents = fade >= 1 ? "none" : "auto"
      })
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    function measure() {
      viewport = contained ? container!.clientHeight : window.innerHeight
      animated =
        !(reducedMotion ?? media.matches) &&
        rows.length > 1 &&
        rows.every((row) => row.offsetHeight <= viewport - inset * 2)
      container!.dataset.stackMode = animated ? "stack" : "list"
      content!.style.paddingTop = `${inset}px`
      // Sticky constraints exclude parent padding: keep the final resting space inside the content box.
      if (tail.current)
        tail.current.style.height = `${animated ? Math.max(0, viewport - (rows.at(-1)?.offsetHeight ?? 0) - inset * 2) : 0}px`
      rows.forEach((row, index) => {
        row.style.position = animated ? "sticky" : "relative"
        row.style.top = animated ? `${inset}px` : "auto"
        row.style.marginBottom =
          index < rows.length - 1 ? `${animated ? gap : 24}px` : "0"
        surfaces[index].style.transform = "none"
        surfaces[index].style.opacity = "1"
        surfaces[index].style.pointerEvents = "auto"
      })
      schedule()
    }
    function reveal(event: FocusEvent) {
      if (!animated) return
      const index = rows.findIndex((row) => row.contains(event.target as Node))
      if (index < 0) return
      const origin = contained
        ? container!.getBoundingClientRect().top + container!.clientTop
        : 0
      const delta = anchors[index].getBoundingClientRect().top - origin - inset
      // Keyboard focus can reach a previously covered item. Reveal its original position.
      if (Math.abs(delta) > 1)
        scroller.scrollBy({ top: delta, behavior: "instant" })
      update()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    rows.forEach((row) => observer.observe(row))
    scroller.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", measure)
    media.addEventListener("change", measure)
    container.addEventListener("focusin", reveal)
    measure()
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      scroller.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", measure)
      media.removeEventListener("change", measure)
      container.removeEventListener("focusin", reveal)
    }
  }, [children, contained, viewportHeight, inset, gap, scale, reducedMotion])

  return (
    <div
      ref={root}
      role="region"
      aria-label={label}
      tabIndex={contained && items.length ? 0 : undefined}
      className={className}
      style={{
        width: "100%",
        fontFamily: font.sans,
        ...style,
        height: contained ? viewportHeight : undefined,
        overflowY: contained ? "auto" : undefined,
        overscrollBehaviorY: contained ? "contain" : undefined,
      }}
    >
      <div
        ref={list}
        role="list"
        style={{
          position: "relative",
          padding: `${inset}px 24px`,
          isolation: "isolate",
        }}
      >
        {items.map((child, index) => (
          <Fragment
            key={
              typeof child === "object" && "key" in child ? child.key : index
            }
          >
            <div aria-hidden="true" />
            <div
              role="listitem"
              data-stack-item=""
              style={{
                position: "relative",
                zIndex: index + 1,
                marginBottom: index < items.length - 1 ? 24 : 0,
              }}
            >
              <div
                style={{ transformOrigin: "center top", display: "flow-root" }}
              >
                {child}
              </div>
            </div>
          </Fragment>
        ))}
        <div ref={tail} aria-hidden="true" />
      </div>
    </div>
  )
}
