import test from 'node:test'
import assert from 'node:assert/strict'
import { planetStops } from '../src/journey/path.ts'
import { planetVisibility } from '../src/journey/planetVisibility.ts'

test('only the destination is visible throughout every exploration window', () => {
  for (const { planet, start, end, stop } of planetStops) {
    for (const progress of [start, (start + stop) / 2, stop, (stop + end) / 2, end]) {
      for (const other of planetStops) {
        assert.equal(planetVisibility(other.planet.id, progress), other.planet.id === planet.id ? 1 : 0)
      }
    }
  }
})

test('travel fades stay bounded and continuous and reverse restores identical visibility', () => {
  const samples = Array.from({ length: 10001 }, (_, index) => index / 10000)
  for (const { planet } of planetStops) {
    const forward = samples.map(progress => planetVisibility(planet.id, progress))
    const reverse = samples.toReversed().map(progress => planetVisibility(planet.id, progress)).toReversed()
    assert.deepEqual(reverse, forward)
    forward.forEach((value, index) => {
      assert.ok(Number.isFinite(value) && value >= 0 && value <= 1)
      if (index) assert.ok(Math.abs(value - forward[index - 1]) < 0.01, `Abrupt fade: ${planet.id}`)
    })
    assert.equal(forward[0], 0)
    assert.equal(planetVisibility(planet.id, 0.99), 1)
    assert.equal(forward.at(-1), 1)
    assert.ok(forward.some(value => value > 0 && value < 1))
  }
})

test('opening, exploration and closing keep the selected planet and its attachments fully visible', () => {
  for (const { planet } of planetStops) {
    for (const progress of [0, 0.3, 0.7, 1]) {
      for (const other of planetStops) {
        assert.equal(planetVisibility(other.planet.id, progress, planet.id), other.planet.id === planet.id ? 1 : 0)
      }
    }
  }
  assert.equal(planetVisibility('unknown', 1), 0)
})
