"use client"

import { useLayoutEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { ItemPreview } from "./qa-bench-preview"

// The Remotion Player is client-only and heavy; only motion items load it.
const MotionBench = dynamic(() => import("./qa-bench-motion"), {
  ssr: false,
  loading: () => (
    <div className="bench">
      <p className="loading bench-loading">Loading preview…</p>
    </div>
  ),
})

/**
 * Publishes the bench's distance from the top of the document as `--bench-top`, so CSS can size
 * the stage from the viewport height left under the page header (see `.bench` in globals.css).
 * The CSS fallback covers the server render; this refines it when the header wraps or fonts load.
 */
function useBenchTop() {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const host = ref.current
    if (!host) return
    const measure = () => {
      const top = Math.round(host.getBoundingClientRect().top + window.scrollY)
      host.style.setProperty("--bench-top", `${top}px`)
    }
    measure()
    // The header above the bench reflows with the page width and with font loading, both of
    // which resize the body; the bench's own resizing re-measures the same value.
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])
  return ref
}

/** Client boundary for the /c/<name> QA bench: Player items get frame controls, the rest their demo. */
export function QaBench({
  name,
  title,
  player,
  orientationAware,
}: {
  name: string
  title: string
  player: boolean
  orientationAware: boolean
}) {
  const host = useBenchTop()
  return (
    <div className="bench-host" ref={host}>
      {player ? (
        <MotionBench
          name={name}
          title={title}
          orientationAware={orientationAware}
        />
      ) : (
        <div className="bench">
          <div className="bench-preview">
            <ItemPreview name={name} />
          </div>
        </div>
      )}
    </div>
  )
}
