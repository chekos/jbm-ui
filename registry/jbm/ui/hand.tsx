import type { SVGProps } from "react"
import { color } from "../lib/tokens"
export type HandPose = "open" | "point" | "pinch"
export type HandProps = SVGProps<SVGSVGElement> & { pose?: HandPose }
// Quiver paths exported from Paper using the issue #50 cursor image as reference.
const poses = {
  open: [
    {
      d: "m56.44 41.51c-1.02-6.68-2.1-15.33-2.52-18.83-0.17-1.85-1.56-3.07-3.2-3.07-1.6 0-2.97 1.36-3 2.94l-0.27-4.31c-0.12-2.14-1.53-3.42-3.22-3.42-1.88 0-3.16 1.59-3.1 3.6l0.07 1.19c-0.3-1.4-1.6-2.22-3.09-2.22-1.86 0-3.12 1.66-3 3.66l0.25 3.97c-0.13-1.79-1.53-2.92-3-2.92-1.82 0.06-3.15 1.57-3.09 3.5 0.26 4.14 1.31 13.55 1.79 17.16 0 0.05-0.04 0.07-0.07 0.04l-4.83-3.32c-0.87-0.56-1.74-0.92-2.73-0.92-1.83 0-3.12 1.21-3.12 2.88 0 0.99 0.45 1.94 1.24 2.76l12.43 13.17c0.68 0.75 1.56 1.36 2.32 1.78 0.16 0.1 0.24 0.24 0.27 0.38l1.42 4.89c0.02 0.07 0.1 0.1 0.17 0.09l17.03-4.59c0.08-0.03 0.14-0.11 0.12-0.2-0.18-1.03-0.62-3.2-0.62-4.11 0-2.17 1.95-5.81 1.95-10.78 0-1.18-0.07-2.32-0.2-3.32z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
    },
    {
      d: "m35.24 24.82 1.28 12.12",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "1.714",
      strokeLinecap: "round",
    },
    {
      d: "m41.21 20.19 1.32 15.85",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "1.714",
      strokeLinecap: "round",
    },
    {
      d: "m47.68 22.26 1.02 13.41",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "1.714",
      strokeLinecap: "round",
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
      d: "m39.38 39.61-0.11-2.37",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m43.08 40.06-0.1-2.33",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m46.49 41.19-0.05-2.16",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.7116",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  pinch: [
    {
      d: "m76.37 41.83c-0.07-1.15-0.91-1.96-1.85-1.94-0.19 0.01-0.38 0.12-0.42 0.17l-0.03-0.81c-0.02-1.42-1.21-2.44-2.45-2.4-0.75 0.04-1.24 0.63-1.2 1.16l-0.13-0.75c-0.22-1.36-1.57-2.28-2.75-2.17-1.08 0.13-1.56 1.03-1.39 1.85l-1.11-3.05c-0.7-1.87-1.74-2.64-3.37-2.34-1.43 0.34-2.89 0.9-3.97 1.36-0.87 0.38-1.17 1.33-0.86 2.22 0.28 0.78 1.14 1.25 2 1.19l1.88-0.16c0.15-0.02 0.27 0.05 0.34 0.18 1.24 2.08 1.98 4.5 1.97 6.5 0 0.73-0.53 1.14-1.23 0.99-1.33-0.41-2.71-1.45-4.15-2.03-0.95-0.31-2.1 0.23-2.62 1.28-0.3 0.9 0.13 1.94 0.94 2.45 2.6 1.91 5.26 3.76 7.65 5.22 0.73 0.5 1.16 1.21 1.39 2.06 0.07 0.27 0.32 0.38 0.59 0.33l8.38-1.53c0.41-0.08 0.58-0.35 0.53-0.75-0.1-0.72-0.14-1.56 0.21-2.09 1.28-2.11 1.76-4.65 1.65-6.94z",
      fill: "#FFFFFF",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m66.93 39.67-0.71-3",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m70.67 40.25-0.29-2.34",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m73.87 41.43 0.2-1.41",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.7116",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
} as const
const transforms = {
  open: "translate(4 1) scale(0.48) translate(-19 -13)",
  point: "translate(-26 -27)",
  pinch: "translate(-53 -27)",
} as const
export function Hand({ pose = "point", style, ...props }: HandProps) {
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
