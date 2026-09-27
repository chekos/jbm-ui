import type { ItemContract } from "../schema"

export default {
  name: "scene-geometry",
  entry: "component",
  title: "SceneGeometry",
  description: "Shared points, bounds, arc-length path interpolation and travel tilt.",
  category: "Foundations",
  capabilities: [],
  api: [
    {
      export: "unit",
      kind: "function",
      summary: "Clamps a progress value to 0–1, treating non-finite input as 0.",
      params: { value: "Any number, usually a progress value." },
      returns: "The value clamped to 0–1, or 0 when it is NaN or infinite.",
    },
    {
      export: "pointOn",
      kind: "function",
      summary:
        "Point at a fraction of a polyline's total length (arc-length, not per segment). Repeated points and a one-point path are valid; an empty path throws.",
      params: {
        path: "Polyline points in the caller's coordinate space; at least one.",
        progress: "0–1 fraction of the total length; clamped with unit.",
      },
      returns: "A new { x, y } on the path; the last point at 1 or when the path has no length.",
    },
    {
      export: "pathTilt",
      kind: "function",
      summary:
        "Restrained travel tilt from the direction of travel around a progress point (sampled ±0.01), measured against horizontal regardless of left/right direction.",
      params: {
        path: "Polyline points, as for pointOn.",
        progress: "0–1 fraction of the total length.",
      },
      returns: "Degrees clamped to −18…18; positive when the path descends on screen (y grows).",
    },
    { export: "Pt", kind: "type", summary: "A point { x, y } in scene (SVG user) units." },
    { export: "Box", kind: "type", summary: "A Pt plus w and h: the top-left corner and size of a rectangle." },
  ],
  stage: {
    mode: "n/a",
    reason: "Geometry helpers only; nothing renders. The gallery draws an example path to illustrate the points.",
  },
  examples: [
    {
      title: "Place and tilt an object along a path",
      code: 'import { pointOn, pathTilt } from "@/jbm/lib/geometry"\n\nconst path = [{ x: 40, y: 170 }, { x: 220, y: 50 }, { x: 460, y: 130 }]\nconst at = pointOn(path, 0.5)\nconst angle = pathTilt(path, 0.5)\n<g transform={`translate(${at.x} ${at.y}) rotate(${angle})`} />',
    },
  ],
  qa: [
    "pointOn at 0, 0.5, and 1 returns the first point, the arc-length midpoint, and the last point; out-of-range progress clamps.",
    "A path with repeated points or a single point never returns NaN.",
    "pathTilt stays within ±18° on steep segments; objects moving right-to-left tilt the same way as left-to-right on the same slope.",
  ],
} satisfies ItemContract
