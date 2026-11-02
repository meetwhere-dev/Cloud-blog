export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
export function flatten(points, tolerance = 0.001, depth = 0) {
  if (points.length === 2) return points
  const [a, b, c, d] = points
  if (depth >= 18 || distance(a, b) + distance(b, c) + distance(c, d) - distance(a, d) <= tolerance) return [a, d]
  const ab = mid(a, b), bc = mid(b, c), cd = mid(c, d)
  const abc = mid(ab, bc), bcd = mid(bc, cd), center = mid(abc, bcd)
  return [...flatten([a, ab, abc, center], tolerance / 2, depth + 1).slice(0, -1), ...flatten([center, bcd, cd, d], tolerance / 2, depth + 1)]
}
export function length(points) {
  const vertices = flatten(points)
  return vertices.slice(1).reduce((sum, p, i) => sum + distance(vertices[i], p), 0)
}
export function nearestPoint(points, target) {
  const vertices = flatten(points)
  let nearest = { distance: Infinity, along: 0, point: vertices[0] }, traveled = 0
  for (let i = 1; i < vertices.length; i++) {
    const a = vertices[i - 1], b = vertices[i], len = distance(a, b)
    const t = len ? Math.max(0, Math.min(1, ((target.x - a.x) * (b.x - a.x) + (target.y - a.y) * (b.y - a.y)) / (len * len))) : 0
    const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, gap = distance(point, target)
    if (gap < nearest.distance) nearest = { point, distance: gap, along: traveled + t * len }
    traveled += len
  }
  return nearest
}
export const pathData = points => points.length === 2 ? `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}` : `M ${points[0].x} ${points[0].y} C ${points.slice(1).map(p => `${p.x} ${p.y}`).join(' ')}`
