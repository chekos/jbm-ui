export type Pt = { x: number; y: number }
export type Box = Pt & { w: number; h: number }

export function unit(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0
}

/** Arc-length interpolation; repeated points and a one-point path are valid. */
export function pointOn(path: readonly Pt[], progress: number): Pt {
  if (!path.length) throw new Error("pointOn needs at least one point")
  const lengths = path
    .slice(1)
    .map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y))
  let distance = unit(progress) * lengths.reduce((a, b) => a + b, 0)
  for (let i = 0; i < lengths.length; i++) {
    if (lengths[i] > 0 && distance <= lengths[i]) {
      const p = distance / lengths[i]
      return {
        x: path[i].x + (path[i + 1].x - path[i].x) * p,
        y: path[i].y + (path[i + 1].y - path[i].y) * p,
      }
    }
    distance -= lengths[i]
  }
  return { ...path[path.length - 1] }
}

/** Restrained travel tilt, in degrees. */
export function pathTilt(path: readonly Pt[], progress: number): number {
  const a = pointOn(path, Math.max(0, progress - 0.01))
  const b = pointOn(path, Math.min(1, progress + 0.01))
  return Math.max(
    -18,
    Math.min(18, (Math.atan2(b.y - a.y, Math.abs(b.x - a.x)) * 180) / Math.PI)
  )
}
