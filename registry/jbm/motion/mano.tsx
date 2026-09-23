import { Hand, type HandPose } from "../ui/hand"
import { type Pt } from "../lib/geometry"
export { pointOn, pathTilt } from "../lib/geometry"
export type ManoProps = {
  at: Pt
  pose?: HandPose
  size?: number
  angle?: number
  /** Local point in the Hand's 30×29 viewBox held at `at`, including during rotation. */
  anchor?: Pt
}
/** Placement wrapper; Hand owns the artwork and pose, callers own movement. */
export function Mano({
  at,
  pose = "point",
  size = 180,
  angle = 0,
  anchor,
}: ManoProps) {
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`}>
      <g
        transform={
          anchor
            ? `translate(${(-anchor.x * size) / 30} ${(-anchor.y * size) / 30})`
            : undefined
        }
      >
        <Hand
          pose={pose}
          width={size}
          height={(size * (anchor ? 29 : 44)) / 30}
          style={{ height: (size * (anchor ? 29 : 44)) / 30 }}
        />
      </g>
    </g>
  )
}
