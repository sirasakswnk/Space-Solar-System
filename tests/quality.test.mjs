import test from 'node:test'
import assert from 'node:assert/strict'
import { lightScale, qualityDpr } from '../src/journey/quality.ts'

test('standard keeps the original 1 to 1.5 pixel ratio range', () => {
  assert.equal(qualityDpr('standard', 1), 1)
  assert.equal(qualityDpr('standard', 0.8), 1)
  assert.equal(qualityDpr('standard', 1.25), 1.25)
  assert.equal(qualityDpr('standard', 2), 1.5)
})

test('light renders fewer pixels than standard on every display', () => {
  for (const ratio of [0.8, 1, 1.25, 1.5, 2, 3]) {
    const pixels = (qualityDpr('light', ratio) / qualityDpr('standard', ratio)) ** 2
    assert.ok(Math.abs(pixels - lightScale ** 2) < 1e-12 && pixels < 0.6)
  }
})

test('an unknown device ratio falls back to 1', () => {
  for (const ratio of [Number.NaN, 0, -1, Infinity]) {
    assert.equal(qualityDpr('standard', ratio), 1)
    assert.equal(qualityDpr('light', ratio), lightScale)
  }
})
