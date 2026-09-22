import { Hand, type HandPose } from "../ui/hand"
import { type Pt } from "../lib/geometry"
export { pointOn, pathTilt } from "../lib/geometry"
export type ManoProps = {
  at: Pt
  pose?: HandPose
  size?: number
  angle?: number
}
/** Placement wrapper; Hand owns the artwork and pose, callers own movement. */
export function Mano({ at, pose = "point", size = 180, angle = 0 }: ManoProps) {
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`}>
      <Hand
        pose={pose}
        width={size}
        height={(size * 44) / 30}
        style={{ height: (size * 44) / 30 }}
      />
    </g>
  )
}
