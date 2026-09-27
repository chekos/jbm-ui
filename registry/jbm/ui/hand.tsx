import type { SVGProps } from "react"
import { color } from "../lib/tokens"
/** Every pose, in gallery order. `pinch` doubles as the pen grip (Pluma); there is no pen pose. */
export const handPoses = ["open", "point", "pinch", "grip", "type", "hold"] as const
export type HandPose = (typeof handPoses)[number]
export type HandProps = SVGProps<SVGSVGElement> & {
  pose?: HandPose
  /**
   * Knock the hand out of whatever it overlaps: a card ring, half the outline wide, just
   * outside the contour. Use it when ink art (a pen barrel, a thread) passes behind the hand, so
   * the two outlines stay separable instead of fusing into one dark mass. The ring paints over
   * everything under the hand, writing included; to cut only the art behind the hand, mask that
   * art with handOutline instead (as Pluma does).
   */
  halo?: boolean
}
// Based on the issue #50 cursor reference; open-palm joins share coordinates and stroke widths.
// grip, type, and hold (issues #136, #164) trace the owner-requested generated references (Paper,
// page "hands") in the open palm's construction: one closed outline plus open dividers, the same
// transform, 2.57 outline, wrist cut, 6.4-wide fingers, and circular fingertip arcs (A commands,
// radius 3.2) that meet a taller neighbour's side at a valley point, as in the open palm. No finger
// is a closed capsule laid over another. grip is a front-view fist: knuckle bumps on top, a row of
// curled fingertips drawn as one scalloped line whose arcs meet each divider (and the outline) at
// 50°, never tangentially, and the thumb lying across under them, its top edge leaving the
// outline square. type is the hand from above on a keyboard: the four fingers are concentric bands
// around one centre, so neighbours share a side exactly; each rises from the palm and arches over
// to the left, the index and middle tips pointing left and down onto the keys, the middle
// tallest, and the thumb low, pointing left toward the space bar. hold is the side-view mug grip
// turned so the wrist sits at the bottom: four stacked fingers with the same scalloped fingertip
// row, and the thumb opening from the index in a V whose bottom is a round web, not a cusp.
// In every pose, including point and pinch, dividers start on the outline's valley points and use
// the outline's stroke width.
const poses = {
  open: [
    {
      d: "M54 23 C54 18.8 47.6 18.8 47.6 23 V18 C47.6 13.8 41.2 13.8 41.2 18 V20 C41.2 15.8 34.8 15.8 34.8 20 V25 C34.8 20.8 28.4 20.8 28.4 25 C28.4 29.2 29.5 39.5 30 43 L25.1 39.7 C24.2 39.1 23.3 38.8 22.3 38.8 C20.5 38.8 19.2 40 19.2 41.7 C19.2 42.7 19.7 43.6 20.5 44.5 L32.9 57.6 C33.6 58.4 34.5 59 35.3 59.4 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 C55.5 39 54 28 54 23 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M34.8 25 V37",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M41.2 20 V36",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M47.6 23 V36",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  point: [
    {
      d: "m49.4 41.21c-0.06-1.26-0.98-2.35-2.04-2.35-0.37 0-0.73 0.24-0.73 0.24l-0.01-0.85c-0.03-1.15-0.96-1.95-2.05-1.92-0.98 0.03-1.65 0.84-1.6 1.51l-0.01-0.63c-0.06-1.15-1.03-1.96-2.09-1.91-1.16 0.04-1.87 0.97-1.85 1.99l-0.79-6.58c-0.12-1.16-1.14-1.86-2.24-1.78-1.23 0.14-1.96 1.21-1.86 2.27l1.62 11.14-1.94-1.38c-0.99-0.6-2.29-0.21-3 0.96-0.37 0.83-0.09 1.85 0.58 2.48l5.27 5.23c0.77 0.76 1.24 1.72 1.57 2.68 0.1 0.29 0.38 0.44 0.68 0.39l8.25-1.51c0.35-0.06 0.51-0.35 0.43-0.71-0.12-0.79-0.14-1.71 0.24-2.3 1.29-2.09 1.69-4.54 1.57-6.97z",
      fill: "#FFFFFF",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M39.02 37.29 L39.3 39.64",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M42.97 37.84 L43.01 40.17",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M46.63 39.1 L46.66 41.26",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  pinch: [
    {
      d: "m76.37 41.83c-0.07-1.15-0.91-1.96-1.85-1.94-0.19 0.01-0.38 0.12-0.42 0.17l-0.03-0.81c-0.02-1.42-1.21-2.44-2.45-2.4-0.75 0.04-1.24 0.63-1.2 1.16l-0.13-0.75c-0.22-1.36-1.57-2.28-2.75-2.17-1.08 0.13-1.56 1.03-1.39 1.85l-1.11-3.05c-0.7-1.87-1.74-2.64-3.37-2.34-1.43 0.34-2.89 0.9-3.97 1.36-0.87 0.38-1.17 1.33-0.86 2.22 0.28 0.78 1.14 1.25 2 1.19c1.5-0.1 2.61 0.62 3.05 1.63 0.73 1.65 1.15 3.39 1.14 4.89 0 0.73-0.53 1.14-1.23 0.99-1.33-0.41-2.71-1.45-4.15-2.03-0.95-0.31-2.1 0.23-2.62 1.28-0.3 0.9 0.13 1.94 0.94 2.45 2.6 1.91 5.26 3.76 7.65 5.22 0.73 0.5 1.16 1.21 1.39 2.06 0.07 0.27 0.32 0.38 0.59 0.33l8.38-1.53c0.41-0.08 0.58-0.35 0.53-0.75-0.1-0.72-0.14-1.56 0.21-2.09 1.28-2.11 1.76-4.65 1.65-6.94z",
      fill: "#FFFFFF",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M66.15 36.94 L67.11 39.57",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M70.42 38.01 L70.82 40.32",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M74.1 40.06 L74.15 41.47",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  grip: [
    {
      d: "M54 32.6 A3.2 3.2 0 0 0 47.6 32.6 L47.6 30.2 A3.2 3.2 0 0 0 41.2 30.2 L41.2 28.8 A3.2 3.2 0 0 0 34.8 28.8 L34.8 31 A3.2 3.2 0 0 0 28.4 31 L28.4 39.2 C28.4 42.4 27.6 42.9 27.6 45.5 C27.6 51.1 30.5 55.4 32.9 57.6 C33.6 58.4 34.5 59 35.3 59.4 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 C55.5 42.4 54 42.2 54 39.2 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M34.8 31 L34.8 39.2",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M41.2 30.2 L41.2 39.2",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M47.6 32.6 L47.6 39.2",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M28.4 39.2 C30.97 42.27 32.23 42.27 34.8 39.2 C37.37 42.27 38.63 42.27 41.2 39.2 C43.77 42.27 45.03 42.27 47.6 39.2 C50.17 42.27 51.43 42.27 54 39.2",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M27.6 45.5 L38.4 45.5 A3.2 3.2 0 0 1 38.4 51.9 L34.2 51.9",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  type: [
    {
      d: "M55.5 45.2 C55.5 41.3 54 38.3 54 34.3 A32.1 32.1 0 0 0 52.06 23.32 A3.2 3.2 0 0 0 46.05 25.51 A25.7 25.7 0 0 0 40.07 16.13 A3.2 3.2 0 0 0 35.55 20.65 A19.3 19.3 0 0 0 23.58 15.07 A3.2 3.2 0 0 0 23.02 21.45 A12.9 12.9 0 0 0 17.49 22.18 A3.2 3.2 0 0 0 19.68 28.19 A6.5 6.5 0 0 1 28.4 34.3 L28.4 43.7 L24 41.93 A3.2 3.2 0 0 0 21.6 47.87 C24.38 48.99 29.4 53.6 32.9 57.6 C33.6 58.4 34.5 59 35.3 59.4 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M23.02 21.45 A12.9 12.9 0 0 1 34.8 34.3 L34.8 38",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M35.55 20.65 A19.3 19.3 0 0 1 41.2 34.3 L41.2 37.5",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M46.05 25.51 A25.7 25.7 0 0 1 47.6 34.3 L47.6 37",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  hold: [
    {
      d: "M52.1 26.77 A3.2 3.2 0 0 0 45.92 28.42 L45.66 27.46 A3.2 3.2 0 0 0 39.48 29.11 L39.82 30.37 A3.2 3.2 0 0 0 33.63 32.03 L34.44 35.02 A3.2 3.2 0 0 0 28.25 36.68 L29.6 41.7 C30.64 45.56 33.96 54.58 35.3 59.4 L36.8 64.8 L54.1 60.1 C55.2 57 59.24 51.16 61.4 44.5 C63.25 38.79 66.05 32.78 67.29 28.98 A3.2 3.2 0 0 0 61.2 27 L58.55 35.18 A2.2 2.2 0 0 1 54.33 35.07 L52.1 26.77 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M34.44 35.02 L35.78 40.04",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M39.82 30.37 L41.96 38.39",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M45.92 28.42 L48.15 36.73",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M29.6 41.7 C32.88 43.99 34.09 43.67 35.78 40.04 C39.06 42.34 40.27 42.02 41.96 38.39 C45.24 40.69 46.46 40.36 48.15 36.73 C51.43 39.02 52.64 38.7 54.33 35.07",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
} as const
const transforms = {
  open: "translate(4 1) scale(0.48) translate(-19 -13)",
  point: "translate(-26 -27)",
  pinch: "translate(-53 -27)",
  grip: "translate(4 1) scale(0.48) translate(-19 -13)",
  type: "translate(4 1) scale(0.48) translate(-19 -13)",
  hold: "translate(4 1) scale(0.48) translate(-19 -13)",
} as const
/**
 * A pose's closed outline in the Hand's 30×29 viewBox: its path, the transform that places it,
 * and the outline's stroke width in path units. Composites use it to cut art drawn behind the hand
 * (a mask or clip) instead of painting a halo over whatever else is under it.
 */
export function handOutline(pose: HandPose = "point") {
  const outline = poses[pose][0]
  return {
    d: outline.d,
    transform: transforms[pose],
    strokeWidth: Number(outline.strokeWidth),
  }
}
export function Hand({ pose = "point", halo = false, style, ...props }: HandProps) {
  return (
    <svg
      viewBox="0 0 30 29"
      width={180}
      height={174}
      role="img"
      aria-label={`Hand: ${pose}`}
      {...props}
      style={{ display: "block", maxWidth: "100%", height: "auto", ...style }}
    >
      <g transform={transforms[pose]}>
        {halo && (
          <path
            d={poses[pose][0].d}
            fill={color.card}
            stroke={color.card}
            strokeWidth={Number(poses[pose][0].strokeWidth) * 2}
            strokeLinejoin="round"
          />
        )}
        {poses[pose].map((path, i) => (
          <path
            {...path}
            key={i}
            fill={path.fill === "none" ? "none" : color.card}
            stroke={color.ink}
          />
        ))}
      </g>
    </svg>
  )
}
