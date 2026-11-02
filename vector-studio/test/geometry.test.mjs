import test from 'node:test'
import assert from 'node:assert/strict'
import { length, nearestPoint } from '../geometry.mjs'
const p = (x, y) => ({ x, y })
test('straight distance and projection, including outside endpoints', () => {
  assert.equal(length([p(0, 0), p(3, 4)]), 5)
  const result = nearestPoint([p(0, 0), p(10, 0)], p(4, 3))
  assert.deepEqual(result, { point: p(4, 0), distance: 3, along: 4 })
  assert.deepEqual(nearestPoint([p(0, 0), p(10, 0)], p(12, 0)).point, p(10, 0))
})
test('cubic arch has analytic length 200; translation preserves it', () => {
  const points = [p(0, 0), p(0, 100), p(100, 100), p(100, 0)]
  assert.ok(Math.abs(length(points) - 200) < 0.001)
  assert.ok(Math.abs(length(points.map(a => p(a.x + 500, a.y - 100))) - 200) < 0.001)
  const result = nearestPoint(points, p(50, 80))
  assert.ok(Math.abs(result.distance - 5) < 0.001)
  assert.ok(Math.abs(result.along - 100) < 0.001)
})
test('degenerate and retracing curves remain finite and measure travel', () => {
  assert.equal(length([p(2, 2), p(2, 2), p(2, 2), p(2, 2)]), 0)
  assert.equal(nearestPoint([p(2, 2), p(2, 2)], p(5, 6)).distance, 5)
  assert.ok(Math.abs(length([p(0, 0), p(100, 0), p(100, 0), p(0, 0)]) - 150) < 0.001)
})
