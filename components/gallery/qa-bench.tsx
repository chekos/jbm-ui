"use client"

import dynamic from "next/dynamic"
import { ItemPreview } from "./qa-bench-preview"

// The Remotion Player is client-only and heavy; only motion items load it.
const MotionBench = dynamic(() => import("./qa-bench-motion"), {
  ssr: false,
  loading: () => <p className="loading bench-loading">Loading preview…</p>,
})

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
  if (player)
    return (
      <MotionBench
        name={name}
        title={title}
        orientationAware={orientationAware}
      />
    )
  return (
    <div className="bench">
      <div className="bench-preview">
        <ItemPreview name={name} />
      </div>
    </div>
  )
}
