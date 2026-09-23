import type { SVGProps } from "react"
import { color } from "../lib/tokens"

/** Independent wire clip. Place across a paper edge; it does not own the paper. */
export function PaperClip(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={26} height={48} viewBox="0 0 34 62" aria-hidden {...props}>
      <path
        d="M8 58V12a9 9 0 0 1 18 0V48a5 5 0 0 1-10 0V16"
        fill="none"
        stroke={color.ink}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  )
}
