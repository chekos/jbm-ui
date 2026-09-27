"use client"

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

/**
 * A fixed-size stage in px, scaled to its container. The frame is sized by CSS (full width up to
 * `maxScale` × w, at the stage's aspect ratio), so the server-rendered page already reserves its
 * height and nothing below it moves on hydration or resize; only the inner transform follows the
 * measured width.
 *
 * On a /c/<name> bench the outer box can also be capped in height (`.bench-fit` in globals.css):
 * it becomes a size container, and the frame narrows to `--stage-frame-w` so the whole stage fits
 * the height left beside the controls, at the same aspect ratio.
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
      data-stage=""
      style={
        {
          width: "100%",
          minWidth: 0,
          "--stage-ratio-n": w / h,
          "--stage-max-w": `${w * maxScale}px`,
        } as CSSProperties
      }
    >
      <div
        ref={ref}
        data-stage-frame=""
        style={{
          width: "var(--stage-frame-w, 100%)",
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
    </div>
  )
}
