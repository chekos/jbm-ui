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
// grip, type, and hold (issue #136) trace the owner-approved generated references (Paper, page
// "hands") in the open palm's construction: same transform, 2.57 outline, wrist cut, and 6.4-wide
// fingers with round tips. grip is a front-view fist: knuckle bumps on top, the curled fingertips
// in a row below, the thumb lying across under them, pointing in. type is the hand from above on a
// keyboard: the four fingers are concentric curved bands around one centre, so neighbours share a
// side exactly; each rises straight from the palm and arcs up-left, the index curling furthest and
// the middle tallest, and the thumb lies low, pointing left toward the space bar. hold is the
// side-view mug grip turned so the wrist sits at the bottom: four stacked fingers with their curled
// tips on the palm and the thumb opening from the index in a V.
// Their ink is one path: the closed outline, with every interior line (dividers, fingertip row,
// thumb fold) walked out and back from an outline point as a retraced spur. A spur adds no fill,
// and one stroke never doubles its antialiased edge where lines meet, so joins show no steps.
// Every join is tangent-continuous; each cusp between fingertips, the web of hold's thumb, and
// grip's palm edge between index and thumb round off in a fillet.
// In every pose, including point and pinch, dividers start on the outline's valley points and use
// the outline's stroke width, and the palm side meets the wrist cut in one tangent fillet.
const poses = {
  open: [
    {
      d: "M54 23 A3.2 3.2 0 0 0 47.6 23 V18 A3.2 3.2 0 0 0 41.2 18 V20 A3.2 3.2 0 0 0 34.8 20 V25 A3.2 3.2 0 0 0 28.4 25 C28.4 29.2 29.5 39.5 30 43 L25.1 39.7 C24.2 39.1 23.3 38.8 22.3 38.8 C20.5 38.8 19.2 40 19.2 41.7 C19.2 42.7 19.7 43.6 20.5 44.5 L33.53 58.27 C34.88 59.7 35.86 61.45 36.39 63.34 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 C55.5 39 54 28 54 23 Z",
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
      d: "M54 32.6 C54 28.4 47.6 28.4 47.6 32.6 L47.6 38.3 A3.2 3.2 0 0 1 46.469 40.741 A3.2 3.2 0 0 1 42.331 40.741 A1.75 1.75 0 0 0 40.069 40.741 A3.2 3.2 0 0 1 35.931 40.741 A1.75 1.75 0 0 0 33.669 40.741 A3.2 3.2 0 0 1 29.45 40.67 A3.2 3.2 0 0 0 33.669 40.741 A3.2 3.2 0 0 0 34.8 38.3 L34.8 31 L34.8 38.3 A3.2 3.2 0 0 0 35.931 40.741 A3.2 3.2 0 0 1 34.8 38.3 A3.2 3.2 0 0 1 33.669 40.741 A1.75 1.75 0 0 1 35.931 40.741 A3.2 3.2 0 0 0 40.069 40.741 A3.2 3.2 0 0 0 41.2 38.3 L41.2 30.2 L41.2 38.3 A3.2 3.2 0 0 0 42.331 40.741 A3.2 3.2 0 0 1 41.2 38.3 A3.2 3.2 0 0 1 40.069 40.741 A1.75 1.75 0 0 1 42.331 40.741 A3.2 3.2 0 0 0 46.469 40.741 A1.75 1.75 0 0 1 48.731 40.741 A3.2 3.2 0 0 1 47.6 38.3 A3.2 3.2 0 0 0 48.731 40.741 A3.2 3.2 0 0 0 53.825 39.345 A3.2 3.2 0 0 1 48.731 40.741 A1.75 1.75 0 0 0 46.469 40.741 A3.2 3.2 0 0 0 47.6 38.3 L47.6 32.6 L47.6 30.2 C47.6 26 41.2 26 41.2 30.2 L41.2 28.8 C41.2 24.6 34.8 24.6 34.8 28.8 L34.8 31 C34.8 26.8 28.4 26.8 28.4 31 L28.4 38.3 A3.2 3.2 0 0 0 29.45 40.67 A3.24 3.24 0 0 1 28.846 45.902 A3.2 3.2 0 0 1 30.4 45.5 L38.4 45.5 A3.2 3.2 0 0 1 41.6 48.7 A3.2 3.2 0 0 1 38.4 51.9 L34.2 51.9 L38.4 51.9 A3.2 3.2 0 0 0 41.6 48.7 A3.2 3.2 0 0 0 38.4 45.5 L30.4 45.5 A3.2 3.2 0 0 0 28.846 45.902 A3.2 3.2 0 0 0 27.2 48.7 C27.2 52.4 30.5 55.4 32.9 57.6 C34.669 59.222 35.748 61.028 36.39 63.34 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 A3.58 3.58 0 0 0 54.545 42.766 A3.4 3.4 0 0 1 53.825 39.345 A3.2 3.2 0 0 0 54 38.3 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  type: [
    {
      d: "M55.5 45.2 C55.5 39.2 53.597 37.453 53.248 32.465 L53.179 31.465 A31.4 31.4 0 0 0 52.569 27.127 A3.2 3.2 0 0 0 47.62 25.159 A1.7 1.7 0 0 1 45.075 24.39 A1.7 1.7 0 0 0 47.62 25.159 A3.2 3.2 0 0 0 46.309 28.457 A25 25 0 0 1 46.794 31.911 L47.178 37.398 L46.794 31.911 A25 25 0 0 0 46.309 28.457 A25 25 0 0 0 45.075 24.39 A25 25 0 0 0 44.868 23.887 A3.2 3.2 0 0 0 39.579 22.958 A1.7 1.7 0 0 1 36.954 22.793 A1.7 1.7 0 0 0 39.579 22.958 A3.2 3.2 0 0 0 38.976 26.387 A18.6 18.6 0 0 1 40.41 32.358 L40.793 37.844 L40.41 32.358 A18.6 18.6 0 0 0 38.976 26.387 A18.6 18.6 0 0 0 36.954 22.793 A18.6 18.6 0 0 0 34.776 20.275 A3.2 3.2 0 0 0 29.483 21.675 A1.7 1.7 0 0 1 27.332 22.814 A1.7 1.7 0 0 0 29.483 21.675 A3.2 3.2 0 0 0 30.33 24.879 A12.2 12.2 0 0 1 34.025 32.804 L34.409 38.291 L34.025 32.804 A12.2 12.2 0 0 0 30.33 24.879 A12.2 12.2 0 0 0 27.955 23.089 A3.2 3.2 0 0 0 27.332 22.814 A3.2 3.2 0 0 0 23.429 24.565 A3.2 3.2 0 0 0 24.755 28.632 A5.8 5.8 0 0 1 27.641 33.25 L28.372 43.7 L24 41.93 A3.203 3.203 0 0 0 19.83 43.7 A3.203 3.203 0 0 0 21.6 47.87 C24.38 48.99 29.4 53.6 32.9 57.6 C34.744 59.707 35.641 60.642 36.39 63.34 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  hold: [
    {
      d: "M54.33 35.07 A3.2 3.2 0 0 1 54.441 35.957 A3.2 3.2 0 0 1 51.641 39.083 A3.2 3.2 0 0 1 48.154 36.747 L45.793 28.052 L48.154 36.747 L48.371 37.548 A3.2 3.2 0 0 1 46.121 41.475 A3.2 3.2 0 0 1 42.195 39.225 L39.792 30.375 L42.195 39.225 L42.284 39.553 A3.2 3.2 0 0 1 40.034 43.48 A3.2 3.2 0 0 1 36.107 41.23 L35.843 40.255 L34.533 35.43 L35.843 40.255 A3.2 3.2 0 0 1 31.173 43.875 A3.2 3.2 0 0 0 35.843 40.255 L36.107 41.23 A3.2 3.2 0 0 0 40.034 43.48 A3.2 3.2 0 0 0 42.284 39.553 L42.195 39.225 A3.2 3.2 0 0 0 46.121 41.475 A3.2 3.2 0 0 0 48.371 37.548 L48.154 36.747 A3.2 3.2 0 0 0 51.641 39.083 A3.2 3.2 0 0 0 54.441 35.957 A7 7 0 0 1 54.896 33.578 A7 7 0 0 0 54.441 35.957 A3.2 3.2 0 0 0 54.33 35.07 L51.969 26.375 A3.2 3.2 0 0 0 48.043 24.125 A3.2 3.2 0 0 0 45.793 28.052 A3.2 3.2 0 0 0 41.866 25.802 A3.2 3.2 0 0 0 39.616 29.729 L39.792 30.375 A3.2 3.2 0 0 0 35.865 28.126 A3.2 3.2 0 0 0 33.616 32.052 L34.533 35.43 A3.2 3.2 0 0 0 30.606 33.18 A3.2 3.2 0 0 0 28.356 37.107 L29.666 41.932 A3.2 3.2 0 0 0 31.173 43.875 C30.04 47.01 35.67 55.86 36.8 64.8 L54.1 60.1 C54.1 56.25 61.29 46.99 61.58 44.5 L63.46 28.79 A3.204 3.204 0 0 0 61.047 25.289 A3.204 3.204 0 0 0 57.29 27.27 L54.896 33.578 Z",
      fill: "#FFFFFF",
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
 * (a mask or clip) instead of painting a halo over whatever else is under it. For grip, type, and
 * hold the path also retraces the interior lines as spurs inside the outline; they add no area.
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
