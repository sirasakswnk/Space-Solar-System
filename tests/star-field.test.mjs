import test from 'node:test'
import assert from 'node:assert/strict'
import { createStarField, starFieldRadius } from '../src/scene/starField.ts'

test('star field lies on one sphere inside the camera far plane', () => {
  const positions = createStarField()
  assert.equal(positions.length, 1200 * 3)
  assert.ok(starFieldRadius < 1000)
  for (let i = 0; i < positions.length; i += 3) {
    const length = Math.hypot(positions[i], positions[i + 1], positions[i + 2])
    assert.ok(Math.abs(length - starFieldRadius) < 0.01)
  }
})

test('star field covers every viewing direction and is deterministic', () => {
  const positions = createStarField()
  const octants = new Array(8).fill(0)
  for (let i = 0; i < positions.length; i += 3) {
    octants[(positions[i] > 0 ? 1 : 0) + (positions[i + 1] > 0 ? 2 : 0) + (positions[i + 2] > 0 ? 4 : 0)]++
  }
  // Uniform sampling gives about 150 stars per octant; require a clear share in each.
  for (const count of octants) assert.ok(count > 100, `octant count ${count}`)
  assert.deepEqual(createStarField(), positions)
})
