import test from 'node:test'
import assert from 'node:assert/strict'
import { createMotionPreference, fadeAfter, fadeDuration, largeJump, shouldCut } from '../src/journey/motion.ts'
import { planetStops } from '../src/journey/path.ts'

test('only reduced motion cuts, and only for long jumps', () => {
  assert.deepEqual(createMotionPreference(), { reduced: false, fade: 0 })
  assert.equal(shouldCut(false, 0, 1), false)
  assert.equal(shouldCut(true, 0.3, 0.3 + largeJump * 0.99), false)
  assert.equal(shouldCut(true, 0, largeJump), true)
  assert.equal(shouldCut(true, 0.9, 0.2), true)
  // A PageDown at 720px is about 650px of 24,000px: it still eases.
  assert.equal(shouldCut(true, 0.5, 0.5 + 650 / 24000), false)
})

test('every destination, replay and overview jump counts as a long jump', () => {
  const points = [0, ...planetStops.map(stop => stop.stop), 1]
  for (const from of points) for (const to of points) {
    if (from !== to) assert.ok(shouldCut(true, from, to), `${from} -> ${to}`)
  }
})

test('fade-in finishes within its duration and ignores long frame gaps', () => {
  let fade = 1, frames = 0
  while (fade > 0) { fade = fadeAfter(fade, 1 / 60); frames++ }
  assert.ok(frames <= Math.ceil(fadeDuration * 60) + 1)
  assert.ok(fadeAfter(1, 5) > 0.8)
  assert.equal(fadeAfter(0, 1 / 60), 0)
})
