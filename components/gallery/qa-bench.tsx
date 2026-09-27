"use client"

import { useLayoutEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { ItemPreview } from "./qa-bench-preview"
import { BenchParams } from "./bench-url"
import { urlStateNames } from "./demo-data"
import { BenchHostScript, BenchSkeleton } from "./qa-bench-chrome"

// The Remotion Player is client-only and heavy; only motion items load it. QaBench draws the
// placeholder itself (BenchSkeleton), since next/dynamic's loading slot cannot see the bench's props.
const MotionBench = dynamic(() => import("./qa-bench-motion"), {
  ssr: false,
  loading: () => null,
})

/**
 * Keeps `--bench-top` (the bench's distance from the top of the document, first set by
 * BenchHostScript before paint) current when the header wraps or fonts load, so CSS can size the
 * stage from the viewport height left under the page header (see `.bench` in globals.css).
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
  // The placeholder holds the bench's size until MotionBench mounts, then leaves in the same frame.
  const [loaded, setLoaded] = useState(false)
  return (
    // BenchHostScript sets --bench-top on this element before hydration.
    <div className="bench-host" ref={host} suppressHydrationWarning>
      {player ? (
        <>
          <MotionBench
            key={name}
            name={name}
            title={title}
            orientationAware={orientationAware}
            onMount={() => setLoaded(true)}
          />
          {!loaded && (
            <>
              <BenchSkeleton
                name={name}
                title={title}
                orientationAware={orientationAware}
              />
              {/* The skeleton is hidden from assistive technology; this line is not. */}
              <p className="sr-only">Loading preview…</p>
            </>
          )}
        </>
      ) : urlStateNames.includes(name) ? (
        // Controlled illustrations: Copy link above the preview, control values in the URL.
        <div className="bench" data-layout="controls">
          <BenchParams>
            <div className="bench-preview">
              <ItemPreview name={name} />
            </div>
          </BenchParams>
        </div>
      ) : (
        <div className="bench">
          <div className="bench-preview">
            <ItemPreview name={name} />
          </div>
        </div>
      )}
      <BenchHostScript />
    </div>
  )
}
