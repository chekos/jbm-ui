"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

/**
 * A fixed-size stage in px, scaled to its container. The box is sized by CSS (full width up to
 * `maxScale` × w, at the stage's aspect ratio), so the server-rendered page already reserves its
 * height and nothing below it moves on hydration or resize; only the inner transform follows the
 * measured width.
 */
export function StageFit({
  w,
  h,
  maxScale = 1,
  children,
}: {
  w: number
  h: number
  maxScale?: number
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(maxScale)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / w)
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [w])
  return (
    <div
      ref={ref}
      data-stage=""
      style={{
        width: "100%",
        maxWidth: w * maxScale,
        aspectRatio: `${w} / ${h}`,
        margin: "0 auto",
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  )
}
